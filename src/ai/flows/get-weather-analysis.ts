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
import { getWeatherData, type WeatherData } from '@/services/weather';

const getRealtimeWeatherData = ai.defineTool(
    {
        name: 'getRealtimeWeatherData',
        description: 'Get the current weather conditions for a specific latitude and longitude.',
        inputSchema: z.object({
            lat: z.number(),
            lon: z.number(),
        }),
        outputSchema: z.custom<WeatherData>(),
    },
    async ({lat, lon}) => {
        return await getWeatherData(lat, lon);
    }
);

const GetWeatherAnalysisInputSchema = z.object({
  lat: z.number().describe('The latitude of the location.'),
  lon: z.number().describe('The longitude of the location.'),
});
export type GetWeatherAnalysisInput = z.infer<typeof GetWeatherAnalysisInputSchema>;

const GetWeatherAnalysisOutputSchema = z.object({
    temperature: z.number().describe("The current temperature in Celsius."),
    windSpeed: z.string().describe("The current wind speed, including units (e.g., '15 km/h')."),
    windDirection: z.string().describe("The current wind direction (e.g., 'from the SW')."),
    humidity: z.number().describe("The current humidity as a percentage."),
    cycloneProbability: z.number().min(0).max(100).describe("The estimated probability of a cyclone forming or being present, as a percentage from 0 to 100."),
    forecast: z.string().describe("A detailed weather forecast for the next 72 hours, including changes in conditions, precipitation, and any significant weather events. Format this as a readable, multi-line string."),
    recommendations: z.string().describe("Actionable recommendations for individuals in the area, particularly for fishermen or people in coastal regions, based on the overall forecast and cyclone risk. E.g., 'Safe to go fishing', 'Advised to return to shore', 'Immediate evacuation recommended'."),
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
  tools: [getRealtimeWeatherData],
  prompt: `You are an expert meteorologist specializing in tropical cyclones and maritime weather.
  Your task is to provide a detailed weather analysis for the given geographical coordinates.

  First, use the getRealtimeWeatherData tool to fetch the current weather data for the provided latitude and longitude.

  Location:
  Latitude: {{{lat}}}
  Longitude: {{{lon}}}

  Once you have the weather data from the tool, analyze it and provide the following information:
  1.  **Temperature**: The current temperature in Celsius.
  2.  **Wind**: The current wind speed (in km/h) and its direction. Convert wind degrees from the data into a cardinal direction (e.g., SW, N, E).
  3.  **Humidity**: The current relative humidity as a percentage.
  4.  **Cyclone Probability**: An estimated probability (from 0 to 100%) of a cyclone forming or being present. Use indicators like high wind speeds (> 60 km/h), low atmospheric pressure (< 1000 hPa), and high humidity to inform your probability.
  5.  **72-Hour Forecast**: A detailed, multi-line forecast for the next 72 hours.
  6.  **Recommendations**: Based on the entire analysis, provide specific, actionable recommendations for people in the area, especially those near the coast or at sea. Prioritize safety.
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
