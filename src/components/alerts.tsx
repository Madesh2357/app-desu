import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, TriangleAlert, Settings, CheckCircle, ShieldQuestion } from "lucide-react";
import type { GetWeatherAnalysisOutput } from "@/ai/flows/get-weather-analysis";
import { Skeleton } from "@/components/ui/skeleton";

type AlertsProps = {
  analysis: GetWeatherAnalysisOutput | null;
  loading: boolean;
};

export function Alerts({ analysis, loading }: AlertsProps) {
    const riskLevel = (() => {
        if (!analysis || analysis.locationType === 'land' || typeof analysis.cycloneProbability !== 'number') return 'none';
        if (analysis.cycloneProbability > 75) return 'high';
        if (analysis.cycloneProbability > 40) return 'medium';
        if (analysis.cycloneProbability > 10) return 'low';
        return 'none';
    })();
  
  const alertConfig = {
    high: {
      container: "border-destructive/50 bg-destructive/10",
      icon: TriangleAlert,
      iconClass: "text-destructive",
      titleClass: "text-destructive",
      title: "High Cyclone Probability",
    },
    medium: {
      container: "border-accent/50 bg-accent/10",
      icon: TriangleAlert,
      iconClass: "text-accent",
      titleClass: "text-accent",
      title: "Medium Cyclone Risk",
    },
    low: {
      container: "border-chart-2/50 bg-chart-2/10",
      icon: ShieldQuestion,
      iconClass: "text-chart-2",
      titleClass: "text-chart-2",
      title: "Low Cyclone Possibility",
    },
    none: {
      container: "border-transparent bg-secondary/30",
      icon: CheckCircle,
      iconClass: "text-primary",
      titleClass: "text-foreground",
      title: "No Active Alerts",
    }
  };
  
  const currentAlert = alertConfig[riskLevel];
  const Icon = currentAlert.icon;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-headline font-medium flex items-center">
          <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
          Alerts & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-start space-x-4 rounded-md border p-4">
             <Skeleton className="h-5 w-5 rounded-full" />
             <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
             </div>
          </div>
        ) : (
          <div className={`flex items-start space-x-4 rounded-md border p-4 ${currentAlert.container}`}>
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${currentAlert.iconClass}`} />
            <div className="flex-1 space-y-1">
              <p className={`text-sm font-semibold ${currentAlert.titleClass}`}>
                {currentAlert.title}
              </p>
              <p className="text-sm text-muted-foreground">
                 {analysis ? analysis.recommendations : "Current conditions appear safe. Click the map to check other areas."}
              </p>
            </div>
          </div>
        )}
        
        <Separator />
        
        <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center"><Settings className="mr-2 h-4 w-4"/>Notification Settings</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-alerts" className="flex-grow">SMS Alerts</Label>
              <Switch id="sms-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-alerts" className="flex-grow">Email Alerts</Label>
              <Switch id="email-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="coast-guard-alerts" className="flex-grow">Alert Coast Guard</Label>
              <Switch id="coast-guard-alerts" defaultChecked />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
