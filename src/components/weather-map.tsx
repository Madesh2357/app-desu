"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet's default icon path issue with webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationMarkerProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

function LocationMarker({ onLocationSelect }: LocationMarkerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const map = useMap();
  
    useEffect(() => {
      const onLocationFound = (e: L.LocationEvent) => {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      };
      
      const onMapClick = (e: L.LeafletMouseEvent) => {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      };

      map.on('locationfound', onLocationFound);
      map.on('click', onMapClick);

      // Locate user on initial load
      map.locate();
  
      // Cleanup function to remove listeners on component unmount
      return () => {
        map.off('locationfound', onLocationFound);
        map.off('click', onMapClick);
        map.stopLocate();
      };
    }, [map, onLocationSelect]);
  
    return position === null ? null : (
      <Marker position={position}>
        <Popup>Selected Location</Popup>
      </Marker>
    );
}

interface WeatherMapProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

export function WeatherMap({ onLocationSelect }: WeatherMapProps) {
  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '0.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}
