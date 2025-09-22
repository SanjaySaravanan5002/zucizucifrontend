import React, { useState, useEffect } from 'react';
import { X, User, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuci-sbackend-8.onrender.com/api';

interface Washer {
  _id: string;
  name: string;
  id: number;
}

interface Customer {
  _id: string;
  customerName: string;
  phone: string;
  area: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onAssignmentComplete: () => void;
}

const WasherAssignmentModal: React.FC<Props> = ({ isOpen, onClose, selectedDate, onAssignmentComplete }) => {
  const [washers, setWashers] = useState<Washer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schedulePattern, setSchedulePattern] = useState('weekly');
  const [customInterval, setCustomInterval] = useState(7);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatedDates, setGeneratedDates] = useState<string[]>([]);
  const [showAllDates, setShowAllDates] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    generateDates();
  }, [schedulePattern, customInterval, startDate]);

  const generateDates = () => {
    if (!startDate) return;
    
    const dates = [];
    const start = new Date(startDate);
    let interval = 7; // default weekly
    
    switch (schedulePattern) {
      case 'weekly': interval = 7; break;
      case 'biweekly': interval = 14; break;
      case 'monthly': interval = 30; break;
      case 'custom': interval = customInterval || 7; break;
    }
    
    // Generate first 10 dates as preview (can be extended)
    for (let i = 0; i < 10; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + (i * interval));
      dates.push(date.toISOString().split('T')[0]);
    }
    
    setGeneratedDates(dates);
  };

  const updateDate = (index: number, newDate: string) => {
    const updated = [...generatedDates];
    updated[index] = newDate;
    setGeneratedDates(updated);
  };

  const fetchData = async () => {
    try {
      const [washersRes, customersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/washers`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        axios.get(`${API_BASE_URL}/leads?status=New`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ]);
      
      setWashers(washersRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedWasher || !selectedCustomer) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/schedule/assign-washer-date`, {
        leadId: selectedCustomer,
        washerId: selectedWasher,
        targetDate: selectedDate.toISOString(),
        washType
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });

      onAssignmentComplete();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error assigning:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSchedulePattern('weekly');
    setCustomInterval(7);
    setStartDate(new Date().toISOString().split('T')[0]);
    setGeneratedDates([]);
    setShowAllDates(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Assign for {selectedDate.toDateString()}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Schedule Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Pattern
            </label>
            <select
              value={schedulePattern}
              onChange={(e) => setSchedulePattern(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Weekly (Every 7 days)</option>
              <option value="biweekly">Bi-weekly (Every 14 days)</option>
              <option value="monthly">Monthly (Every 30 days)</option>
              <option value="custom">Custom Interval</option>
            </select>
          </div>

          {schedulePattern === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Interval (days)
              </label>
              <input
                type="number"
                value={customInterval}
                onChange={(e) => setCustomInterval(parseInt(e.target.value))}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Generated Dates Preview */}
          {generatedDates.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Generated Dates ({generatedDates.length} washes)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAllDates(!showAllDates)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAllDates ? 'Show Less' : 'Edit All Dates'}
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                {(showAllDates ? generatedDates : generatedDates.slice(0, 5)).map((date, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm">Wash {index + 1}:</span>
                    {showAllDates ? (
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => updateDate(index, e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{new Date(date).toLocaleDateString()}</span>
                    )}
                  </div>
                ))}
                {!showAllDates && generatedDates.length > 5 && (
                  <div className="text-sm text-gray-500 text-center py-1">
                    ... and {generatedDates.length - 5} more dates
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedWasher || !selectedCustomer || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WasherAssignmentModal;

