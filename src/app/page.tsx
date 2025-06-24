"use client";

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/header';
import { Alerts } from '@/components/alerts';
import { WeatherAnalysis } from '@/components/weather-analysis';
import { fetchWeatherAnalysis } from '@/app/actions';
import type { GetWeatherAnalysisOutput } from '@/ai/flows/get-weather-analysis';
import { useToast } from "@/hooks/use-toast";

const WeatherMap = dynamic(() => import('@/components/weather-map').then(mod => mod.WeatherMap), {
    ssr: false,
    loading: () => <div className="aspect-video w-full rounded-md bg-muted animate-pulse" />
});

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GetWeatherAnalysisOutput | null>(null);
  const [language, setLanguage] = useState('en');
  const { toast } = useToast();

  // Load last analysis from localStorage on initial render
  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem('lastSafeCatchAnalysis');
      if (savedAnalysis) {
        setAnalysis(JSON.parse(savedAnalysis));
      }
    } catch (error) {
      console.error("Failed to load analysis from localStorage", error);
      // If parsing fails, remove the invalid item
      localStorage.removeItem('lastSafeCatchAnalysis');
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await fetchWeatherAnalysis({ lat, lon, language });
      setAnalysis(result);
      // Save successful analysis to localStorage
      localStorage.setItem('lastSafeCatchAnalysis', JSON.stringify(result));
    } catch (error: any)
      {
      console.error(error);
      let description = "An unknown error occurred. Please try again later.";

      if (error.status === 429) {
          description = "You have exceeded the daily request limit for the AI service. Please try again tomorrow."
      } else if (error.status === 'FAILED_PRECONDITION') {
        description = "The Google AI API key is missing or invalid. Please add GOOGLE_API_KEY=your_key_here to the .env file and restart the server."
      } else if (error instanceof Error) {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Error Fetching Weather Analysis",
        description: description,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, language]);

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header language={language} setLanguage={setLanguage} />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 min-h-[60vh] lg:min-h-0">
            <WeatherMap onLocationSelect={handleLocationSelect} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Alerts analysis={analysis} loading={loading} />
            <WeatherAnalysis analysis={analysis} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
