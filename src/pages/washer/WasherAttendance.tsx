import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface AttendanceRecord {
  date: string;
  timeIn?: string;
  timeOut?: string;
  duration?: number;
  status: string;
}

const WasherAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    totalHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://zuci-sbackend.onrender.com/api/washer/${user?.id}/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAttendance(response.data.attendance || []);
      setStats(response.data.stats || { totalDays: 0, presentDays: 0, totalHours: 0 });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (type: 'in' | 'out') => {
    try {
      setIsMarkingAttendance(true);
      const token = localStorage.getItem('token');
      await axios.post('https://zuci-sbackend.onrender.com/api/washer/attendance', {
        washerId: user?.id,
        type
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success(`Time-${type} marked successfully`);
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to mark time-${type}`);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  if (loading) {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance</h1>
        <p className="text-gray-600">Track your daily attendance and working hours</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mark Attendance</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => markAttendance('in')}
              disabled={isMarkingAttendance}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4 mr-2" />
              Clock In
            </button>
            <button
              onClick={() => markAttendance('out')}
              disabled={isMarkingAttendance}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4 mr-2" />
              Clock Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Days</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalDays}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Present Days</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.presentDays}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Hours</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalHours.toFixed(1)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.timeIn ? new Date(record.timeIn).toLocaleTimeString('en-IN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-IN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.duration ? `${record.duration.toFixed(1)} hrs` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.timeIn && record.timeOut
                        ? 'bg-green-100 text-green-800'
                        : record.timeIn
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.timeIn && record.timeOut
                        ? 'Complete'
                        : record.timeIn
                        ? 'Incomplete'
                        : 'Absent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WasherAttendance;
