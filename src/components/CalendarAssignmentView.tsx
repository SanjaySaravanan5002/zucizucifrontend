import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuci-sbackend-8.onrender.com/api';

interface Assignment {
  _id: string;
  customerName: string;
  washerName: string;
  date: string;
  status: string;
  message: string;
}

const CalendarAssignmentView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch assignments
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await axios.get(`${API_BASE_URL}/schedule/calendar-assignments`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      setAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentDate]);

  // Navigation
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

  // Get assignments for date
  const getAssignmentsForDate = (date: Date) => {
    const targetDateStr = date.toISOString().split('T')[0];
    return assignments.filter(assignment => 
      assignment.date.split('T')[0] === targetDateStr
    );
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending': return <Clock className="h-3 w-3 text-yellow-600" />;
      default: return <AlertCircle className="h-3 w-3 text-blue-600" />;
    }
  };

  // Status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-7 w-7 text-blue-600 mr-3" />
              Washer Assignment Calendar
            </h1>
            <p className="text-gray-600 mt-1">View customer-washer assignments by date</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Days header */}
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
            const assignmentsForDate = getAssignmentsForDate(date);
            
            return (
              <div
                key={index}
                className={`min-h-[140px] p-2 border-r border-b last:border-r-0 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                }`}>
                  {date.getDate()}
                </div>
                
                {/* Assignments */}
                <div className="space-y-1">
                  {assignmentsForDate.map((assignment, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2 rounded border ${getStatusColor(assignment.status)}`}
                      title={assignment.message}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">{assignment.customerName}</span>
                        {getStatusIcon(assignment.status)}
                      </div>
                      <div className="flex items-center text-xs opacity-75">
                        <User className="h-3 w-3 mr-1" />
                        <span className="truncate">{assignment.washerName}</span>
                      </div>
                      <div className="text-xs mt-1 font-medium">
                        {assignment.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
                  
                  {assignmentsForDate.length === 0 && isCurrentMonth && (
                    <div className="text-xs text-gray-400 text-center py-2">
                      No assignments
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm">Scheduled</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed top-4 right-4 bg-white shadow-lg rounded p-3 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Loading assignments...</span>
        </div>
      )}
    </div>
  );
};

export default CalendarAssignmentView;

