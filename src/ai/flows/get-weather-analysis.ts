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
import { getWeatherData } from '@/services/weather';

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
  input: {schema: z.object({ weatherData: z.string() })},
  output: {schema: GetWeatherAnalysisOutputSchema},
  prompt: `You are an expert meteorologist specializing in tropical cyclones and maritime weather.
  Analyze the following weather data, which is from a shore or oceanic region.
  Your analysis should focus on identifying the potential for cyclone development.

  Weather Data:
  \`\`\`json
  {{{weatherData}}}
  \`\`\`

  Based on the data, provide:
  1.  A detailed weather analysis.
  2.  The probability of a cyclone (0-100%). High wind speeds (e.g., > 60 km/h), low atmospheric pressure (e.g., < 1000 hPa), and high humidity are key indicators.
  3.  Specific, actionable recommendations for people in the area, especially those near the coast or at sea.
  
  Be cautious and prioritize safety in your recommendations. It is better to be safe than sorry.
  `,
});

const weatherAnalysisFlow = ai.defineFlow(
  {
    name: 'weatherAnalysisFlow',
    inputSchema: GetWeatherAnalysisInputSchema,
    outputSchema: GetWeatherAnalysisOutputSchema,
  },
  async ({ lat, lon }) => {
    const weatherData = await getWeatherData(lat, lon);
    const {output} = await prompt({ weatherData: JSON.stringify(weatherData, null, 2) });
    return output!;
  }
);
