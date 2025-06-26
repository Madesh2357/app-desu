'use server';
/**
 * @fileOverview Genkit tools to fetch data from third-party geo APIs.
 *
 * - openWeatherTool - A tool that fetches current weather data from OpenWeatherMap.
 * - determineLocationType - A function that uses the Overpass API to classify a location.
 * - reverseGeocode - A function that gets address details from the Nominatim API.
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


/**
 * Determines if a location is on land, shore, or in the ocean using the Overpass API.
 * @param lat The latitude of the location.
 * @param lon The longitude of the location.
 * @returns A promise that resolves to 'shore', 'ocean', or 'land'.
 */
export async function determineLocationType(lat: number, lon: number): Promise<'shore' | 'ocean' | 'land'> {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

  // 1. Check for a coastline within 2km to determine if it's 'shore'. This is the most specific check.
  const shoreQuery = `[out:json][timeout:10];way(around:2000,${lat},${lon})["natural"="coastline"];out count;`;
  
  try {
    const shoreResponse = await fetch(overpassUrl, { method: 'POST', headers, body: `data=${encodeURIComponent(shoreQuery)}` });
    if (shoreResponse.ok) {
        const shoreData = await shoreResponse.json();
        const wayCount = shoreData.elements[0]?.tags?.ways;
        if (wayCount && parseInt(wayCount, 10) > 0) {
            return 'shore';
        }
    }
  } catch (e) {
    // Errors are ignored, we will proceed to the next check.
  }

  // 2. If not shore, we distinguish land from ocean by checking for the presence of *any* nearby map data.
  // Land areas are full of data (nodes), while open oceans are empty. We check a 1km radius.
  const nodeCheckQuery = `[out:json][timeout:10];node(around:1000,${lat},${lon});out count;`;
  
  try {
    const nodeResponse = await fetch(overpassUrl, { method: 'POST', headers, body: `data=${encodeURIComponent(nodeCheckQuery)}` });
     if (nodeResponse.ok) {
        const nodeData = await nodeResponse.json();
        const nodeCount = nodeData.elements[0]?.tags?.nodes;
        // If we find any map nodes, it's land.
        if (nodeCount && parseInt(nodeCount, 10) > 0) {
            return 'land';
        } else {
            // If the 1km radius is empty, it's ocean.
            return 'ocean';
        }
     }
  } catch (e) {
     // Errors are ignored, we will proceed to the fallback.
  }

  // 3. Fallback: if all API calls fail, assume 'land' as the safest default to prevent app errors.
  console.warn("All Overpass API checks failed; falling back to 'land' classification.");
  return 'land';
}


/**
 * Gets detailed address components for a location using the Nominatim (OpenStreetMap) API.
 * @param lat The latitude.
 * @param lon The longitude.
 * @returns A promise that resolves to an object with zone and district.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ zone: string; district: string }> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FirebaseStudio-FishermanApp/1.0', // Nominatim requires a User-Agent header
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.statusText}`);
      return { zone: '', district: '' };
    }

    const data = await response.json();
    const address = data.address;

    // Extract a reasonable "zone" (city/town/village) and "district"
    const zone = address.city || address.town || address.village || '';
    const district = address.state_district || address.county || '';

    return { zone, district };
  } catch (error) {
    console.error('Reverse geocoding with Nominatim failed:', error);
    return { zone: '', district: '' }; // Return empty strings on failure
  }
}
