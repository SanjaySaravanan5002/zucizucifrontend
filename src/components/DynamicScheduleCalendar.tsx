import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuci-backend-my3h.onrender.com/api';

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

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const [scheduledRes, customersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/schedule/scheduled-washes`, {
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        axios.get(`${API_BASE_URL}/leads?status=New`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ]);
      
      setScheduledWashes(scheduledRes.data.data || scheduledRes.data);
      setUnassignedCustomers(customersRes.data.filter((c: Customer) => !c.assignedWasher));
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
      await axios.post(`${API_BASE_URL}/schedule/assign-to-date`, {
        leadId: draggedCustomer._id,
        targetDate: date.toISOString(),
        washType: draggedCustomer.leadType
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });

      // Remove from unassigned and refresh
      setUnassignedCustomers(prev => prev.filter(c => c._id !== draggedCustomer._id));
      fetchData();
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
                        className={`text-xs px-2 py-1 rounded ${
                          wash.status === 'completed' ? 'bg-green-100 text-green-800' :
                          wash.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <div className="truncate">{wash.customerName}</div>
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
    </div>
  );
};

export default DynamicScheduleCalendar;
