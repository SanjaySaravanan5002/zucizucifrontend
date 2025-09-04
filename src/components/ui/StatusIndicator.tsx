import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusConfig = {
    online: {
      color: 'bg-emerald-500',
      label: 'Online',
      pulse: true
    },
    offline: {
      color: 'bg-gray-400',
      label: 'Offline',
      pulse: false
    },
    busy: {
      color: 'bg-red-500',
      label: 'Busy',
      pulse: true
    },
    away: {
      color: 'bg-amber-500',
      label: 'Away',
      pulse: false
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full ${config.color}`} />
        {config.pulse && (
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full ${config.color} animate-ping opacity-75`} />
        )}
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">{config.label}</span>
      )}
    </div>
  );
};

export default StatusIndicator;
