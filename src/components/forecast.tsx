import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CloudSun, Sun, CloudRain, Wind } from "lucide-react";

const forecastData = [
  { day: "Today", temp: "29°C", weather: "Sunny", icon: <Sun className="h-6 w-6 text-yellow-500" /> },
  { day: "Tomorrow", temp: "27°C", weather: "Partly Cloudy", icon: <CloudSun className="h-6 w-6 text-gray-500" /> },
  { day: "Next Day", temp: "26°C", weather: "Rain Likely", icon: <CloudRain className="h-6 w-6 text-blue-500" /> },
];

export function Forecast() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-headline font-medium">
          72-Hour Forecast
        </CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {forecastData.map((item) => (
            <div key={item.day} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {item.icon}
                <div>
                  <p className="text-sm font-medium leading-none">{item.day}</p>
                  <p className="text-sm text-muted-foreground">{item.weather}</p>
                </div>
              </div>
              <div className="font-medium">{item.temp}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
