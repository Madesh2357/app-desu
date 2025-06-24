"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

const INITIAL_CENTER: L.LatLngTuple = [20.5937, 78.9629];
const INITIAL_ZOOM = 5;

// A custom component to handle map events and logic
function MapController({ onLocationSelect }: WeatherMapProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [popupText, setPopupText] = useState("Click the map to get a forecast.");
  const map = useMap();

  // On initial load, get user location from IP and center the map
  useEffect(() => {
    fetch('https://ipinfo.io/json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch IP info');
        return res.json();
      })
      .then(data => {
        if (data.loc) {
          const [lat, lon] = data.loc.split(',').map(Number);
          const latlng = L.latLng(lat, lon);
          map.flyTo(latlng, 10);
          setPosition(latlng);
          setPopupText("Your estimated location. Click the map to get a forecast.")
        }
      })
      .catch(error => {
        console.error("Could not fetch initial location:", error);
        // Silently fail if IP lookup fails, user can still click the map.
      });
  }, [map]);

  // Handle map click events
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      setPopupText("Selected Location");
      onLocationSelect(lat, lng);
    },
  });

  // Render the marker and popup
  return position === null ? null : (
    <Marker position={position}>
      <Popup autoOpen={true}>{popupText}</Popup>
    </Marker>
  );
}

export function WeatherMap({ onLocationSelect }: WeatherMapProps) {
  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      scrollWheelZoom={true}
      className="w-full h-full min-h-[400px] rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}
