"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/header';
import { Alerts } from '@/components/alerts';
import { WeatherAnalysis } from '@/components/weather-analysis';
import { fetchWeatherAnalysis } from '@/app/actions';
import type { GetWeatherAnalysisOutput } from '@/ai/flows/get-weather-analysis';
import { useToast } from "@/hooks/use-toast";
import { sampleAnalysis } from '@/lib/sample-analysis';

// Dynamically import the WeatherMap component to prevent SSR issues with Leaflet
const WeatherMap = dynamic(() => import('@/components/weather-map'), {
    ssr: false,
    loading: () => <div className="aspect-video w-full rounded-md bg-muted animate-pulse" />
});

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GetWeatherAnalysisOutput | null>(null);
  const [language, setLanguage] = useState('en');
  const { toast } = useToast();

  // Use a ref to store the current language to avoid re-creating the callback
  const languageRef = useRef(language);
  languageRef.current = language;

  // Load last analysis from localStorage on initial render
  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem('lastFishermanAnalysis');
      if (savedAnalysis) {
        setAnalysis(JSON.parse(savedAnalysis));
      }
    } catch (error) {
      console.error("Failed to load analysis from localStorage", error);
      localStorage.removeItem('lastFishermanAnalysis');
    }
  }, []);

  // Define the location select handler with useCallback to stabilize its identity
  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await fetchWeatherAnalysis({ lat, lon, language: languageRef.current });
      setAnalysis(result);
      // Save successful analysis to localStorage
      localStorage.setItem('lastFishermanAnalysis', JSON.stringify(result));
    } catch (error: any) {
      console.error(error);
      let title = "Error Fetching Weather Analysis";
      let description = "An unknown error occurred. Please try again later.";

      // Check for quota error and provide a fallback
      if (error.message?.includes("429") || error.message?.includes("Quota")) {
          title = "API Quota Exceeded";
          description = "Displaying sample data as a fallback. Please check your API key or plan.";
          setAnalysis(sampleAnalysis);
          localStorage.setItem('lastFishermanAnalysis', JSON.stringify(sampleAnalysis));
      } else if (error.message?.includes('API key')) {
        description = "The Google AI API key is missing or invalid. Please add GOOGLE_API_KEY=your_key_here to the .env file and restart the server."
      } else if (error instanceof Error) {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // Now only depends on toast, which is stable

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
