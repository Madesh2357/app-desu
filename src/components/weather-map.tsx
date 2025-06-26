
"use client";

import { useRef, useEffect, memo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "@/hooks/use-toast";
import type { GetWeatherAnalysisOutput } from "@/ai/flows/get-weather-analysis";

interface WeatherMapProps {
  onLocationSelect: (lat: number, lon: number) => void;
  analysis: GetWeatherAnalysisOutput | null;
}

const INITIAL_CENTER: L.LatLngTuple = [20.5937, 78.9629];
const INITIAL_ZOOM = 5;

// Fix for default icon path issue with bundlers.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function BaseWeatherMap({ onLocationSelect, analysis }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const selectedLocationMarkerRef = useRef<L.Marker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedLocationMarkerRef.current) {
        if (analysis?.locationName) {
            selectedLocationMarkerRef.current.bindPopup(analysis.locationName).openPopup();
        } else {
            // When analysis is null (because we're fetching a new one), show a loading state.
            selectedLocationMarkerRef.current.bindPopup("Analyzing location...").openPopup();
        }
    }
  }, [analysis]);

  useEffect(() => {
    let isMounted = true;
    
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(INITIAL_CENTER, INITIAL_ZOOM);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // This function handles the "Selected Location" marker and triggers the analysis
      const updateSelectedLocation = (latlng: L.LatLng) => {
        if (!mapInstanceRef.current) return;
        
        if (selectedLocationMarkerRef.current) {
          selectedLocationMarkerRef.current.setLatLng(latlng);
        } else {
          // Create the marker. The popup content will be managed by the other useEffect hook.
          selectedLocationMarkerRef.current = L.marker(latlng).addTo(mapInstanceRef.current);
        }
        onLocationSelect(latlng.lat, latlng.lng);
      };

      map.on('click', (e) => {
        updateSelectedLocation(e.latlng);
      });

      // This function handles finding the location and setting the initial markers
      const handleLocationFound = (latlng: L.LatLng, accuracy: number) => {
        if (!mapInstanceRef.current || !isMounted || mapInstanceRef.current !== map) return;

        if (accuracy > 100) {
            toast({
              title: "Low Location Accuracy",
              description: `Your location is only accurate to ${Math.round(accuracy)} meters.`,
            });
        }

        // Set the initial "Selected Location" and run analysis
        updateSelectedLocation(latlng);
        map.flyTo(latlng, 15);
      }

      const locateWithBrowser = () => {
        if (!mapInstanceRef.current || !isMounted) return;

        mapInstanceRef.current.locate({ enableHighAccuracy: true }).on("locationfound", (e) => {
            if (mapInstanceRef.current === map && isMounted) {
                handleLocationFound(e.latlng, e.accuracy);
            }
        }).on("locationerror", () => {
          if (!isMounted) return;
          console.warn("Could not fetch initial location via browser. Please click the map.");
          toast({
            title: "Location Not Found",
            description: "Could not determine your location. Please click the map to select a location.",
          });
        });
      };
      
      const getInitialLocation = async () => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (apiKey) {
          try {
            const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            if (!response.ok) throw new Error(`API failed: ${response.status}`);
            const data = await response.json();
            
            if (isMounted && mapInstanceRef.current === map) {
              const latlng = L.latLng(data.location.lat, data.location.lng);
              handleLocationFound(latlng, data.accuracy);
            }
          } catch (error) {
            if (!isMounted) return;
            console.error("Google Geolocation API failed, falling back to browser API.", error);
            toast({
              variant: "destructive",
              title: "Google Location Failed",
              description: "Falling back to standard browser location. This may be less accurate.",
            });
            locateWithBrowser();
          }
        } else {
          if (!isMounted) return;
          console.warn("NEXT_PUBLIC_GOOGLE_API_KEY is not set. Falling back to browser location.");
          locateWithBrowser();
        }
      };

      getInitialLocation();
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // The empty dependency array ensures this effect runs only once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[60vh] lg:min-h-0 rounded-lg"
    />
  );
}

const WeatherMap = memo(BaseWeatherMap);
export default WeatherMap;
