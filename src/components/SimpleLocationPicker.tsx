import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface SimpleLocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const SimpleLocationPicker: React.FC<SimpleLocationPickerProps> = ({
  onLocationSelect,
  initialLat = 13.0827,
  initialLng = 80.2707
}) => {
  const [location, setLocation] = useState({ lat: initialLat, lng: initialLng });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawMap();
  }, [location]);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#e5f3ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw marker at center (representing selected location)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Marker pin
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 10, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Marker base
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 2);
    ctx.lineTo(centerX - 6, centerY + 8);
    ctx.lineTo(centerX + 6, centerY + 8);
    ctx.closePath();
    ctx.fill();

    // Location text
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`, centerX, canvas.height - 10);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert canvas coordinates to approximate lat/lng (simplified)
    const lat = location.lat + (canvas.height / 2 - y) * 0.001;
    const lng = location.lng + (x - canvas.width / 2) * 0.001;

    setLocation({ lat, lng });
    onLocationSelect(lat, lng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        onLocationSelect(lat, lng);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Location Selection
            </h3>
            <button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Getting...
                </>
              ) : (
                <>
                  <Navigation className="h-3 w-3 mr-1" />
                  Use Current Location
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            onClick={handleCanvasClick}
            className="w-full cursor-crosshair"
            style={{ maxHeight: '300px' }}
          />
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
            Click on map to select location
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border-t">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="p-3 bg-gray-50 border-t">
          <div className="text-xs text-gray-600">
            <strong>Selected:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLocationPicker;
