'use server';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export interface WeatherData {
  coord: { lon: number; lat: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: { speed: number; deg: number; gust?: number };
  rain?: { '1h'?: number; '3h'?: number };
  snow?: { '1h'?: number; '3h'?: number };
  clouds: { all: number };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
  message?: string;
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  if (!API_KEY) {
    throw new Error('OpenWeather API key is not configured.');
  }

  const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch weather data: ${errorData.message || response.statusText}`);
  }
  return response.json();
}
