import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';

interface DashboardStats {
  todayCompleted: number;
  todayPending: number;
  tomorrowScheduled: number;
  attendanceStatus: 'in' | 'out' | 'none';
}

interface AssignedLead {
  id: number;
  customerName: string;
  phone: string;
  area: string;
  leadType: string;
  status: string;
}

const WasherDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    todayCompleted: 0,
    todayPending: 0,
    tomorrowScheduled: 0,
    attendanceStatus: 'none'
  });
  const [assignedLeads, setAssignedLeads] = useState<AssignedLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const fetchDashboardStats = async () => {
    try {
      if (!user?.id) return;
      
      // Fetch washer dashboard stats
      const dashboardResponse = await axios.get(`https://zuci-sbackend-4.onrender.com/api/washer/${user.id}/dashboard`);
      const dashboardData = dashboardResponse.data;
      
      // Fetch assigned leads for display
      const leadsResponse = await axios.get(`https://zuci-sbackend-4.onrender.com/api/washer/${user.id}/assigned-leads`);
      const responseData = leadsResponse.data;
      const allLeads = responseData.allLeads || responseData || [];
      
      setAssignedLeads(allLeads);
      setStats({
        todayCompleted: dashboardData.stats.todayCompleted,
        todayPending: dashboardData.stats.todayPending,
        tomorrowScheduled: dashboardData.stats.tomorrowScheduled,
        attendanceStatus: 'none'
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setAssignedLeads([]);
      setStats({
        todayCompleted: 0,
        todayPending: 0,
        tomorrowScheduled: 0,
        attendanceStatus: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (type: 'in' | 'out') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://zuci-sbackend-4.onrender.com/api/washer/attendance', {
        washerId: user?.id,
        type
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setStats(prev => ({ ...prev, attendanceStatus: type }));
      showToast('success', `Time-${type} marked successfully!`);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      showToast('error', error.response?.data?.message || `Failed to mark time-${type}`);
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
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Manage your work and attendance</p>
      </div>

      {/* Attendance Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => handleAttendance('in')}
              disabled={stats.attendanceStatus === 'in'}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4 mr-2" />
              Clock In
            </button>
            <button
              onClick={() => handleAttendance('out')}
              disabled={stats.attendanceStatus === 'out' || stats.attendanceStatus === 'none'}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="h-4 w-4 mr-2" />
              Clock Out
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${
            stats.attendanceStatus === 'in' ? 'bg-green-500' : 
            stats.attendanceStatus === 'out' ? 'bg-red-500' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm text-gray-600">
            Status: {stats.attendanceStatus === 'in' ? 'Clocked In' : 
                    stats.attendanceStatus === 'out' ? 'Clocked Out' : 'Not Clocked In'}
          </span>
        </div>
      </div>

      {/* Work Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Today's Completed</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.todayCompleted}</dd>
                <dd className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB')}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Today's Pending</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.todayPending}</dd>
                <dd className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB')}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Tomorrow</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.tomorrowScheduled}</dd>
                <dd className="text-xs text-gray-400">{new Date(Date.now() + 24*60*60*1000).toLocaleDateString('en-GB')}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasherDashboard;
