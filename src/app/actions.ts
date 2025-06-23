'use server';

import { getWeatherAnalysis, GetWeatherAnalysisInput } from '@/ai/flows/get-weather-analysis';

export async function fetchWeatherAnalysis(input: GetWeatherAnalysisInput) {
    return await getWeatherAnalysis(input);
}
