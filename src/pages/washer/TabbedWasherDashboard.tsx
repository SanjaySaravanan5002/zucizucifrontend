import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';


interface AssignedLead {
  id: number;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  leadType: string;
  status: string;
  washHistory: Array<{
    _id: string;
    washType: string;
    amount: number;
    date: string;
    washStatus: string;
    is_amountPaid: boolean;
    feedback?: string;
  }>;
}

const TabbedWasherDashboard = () => {
  const { user } = useAuth();
  // Removed tab state - only attendance now
  const [leads, setLeads] = useState<AssignedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState<'in' | 'out' | 'none'>('none');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState({
    todayCompleted: 0,
    todayPending: 0,
    tomorrowScheduled: 0,
    todayDate: '',
    tomorrowDate: '',
    todayWashes: [],
    tomorrowWashes: []
  });

  useEffect(() => {
    if (user?.id) {
      fetchDashboardStats();
      fetchAssignedLeads();
      fetchTodayAttendance();
      
      // Set up auto-refresh for assigned leads every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardStats();
        fetchAssignedLeads();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`https://zuci-backend-my3h.onrender.com/api/washer/${user?.id}/dashboard`);
      setDashboardStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard stats');
    }
  };

  const fetchAssignedLeads = async () => {
    try {
      const response = await axios.get(`https://zuci-backend-my3h.onrender.com/api/washer/${user?.id}/assigned-leads`);
      // Handle new API response structure
      if (response.data.allLeads) {
        setLeads(response.data.allLeads);
      } else {
        setLeads(response.data); // Fallback for old structure
      }
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      toast.error('Failed to fetch assigned leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get(`https://zuci-backend-my3h.onrender.com/api/washer/${user?.id}/attendance`);
      const today = new Date().toDateString();
      const todayRecord = response.data.attendance.find((record: any) => 
        new Date(record.date).toDateString() === today
      );
      
      if (todayRecord) {
        setTodayAttendance(todayRecord);
        if (todayRecord.timeIn && !todayRecord.timeOut) {
          setAttendanceStatus('in');
        } else if (todayRecord.timeOut) {
          setAttendanceStatus('out');
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAttendance = async (type: 'in' | 'out') => {
    try {
      await axios.post('https://zuci-backend-my3h.onrender.com/api/washer/attendance', {
        washerId: user?.id,
        type
      });
      
      setAttendanceStatus(type);
      toast.success(`Time-${type} marked successfully!`);
      fetchTodayAttendance();
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error(error.response?.data?.message || `Failed to mark time-${type}`);
    }
  };

  const handleUpdateWash = async (leadId: number) => {
    // Washers can only update existing wash entries
    const feedback = prompt('Enter feedback (optional):') || '';
    const paymentStatus = confirm('Is payment completed?');
    const washStatus = confirm('Is wash completed?') ? 'completed' : 'notcompleted';
    
    try {
      await axios.put(`https://zuci-backend-my3h.onrender.com/api/washer/${user?.id}/update-wash/${leadId}`, {
        washStatus,
        amountPaid: paymentStatus,
        feedback
      });
      
      toast.success('Wash status updated successfully');
      fetchDashboardStats();
      fetchAssignedLeads();
    } catch (error) {
      console.error('Error updating wash:', error);
      toast.error(error.response?.data?.message || 'Failed to update wash status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Use dashboard stats from API
  const { todayCompleted, todayPending, tomorrowScheduled, todayDate, tomorrowDate, todayWashes, tomorrowWashes } = dashboardStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Manage your work and attendance</p>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Today's Completed</dt>
                <dd className="text-lg font-medium text-gray-900">{todayCompleted}</dd>
                <dd className="text-xs text-gray-500 font-medium">{todayDate}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Today's Pending</dt>
                <dd className="text-lg font-medium text-gray-900">{todayPending}</dd>
                <dd className="text-xs text-gray-500 font-medium">{todayDate}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Tomorrow</dt>
                <dd className="text-lg font-medium text-gray-900">{tomorrowScheduled}</dd>
                <dd className="text-xs text-gray-500 font-medium">{tomorrowDate}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mark Attendance</h2>

          <div className="text-center">
            {/* Current Status */}
            <div className="mb-6">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                attendanceStatus === 'in' ? 'bg-green-100 text-green-800' :
                attendanceStatus === 'out' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                <div className={`h-2 w-2 rounded-full mr-2 ${
                  attendanceStatus === 'in' ? 'bg-green-500' :
                  attendanceStatus === 'out' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></div>
                {attendanceStatus === 'in' ? 'Clocked In' :
                 attendanceStatus === 'out' ? 'Clocked Out' :
                 'Not Clocked In'}
              </div>
            </div>

            {/* Clock In/Out Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleAttendance('in')}
                disabled={attendanceStatus === 'in'}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="h-5 w-5 mr-2" />
                Clock In
              </button>
              <button
                onClick={() => handleAttendance('out')}
                disabled={attendanceStatus === 'out' || attendanceStatus === 'none'}
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="h-5 w-5 mr-2" />
                Clock Out
              </button>
            </div>

            {/* Today's Attendance Info */}
            {todayAttendance && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Today's Attendance - {todayDate}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {todayAttendance.timeIn && (
                    <p>Clock In: {new Date(todayAttendance.timeIn).toLocaleTimeString()}</p>
                  )}
                  {todayAttendance.timeOut && (
                    <p>Clock Out: {new Date(todayAttendance.timeOut).toLocaleTimeString()}</p>
                  )}
                  {todayAttendance.duration && (
                    <p>Duration: {todayAttendance.duration.toFixed(2)} hours</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabbedWasherDashboard;