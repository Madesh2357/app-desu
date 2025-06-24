import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GetWeatherAnalysisOutput } from "@/ai/flows/get-weather-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Wind, Droplets, ShieldAlert, CalendarClock, BadgeInfo } from "lucide-react";
import DynamicIcon from "./dynamic-icon";

type WeatherAnalysisProps = {
  analysis: GetWeatherAnalysisOutput | null;
  loading: boolean;
};

export function WeatherAnalysis({ analysis, loading }: WeatherAnalysisProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-headline font-medium">Weather Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Separator />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-1/2" />
            <Separator />
            <Skeleton className="h-4 w-1/3" />
            <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-headline font-medium flex items-center">
                    <BadgeInfo className="mr-2 h-4 w-4 text-muted-foreground" />
                    Weather Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Click on the map to select a location and get a detailed weather analysis and cyclone risk assessment.</p>
            </CardContent>
        </Card>
    )
  }

  const probabilityColor =
    analysis.cycloneProbability && analysis.cycloneProbability > 75
      ? "text-destructive"
      : analysis.cycloneProbability && analysis.cycloneProbability > 50
      ? "text-accent"
      : "text-primary";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-headline font-medium">Weather Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-muted-foreground">Temperature</p>
                    <p className="font-semibold">{analysis.temperature}°C</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-muted-foreground">Wind</p>
                    <p className="font-semibold">{analysis.windSpeed} {analysis.windDirection}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-muted-foreground">Humidity</p>
                    <p className="font-semibold">{analysis.humidity}%</p>
                </div>
            </div>
        </div>
        
        {analysis.isCoastal && typeof analysis.cycloneProbability === 'number' && (
          <>
            <Separator />
            <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center"><ShieldAlert className="mr-2 h-4 w-4"/> Cyclone Probability</h3>
                <p className={`text-2xl font-bold ${probabilityColor}`}>{analysis.cycloneProbability}%</p>
            </div>
          </>
        )}
        
        <Separator />
        
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center"><CalendarClock className="mr-2 h-4 w-4"/> 72-Hour Forecast</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {analysis.forecast.map((item, index) => (
              <div key={index} className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/50">
                <p className="text-xs font-semibold">{item.time}</p>
                <DynamicIcon name={item.icon} className="h-8 w-8 my-1 text-accent" />
                <p className="text-xs font-bold">{item.temperature}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
