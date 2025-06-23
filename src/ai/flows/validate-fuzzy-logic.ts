'use server';

/**
 * @fileOverview A flow to validate and refine cyclone predictions from a Fuzzy Logic algorithm using Gemini.
 *
 * - validateFuzzyLogic - A function that validates and refines the cyclone predictions.
 * - ValidateFuzzyLogicInput - The input type for the validateFuzzyLogic function.
 * - ValidateFuzzyLogicOutput - The return type for the validateFuzzyLogic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateFuzzyLogicInputSchema = z.object({
  fuzzyLogicOutput: z
    .string()
    .describe('The cyclone prediction output from the Fuzzy Logic algorithm.'),
  weatherData: z
    .string()
    .describe(
      'The weather data used by the Fuzzy Logic algorithm (e.g., temperature, humidity, wind speed).' 
    ),
});
export type ValidateFuzzyLogicInput = z.infer<typeof ValidateFuzzyLogicInputSchema>;

const ValidateFuzzyLogicOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the Fuzzy Logic output is valid.'),
  refinedPrediction: z
    .string()
    .describe(
      'The refined cyclone prediction, incorporating Gemini validation. If the fuzzy logic output is considered valid, this should be the same as the fuzzyLogicOutput, otherwise it should be Gemini\'s improved prediction.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind Gemini\'s validation and refinement.  This should explain why the fuzzyLogicOutput was considered valid or invalid, and how Gemini arrived at the refinedPrediction.'
    ),
});
export type ValidateFuzzyLogicOutput = z.infer<typeof ValidateFuzzyLogicOutputSchema>;

export async function validateFuzzyLogic(
  input: ValidateFuzzyLogicInput
): Promise<ValidateFuzzyLogicOutput> {
  return validateFuzzyLogicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateFuzzyLogicPrompt',
  input: {schema: ValidateFuzzyLogicInputSchema},
  output: {schema: ValidateFuzzyLogicOutputSchema},
  prompt: `You are an expert weather analyst specializing in cyclone prediction validation.

You will receive a cyclone prediction from a Fuzzy Logic algorithm, along with the weather data used to generate it.  Your task is to validate the Fuzzy Logic output and refine it if necessary.

Here's the Fuzzy Logic output:
{{fuzzyLogicOutput}}

Here's the weather data used:
{{weatherData}}

Consider edge cases and situations where the Fuzzy Logic algorithm might have limitations.

Explain your reasoning for validating or refining the prediction in the reasoning output field. If the Fuzzy Logic output is not valid, the refinedPrediction should be your own improved prediction, otherwise it should match the fuzzyLogicOutput.
`,
});

const validateFuzzyLogicFlow = ai.defineFlow(
  {
    name: 'validateFuzzyLogicFlow',
    inputSchema: ValidateFuzzyLogicInputSchema,
    outputSchema: ValidateFuzzyLogicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
