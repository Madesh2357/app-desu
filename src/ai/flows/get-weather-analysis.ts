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
import { openWeatherTool } from '@/services/openweathermap';

const GetWeatherAnalysisInputSchema = z.object({
  lat: z.number().describe('The latitude of the location.'),
  lon: z.number().describe('The longitude of the location.'),
  language: z.string().describe("The language for the response (e.g., 'en', 'fr', 'ta')."),
});
export type GetWeatherAnalysisInput = z.infer<typeof GetWeatherAnalysisInputSchema>;

const GetWeatherAnalysisOutputSchema = z.object({
    locationType: z.enum(['shore', 'ocean', 'land']).describe("The type of the location: 'shore' for coastlines, 'ocean' for open sea, or 'land' for inland areas."),
    locationName: z.string().describe("The name of the location provided by the weather service (e.g., 'Chennai')."),
    temperature: z.number().describe("The current temperature in Celsius."),
    windSpeed: z.string().describe("The current wind speed, including units (e.g., '15 km/h')."),
    windDirection: z.string().describe("The current wind direction (e.g., 'from the SW')."),
    humidity: z.number().describe("The current humidity as a percentage."),
    cycloneProbability: z.number().min(0).max(100).describe("The estimated probability of a cyclone forming or being present now, from 0-100. This field is ONLY required if 'locationType' is 'shore' or 'ocean', otherwise it must be omitted.").optional(),
    tides: z.array(z.object({
        time: z.string().describe("The time of the tide (e.g., '04:30 AM')."),
        type: z.enum(['High', 'Low']).describe("The type of the tide."),
        height: z.string().describe("The estimated height of the tide in meters (e.g., '1.2m').")
    })).describe("A simulated 24-hour tide forecast. This field is ONLY required if 'locationType' is 'shore' or 'ocean', otherwise it must be omitted.").optional(),
    forecast: z.array(z.object({
        time: z.string().describe("The time period for this forecast (e.g., 'Next 12 Hours', '12-24 Hours')."),
        summary: z.string().describe("A brief, simple summary of the weather (e.g., 'Clear skies', 'Chance of rain')."),
        icon: z.string().describe("A relevant icon name from the lucide-react library (e.g., 'Sun', 'CloudRain', 'Wind')."),
        temperature: z.string().describe("The expected temperature range, e.g., '25-28°C'."),
        windSpeed: z.string().describe("The expected average wind speed for the period, e.g., '10-15 km/h'.").optional(),
        humidity: z.number().describe("The expected average humidity percentage for the period.").optional(),
        cycloneRiskLevel: z.enum(['none', 'low', 'medium', 'high']).describe("The predicted cyclone risk for this specific time period. This field is ONLY required if 'locationType' is 'shore' or 'ocean', otherwise it must be omitted.").optional(),
    })).describe("A 72-hour forecast broken down into intervals."),
    recommendations: z.string().describe("Actionable recommendations for individuals in the area. If the location is 'shore' or 'ocean', focus on maritime safety. If 'land', provide general advice. Provide all text in the requested language."),
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
  tools: [openWeatherTool],
  prompt: `You are an expert meteorologist and oceanographer. Your task is to provide a detailed and accurate weather analysis based on a user's location, using external tools to gather real-time data.

  Your entire response for any text field must be in the language specified by the language code: {{{language}}}.

  User Location:
  Latitude: {{{lat}}}
  Longitude: {{{lon}}}

  Follow these steps precisely:

  1.  **FETCH REAL-TIME DATA:**
      - Use the \`getOpenWeatherData\` tool with the provided latitude and longitude to get current weather conditions. This data is the primary source for your analysis.

  2.  **LOCATION TYPE DETERMINATION (CRITICAL):**
      - Based on the data from the tool and your geographical knowledge, determine the location type using these strict definitions. Your accuracy here is paramount.
      - You MUST set the \`locationType\` field to one of three values: 'land', 'shore', or 'ocean'.
      -   'shore': Use for any location on or within 2 kilometers of a major body of **saltwater**, like an ocean or a sea. **Do not** classify locations near freshwater lakes, rivers, or other non-sea water bodies as 'shore'.
      -   'ocean': Use for any location clearly in the open ocean, more than 2km from any coastline.
      -   'land': Use for any location that is more than 2 kilometers inland from a major body of **saltwater**. This includes all locations near freshwater bodies.
      - This determination is critical and dictates the structure of your response.

  3.  **PROVIDE UNIVERSAL WEATHER DATA:**
      - Set the \`locationName\` from the tool's response.
      - Provide current \`temperature\`, \`windSpeed\` (convert from m/s to km/h), \`windDirection\`, and \`humidity\` based on the tool's data.
      - Provide a 72-hour \`forecast\` broken into six 12-hour intervals. Use icons from: 'Sun', 'Moon', 'CloudSun', 'CloudMoon', 'Cloud', 'Cloudy', 'CloudRain', 'CloudLightning', 'Wind', 'Sunrise', 'Sunset'.

  4.  **CONDITIONAL ANALYSIS (BASED ON STEP 2):**

      **A. IF \`locationType\` IS \`shore\` OR \`ocean\`:**
      - Perform a cyclone risk analysis. You MUST provide a \`cycloneProbability\` (a percentage from 0-100).
      - In the \`forecast\`, you MUST include the \`cycloneRiskLevel\` ('none', 'low', 'medium', 'high') for each interval.
      - You MUST provide a simulated 24-hour \`tides\` forecast. Create a realistic, plausible 24-hour cycle of 2 high and 2 low tides based on the location.
      - The \`recommendations\` MUST focus on maritime safety, tide warnings, advice for fishermen, and coastal communities based on the cyclone risk.

      **B. IF \`locationType\` IS \`land\`:**
      - You MUST OMIT the \`cycloneProbability\` field.
      - You MUST OMIT the \`tides\` field.
      - You MUST OMIT the \`cycloneRiskLevel\` field in all forecast intervals.
      - The \`recommendations\` MUST be general weather advice for a landlocked area.
      - **CRITICAL:** Do NOT mention cyclones, tides, the sea, fishing, or any maritime-related topics in any text field.
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
