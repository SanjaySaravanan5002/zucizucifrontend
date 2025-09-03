import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface GoogleMapLocationProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

const GoogleMapLocation: React.FC<GoogleMapLocationProps> = ({
  onLocationSelect,
  initialLat = 13.0827,
  initialLng = 80.2707
}) => {
  const { showToast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const markerInstance = new window.google.maps.Marker({
        position: { lat: initialLat, lng: initialLng },
        map: mapInstance,
        draggable: true,
        title: 'Lead Location'
      });

      mapInstance.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        markerInstance.setPosition({ lat, lng });
        onLocationSelect(lat, lng);
      });

      markerInstance.addListener('dragend', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        onLocationSelect(lat, lng);
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setMapLoaded(true);
    };

    if (window.google) {
      initializeMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AlzaSyBblIRI5P06Hjt-NAcYM8ebaYb-P-HbJwT&callback=initGoogleMap`;
      script.async = true;
      script.defer = true;
      window.initGoogleMap = initializeMap;
      document.head.appendChild(script);
    }
  }, [initialLat, initialLng, onLocationSelect]);

  const getCurrentLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setCurrentLocation({ lat, lng });
        
        if (map && marker) {
          const newPosition = { lat, lng };
          map.setCenter(newPosition);
          map.setZoom(15);
          marker.setPosition(newPosition);
          onLocationSelect(lat, lng);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        showToast('error', 'Unable to retrieve your location. Please try again or select manually on the map.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Select Location</h3>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Navigation className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Getting Location...' : 'Use Current Location'}
        </button>
      </div>
      
      <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 relative">
        <div ref={mapRef} className="h-full w-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500 flex items-center">
        <MapPin className="h-4 w-4 mr-1" />
        Click on the map or use current location to set the lead's location
      </div>
      
      {currentLocation && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="text-sm text-green-800">
            <strong>Current Location:</strong> {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapLocation;