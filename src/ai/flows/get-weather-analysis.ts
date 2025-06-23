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
});
export type GetWeatherAnalysisInput = z.infer<typeof GetWeatherAnalysisInputSchema>;

const GetWeatherAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A concise summary of the current weather conditions and a short-term prediction, focusing on potential cyclone formation. Mention key factors like wind speed, pressure, and humidity."),
  cycloneProbability: z.number().min(0).max(100).describe("The estimated probability of a cyclone forming or being present, as a percentage from 0 to 100."),
  recommendations: z.string().describe("Actionable recommendations for individuals in the area, particularly for fishermen or people in coastal regions. E.g., 'Safe to go fishing', 'Advised to return to shore', 'Immediate evacuation recommended'."),
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
  prompt: `You are an expert meteorologist specializing in tropical cyclones and maritime weather.
  Your task is to provide a detailed weather analysis for the given geographical coordinates, which are likely in a shore or oceanic region.

  Location:
  Latitude: {{{lat}}}
  Longitude: {{{lon}}}

  Using your access to real-time weather data, please:
  1.  Find the current weather conditions for this location.
  2.  Provide a concise weather analysis, focusing on identifying the potential for cyclone development. Mention key factors like wind speed, atmospheric pressure, and humidity.
  3.  Estimate the probability of a cyclone (from 0 to 100%). Use indicators like high wind speeds (> 60 km/h), low atmospheric pressure (< 1000 hPa), and high humidity to inform your probability.
  4.  Give specific, actionable recommendations for people in the area, especially those near the coast or at sea (e.g., 'Safe to go fishing', 'Advised to return to shore', 'Immediate evacuation recommended').
  
  Prioritize safety in your recommendations. It is better to be safe than sorry.
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
