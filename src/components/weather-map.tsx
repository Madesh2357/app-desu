"use client";

import { useRef, useEffect, memo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  useEffect(() => {
    // This effect runs only once on mount, and the check ensures the map is initialized only once.
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(INITIAL_CENTER, INITIAL_ZOOM);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const updateMarkerAndSelect = (latlng: L.LatLng) => {
        if (markerRef.current) {
          markerRef.current.setLatLng(latlng);
        } else {
          markerRef.current = L.marker(latlng).addTo(map);
        }
        markerRef.current.bindPopup("Selected Location").openPopup();
        onLocationSelect(latlng.lat, latlng.lng);
      };

      map.on('click', (e) => {
        updateMarkerAndSelect(e.latlng);
      });

      // Try to get user's location automatically on load
      map.locate({ enableHighAccuracy: true }).on("locationfound", (e) => {
        map.flyTo(e.latlng, 10);
        updateMarkerAndSelect(e.latlng);
      }).on("locationerror", () => {
        // If it fails (e.g. permission denied, no GPS signal), do nothing.
        // The user can still click the map to get a forecast.
        console.warn("Could not fetch initial location. Please click the map.");
      });
    }

    // Cleanup function to run when the component unmounts.
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onLocationSelect]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[60vh] lg:min-h-0 rounded-lg"
    />
  );
}

const WeatherMap = memo(BaseWeatherMap);

export default WeatherMap;
