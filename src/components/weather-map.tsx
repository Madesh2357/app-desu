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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Function to handle setting a new location, which always uses the current map instance
    const setLocation = (latlng: L.LatLng, popupText: string) => {
      const map = mapInstanceRef.current;
      if (!map) return; // Guard against calls after map is destroyed

      onLocationSelect(latlng.lat, latlng.lng);

      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        markerRef.current = L.marker(latlng).addTo(map);
      }
      markerRef.current.bindPopup(popupText).openPopup();
      map.flyTo(latlng, map.getZoom());
    };
    
    // Initialize map only if the container ref is set and a map instance doesn't exist
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Handle map clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        setLocation(e.latlng, "Selected Location");
      });

      // Attempt to geolocate the user on initial load
      map.locate().on('locationfound', (e: L.LocationEvent) => {
        setLocation(e.latlng, "Your Location");
      });
    }

    // Cleanup function: remove map instance on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.stopLocate(); // Important to prevent async events on a removed map
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onLocationSelect]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[400px] rounded-lg"
    />
  );
}
