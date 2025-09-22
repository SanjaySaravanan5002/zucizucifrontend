import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, UserCheck, UserX } from 'lucide-react';

interface AttendanceNotification {
  id: string;
  type: 'clock-in' | 'clock-out' | 'absent';
  washerName: string;
  time: Date;
  message: string;
}

interface AttendanceNotificationsProps {
  attendanceData: any[];
}

const AttendanceNotifications: React.FC<AttendanceNotificationsProps> = ({ attendanceData }) => {
  const [notifications, setNotifications] = useState<AttendanceNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [previousData, setPreviousData] = useState<any[]>([]);

  useEffect(() => {
    if (previousData.length > 0) {
      const newNotifications: AttendanceNotification[] = [];
      
      attendanceData.forEach(current => {
        const previous = previousData.find(p => p.id === current.id);
        
        if (previous) {
          // Check for status changes
          if (previous.currentStatus !== current.currentStatus) {
            let type: 'clock-in' | 'clock-out' | 'absent' = 'clock-in';
            let message = '';
            
            if (current.currentStatus === 'active' && previous.currentStatus === 'absent') {
              type = 'clock-in';
              message = `${current.name} clocked in`;
            } else if (current.currentStatus === 'completed' && previous.currentStatus === 'active') {
              type = 'clock-out';
              message = `${current.name} clocked out`;
            } else if (current.currentStatus === 'absent') {
              type = 'absent';
              message = `${current.name} is absent`;
            }
            
            if (message) {
              newNotifications.push({
                id: `${current.id}-${Date.now()}`,
                type,
                washerName: current.name,
                time: new Date(),
                message
              });
            }
          }
        }
      });
      
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Keep only last 10
      }
    }
    
    setPreviousData(attendanceData);
  }, [attendanceData]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'clock-in': return <Clock className="h-4 w-4 text-green-600" />;
      case 'clock-out': return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'absent': return <UserX className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'clock-in': return 'border-l-green-500 bg-green-50';
      case 'clock-out': return 'border-l-blue-500 bg-blue-50';
      case 'absent': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
      >
        <Bell className="h-6 w-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Live Updates</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No recent updates</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.time.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceNotifications;

