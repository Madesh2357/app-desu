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

const GetWeatherAnalysisInputSchema = z.object({
  lat: z.number().describe('The latitude of the location.'),
  lon: z.number().describe('The longitude of the location.'),
  language: z.string().describe("The language for the response (e.g., 'en', 'fr', 'ta')."),
});
export type GetWeatherAnalysisInput = z.infer<typeof GetWeatherAnalysisInputSchema>;

const GetWeatherAnalysisOutputSchema = z.object({
    isCoastal: z.boolean().describe("True if the location is on a seashore or oceanic region, otherwise false."),
    temperature: z.number().describe("The current temperature in Celsius."),
    windSpeed: z.string().describe("The current wind speed, including units (e.g., '15 km/h')."),
    windDirection: z.string().describe("The current wind direction (e.g., 'from the SW')."),
    humidity: z.number().describe("The current humidity as a percentage."),
    cycloneProbability: z.number().min(0).max(100).describe("The estimated probability of a cyclone forming or being present, as a percentage from 0 to 100. Omit this field if isCoastal is false.").optional(),
    forecast: z.array(z.object({
        time: z.string().describe("The time period for this forecast (e.g., 'Next 12 Hours', '12-24 Hours')."),
        summary: z.string().describe("A brief, simple summary of the weather (e.g., 'Clear skies', 'Chance of rain')."),
        icon: z.string().describe("A relevant icon name from the lucide-react library (e.g., 'Sun', 'CloudRain', 'Wind')."),
        temperature: z.string().describe("The expected temperature range, e.g., '25-28°C'."),
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
  output: {schema: GetWeatherAnalysisOutputSchema},
  prompt: `You are an expert meteorologist providing easily understandable weather analysis.
  Your entire response for any text field must be in the language specified by the language code: {{{language}}}.

  Location:
  Latitude: {{{lat}}}
  Longitude: {{{lon}}}

  Tasks:
  1.  **Location Type**: First, determine if the location is on a seashore or in an oceanic region. Set 'isCoastal' to true if it is, and false otherwise.
  2.  **Current Conditions**: Provide the current temperature (Celsius), wind speed (km/h), wind direction, and humidity.
  3.  **Cyclone Risk**: If 'isCoastal' is true, provide an estimated 'cycloneProbability' (0-100%). Base this on factors like wind speed, humidity, and your internal knowledge of cyclone formation patterns. If 'isCoastal' is false, you MUST omit the 'cycloneProbability' field entirely.
  4.  **Visual Forecast**: Provide a 72-hour forecast broken into six 12-hour intervals. For each interval, provide a simple summary, temperature range, and an icon. The icon MUST be one of the following exact names: 'Sun', 'Moon', 'CloudSun', 'CloudMoon', 'Cloud', 'Cloudy', 'CloudRain', 'CloudLightning', 'Wind', 'Sunrise', 'Sunset'.
  5.  **Simple Recommendations**: Provide actionable recommendations. If 'isCoastal' is true, focus on safety for fishermen and coastal communities. If 'isCoastal' is false, give general weather advice. Keep the language simple and clear.
  `,
});

const weatherAnalysisFlow = ai.defineFlow(
  {
    name: 'weatherAnalysisFlow',
    inputSchema: GetWeatherAnalysisInputSchema,
    outputSchema: GetWeatherAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
