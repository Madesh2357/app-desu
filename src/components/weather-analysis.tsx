import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GetWeatherAnalysisOutput } from "@/ai/flows/get-weather-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, ShieldAlert, BadgeInfo } from "lucide-react";

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
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <Separator />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
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
    analysis.cycloneProbability > 75
      ? "text-red-500"
      : analysis.cycloneProbability > 50
      ? "text-yellow-500"
      : "text-green-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-headline font-medium">Weather Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center"><Zap className="mr-2 h-4 w-4"/> AI Analysis</h3>
          <p className="text-sm text-muted-foreground">{analysis.analysis}</p>
        </div>
        <Separator />
        <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center"><ShieldAlert className="mr-2 h-4 w-4"/> Cyclone Probability</h3>
            <p className={`text-2xl font-bold ${probabilityColor}`}>{analysis.cycloneProbability}%</p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center"><BadgeInfo className="mr-2 h-4 w-4"/> Recommendations</h3>
          <p className="text-sm text-muted-foreground">{analysis.recommendations}</p>
        </div>
      </CardContent>
    </Card>
  );
}
