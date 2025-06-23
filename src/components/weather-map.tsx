"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// A component to handle map events and the location marker
function MapEventsAndMarker({ onLocationSelect }: WeatherMapProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    // On initial load, try to locate the user
    map.locate();
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}


// The main map component
export function WeatherMap({ onLocationSelect }: WeatherMapProps) {
  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventsAndMarker onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}
