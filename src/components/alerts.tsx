import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, TriangleAlert, Settings } from "lucide-react";

export function Alerts() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-headline font-medium flex items-center">
          <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
          Alerts & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-4 rounded-md border border-accent/50 bg-accent/10 p-4">
          <TriangleAlert className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-accent">
              High Cyclone Probability
            </p>
            <p className="text-sm text-muted-foreground">
              A cyclone with 90% probability is forecast for your region in the next 48 hours. Evacuate immediately.
            </p>
          </div>
        </div>
        
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
