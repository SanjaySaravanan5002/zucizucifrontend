import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Crosshair } from 'lucide-react';

interface GPSMapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const GPSMapPicker: React.FC<GPSMapPickerProps> = ({
  onLocationSelect,
  initialLat = 13.0827,
  initialLng = 80.2707
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState({ lat: initialLat, lng: initialLng });

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const L = (window as any).L;
        
        // Create map with custom options
        const map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true
        }).setView([location.lat, location.lng], 15);
        mapInstanceRef.current = map;

        // Street/Road view with detailed roads and labels
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          className: 'street-tiles'
        });

        // Satellite hybrid view
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
          maxZoom: 18
        });

        // Terrain view
        const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenTopoMap contributors',
          maxZoom: 17
        });

        // Add default street layer
        streetLayer.addTo(map);

        // Layer control
        const baseLayers = {
          "Street View": streetLayer,
          "Satellite": satelliteLayer,
          "Terrain": terrainLayer
        };

        L.control.layers(baseLayers).addTo(map);

        // Custom green marker icon
        const greenIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 30px;
              height: 30px;
              background: linear-gradient(135deg, #10b981, #059669);
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        // Add marker with custom icon
        const marker = L.marker([location.lat, location.lng], {
          icon: greenIcon,
          draggable: true
        }).addTo(map);
        markerRef.current = marker;

        // Add accuracy circle
        const accuracyCircle = L.circle([location.lat, location.lng], {
          radius: 50,
          fillColor: '#10b981',
          fillOpacity: 0.1,
          color: '#10b981',
          weight: 2,
          opacity: 0.3
        }).addTo(map);

        // Handle marker drag
        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          setLocation({ lat: pos.lat, lng: pos.lng });
          onLocationSelect(pos.lat, pos.lng);
          accuracyCircle.setLatLng(pos);
        });

        // Handle map click
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          accuracyCircle.setLatLng([lat, lng]);
          setLocation({ lat, lng });
          onLocationSelect(lat, lng);
        });

        // Add custom CSS for professional styling
        const style = document.createElement('style');
        style.textContent = `
          .leaflet-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8fafc;
          }
          .leaflet-control-zoom {
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .leaflet-control-zoom a {
            background: white;
            color: #374151;
            border: none;
            font-weight: bold;
            font-size: 18px;
          }
          .leaflet-control-zoom a:hover {
            background: #f3f4f6;
            color: #10b981;
          }
          .street-tiles {
            filter: contrast(1.1) saturate(1.2) brightness(1.05);
          }
          .leaflet-control-layers {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: none;
          }
          .leaflet-control-layers-toggle {
            background-image: none;
            background-color: #10b981;
            border-radius: 4px;
          }
          .leaflet-control-layers-toggle:after {
            content: '🗺️';
            font-size: 16px;
            line-height: 26px;
            text-align: center;
            display: block;
          }
        `;
        document.head.appendChild(style);

        setIsLoading(false);
      };

      script.onerror = () => {
        setIsLoading(false);
        console.error('Failed to load map library');
      };

      document.body.appendChild(script);
    };

    if (!(window as any).L) {
      initMap();
    } else {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLocation({ lat, lng });
        onLocationSelect(lat, lng);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        
        setIsLoading(false);
      },
      () => setIsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Location Selector</h3>
                <p className="text-sm text-gray-600">Choose your precise location</p>
              </div>
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Locating...
                </>
              ) : (
                <>
                  <Crosshair className="h-4 w-4 mr-2" />
                  My Location
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-96 bg-gray-100"
            style={{ minHeight: '384px' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-900">Loading Map</p>
                <p className="text-sm text-gray-600">Please wait while we prepare your location picker</p>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="font-medium text-gray-700">Interactive Map</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Latitude</div>
              <div className="text-lg font-mono text-gray-900">{location.lat.toFixed(6)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Longitude</div>
              <div className="text-lg font-mono text-gray-900">{location.lng.toFixed(6)}</div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center">
                <Navigation className="h-4 w-4 mr-1" />
                Drag the marker or click anywhere on the map to set location
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSMapPicker;

