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
    isCoastal: z.boolean().describe("True if the location is on a seashore or an oceanic region. False for all land locations."),
    temperature: z.number().describe("The current temperature in Celsius."),
    windSpeed: z.string().describe("The current wind speed, including units (e.g., '15 km/h')."),
    windDirection: z.string().describe("The current wind direction (e.g., 'from the SW')."),
    humidity: z.number().describe("The current humidity as a percentage."),
    cycloneProbability: z.number().min(0).max(100).describe("The estimated probability of a cyclone forming or being present now, from 0-100. This field is ONLY required if 'isCoastal' is true, otherwise it must be omitted.").optional(),
    forecast: z.array(z.object({
        time: z.string().describe("The time period for this forecast (e.g., 'Next 12 Hours', '12-24 Hours')."),
        summary: z.string().describe("A brief, simple summary of the weather (e.g., 'Clear skies', 'Chance of rain')."),
        icon: z.string().describe("A relevant icon name from the lucide-react library (e.g., 'Sun', 'CloudRain', 'Wind')."),
        temperature: z.string().describe("The expected temperature range, e.g., '25-28°C'."),
        windSpeed: z.string().describe("The expected average wind speed for the period, e.g., '10-15 km/h'.").optional(),
        humidity: z.number().describe("The expected average humidity percentage for the period.").optional(),
        cycloneRiskLevel: z.enum(['none', 'low', 'medium', 'high']).describe("The predicted cyclone risk for this specific time period. This field is ONLY required if 'isCoastal' is true, otherwise it must be omitted.").optional(),
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
  prompt: `You are an expert meteorologist with access to advanced climate models and historical weather data. Your primary task is to provide a weather analysis tailored to the user's location.

  Your entire response for any text field must be in the language specified by the language code: {{{language}}}.

  Location:
  Latitude: {{{lat}}}
  Longitude: {{{lon}}}

  Follow these steps precisely:

  1.  **COASTAL DETERMINATION (CRITICAL):**
      First, determine if the coordinates are for an oceanic region or a seashore.
      - If YES, set \`isCoastal\` to \`true\`.
      - If NO (it is a landlocked location), set \`isCoastal\` to \`false\`.
      This determination dictates the rest of your response.

  2.  **PROVIDE UNIVERSAL WEATHER DATA:**
      Regardless of coastal status, provide the following:
      - \`temperature\`: Current temperature in Celsius.
      - \`windSpeed\`: Current wind speed in km/h.
      - \`windDirection\`: Current wind direction.
      - \`humidity\`: Current humidity percentage.
      - \`forecast\`: A 72-hour forecast broken into six 12-hour intervals. Each interval needs \`time\`, \`summary\`, \`icon\`, \`temperature\`, \`windSpeed\`, and \`humidity\`. Use icons from: 'Sun', 'Moon', 'CloudSun', 'CloudMoon', 'Cloud', 'Cloudy', 'CloudRain', 'CloudLightning', 'Wind', 'Sunrise', 'Sunset'.

  3.  **CONDITIONAL ANALYSIS (BASED ON STEP 1):**

      **A. IF \`isCoastal\` IS \`true\`:**
      - Perform a cyclone risk analysis.
      - You MUST provide \`cycloneProbability\` (a percentage from 0-100).
      - In the \`forecast\`, you MUST include the \`cycloneRiskLevel\` ('none', 'low', 'medium', 'high') for each interval.
      - The \`recommendations\` MUST focus on maritime safety, advice for fishermen, and coastal communities based on the cyclone risk.

      **B. IF \`isCoastal\` IS \`false\`:**
      - You MUST NOT provide the \`cycloneProbability\` field.
      - You MUST NOT provide the \`cycloneRiskLevel\` field in any forecast interval.
      - The \`recommendations\` MUST be general weather advice for a landlocked area.
      - **IMPORTANT:** Absolutely DO NOT mention cyclones, cyclone risk, the sea, fishing, or any maritime-related warnings in the \`recommendations\` or any other text field.
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
    if (!output) {
        throw new Error("Failed to get weather data from AI model.");
    }
    return output;
  }
);
