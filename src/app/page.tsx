import Header from '@/components/header';
import CycloneValidator from '@/components/cyclone-validator';
import { Alerts } from '@/components/alerts';
import { WeatherMap } from '@/components/weather-map';
import { Forecast } from '@/components/forecast';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <CycloneValidator />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Alerts />
            <WeatherMap />
            <Forecast />
          </div>
        </div>
      </main>
    </div>
  );
}
