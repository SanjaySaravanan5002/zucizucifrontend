import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, Filter, RefreshCw, Activity, UserCheck, UserX, Grid, List } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCard from '../components/AttendanceCard';
import AttendanceNotifications from '../components/AttendanceNotifications';

interface AttendanceRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  currentStatus: 'active' | 'completed' | 'absent';
  timeIn?: string;
  timeOut?: string;
  presentDays: number;
  incompleteDays: number;
  totalDays: number;
  totalHours: number;
  attendancePercentage: string;
  recentAttendance: Array<{
    date: string;
    timeIn?: string;
    timeOut?: string;
    duration?: number;
    status: string;
  }>;
}

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAttendanceData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAttendanceData, 30000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setError('Please login to access attendance data');
        return;
      }
      
      if (!['admin', 'superadmin'].includes(user.role)) {
        setError('Access denied. Admin privileges required.');
        return;
      }
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }
      
      const response = await axios.get('https://zuci-backend-my3h.onrender.com/api/dashboard/washer-attendance', {
        params: dateFilter,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setAttendanceData(Array.isArray(response.data) ? response.data : []);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to fetch attendance data. Please try again.');
      }
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const activeWashers = attendanceData.filter(w => w.currentStatus === 'active').length;
  const completedWashers = attendanceData.filter(w => w.currentStatus === 'completed').length;
  const absentWashers = attendanceData.filter(w => w.currentStatus === 'absent').length;

  if (loading && attendanceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Real-Time Attendance Management</h1>
            <p className="text-gray-600">Monitor washer attendance and working hours in real-time</p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            {user && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <AttendanceNotifications attendanceData={attendanceData} />
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={fetchAttendanceData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Currently Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeWashers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{completedWashers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserX className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Absent Today</p>
              <p className="text-2xl font-bold text-gray-900">{absentWashers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Washers</p>
              <p className="text-2xl font-bold text-gray-900">{attendanceData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900">Date Filter</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateFilter({
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attendanceData.map((record) => (
            <AttendanceCard key={record.id} washer={record} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Washer Attendance Records</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Washer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.name}</div>
                          <div className="text-sm text-gray-500">ID: {record.id} • {record.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.currentStatus)}`}>
                          {getStatusIcon(record.currentStatus)}
                          <span className="ml-1 capitalize">{record.currentStatus}</span>
                        </span>
                      </div>
                      {record.timeIn && (
                        <div className="text-xs text-gray-500 mt-1">
                          In: {new Date(record.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {record.timeOut && (
                            <span> • Out: {new Date(record.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.presentDays}</div>
                      <div className="text-sm text-gray-500">of {record.totalDays} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="h-4 w-4 mr-1" />
                        {record.totalHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${record.attendancePercentage}%`}}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{record.attendancePercentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <UserX className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAttendanceData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      
      {!error && attendanceData.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
          <p className="text-gray-500 mb-4">No washers found for the selected date range.</p>
          <p className="text-sm text-gray-400">Make sure washers are registered in the system.</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;