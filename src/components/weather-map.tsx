import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

export function WeatherMap() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-headline font-medium">
          Interactive Weather Map
        </CardTitle>
        <Map className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full rounded-md overflow-hidden border">
           <Image
            src="https://placehold.co/600x400.png"
            alt="Weather map placeholder"
            width={600}
            height={400}
            className="w-full h-full object-cover"
            data-ai-hint="weather map"
          />
        </div>
      </CardContent>
    </Card>
  );
}
