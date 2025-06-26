import type { GetWeatherAnalysisOutput } from '@/ai/flows/get-weather-analysis';

export const sampleAnalysis: GetWeatherAnalysisOutput = {
  locationType: 'shore',
  locationName: 'Sample City',
  temperature: 28,
  windSpeed: '15 km/h',
  windDirection: 'from the SW',
  humidity: 85,
  cycloneProbability: 65,
  tides: [
    { time: '02:30 AM', type: 'Low', height: '0.4m' },
    { time: '08:45 AM', type: 'High', height: '1.8m' },
    { time: '03:00 PM', type: 'Low', height: '0.6m' },
    { time: '09:15 PM', type: 'High', height: '1.9m' },
  ],
  forecast: [
    {
      time: 'Next 12 Hours',
      summary: 'Heavy Rain',
      icon: 'CloudRain',
      temperature: '27-29°C',
      cycloneRiskLevel: 'medium',
    },
    {
      time: '12-24 Hours',
      summary: 'Strong Winds',
      icon: 'Wind',
      temperature: '26-28°C',
      cycloneRiskLevel: 'medium',
    },
    {
      time: '24-36 Hours',
      summary: 'Thunderstorms',
      icon: 'CloudLightning',
      temperature: '26-27°C',
      cycloneRiskLevel: 'high',
    },
    {
      time: '36-48 Hours',
      summary: 'Rain Easing',
      icon: 'CloudRain',
      temperature: '27-28°C',
      cycloneRiskLevel: 'medium',
    },
    {
      time: '48-60 Hours',
      summary: 'Cloudy',
      icon: 'Cloudy',
      temperature: '28-30°C',
      cycloneRiskLevel: 'low',
    },
    {
      time: '60-72 Hours',
      summary: 'Partly Sunny',
      icon: 'CloudSun',
      temperature: '29-31°C',
      cycloneRiskLevel: 'none',
    },
  ],
  recommendations: 'A cyclone is forming. Fishermen are advised not to venture into the sea. Coastal residents should prepare for strong winds and heavy rain. This is sample data shown because the API limit was reached.',
};
