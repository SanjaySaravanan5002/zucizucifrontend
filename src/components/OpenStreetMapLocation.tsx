import React, { useEffect, useRef, useState } from 'react';

interface OpenStreetMapLocationProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const OpenStreetMapLocation: React.FC<OpenStreetMapLocationProps> = ({
  onLocationSelect,
  initialLat = 13.0827,
  initialLng = 80.2707
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initializeMap = () => {
      try {
        const L = (window as any).L;
        if (!L) {
          setError('Map library not available');
          return;
        }
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);
        mapInstanceRef.current = map;
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        let marker = L.marker([initialLat, initialLng]).addTo(map);

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onLocationSelect(lat, lng);
        });

        setIsLoading(false);
        setError(null);
      } catch (err) {
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    if ((window as any).L) {
      initializeMap();
      return;
    }

    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.querySelector('script[src*="leaflet.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initializeMap;
      script.onerror = () => setError('Failed to load map');
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (mapInstanceRef.current) {
          const L = (window as any).L;
          mapInstanceRef.current.setView([lat, lng], 15);
          
          mapInstanceRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) {
              mapInstanceRef.current.removeLayer(layer);
            }
          });
          
          L.marker([lat, lng]).addTo(mapInstanceRef.current);
          onLocationSelect(lat, lng);
        }
        setIsLoading(false);
      },
      () => {
        setError('Unable to get location');
        setIsLoading(false);
      }
    );
  };

  if (error) {
    return (
      <div className="h-[400px] w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={getCurrentLocation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Use Current Location
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[400px] w-full rounded-lg" />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <button 
        onClick={getCurrentLocation}
        className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
      >
        📍 Current Location
      </button>
    </div>
  );
};

export default OpenStreetMapLocation;