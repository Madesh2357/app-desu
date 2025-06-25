"use client";

import { useState, useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

interface WeatherMapProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

const INITIAL_CENTER: L.LatLngTuple = [20.5937, 78.9629]; // Center of India
const INITIAL_ZOOM = 5;

// This component handles map events like clicks and initial location
function MapEventsHandler({ 
  onLocationSelect, 
  setPosition 
}: { 
  onLocationSelect: (lat: number, lng: number) => void;
  setPosition: (position: L.LatLng) => void;
}) {
  const map = useMap();

  useEffect(() => {
    // Fix for default icon path issue with webpack and Next.js
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // On initial load, try to get user location
  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 10);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }).on("locationerror", function(e){
      console.warn("Could not fetch initial location:", e.message);
      // If location fails, we don't do anything, user can click the map.
    });
  // The onLocationSelect callback is stable due to useCallback in parent,
  // so including it is safe and correct.
  }, [map, onLocationSelect, setPosition]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      onLocationSelect(lat, lng);
    },
  });

  // This component does not render anything itself
  return null;
}

function BaseWeatherMap({ onLocationSelect }: WeatherMapProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

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
      <MapEventsHandler onLocationSelect={onLocationSelect} setPosition={setPosition} />
      {position && (
        <Marker position={position}>
          <Popup>Selected Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

// Memoize the component to prevent re-renders when parent state changes
const WeatherMap = memo(BaseWeatherMap);
WeatherMap.displayName = 'WeatherMap';

export default WeatherMap;
