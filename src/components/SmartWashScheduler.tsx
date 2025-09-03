import React, { useState } from 'react';
import { Calendar, Clock, Repeat, Zap, Settings } from 'lucide-react';

interface SmartWashSchedulerProps {
  totalWashes: number;
  onScheduleGenerated: (schedules: any[]) => void;
  onCancel: () => void;
}

const SmartWashScheduler: React.FC<SmartWashSchedulerProps> = ({
  totalWashes,
  onScheduleGenerated,
  onCancel
}) => {
  const [schedulingMethod, setSchedulingMethod] = useState<'pattern' | 'bulk' | 'manual'>('pattern');
  const [patternConfig, setPatternConfig] = useState({
    frequency: 'weekly', // weekly, biweekly, monthly
    startDate: new Date().toISOString().split('T')[0],
    preferredDays: ['monday'], // days of week
    timeSlot: '09:00',
    skipWeekends: true,
    skipHolidays: false
  });
  
  const [bulkConfig, setBulkConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    distributeEvenly: true,
    timeSlot: '09:00'
  });

  const generatePatternSchedule = () => {
    const schedules = [];
    const startDate = new Date(patternConfig.startDate);
    let currentDate = new Date(startDate);
    
    const dayMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const preferredDayNumbers = patternConfig.preferredDays.map(day => dayMap[day]);
    
    for (let i = 0; i < totalWashes; i++) {
      // Find next preferred day
      while (!preferredDayNumbers.includes(currentDate.getDay()) || 
             (patternConfig.skipWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6))) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      schedules.push({
        washNumber: i + 1,
        scheduledDate: new Date(currentDate),
        scheduledTime: patternConfig.timeSlot,
        status: 'scheduled',
        washServiceType: 'Exterior'
      });
      
      // Move to next occurrence based on frequency
      switch (patternConfig.frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }
    
    return schedules;
  };

  const generateBulkSchedule = () => {
    const schedules = [];
    const startDate = new Date(bulkConfig.startDate);
    const endDate = new Date(bulkConfig.endDate);
    
    if (bulkConfig.distributeEvenly) {
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const interval = Math.max(1, Math.floor(totalDays / totalWashes));
      
      for (let i = 0; i < totalWashes; i++) {
        const washDate = new Date(startDate);
        washDate.setDate(startDate.getDate() + (i * interval));
        
        schedules.push({
          washNumber: i + 1,
          scheduledDate: washDate,
          scheduledTime: bulkConfig.timeSlot,
          status: 'scheduled',
          washServiceType: 'Exterior'
        });
      }
    }
    
    return schedules;
  };

  const handleGenerate = () => {
    let schedules = [];
    
    switch (schedulingMethod) {
      case 'pattern':
        schedules = generatePatternSchedule();
        break;
      case 'bulk':
        schedules = generateBulkSchedule();
        break;
      default:
        schedules = [];
    }
    
    onScheduleGenerated(schedules);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Smart Wash Scheduler - {totalWashes} Washes
        </h3>
        <p className="text-sm text-gray-600">
          Choose how you want to schedule {totalWashes} washes automatically
        </p>
      </div>

      {/* Scheduling Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Scheduling Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              schedulingMethod === 'pattern' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSchedulingMethod('pattern')}
          >
            <div className="flex items-center mb-2">
              <Repeat className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Pattern Based</span>
            </div>
            <p className="text-xs text-gray-600">
              Weekly, bi-weekly, or monthly patterns
            </p>
          </div>
          
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              schedulingMethod === 'bulk' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSchedulingMethod('bulk')}
          >
            <div className="flex items-center mb-2">
              <Zap className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Bulk Distribution</span>
            </div>
            <p className="text-xs text-gray-600">
              Distribute evenly over date range
            </p>
          </div>
          
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              schedulingMethod === 'manual' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSchedulingMethod('manual')}
          >
            <div className="flex items-center mb-2">
              <Settings className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium">Manual Entry</span>
            </div>
            <p className="text-xs text-gray-600">
              Enter each date manually (not recommended for 40+ washes)
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Configuration */}
      {schedulingMethod === 'pattern' && (
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Pattern Configuration</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={patternConfig.frequency}
                onChange={(e) => setPatternConfig({...patternConfig, frequency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={patternConfig.startDate}
                onChange={(e) => setPatternConfig({...patternConfig, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Days
            </label>
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={patternConfig.preferredDays.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPatternConfig({
                          ...patternConfig,
                          preferredDays: [...patternConfig.preferredDays, day]
                        });
                      } else {
                        setPatternConfig({
                          ...patternConfig,
                          preferredDays: patternConfig.preferredDays.filter(d => d !== day)
                        });
                      }
                    }}
                    className="mr-1"
                  />
                  <span className="text-sm capitalize">{day}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot
              </label>
              <input
                type="time"
                value={patternConfig.timeSlot}
                onChange={(e) => setPatternConfig({...patternConfig, timeSlot: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4 pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patternConfig.skipWeekends}
                  onChange={(e) => setPatternConfig({...patternConfig, skipWeekends: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm">Skip Weekends</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Configuration */}
      {schedulingMethod === 'bulk' && (
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Bulk Distribution Configuration</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={bulkConfig.startDate}
                onChange={(e) => setBulkConfig({...bulkConfig, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={bulkConfig.endDate}
                onChange={(e) => setBulkConfig({...bulkConfig, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot
              </label>
              <input
                type="time"
                value={bulkConfig.timeSlot}
                onChange={(e) => setBulkConfig({...bulkConfig, timeSlot: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={bulkConfig.distributeEvenly}
                  onChange={(e) => setBulkConfig({...bulkConfig, distributeEvenly: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm">Distribute Evenly</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Manual Warning */}
      {schedulingMethod === 'manual' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Manual Entry Not Recommended
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Manual entry for {totalWashes} washes will be time-consuming. 
                  Consider using Pattern Based or Bulk Distribution methods for better efficiency.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={schedulingMethod === 'bulk' && !bulkConfig.endDate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {schedulingMethod === 'manual' ? 'Continue Manual Entry' : 'Generate Schedule'}
        </button>
      </div>
    </div>
  );
};

export default SmartWashScheduler;