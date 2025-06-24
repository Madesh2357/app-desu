"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon paths in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface WeatherMapProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

export function WeatherMap({ onLocationSelect }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Use a ref to hold the latest onLocationSelect function without re-triggering the effect
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);


  useEffect(() => {
    // This effect runs only once to initialize the map.
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // A neutral default center
        zoom: 5,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Function to update marker and trigger analysis
      const selectLocation = (lat: number, lon: number, popupText: string) => {
          const currentMap = mapRef.current;
          if (!currentMap) return;

          const latlng = L.latLng(lat, lon);
          if (markerRef.current) {
            markerRef.current.setLatLng(latlng);
          } else {
            markerRef.current = L.marker(latlng).addTo(currentMap);
          }
          markerRef.current.bindPopup(popupText).openPopup();
          currentMap.setView(latlng, currentMap.getZoom());
          onLocationSelectRef.current(lat, lon);
      };

      // Handle map clicks to trigger analysis
      map.on('click', (e: L.LeafletMouseEvent) => {
        selectLocation(e.latlng.lat, e.latlng.lng, "Selected Location");
      });

      // Fetch initial location from ipinfo.io, but DO NOT trigger analysis
      fetch('https://ipinfo.io/json')
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to fetch IP info');
            }
            return res.json();
        })
        .then(data => {
          const currentMap = mapRef.current;
          if (currentMap && data.loc) {
            const [lat, lon] = data.loc.split(',').map(Number);
            const latlng = L.latLng(lat, lon);
            
            // Just center the map and place a marker, no analysis
            currentMap.flyTo(latlng, 10);
            if (markerRef.current) {
                markerRef.current.setLatLng(latlng);
            } else {
                markerRef.current = L.marker(latlng).addTo(currentMap);
            }
            markerRef.current.bindPopup("Your estimated location. Click the map to get a forecast.").openPopup();
          }
        })
        .catch(error => {
          console.error("Could not fetch initial location from ipinfo.io:", error);
          // Silently fail and let user click map.
        });
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once.

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[400px] rounded-lg"
    />
  );
}
