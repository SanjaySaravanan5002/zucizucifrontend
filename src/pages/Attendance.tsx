import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, Filter, RefreshCw, Activity, UserCheck, UserX, Grid, List, Download, Edit } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCard from '../components/AttendanceCard';
import AttendanceNotifications from '../components/AttendanceNotifications';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { createStyledWorkbook } from '../utils/excelStyles';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAttendance, setEditAttendance] = useState<any>(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [selectedWasherForEdit, setSelectedWasherForEdit] = useState<AttendanceRecord | null>(null);
  const [selectedEditDate, setSelectedEditDate] = useState('');

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
      
      const response = await axios.get('https://zuci-sbackend-12.onrender.com/api/dashboard/washer-attendance', {
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

  const handleEditAttendance = async (washer: AttendanceRecord, attendanceRecord: any) => {
    setEditAttendance({
      washer,
      record: attendanceRecord,
      newStatus: attendanceRecord.status
    });
    setShowEditModal(true);
  };

  const handleDateBasedEdit = (washer: AttendanceRecord) => {
    setSelectedWasherForEdit(washer);
    setSelectedEditDate(new Date().toISOString().split('T')[0]);
    setShowDatePickerModal(true);
  };

  const proceedWithDateEdit = () => {
    if (!selectedWasherForEdit || !selectedEditDate) return;
    
    const targetDate = new Date(selectedEditDate).toISOString().split('T')[0];
    const existingRecord = selectedWasherForEdit.recentAttendance?.find(att => {
      const attDate = new Date(att.date).toISOString().split('T')[0];
      return attDate === targetDate;
    });
    
    const recordToEdit = existingRecord || {
      date: selectedEditDate,
      status: 'absent',
      timeIn: null,
      timeOut: null,
      _id: null
    };
    
    setEditAttendance({
      washer: selectedWasherForEdit,
      record: recordToEdit,
      newStatus: recordToEdit.status,
      selectedDate: selectedEditDate
    });
    
    setShowDatePickerModal(false);
    setShowEditModal(true);
  };

  const saveAttendanceEdit = async () => {
    if (!editAttendance) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (editAttendance.selectedDate) {
        await axios.put(
          `https://zuci-sbackend-12.onrender.com/api/washer/${editAttendance.washer.id}/attendance/date/${editAttendance.selectedDate}`,
          {
            status: editAttendance.newStatus,
            date: editAttendance.selectedDate
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        await axios.put(
          `https://zuci-sbackend-12.onrender.com/api/washer/${editAttendance.washer.id}/attendance/${editAttendance.record._id}`,
          {
            status: editAttendance.newStatus,
            timeIn: editAttendance.record.timeIn,
            timeOut: editAttendance.record.timeOut
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      setShowEditModal(false);
      setEditAttendance(null);
      fetchAttendanceData();
      toast.success('Attendance updated successfully');
    } catch (error) {
      console.error('Error updating attendance:', error);
      if (error.response?.status === 404) {
        toast.error('Attendance record not found');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required');
      } else {
        toast.error('Failed to update attendance');
      }
    }
  };

  const downloadExcel = async () => {
    try {
      // Use current filter settings instead of always using monthly data
      const reportFilter = {
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      };

      const token = localStorage.getItem('auth_token');
      const response = await axios.get('https://zuci-sbackend-12.onrender.com/api/dashboard/washer-attendance', {
        params: reportFilter,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const reportData = Array.isArray(response.data) ? response.data : [];
      
      if (reportData.length === 0) {
        toast.error('No attendance data to download for the selected date range');
        return;
      }

      // Generate date range based on filter
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      const allDates = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        allDates.push(new Date(d).toISOString().split('T')[0]);
      }

      const title = `Attendance Report - ${startDate.toLocaleDateString('en-GB')} to ${endDate.toLocaleDateString('en-GB')}`;
      const headers = ['Washer ID', 'Washer Name', 'Phone', 'Date', 'Time In', 'Time Out', 'Duration (Hours)', 'Status'];
      
      const attendanceData: any[][] = [];
      const washerStats = new Map(); // Track individual washer stats
      
      reportData.forEach(washer => {
        const attendanceMap = new Map();
        if (washer.recentAttendance && washer.recentAttendance.length > 0) {
          washer.recentAttendance.forEach(attendance => {
            const dateKey = new Date(attendance.date).toISOString().split('T')[0];
            attendanceMap.set(dateKey, attendance);
          });
        }

        let washerPresentDays = 0;
        let washerAbsentDays = 0;

        allDates.forEach(dateStr => {
          const attendance = attendanceMap.get(dateStr);
          const displayDate = new Date(dateStr).toLocaleDateString('en-GB');
          
          if (attendance) {
            const timeIn = attendance.timeIn ? new Date(attendance.timeIn).toLocaleTimeString('en-GB', { hour12: false }) : 'N/A';
            const timeOut = attendance.timeOut ? new Date(attendance.timeOut).toLocaleTimeString('en-GB', { hour12: false }) : 'N/A';
            
            let duration = 0;
            if (attendance.timeIn && attendance.timeOut) {
              const timeInDate = new Date(attendance.timeIn);
              const timeOutDate = new Date(attendance.timeOut);
              const durationMs = timeOutDate.getTime() - timeInDate.getTime();
              duration = Math.max(0, durationMs / (1000 * 60 * 60));
            } else if (attendance.duration) {
              duration = attendance.duration > 24 ? attendance.duration / 60 : attendance.duration;
            }
            
            attendanceData.push([washer.id, washer.name, washer.phone, displayDate, timeIn, timeOut, duration, attendance.status]);
            
            if (attendance.status === 'present') {
              washerPresentDays++;
            } else {
              washerAbsentDays++;
            }
          } else {
            attendanceData.push([washer.id, washer.name, washer.phone, displayDate, 'N/A', 'N/A', 0, 'absent']);
            washerAbsentDays++;
          }
        });

        // Store individual washer stats
        washerStats.set(washer.name, {
          presentDays: washerPresentDays,
          absentDays: washerAbsentDays
        });
      });
      
      // Build analytics data with overall stats first
      const analyticsData = [
        { label: 'Total Washers', value: reportData.length },
        { label: 'Total Working Days', value: allDates.length },
        { label: 'Total Records', value: attendanceData.length },
        { label: 'Present Days', value: attendanceData.filter(row => row[7] === 'present').length },
        { label: 'Absent Days', value: attendanceData.filter(row => row[7] === 'absent').length },
        { label: 'Attendance Rate', value: `${Math.round((attendanceData.filter(row => row[7] === 'present').length / attendanceData.length) * 100)}%` },
        { label: 'Total Hours Worked', value: attendanceData.reduce((sum, row) => sum + (typeof row[6] === 'number' ? row[6] : 0), 0).toFixed(1) }
      ];

      // Create individual washer details as structured table data
      const washerDetailsData: any[][] = [];
      washerDetailsData.push(['Washer Name', 'Present Days', 'Absent Days']); // Header row
      
      washerStats.forEach((stats, washerName) => {
        washerDetailsData.push([washerName, stats.presentDays, stats.absentDays]);
      });

      // Add the structured washer details to the main data after analytics
      const combinedData = [...attendanceData];
      
      // Add separator rows and washer details table
      combinedData.push([], []); // Two empty rows for separation
      combinedData.push(['═══ INDIVIDUAL WASHER DETAILS ═══', '', '', '', '', '', '', '']); // Header spanning all columns
      combinedData.push([], []); // Empty rows
      
      // Add washer details table
      washerDetailsData.forEach(row => {
        const paddedRow = [...row];
        // Pad with empty cells to match main table width
        while (paddedRow.length < headers.length) {
          paddedRow.push('');
        }
        combinedData.push(paddedRow);
      });
      
      const { wb, ws } = createStyledWorkbook(title, headers, combinedData, analyticsData);
      
      const dateRange = `${startDate.toLocaleDateString('en-GB').replace(/\//g, '-')}_to_${endDate.toLocaleDateString('en-GB').replace(/\//g, '-')}`;
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
      XLSX.writeFile(wb, `Attendance-Report-${dateRange}.xlsx`);
      
      toast.success('Attendance report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download attendance report. Please try again.');
    }
  };

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
              onClick={downloadExcel}
              disabled={attendanceData.length === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              title={`Download report for ${dateFilter.startDate} to ${dateFilter.endDate}`}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </button>
            {/* <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('auth_token');
                  await axios.post('https://zuci-sbackend-12.onrender.com/api/dashboard/clear-sample-attendance', {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  fetchAttendanceData();
                } catch (error) {
                  console.error('Error clearing sample data:', error);
                }
              }}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear Fake Data
            </button> */}

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const latestAttendance = record.recentAttendance?.[0] || {
                              date: new Date().toISOString(),
                              status: 'absent',
                              timeIn: null,
                              timeOut: null
                            };
                            handleEditAttendance(record, latestAttendance);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Latest Attendance"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDateBasedEdit(record)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Attendance by Date"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
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
      
      {/* Date Picker Modal */}
      {showDatePickerModal && selectedWasherForEdit && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Date to Edit - {selectedWasherForEdit.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedEditDate}
                  onChange={(e) => setSelectedEditDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>You can edit attendance for any past date or today.</p>
                <p>If no record exists for this date, a new one will be created.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDatePickerModal(false);
                  setSelectedWasherForEdit(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithDateEdit}
                disabled={!selectedEditDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {showEditModal && editAttendance && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Attendance - {editAttendance.washer.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editAttendance.newStatus}
                  onChange={(e) => setEditAttendance({
                    ...editAttendance,
                    newStatus: e.target.value
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  {/* <option value="incomplete">Incomplete</option> */}
                </select>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Date:</strong> {editAttendance.selectedDate ? new Date(editAttendance.selectedDate).toLocaleDateString('en-GB') : (editAttendance.record?.date ? new Date(editAttendance.record.date).toLocaleDateString('en-GB') : 'N/A')}</p>
                {editAttendance.record?.timeIn && (
                  <p><strong>Time In:</strong> {new Date(editAttendance.record.timeIn).toLocaleTimeString()}</p>
                )}
                {editAttendance.record?.timeOut && (
                  <p><strong>Time Out:</strong> {new Date(editAttendance.record.timeOut).toLocaleTimeString()}</p>
                )}
                {editAttendance.selectedDate && (
                  <p className="text-blue-600 mt-2">✓ Editing attendance for selected date</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditAttendance(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveAttendanceEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

