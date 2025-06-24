'use server';
/**
 * @fileOverview A flow to analyze weather data and predict cyclone risk.
 *
 * - getWeatherAnalysis - A function that provides a weather analysis for given coordinates.
 * - GetWeatherAnalysisInput - The input type for the getWeatherAnalysis function.
 * - GetWeatherAnalysisOutput - The return type for the getWeatherAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { calculateCycloneRisk } from '@/services/fuzzy-logic';

const GetWeatherAnalysisInputSchema = z.object({
  lat: z.number().describe('The latitude of the location.'),
  lon: z.number().describe('The longitude of the location.'),
  language: z.string().describe("The language for the response (e.g., 'en', 'fr', 'ta')."),
});
export type GetWeatherAnalysisInput = z.infer<typeof GetWeatherAnalysisInputSchema>;

const GetWeatherAnalysisOutputSchema = z.object({
    isCoastal: z.boolean().describe("True if the location is on a seashore or an oceanic region. False for all land locations."),
    temperature: z.number().describe("The current temperature in Celsius."),
    windSpeed: z.string().describe("The current wind speed, including units (e.g., '15 km/h')."),
    windDirection: z.string().describe("The current wind direction (e.g., 'from the SW')."),
    humidity: z.number().describe("The current humidity as a percentage."),
    cycloneProbability: z.number().min(0).max(100).describe("The estimated probability of a cyclone forming or being present now. Omit this field if isCoastal is false.").optional(),
    forecast: z.array(z.object({
        time: z.string().describe("The time period for this forecast (e.g., 'Next 12 Hours', '12-24 Hours')."),
        summary: z.string().describe("A brief, simple summary of the weather (e.g., 'Clear skies', 'Chance of rain')."),
        icon: z.string().describe("A relevant icon name from the lucide-react library (e.g., 'Sun', 'CloudRain', 'Wind')."),
        temperature: z.string().describe("The expected temperature range, e.g., '25-28°C'."),
        windSpeed: z.string().describe("The expected average wind speed for the period, e.g., '10-15 km/h'.").optional(),
        humidity: z.number().describe("The expected average humidity percentage for the period.").optional(),
        cycloneRiskLevel: z.enum(['none', 'low', 'medium', 'high']).describe("The predicted cyclone risk for this specific time period. This field is ONLY required if 'isCoastal' is true, otherwise it can be omitted.").optional(),
    })).describe("A 72-hour forecast broken down into intervals."),
    recommendations: z.string().describe("Actionable recommendations for individuals in the area. If coastal, focus on maritime safety. Provide all text in the requested language."),
});
export type GetWeatherAnalysisOutput = z.infer<typeof GetWeatherAnalysisOutputSchema>;

export async function getWeatherAnalysis(
  input: GetWeatherAnalysisInput
): Promise<GetWeatherAnalysisOutput> {
  return weatherAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weatherAnalysisPrompt',
  input: {schema: GetWeatherAnalysisInputSchema},
  output: {schema: GetWeatherAnalysisOutputSchema.omit({ cycloneProbability: true, forecast: true }).extend({
    forecast: z.array(z.object({
        time: z.string(),
        summary: z.string(),
        icon: z.string(),
        temperature: z.string(),
        windSpeed: z.string(),
        humidity: z.number(),
    })),
  })},
  prompt: `You are an expert meteorologist providing raw weather data.
  Your entire response for any text field must be in the language specified by the language code: {{{language}}}.

  Location:
  Latitude: {{{lat}}}
  Longitude: {{{lon}}}

  Tasks:
  1.  **Coastal Status**: Determine if the provided coordinates are for an oceanic location or a seashore, or within 10km of one. Set 'isCoastal' to true ONLY for these locations. For ALL other land locations, set 'isCoastal' to false.
  2.  **Current Conditions**: Provide the current temperature (Celsius), wind speed (km/h), wind direction, and humidity.
  3.  **Visual Forecast**: Provide a 72-hour forecast broken into six 12-hour intervals. For each interval, provide:
      - A simple summary.
      - Temperature range (e.g., '25-28°C').
      - An icon from: 'Sun', 'Moon', 'CloudSun', 'CloudMoon', 'Cloud', 'Cloudy', 'CloudRain', 'CloudLightning', 'Wind', 'Sunrise', 'Sunset'.
      - The average wind speed for the period (km/h).
      - The average humidity for the period (%).
  4.  **Simple Recommendations**: Provide actionable recommendations based on the general weather conditions. If 'isCoastal' is true, provide recommendations for fishermen. Keep the language simple. Do NOT mention cyclone risk, as that will be calculated separately.
  `,
});

// Helper to parse numbers from strings like "50 km/h" or "25-30°C"
const parseAverageValue = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const numbers = value.match(/\d+(\.\d+)?/g)?.map(Number);
  if (!numbers || numbers.length === 0) return 0;
  if (numbers.length === 1) return numbers[0];
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
};


const weatherAnalysisFlow = ai.defineFlow(
  {
    name: 'weatherAnalysisFlow',
    inputSchema: GetWeatherAnalysisInputSchema,
    outputSchema: GetWeatherAnalysisOutputSchema,
  },
  async (input) => {
    const {output: geminiOutput} = await prompt(input);

    if (!geminiOutput) {
        throw new Error("Failed to get weather data from AI model.");
    }
    
    let cycloneProbability: number | undefined = undefined;

    if (geminiOutput.isCoastal) {
        cycloneProbability = calculateCycloneRisk({
            temp: parseAverageValue(geminiOutput.temperature),
            humidity: parseAverageValue(geminiOutput.humidity),
            wind: parseAverageValue(geminiOutput.windSpeed),
        });
    }

    const processedForecast = geminiOutput.forecast.map(item => {
        let cycloneRiskLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
        if (geminiOutput.isCoastal && item.windSpeed && item.humidity && item.temperature) {
            const riskValue = calculateCycloneRisk({
                temp: parseAverageValue(item.temperature),
                humidity: item.humidity,
                wind: parseAverageValue(item.windSpeed),
            });
            if (riskValue > 75) cycloneRiskLevel = 'high';
            else if (riskValue > 40) cycloneRiskLevel = 'medium';
            else if (riskValue > 10) cycloneRiskLevel = 'low';
        }
        return { ...item, cycloneRiskLevel };
    });

    return {
        ...geminiOutput,
        cycloneProbability,
        forecast: processedForecast,
    };
  }
);
