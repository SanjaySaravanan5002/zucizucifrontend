import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, Phone, MapPin, Car, Download, Search, Filter, RefreshCw } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { createStyledWorkbook } from '../utils/excelStyles';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuci-sbackend-8.onrender.com/api';

interface ScheduledWash {
  _id: string;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  washType: string;
  washCategory?: string; // Interior or Exterior
  washServiceType?: string; // Interior or Exterior
  serviceType?: string; // Interior or Exterior (alternative field)
  scheduledDate: string;
  washer?: { name: string };
  leadId: string;
  status: string;
}

const ScheduleWash = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledWashes, setScheduledWashes] = useState<ScheduledWash[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<ScheduledWash | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDateWashes, setSelectedDateWashes] = useState<ScheduledWash[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editWashData, setEditWashData] = useState({
    scheduledDate: '',
    washType: '',
    washer: ''
  });
  const [washers, setWashers] = useState<any[]>([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch scheduled washes with optional silent mode
  const fetchScheduledWashes = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await axios.get(`${API_BASE_URL}/schedule/scheduled-washes`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      // Data is already in correct format from schedule API
      console.log('Calendar data updated:', response.data.length, 'washes');
      setScheduledWashes(response.data);
    } catch (error) {
      console.error('Error fetching scheduled washes:', error);
      // Don't clear existing data on error to maintain continuity
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledWashes();
  }, [currentDate]);

  // Background refresh every 30 seconds without loading indicator
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScheduledWashes(true); // Silent refresh
    }, 30000);
    return () => clearInterval(interval);
  }, [currentDate]);

  // Listen for window focus to refresh immediately
  useEffect(() => {
    const handleFocus = () => fetchScheduledWashes(true); // Silent refresh on focus
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentDate]);

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Get washes for a specific date
  const getWashesForDate = (date: Date) => {
    const targetDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    let filteredWashes = scheduledWashes.filter(wash => {
      const washDate = new Date(wash.scheduledDate);
      const washDateStr = `${washDate.getFullYear()}-${String(washDate.getMonth() + 1).padStart(2, '0')}-${String(washDate.getDate()).padStart(2, '0')}`;
      return washDateStr === targetDateStr;
    });
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredWashes = filteredWashes.filter(wash => {
        if (statusFilter === 'pending') return wash.status !== 'completed';
        if (statusFilter === 'completed') return wash.status === 'completed';
        return true;
      });
    }
    
    // Apply search filter
    if (searchQuery) {
      filteredWashes = filteredWashes.filter(wash =>
        wash.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wash.phone.includes(searchQuery) ||
        wash.area.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filteredWashes;
  };

  // Fetch washers for assignment
  const fetchWashers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/washer/list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      setWashers(response.data);
    } catch (error) {
      console.error('Error fetching washers:', error);
    }
  };

  // Handle customer click
  const handleCustomerClick = async (wash: ScheduledWash) => {
    try {
      // Fetch lead details to get the correct wash service type
      const response = await axios.get(`${API_BASE_URL}/leads/${wash.leadId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      const leadData = response.data;
      
      // Find the wash history entry that matches the scheduled date
      const scheduledDate = new Date(wash.scheduledDate).toDateString();
      const matchingWashEntry = leadData.washHistory?.find((entry: any) => {
        const entryDate = new Date(entry.date).toDateString();
        return entryDate === scheduledDate && entry.washType === wash.washType;
      });
      
      // Update the selected customer with the correct wash service type
      const updatedWash = {
        ...wash,
        washServiceType: matchingWashEntry?.washServiceType || matchingWashEntry?.serviceType || wash.washServiceType || wash.serviceType || 'Exterior'
      };
      
      setSelectedCustomer(updatedWash);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      // Fallback to original wash data if API call fails
      setSelectedCustomer(wash);
      setShowModal(true);
    }
  };

  // Handle edit wash
  const handleEditWash = () => {
    if (selectedCustomer) {
      setEditWashData({
        scheduledDate: selectedCustomer.scheduledDate.split('T')[0],
        washType: selectedCustomer.washType,
        washer: selectedCustomer.washer?.name || ''
      });
      setShowEditModal(true);
      fetchWashers();
    }
  };

  // Update wash details
  const updateWashDetails = async () => {
    if (!selectedCustomer) return;
    
    try {
      console.log('Updating wash:', selectedCustomer._id, editWashData);
      const response = await axios.put(`${API_BASE_URL}/schedule/update-wash/${selectedCustomer._id}`, {
        scheduledDate: editWashData.scheduledDate,
        washType: editWashData.washType,
        washer: editWashData.washer
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      setShowEditModal(false);
      setShowModal(false);
      await fetchScheduledWashes();
    } catch (error) {
      console.error('Full error:', error.response?.data || error.message);
      alert(`Update failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle +more click
  const handleMoreClick = (date: Date, washes: ScheduledWash[]) => {
    setSelectedDate(date);
    setSelectedDateWashes(washes);
    setShowDateModal(true);
  };

  // Download Excel
  const downloadExcel = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthlyWashes = scheduledWashes.filter(wash => {
      const washDate = new Date(wash.scheduledDate);
      return washDate >= monthStart && washDate <= monthEnd;
    });
    
    if (monthlyWashes.length === 0) {
      alert('No scheduled washes to download for this month');
      return;
    }
    
    const title = `Schedule Wash Report - ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    const headers = ['Date', 'Customer Name', 'Phone', 'Area', 'Car Model', 'Wash Type', 'Status', 'Washer'];
    
    const washData = monthlyWashes.map(wash => [
      new Date(wash.scheduledDate).toLocaleDateString('en-GB'),
      wash.customerName,
      wash.phone,
      wash.area,
      wash.carModel,
      wash.washType,
      wash.status || 'Pending',
      wash.washer?.name || 'Not Assigned'
    ]);
    
    const analyticsData = [
      { label: 'Total Scheduled Washes', value: monthlyWashes.length },
      { label: 'Completed Washes', value: monthlyWashes.filter(w => w.status === 'completed').length },
      { label: 'Pending Washes', value: monthlyWashes.filter(w => w.status !== 'completed').length },
      { label: 'Assigned Washes', value: monthlyWashes.filter(w => w.washer?.name).length },
      { label: 'Unassigned Washes', value: monthlyWashes.filter(w => !w.washer?.name).length },
      { label: 'Completion Rate', value: `${Math.round((monthlyWashes.filter(w => w.status === 'completed').length / monthlyWashes.length) * 100)}%` }
    ];
    
    const { wb, ws } = createStyledWorkbook(title, headers, washData, analyticsData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule Report');
    XLSX.writeFile(wb, `Schedule-Wash-${months[currentDate.getMonth()]}-${currentDate.getFullYear()}.xlsx`);
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => fetchScheduledWashes()}
              className="p-2 hover:bg-green-100 rounded-full transition-colors text-green-600"
              title="Refresh Calendar"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            
            <button
              onClick={downloadExcel}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
              title="Download Excel"
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
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
                    let bgColor = 'bg-blue-100 text-blue-800'; // Pending (default)
                    let statusIcon = '🔵';
                    if (wash.status === 'completed') {
                      bgColor = 'bg-green-100 text-green-800';
                      statusIcon = '✅';
                    }
                    
                    return (
                      <div
                        key={washIndex}
                        onClick={() => handleCustomerClick(wash)}
                        className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-colors ${bgColor}`}
                        title={`${wash.customerName} - ${wash.washType}\nWasher: ${wash.washer?.name || 'Not Assigned'}\nStatus: ${wash.status || 'pending'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">{wash.customerName}</span>
                          <span className="ml-1">{statusIcon}</span>
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
                  <p className="text-sm text-gray-600 flex items-center">🚿 <span className="ml-1">Wash Type: {selectedCustomer.washServiceType || selectedCustomer.serviceType || selectedCustomer.washCategory || 'Exterior'}</span></p>
                  <p className="text-sm text-gray-600 flex items-center">
                    📊 <span className="ml-1">Status: <span className={`font-medium ${
                      selectedCustomer.status === 'completed' ? 'text-green-600' : 
                      'text-blue-600'
                    }`}>
                      {selectedCustomer.status === 'completed' ? '✅ Completed' : '🔵 Pending'}
                    </span></span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => {
                  const address = encodeURIComponent(selectedCustomer.area);
                  window.open(`https://www.google.com/maps/search/${address}`, '_blank');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={handleEditWash}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
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
                let bgColor = 'bg-blue-50 border-blue-200';
                let statusIcon = '🔵';
                if (wash.status === 'completed') {
                  bgColor = 'bg-green-50 border-green-200';
                  statusIcon = '✅';
                }
                
                return (
                  <div key={index} className={`border rounded-lg p-4 ${bgColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{wash.customerName}</h4>
                      <span className="text-lg">{statusIcon}</span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center">📞 {wash.phone}</p>
                    <p className="text-sm text-gray-600 flex items-center">📍 {wash.area}</p>
                    <p className="text-sm text-gray-600 flex items-center">🚗 {wash.carModel}</p>
                    <p className="text-sm font-medium text-gray-700 flex items-center">🧽 {wash.washType}</p>
                    {wash.washer?.name && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">👤 {wash.washer.name}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        wash.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {wash.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Wash Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Wash Schedule</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                <input
                  type="date"
                  value={editWashData.scheduledDate}
                  onChange={(e) => setEditWashData({...editWashData, scheduledDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wash Type</label>
                <select
                  value={editWashData.washType}
                  onChange={(e) => setEditWashData({...editWashData, washType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Washer</label>
                <select
                  value={editWashData.washer}
                  onChange={(e) => setEditWashData({...editWashData, washer: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Washer</option>
                  {washers.map((washer) => (
                    <option key={washer.id} value={washer.name}>
                      {washer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateWashDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
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

