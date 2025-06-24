'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarIcon, History } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

type HistoricalData = {
    date: string;
    temp: number;
    humidity: number;
    wind: number;
    risk?: number;
};

const chartConfig = {
    temp: { label: "Temp (°C)", color: "hsl(var(--chart-2))" },
    humidity: { label: "Humidity (%)", color: "hsl(var(--chart-1))" },
    wind: { label: "Wind (km/h)", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export function HistoricalWeather() {
    const [date, setDate] = useState<DateRange | undefined>();
    const [data, setData] = useState<HistoricalData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistoricalData = async () => {
        if (!date?.from || !date?.to) {
            setError("Please select a date range.");
            return;
        }
        setLoading(true);
        setError(null);
        setData([]);

        try {
            // NOTE: Firestore requires an index for this query.
            // The error message in the browser console will provide a link to create it.
            const startDate = format(date.from, 'yyyy-MM-dd');
            const endDate = format(date.to, 'yyyy-MM-dd');

            const q = query(
                collection(db, 'weather_history'),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                orderBy('date'),
                limit(30) // Limit to avoid fetching too much data
            );

            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setError("No historical data found for the selected range. Please upload data to Firestore collection 'weather_history'.");
            } else {
                const historicalData: HistoricalData[] = [];
                querySnapshot.forEach((doc) => {
                    historicalData.push(doc.data() as HistoricalData);
                });
                setData(historicalData);
            }
        } catch (e: any) {
            console.error(e);
            let errorMessage = "Failed to fetch data. Ensure Firebase is configured correctly in your .env file and you have a 'weather_history' collection.";
            if (e.message?.includes('indexes')) {
                errorMessage = "Firestore requires an index for this query. Please check the browser console for a link to create it automatically.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-headline font-medium flex items-center">
                    <History className="mr-2 h-4 w-4 text-muted-foreground" />
                    Historical Weather Data
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="w-full sm:w-[280px] justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a date range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={fetchHistoricalData} disabled={loading || !date?.from || !date?.to} className="w-full sm:w-auto">
                        {loading ? 'Loading...' : 'Fetch Data'}
                    </Button>
                </div>
                
                {error && <p className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">{error}</p>}

                {loading && (
                    <div className="aspect-video w-full rounded-md bg-muted animate-pulse" />
                )}

                {data.length > 0 && !loading && (
                     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.substring(5)} // Show MM-DD
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="temp" fill="var(--color-temp)" radius={4} />
                            <Bar dataKey="humidity" fill="var(--color-humidity)" radius={4} />
                            <Bar dataKey="wind" fill="var(--color-wind)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
