import React from 'react';
import { Clock, User, Activity, UserCheck, UserX, Phone, Mail } from 'lucide-react';

interface AttendanceCardProps {
  washer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    currentStatus: 'active' | 'completed' | 'absent';
    timeIn?: string;
    timeOut?: string;
    presentDays: number;
    totalDays: number;
    totalHours: number;
    attendancePercentage: string;
  };
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ washer }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4" />;
      case 'completed': return <UserCheck className="h-4 w-4" />;
      case 'absent': return <UserX className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{washer.name}</h3>
            <p className="text-sm text-gray-500">ID: {washer.id}</p>
          </div>
        </div>
        
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(washer.currentStatus)}`}>
          {getStatusIcon(washer.currentStatus)}
          <span className="ml-1 capitalize">{washer.currentStatus}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2" />
          {washer.phone}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2" />
          {washer.email}
        </div>
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Time In</p>
          <p className="text-lg font-semibold text-gray-900">{formatTime(washer.timeIn)}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Time Out</p>
          <p className="text-lg font-semibold text-gray-900">{formatTime(washer.timeOut)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{washer.presentDays}</p>
          <p className="text-xs text-gray-500">Present Days</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{washer.totalHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-500">Total Hours</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{washer.attendancePercentage}%</p>
          <p className="text-xs text-gray-500">Attendance</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Attendance Progress</span>
          <span>{washer.attendancePercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${washer.attendancePercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCard;

