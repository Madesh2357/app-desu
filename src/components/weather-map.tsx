"use client";

import { useRef, useEffect, memo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "@/hooks/use-toast";

interface WeatherMapProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

const INITIAL_CENTER: L.LatLngTuple = [20.5937, 78.9629];
const INITIAL_ZOOM = 5;

// Fix for default icon path issue with bundlers.
// This needs to run only once.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function BaseWeatherMap({ onLocationSelect }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(INITIAL_CENTER, INITIAL_ZOOM);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const updateMarkerAndSelect = (latlng: L.LatLng) => {
        if (!mapInstanceRef.current) return;
        
        if (markerRef.current) {
          markerRef.current.setLatLng(latlng);
        } else {
          markerRef.current = L.marker(latlng).addTo(mapInstanceRef.current);
        }
        markerRef.current.bindPopup("Selected Location").openPopup();
        onLocationSelect(latlng.lat, latlng.lng);
      };

      map.on('click', (e) => {
        updateMarkerAndSelect(e.latlng);
      });

      const locateWithBrowser = () => {
        // Ensure map instance exists and component is mounted
        if (!mapInstanceRef.current || !isMounted) return;

        mapInstanceRef.current.locate({ enableHighAccuracy: true }).on("locationfound", (e) => {
          if (mapInstanceRef.current === map && isMounted) {
            map.flyTo(e.latlng, 10);
            updateMarkerAndSelect(e.latlng);
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
            const latlng = L.latLng(data.location.lat, data.location.lng);
            
            if (isMounted && mapInstanceRef.current === map) {
              map.flyTo(latlng, 10);
              updateMarkerAndSelect(latlng);
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