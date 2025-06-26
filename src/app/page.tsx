"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import Header from '@/components/header';
import { Alerts } from '@/components/alerts';
import { WeatherAnalysis } from '@/components/weather-analysis';
import { fetchWeatherAnalysis } from '@/app/actions';
import type { GetWeatherAnalysisOutput } from '@/ai/flows/get-weather-analysis';
import { useToast } from "@/hooks/use-toast";
import { sampleAnalysis } from '@/lib/sample-analysis';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const WeatherMap = dynamic(() => import('@/components/weather-map'), {
  ssr: false,
  loading: () => <Skeleton className="aspect-video w-full rounded-md" />,
});

// Define a type for the data stored in localStorage
type StoredAnalysis = {
  analysis: GetWeatherAnalysisOutput;
  location: { lat: number; lon: number };
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GetWeatherAnalysisOutput | null>(null);
  const [language, setLanguage] = useState('en');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const { toast } = useToast();
  const isInitialMount = useRef(true);

  // Load last analysis and location from localStorage on initial mount
  useEffect(() => {
    try {
      const savedDataString = localStorage.getItem('lastFishermanAnalysis');
      if (savedDataString) {
        const savedData: StoredAnalysis = JSON.parse(savedDataString);
        if (savedData.analysis && savedData.location) {
          setAnalysis(savedData.analysis);
          setSelectedLocation(savedData.location);
        }
      }
    } catch (error) {
      console.error("Failed to load analysis from localStorage", error);
      localStorage.removeItem('lastFishermanAnalysis');
    }
  }, []);

  // Centralized async function to fetch and set weather analysis
  const getAnalysis = useCallback(async (lat: number, lon: number, lang: string) => {
    setLoading(true);
    setAnalysis(null);
    setSelectedLocation({ lat, lon });

    try {
      const result = await fetchWeatherAnalysis({ lat, lon, language: lang });
      setAnalysis(result);
      const dataToStore: StoredAnalysis = { analysis: result, location: { lat, lon } };
      localStorage.setItem('lastFishermanAnalysis', JSON.stringify(dataToStore));
    } catch (error: any) {
      console.error(error);
      let title = "Error Fetching Weather Analysis";
      let description = "An unknown error occurred. Please try again later.";

      if (error.message?.includes("429") || error.message?.includes("Quota")) {
        title = "API Quota Exceeded";
        description = "Displaying sample data as a fallback. Please check your API key or plan.";
        const sampleDataToStore: StoredAnalysis = { analysis: sampleAnalysis, location: { lat, lon } };
        setAnalysis(sampleAnalysis);
        localStorage.setItem('lastFishermanAnalysis', JSON.stringify(sampleDataToStore));
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
  }, [toast]);

  // Handler for map selection, calls the main analysis function
  const handleLocationSelect = useCallback((lat: number, lon: number) => {
    getAnalysis(lat, lon, language);
  }, [getAnalysis, language]);

  // Effect to re-fetch analysis when the language changes
  useEffect(() => {
    // Skip the initial render to prevent fetching with default state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (selectedLocation) {
      getAnalysis(selectedLocation.lat, selectedLocation.lon, language);
    }
  // We ONLY want this to re-run when language changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

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
