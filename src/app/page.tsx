"use client";

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/header';
import { Alerts } from '@/components/alerts';
import { WeatherAnalysis } from '@/components/weather-analysis';
import { fetchWeatherAnalysis } from '@/app/actions';
import type { GetWeatherAnalysisOutput } from '@/ai/flows/get-weather-analysis';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GetWeatherAnalysisOutput | null>(null);
  const { toast } = useToast();

  const WeatherMap = useMemo(() => dynamic(() => import('@/components/weather-map').then(mod => mod.WeatherMap), {
      ssr: false,
      loading: () => <div className="aspect-video w-full rounded-md bg-muted animate-pulse" />
  }), []);

  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await fetchWeatherAnalysis({ lat, lon });
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error fetching weather analysis",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please ensure your OpenWeather API key is correctly configured in the .env file.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 min-h-[60vh] lg:min-h-0">
            <WeatherMap onLocationSelect={handleLocationSelect} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Alerts />
            <WeatherAnalysis analysis={analysis} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
