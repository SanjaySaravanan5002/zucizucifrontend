import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, User, Edit, X, MapPin, Copy } from 'lucide-react';
import { apiService } from '../services/apiService';

interface Customer {
  _id: string;
  customerName: string;
  phone: string;
  area: string;
  leadType: string;
  assignedWasher?: { name: string };
}

interface ScheduledWash {
  _id: string;
  customerName: string;
  phone: string;
  area: string;
  scheduledDate: string;
  leadId: string;
  status: string;
}

const DynamicScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledWashes, setScheduledWashes] = useState<ScheduledWash[]>([]);
  const [unassignedCustomers, setUnassignedCustomers] = useState<Customer[]>([]);
  const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWash, setSelectedWash] = useState<ScheduledWash | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    scheduledDate: '',
    washType: 'Basic',
    washer: ''
  });
  const [washers, setWashers] = useState([]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const [scheduledRes, customersRes, washersRes] = await Promise.all([
        apiService.get(`/schedule/scheduled-washes?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        apiService.get('/leads'),
        apiService.get('/washer/list?forAssignment=true')
      ]);
      
      console.log('Scheduled washes response:', scheduledRes);
      console.log('Customers response:', customersRes);
      
      if (scheduledRes.success && customersRes.success) {
        setScheduledWashes(scheduledRes.data?.data || scheduledRes.data || []);
        // Filter for unassigned customers, including monthly customers without scheduled washes
        const allCustomers = customersRes.data || [];
        const unassigned = allCustomers.filter((c: Customer) => 
          c.leadType === 'Monthly' ? !c.assignedWasher : c.leadType === 'One-time' && !c.assignedWasher
        );
        setUnassignedCustomers(unassigned);
        console.log('Unassigned customers:', unassigned.map((c: Customer) => `${c.customerName} (${c.leadType})`));
      }
      
      if (washersRes.success) {
        setWashers(washersRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    return days;
  };

  // Get washes for date
  const getWashesForDate = (date: Date) => {
    const targetDateStr = date.toISOString().split('T')[0];
    return scheduledWashes.filter(wash => 
      wash.scheduledDate.split('T')[0] === targetDateStr
    );
  };

  // Drag handlers
  const handleDragStart = (customer: Customer) => {
    setDraggedCustomer(customer);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedCustomer) return;

    try {
      const response = await apiService.post('/schedule/assign-to-date', {
        leadId: draggedCustomer._id,
        targetDate: date.toISOString(),
        washType: draggedCustomer.leadType
      });

      if (response.success) {
        // Remove from unassigned and refresh
        setUnassignedCustomers(prev => prev.filter(c => c._id !== draggedCustomer._id));
        fetchData();
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
    }
    
    setDraggedCustomer(null);
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dynamic Schedule Calendar</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Unassigned Customers */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Unassigned Customers ({unassignedCustomers.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {unassignedCustomers.map(customer => (
              <div
                key={customer._id}
                draggable
                onDragStart={() => handleDragStart(customer)}
                className="p-3 bg-blue-50 border border-blue-200 rounded cursor-move hover:bg-blue-100 transition-colors"
              >
                <div className="font-medium text-sm">{customer.customerName}</div>
                <div className="text-xs text-gray-600">{customer.phone}</div>
                <div className="text-xs text-gray-500">{customer.area}</div>
                <div className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                  {customer.leadType}
                </div>
              </div>
            ))}
            {unassignedCustomers.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-4">
                No unassigned customers
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow overflow-hidden">
          {/* Days header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {daysOfWeek.map(day => (
              <div key={day} className="p-3 text-center font-medium text-gray-700 border-r last:border-r-0">
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
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, date)}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                    !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                  } ${draggedCustomer ? 'hover:bg-green-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Existing washes */}
                  <div className="space-y-1">
                    {washesForDate.map((wash, washIndex) => (
                      <div
                        key={washIndex}
                        onClick={() => {
                          setSelectedWash(wash);
                          setEditData({
                            scheduledDate: wash.scheduledDate.split('T')[0],
                            washType: 'Basic',
                            washer: ''
                          });
                        }}
                        className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 ${
                          wash.status === 'completed' ? 'bg-green-100 text-green-800' :
                          wash.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <div className="truncate font-medium">{wash.customerName}</div>
                        <div className="text-xs opacity-75">{wash.area || ''}</div>
                      </div>
                    ))}
                    
                    {/* Drop zone indicator */}
                    {draggedCustomer && (
                      <div className="border-2 border-dashed border-green-400 bg-green-50 p-2 rounded text-xs text-green-700 text-center">
                        Drop here to assign
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed top-4 right-4 bg-white shadow-lg rounded p-3 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Updating...</span>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedWash && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                  title="Edit Details"
                >
                  <Edit className="h-4 w-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={() => setSelectedWash(null)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedWash.customerName}</h4>
                <p className="text-sm text-gray-600">Customer</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">{selectedWash.phone}</h4>
                <p className="text-sm text-gray-600">Phone</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedWash.area}</h4>
                    <p className="text-sm text-gray-600">Area</p>
                  </div>
                  <button
                    onClick={() => {
                      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedWash.area)}`;
                      window.open(googleMapsUrl, '_blank');
                    }}
                    className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs transition-colors"
                    title="Open in Google Maps"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>Location</span>
                  </button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Wash Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>🧽</span>
                    <span className="text-sm">Type: Basic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📅</span>
                    <span className="text-sm">Date: {new Date(selectedWash.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📊</span>
                    <span className="text-sm">Status: {selectedWash.status === 'completed' ? '✅ Completed' : '⏳ Scheduled'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedWash(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedWash && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Wash Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await apiService.put(`/leads/${selectedWash.leadId}/reschedule`, {
                  newDate: editData.scheduledDate,
                  washType: editData.washType
                });
                
                if (response.success) {
                  setShowEditModal(false);
                  setSelectedWash(null);
                  fetchData(); // Refresh calendar
                }
              } catch (error) {
                console.error('Error updating wash:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={editData.scheduledDate}
                    onChange={(e) => setEditData({...editData, scheduledDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wash Type
                  </label>
                  <select
                    value={editData.washType}
                    onChange={(e) => setEditData({...editData, washType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Deluxe">Deluxe</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Washer
                  </label>
                  <select
                    value={editData.washer}
                    onChange={(e) => setEditData({...editData, washer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Washer</option>
                    {washers.map((washer: any) => (
                      <option key={washer._id} value={washer.id}>
                        {washer.name} (ID: {washer.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicScheduleCalendar;
