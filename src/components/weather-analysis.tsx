import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GetWeatherAnalysisOutput } from "@/ai/flows/get-weather-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Wind, Droplets, ShieldAlert, CalendarClock, BadgeInfo, Waves, ArrowDown, ArrowUp, LandPlot, Sailboat } from "lucide-react";
import DynamicIcon from "./dynamic-icon";
import { Badge } from "./ui/badge";

type WeatherAnalysisProps = {
  analysis: GetWeatherAnalysisOutput | null;
  loading: boolean;
};

const CycloneRiskIndicator = ({ level }: { level: 'low' | 'medium' | 'high' | 'none' }) => {
    if (level === 'none') {
        return null;
    }
    const styles = {
        low: 'text-chart-2',
        medium: 'text-accent',
        high: 'text-destructive',
    };
    return <ShieldAlert className={`h-4 w-4 mt-1 ${styles[level]}`} title={`Cyclone Risk: ${level}`} />;
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
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
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
      : analysis.cycloneProbability && analysis.cycloneProbability > 40
      ? "text-accent"
      : analysis.cycloneProbability && analysis.cycloneProbability > 10
      ? "text-chart-2"
      : "text-primary";
    
  const locationBadges = {
    shore: { icon: Waves, label: "Shore" },
    ocean: { icon: Sailboat, label: "Ocean" },
    land: { icon: LandPlot, label: "Inland" }
  };

  const BadgeIcon = locationBadges[analysis.locationType]?.icon || LandPlot;
  const badgeLabel = locationBadges[analysis.locationType]?.label || "Inland";


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-base font-headline font-medium mb-1">
                Weather Analysis for <span className="text-primary">{analysis.locationName}</span>
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1.5">
                <BadgeIcon className="h-3 w-3"/>
                {badgeLabel}
            </Badge>
        </div>
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
        
        {(analysis.locationType === 'shore' || analysis.locationType === 'ocean') && typeof analysis.cycloneProbability === 'number' && (
          <>
            <Separator />
            <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center"><ShieldAlert className="mr-2 h-4 w-4"/> Current Cyclone Probability</h3>
                <p className={`text-2xl font-bold ${probabilityColor}`}>{analysis.cycloneProbability}%</p>
            </div>
          </>
        )}

        {(analysis.locationType === 'shore' || analysis.locationType === 'ocean') && analysis.tides && analysis.tides.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center"><Waves className="mr-2 h-4 w-4"/> 24-Hour Tide Forecast</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  {analysis.tides.map((tide, index) => (
                      <div key={index} className="flex flex-col items-center p-2 rounded-md bg-muted/50">
                          <p className="text-xs font-semibold">{tide.time}</p>
                          {tide.type === 'High' ? <ArrowUp className="h-5 w-5 my-1 text-primary"/> : <ArrowDown className="h-5 w-5 my-1 text-secondary-foreground"/>}
                          <p className="text-sm font-bold">{tide.type} Tide</p>
                          <p className="text-xs text-muted-foreground">{tide.height}</p>
                      </div>
                  ))}
              </div>
            </div>
          </>
        )}
        
        <Separator />
        
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center"><CalendarClock className="mr-2 h-4 w-4"/> 72-Hour Forecast</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {analysis.forecast.map((item, index) => (
              <div key={index} className="flex flex-col items-center justify-start p-2 rounded-md bg-muted/50 min-h-[120px]">
                <p className="text-xs font-semibold">{item.time}</p>
                <DynamicIcon name={item.icon} className="h-8 w-8 my-1 text-accent" />
                <p className="text-xs font-bold">{item.temperature}</p>
                <p className="text-xs text-muted-foreground mt-1 flex-grow">{item.summary}</p>
                {item.cycloneRiskLevel && <CycloneRiskIndicator level={item.cycloneRiskLevel} />}
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
