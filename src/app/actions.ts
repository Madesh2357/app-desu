'use server';

import { validateFuzzyLogic, ValidateFuzzyLogicInput } from '@/ai/flows/validate-fuzzy-logic';

export async function validateCyclonePrediction(input: ValidateFuzzyLogicInput) {
    return await validateFuzzyLogic(input);
}
