import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, Phone, MapPin, Car, Download, Search, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuci-sbackend.onrender.com/api';

interface ScheduledWash {
  _id: string;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  washType: string;
  scheduledDate: string;
  washer?: { name: string };
  leadId: string;
  status: string;
}

interface ApiResponse {
  success: boolean;
  data?: ScheduledWash[];
  message?: string;
  code?: string;
  count?: number;
}

// Status styling helper
const getStatusStyle = (status: string) => {
  const styles = {
    completed: {
      bg: 'bg-green-100 text-green-800',
      icon: '✅'
    },
    assigned: {
      bg: 'bg-yellow-100 text-yellow-800',
      icon: '👤'
    },
    pending: {
      bg: 'bg-blue-100 text-blue-800',
      icon: '🔵'
    }
  };
  
  return styles[status as keyof typeof styles] || styles.pending;
};

// Error notification component
const ErrorNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed top-4 right-4 z-50 max-w-md">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-3 text-red-400 hover:text-red-600"
        >
          ×
        </button>
      </div>
    </div>
  </div>
);

const ScheduleWash = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledWashes, setScheduledWashes] = useState<ScheduledWash[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ScheduledWash | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDateWashes, setSelectedDateWashes] = useState<ScheduledWash[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Optimized fetch function with useCallback
  const fetchScheduledWashes = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/schedule/scheduled-washes`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data.success && response.data.data) {
        setScheduledWashes(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch scheduled washes';
      
      console.error('Error fetching scheduled washes:', error);
      
      if (!silent) {
        setError(errorMessage);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [currentDate]);

  // Initial fetch
  useEffect(() => {
    fetchScheduledWashes();
  }, [fetchScheduledWashes]);

  // Background refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScheduledWashes(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchScheduledWashes]);

  // Window focus refresh
  useEffect(() => {
    const handleFocus = () => fetchScheduledWashes(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchScheduledWashes]);

  // Navigate months
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate]);

  // Memoized calendar days calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Optimized wash filtering
  const getWashesForDate = useCallback((date: Date) => {
    const targetDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return scheduledWashes.filter(wash => {
      const washDateStr = wash.scheduledDate.split('T')[0];
      if (washDateStr !== targetDateStr) return false;
      
      // Apply status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && wash.status === 'completed') return false;
        if (statusFilter === 'completed' && wash.status !== 'completed') return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return wash.customerName.toLowerCase().includes(searchLower) ||
               wash.phone.includes(searchQuery) ||
               wash.area.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }, [scheduledWashes, statusFilter, searchQuery]);

  // Event handlers
  const handleCustomerClick = useCallback((wash: ScheduledWash) => {
    setSelectedCustomer(wash);
    setShowModal(true);
  }, []);

  const handleMoreClick = useCallback((date: Date, washes: ScheduledWash[]) => {
    setSelectedDate(date);
    setSelectedDateWashes(washes);
    setShowDateModal(true);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchScheduledWashes();
  }, [fetchScheduledWashes]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchQuery('');
  }, []);

  // Download Excel with error handling
  const downloadExcel = useCallback(() => {
    try {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let csvContent = 'Date,Customer Name,Phone,Area,Car Model,Wash Type,Status,Washer\\n';
      
      scheduledWashes.forEach(wash => {
        const washDate = new Date(wash.scheduledDate);
        if (washDate >= monthStart && washDate <= monthEnd) {
          const row = [
            washDate.toLocaleDateString(),
            wash.customerName,
            wash.phone,
            wash.area,
            wash.carModel,
            wash.washType,
            wash.status || 'Pending',
            wash.washer?.name || 'Not Assigned'
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
          csvContent += row + '\\n';
        }
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-wash-${months[currentDate.getMonth()]}-${currentDate.getFullYear()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setError('Failed to download Excel file');
    }
  }, [currentDate, scheduledWashes, months]);

  const today = new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error Notification */}
      {error && (
        <ErrorNotification message={error} onClose={clearError} />
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-7 w-7 text-blue-600 mr-3" />
              Schedule Wash Calendar
            </h1>
            <p className="text-gray-600 mt-1">View and manage scheduled car washes</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={loading}
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={loading}
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-green-100 rounded-full transition-colors text-green-600"
              title="Refresh Calendar"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={downloadExcel}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
              title="Download Excel"
              disabled={loading || scheduledWashes.length === 0}
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">🔵 Pending</option>
              <option value="completed">🟢 Completed</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {daysOfWeek.map(day => (
            <div key={day} className="p-4 text-center font-medium text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === today.toDateString();
            const washesForDate = getWashesForDate(date);
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                }`}>
                  {date.getDate()}
                </div>
                
                {/* Scheduled washes */}
                <div className="space-y-1">
                  {washesForDate.slice(0, 6).map((wash, washIndex) => {
                    const statusStyle = getStatusStyle(wash.status);
                    
                    return (
                      <div
                        key={washIndex}
                        onClick={() => handleCustomerClick(wash)}
                        className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-colors ${statusStyle.bg}`}
                        title={`${wash.customerName} - ${wash.washType}\\nWasher: ${wash.washer?.name || 'Not Assigned'}\\nStatus: ${wash.status || 'pending'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">{wash.customerName}</span>
                          <span className="ml-1">{statusStyle.icon}</span>
                        </div>
                        {wash.washer?.name && (
                          <div className="text-xs opacity-75 truncate">
                            👤 {wash.washer.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {washesForDate.length > 6 && (
                    <div 
                      onClick={() => handleMoreClick(date, washesForDate)}
                      className="text-xs text-blue-600 px-2 cursor-pointer hover:text-blue-800 font-medium"
                    >
                      +{washesForDate.length - 6} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.customerName}</p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone}</p>
                  <p className="text-sm text-gray-500">Phone</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.area}</p>
                  <p className="text-sm text-gray-500">Area</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Car className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.carModel}</p>
                  <p className="text-sm text-gray-500">Car Model</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Wash Details</p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 flex items-center">🧽 <span className="ml-1">Type: {selectedCustomer.washType}</span></p>
                  <p className="text-sm text-gray-600 flex items-center">📅 <span className="ml-1">
                    Date: {new Date(selectedCustomer.scheduledDate).toLocaleDateString()}
                  </span></p>
                  {selectedCustomer.washer ? (
                    <p className="text-sm text-gray-600 flex items-center">👤 <span className="ml-1">Washer: {selectedCustomer.washer.name}</span></p>
                  ) : (
                    <p className="text-sm text-orange-600 flex items-center">⚠️ <span className="ml-1">No washer assigned</span></p>
                  )}
                  <p className="text-sm text-gray-600 flex items-center">
                    📊 <span className="ml-1">Status: <span className={`font-medium ${
                      selectedCustomer.status === 'completed' ? 'text-green-600' : 
                      selectedCustomer.status === 'assigned' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {getStatusStyle(selectedCustomer.status).icon} {selectedCustomer.status === 'completed' ? 'Completed' :
                       selectedCustomer.status === 'assigned' ? 'Assigned' : 'Pending'}
                    </span></span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Modal for +more */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Scheduled Washes - {selectedDate.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-gray-400 hover:text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedDateWashes.map((wash, index) => {
                const statusStyle = getStatusStyle(wash.status);
                
                return (
                  <div key={index} className={`border rounded-lg p-4 ${statusStyle.bg.replace('text-', 'border-').replace('100', '200')}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{wash.customerName}</h4>
                      <span className="text-lg">{statusStyle.icon}</span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center">📞 {wash.phone}</p>
                    <p className="text-sm text-gray-600 flex items-center">📍 {wash.area}</p>
                    <p className="text-sm text-gray-600 flex items-center">🚗 {wash.carModel}</p>
                    <p className="text-sm font-medium text-gray-700 flex items-center">🧽 {wash.washType}</p>
                    {wash.washer?.name && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">👤 {wash.washer.name}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusStyle.bg}`}>
                        {wash.status || 'Pending'}
                      </span>
                      {wash.washer?.name && (
                        <span className="text-xs text-gray-500">
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white shadow-lg rounded-lg p-3 flex items-center space-x-2 border">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">Refreshing calendar...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleWash;
