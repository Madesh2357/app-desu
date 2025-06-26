'use server';
/**
 * @fileOverview A Genkit tool to fetch weather data from OpenWeatherMap API.
 *
 * - openWeatherTool - A tool that fetches current weather and forecast data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for the OpenWeatherMap API call
const WeatherToolInputSchema = z.object({
  lat: z.number().describe('Latitude for the weather query.'),
  lon: z.number().describe('Longitude for the weather query.'),
});

// A simplified schema for the OpenWeatherMap API response to pass to the model.
// We don't need to pass the full, complex API response. Just the essentials.
const OpenWeatherOutputSchema = z.object({
    locationName: z.string().describe("The name of the location (e.g., city name)."),
    country: z.string().describe("The country code (e.g., 'US')."),
    weather: z.object({
        main: z.string().describe("A general description of the weather (e.g., 'Clouds', 'Rain')."),
        description: z.string().describe("A more detailed description of the weather (e.g., 'overcast clouds')."),
    }),
    main: z.object({
        temp: z.number().describe("Current temperature in Celsius."),
        feels_like: z.number().describe("'Feels like' temperature in Celsius."),
        humidity: z.number().describe("Humidity percentage."),
        pressure: z.number().describe("Atmospheric pressure in hPa."),
    }),
    wind: z.object({
        speed: z.number().describe("Wind speed in meter/sec."),
        deg: z.number().describe("Wind direction in degrees."),
    }),
    timezone: z.number().describe("Shift in seconds from UTC."),
});

export const openWeatherTool = ai.defineTool(
  {
    name: 'getOpenWeatherData',
    description: 'Gets the current weather data for a given latitude and longitude from the OpenWeatherMap API.',
    inputSchema: WeatherToolInputSchema,
    outputSchema: OpenWeatherOutputSchema,
  },
  async ({ lat, lon }) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key is not configured. Please add NEXT_PUBLIC_OPENWEATHER_API_KEY to your .env file.');
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenWeatherMap API error: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();

      // We return a simplified object matching our Zod schema.
      return {
        locationName: data.name,
        country: data.sys.country,
        weather: {
            main: data.weather[0].main,
            description: data.weather[0].description,
        },
        main: {
            temp: data.main.temp,
            feels_like: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
        },
        wind: {
            speed: data.wind.speed,
            deg: data.wind.deg,
        },
        timezone: data.timezone,
      };
    } catch (error) {
      console.error("Failed to fetch data from OpenWeatherMap:", error);
      // Re-throw the error so Genkit knows the tool failed.
      throw error;
    }
  }
);
