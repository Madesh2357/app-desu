"use client";

import { useState, useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

interface WeatherMapProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

const INITIAL_CENTER: L.LatLngTuple = [20.5937, 78.9629]; // Center of India
const INITIAL_ZOOM = 5;

// This component handles map events and the marker's position
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    // Fix for default icon path issue with webpack
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // On initial load, try to get user location
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 10);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }).on("locationerror", function(e){
      console.warn("Could not fetch initial location:", e.message);
    });
  }, [map, onLocationSelect]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      onLocationSelect(lat, lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}


function BaseWeatherMap({ onLocationSelect }: WeatherMapProps) {
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
      <MapEvents onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}

const WeatherMap = memo(BaseWeatherMap);

export default WeatherMap;
