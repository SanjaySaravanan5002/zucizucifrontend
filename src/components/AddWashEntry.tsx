import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Car, User, Clock, MapPin, Zap } from 'lucide-react';
import { apiService } from '../services/apiService';

interface AddWashEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomPlan {
  name: string;
  price: number;
  washes: number;
  interiorWashes: number;
}

interface ScheduledWash {
  washNumber: number;
  scheduledDate: string;
  scheduledTime: string;
  serviceType: 'Exterior' | 'Interior' | 'Full Service';
  carName: string;
  carNumber: string;
  assignedWasher?: string;
}

const AddWashEntry: React.FC<AddWashEntryProps> = ({ isOpen, onClose, onSuccess }) => {
  const [washType, setWashType] = useState<'one-time' | 'monthly'>('one-time');
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>([]);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [washers, setWashers] = useState<Array<{_id: string, id: number, name: string}>>([]);
  
  // Customer details
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    area: '',
    carModel: '',
    carNumber: ''
  });

  // One-time wash data
  const [oneTimeData, setOneTimeData] = useState({
    washType: 'Basic',
    amount: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    serviceType: 'Exterior' as 'Exterior' | 'Interior' | 'Full Service'
  });

  // Monthly subscription data
  const [monthlyData, setMonthlyData] = useState({
    packageType: 'Basic',
    customPlanName: 'Basic',
    totalAmount: 300,
    totalWashes: 3,
    interiorWashes: 1,
    startDate: '',
    endDate: '',
    customerInterval: 7,
    defaultWasher: '', // Single washer for all washes
    scheduledWashes: [] as ScheduledWash[]
  });

  // Custom plan creation
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    washes: '',
    interiorWashes: '0'
  });

  // Auto-schedule generator
  const [showScheduleGenerator, setShowScheduleGenerator] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomPlans();
      fetchWashers();
    }
  }, [isOpen]);

  const fetchWashers = async () => {
    try {
      const response = await apiService.get('/washer/list?forAssignment=true');
      if (response.success) {
        setWashers(response.data);
      }
    } catch (error) {
      console.error('Error fetching washers:', error);
    }
  };

  // Calculate end date based on start date (30 days max)
  useEffect(() => {
    if (monthlyData.startDate) {
      const startDate = new Date(monthlyData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);
      
      setMonthlyData(prev => ({
        ...prev,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  }, [monthlyData.startDate]);

  const fetchCustomPlans = async () => {
    try {
      const response = await apiService.get('/leads/custom-plans');
      if (response.success) {
        setCustomPlans(response.data);
      }
    } catch (error) {
      console.error('Error fetching custom plans:', error);
    }
  };

  const handlePackageChange = (packageType: string) => {
    const packageDetails = {
      'Basic': { washes: 3, price: 300, interior: 1 },
      'Premium': { washes: 4, price: 400, interior: 2 },
      'Deluxe': { washes: 5, price: 500, interior: 2 },
      'Custom': { washes: 0, price: 0, interior: 0 }
    };

    const details = packageDetails[packageType] || packageDetails['Basic'];
    console.log('Package changed to:', packageType, 'Details:', details);
    
    setMonthlyData(prev => {
      const newData = {
        ...prev,
        packageType,
        totalAmount: details.price,
        totalWashes: details.washes,
        interiorWashes: details.interior,
        customPlanName: packageType === 'Custom' ? '' : packageType
      };
      console.log('New monthly data:', newData);
      return newData;
    });
  };

  const handleCustomPlanSelect = (plan: CustomPlan) => {
    setMonthlyData(prev => ({
      ...prev,
      packageType: 'Custom',
      customPlanName: plan.name,
      totalAmount: plan.price,
      totalWashes: plan.washes,
      interiorWashes: plan.interiorWashes
    }));
  };

  const createCustomPlan = async () => {
    try {
      const response = await apiService.post('/leads/custom-plans', {
        name: newPlan.name,
        price: parseFloat(newPlan.price),
        washes: parseInt(newPlan.washes),
        interiorWashes: parseInt(newPlan.interiorWashes)
      });

      if (response.success) {
        await fetchCustomPlans();
        setShowCreatePlan(false);
        setNewPlan({ name: '', price: '', washes: '', interiorWashes: '0' });
        
        // Auto-select the new plan
        handleCustomPlanSelect({
          name: newPlan.name,
          price: parseFloat(newPlan.price),
          washes: parseInt(newPlan.washes),
          interiorWashes: parseInt(newPlan.interiorWashes)
        });
      }
    } catch (error) {
      console.error('Error creating custom plan:', error);
    }
  };

  const generateScheduledWashes = () => {
    const washes: ScheduledWash[] = [];
    const startDate = new Date(monthlyData.startDate);
    const endDate = new Date(monthlyData.endDate);
    
    for (let i = 0; i < monthlyData.totalWashes; i++) {
      const washDate = new Date(startDate);
      washDate.setDate(startDate.getDate() + (i * monthlyData.customerInterval));
      
      // Ensure wash date doesn't exceed end date (30-day limit)
      if (washDate > endDate) {
        washDate.setTime(endDate.getTime() - (i * 24 * 60 * 60 * 1000)); // Distribute remaining washes
      }
      
      let serviceType: 'Exterior' | 'Interior' | 'Full Service' = 'Exterior';
      if (monthlyData.interiorWashes > 0) {
        const interiorInterval = Math.floor(monthlyData.totalWashes / monthlyData.interiorWashes);
        if ((i + 1) % interiorInterval === 0) {
          serviceType = 'Interior';
        }
      }

      washes.push({
        washNumber: i + 1,
        scheduledDate: washDate.toISOString().split('T')[0],
        scheduledTime: '09:00',
        serviceType,
        carName: customerData.carModel,
        carNumber: customerData.carNumber,
        assignedWasher: monthlyData.defaultWasher
      });
    }

    setMonthlyData(prev => ({ ...prev, scheduledWashes: washes }));
  };

  const updateScheduledWash = (index: number, field: keyof ScheduledWash, value: string) => {
    setMonthlyData(prev => ({
      ...prev,
      scheduledWashes: prev.scheduledWashes.map((wash, i) => 
        i === index ? { ...wash, [field]: value } : wash
      )
    }));
  };

  const handleSubmit = async () => {
    try {
      const leadData = {
        name: customerData.name,
        phone: customerData.phone,
        area: customerData.area,
        carModel: customerData.carModel,
        carNumber: customerData.carNumber,
        leadType: washType === 'one-time' ? 'One-time' : 'Monthly',
        leadSource: 'Manual Entry',
        ...(washType === 'one-time' ? {
          oneTimeWash: {
            washType: oneTimeData.washType,
            amount: parseFloat(oneTimeData.amount),
            scheduledDate: oneTimeData.scheduledDate,
            scheduledTime: oneTimeData.scheduledTime,
            serviceType: oneTimeData.serviceType
          }
        } : {
          monthlySubscription: {
            packageType: monthlyData.packageType,
            customPlanName: monthlyData.customPlanName,
            totalAmount: monthlyData.totalAmount,
            totalWashes: monthlyData.totalWashes,
            interiorWashes: monthlyData.interiorWashes,
            startDate: monthlyData.startDate,
            endDate: monthlyData.endDate,
            scheduledWashes: monthlyData.scheduledWashes
          }
        })
      };

      const response = await apiService.post('/leads/wash-entry', leadData);
      
      if (response.success) {
        onSuccess();
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating wash entry:', error);
    }
  };

  const resetForm = () => {
    setCustomerData({ name: '', phone: '', area: '', carModel: '', carNumber: '' });
    setOneTimeData({ washType: 'Basic', amount: '', scheduledDate: '', scheduledTime: '09:00', serviceType: 'Exterior' });
    setMonthlyData({ 
      packageType: 'Basic', customPlanName: '', totalAmount: 0, totalWashes: 0, 
      interiorWashes: 0, startDate: '', endDate: '', customerInterval: 7, defaultWasher: '', scheduledWashes: [] 
    });
    setWashType('one-time');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Wash Entry</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <input
                  type="text"
                  value={customerData.area}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, area: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Car Model</label>
                <input
                  type="text"
                  value={customerData.carModel}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, carModel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Car Number</label>
                <input
                  type="text"
                  value={customerData.carNumber}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, carNumber: e.target.value }))}
                  placeholder="e.g., TN01AB1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Wash Type Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Wash Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  washType === 'one-time' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setWashType('one-time')}
              >
                <div className="flex items-center mb-2">
                  <Car className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium">One-time Wash</span>
                </div>
                <p className="text-sm text-gray-600">Single wash service</p>
              </div>
              
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  washType === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setWashType('monthly')}
              >
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium">Monthly Subscription</span>
                </div>
                <p className="text-sm text-gray-600">Recurring wash package</p>
              </div>
            </div>
          </div>

          {/* One-time Wash Details */}
          {washType === 'one-time' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">One-time Wash Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wash Type</label>
                  <select
                    value={oneTimeData.washType}
                    onChange={(e) => setOneTimeData(prev => ({ ...prev, washType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Basic">Basic - ₹100</option>
                    <option value="Premium">Premium - ₹150</option>
                    <option value="Deluxe">Deluxe - ₹200</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={oneTimeData.amount}
                    onChange={(e) => setOneTimeData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={oneTimeData.scheduledDate}
                    onChange={(e) => setOneTimeData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={oneTimeData.scheduledTime}
                    onChange={(e) => setOneTimeData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <select
                    value={oneTimeData.serviceType}
                    onChange={(e) => setOneTimeData(prev => ({ ...prev, serviceType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Exterior">Exterior</option>
                    <option value="Interior">Interior</option>
                    <option value="Full Service">Full Service</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Subscription Details */}
          {washType === 'monthly' && (
            <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Monthly Subscription</h3>
              
              {/* Package Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Type</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {['Basic', 'Premium', 'Deluxe', 'Custom'].map(type => (
                    <div
                      key={type}
                      className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                        monthlyData.packageType === type ? 'border-green-500 bg-green-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePackageChange(type)}
                    >
                      <div className="font-medium">{type}</div>
                      {type !== 'Custom' && (
                        <div className="text-xs text-gray-600">
                          {type === 'Basic' && '3 washes - ₹300'}
                          {type === 'Premium' && '4 washes - ₹400'}
                          {type === 'Deluxe' && '5 washes - ₹500'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Plan Selection */}
              {monthlyData.packageType === 'Custom' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Custom Plans</label>
                    <button
                      onClick={() => setShowCreatePlan(true)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create New Custom Plan
                    </button>
                  </div>
                  
                  {customPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {customPlans.map((plan, index) => (
                        <div
                          key={index}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            monthlyData.customPlanName === plan.name ? 'border-green-500 bg-green-100' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleCustomPlanSelect(plan)}
                        >
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-gray-600">
                            {plan.washes} washes - ₹{plan.price}
                            {plan.interiorWashes > 0 && ` (${plan.interiorWashes} interior)`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No custom plans available. Create one to get started.
                    </div>
                  )}
                </div>
              )}

              {/* Create Custom Plan Modal */}
              {showCreatePlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Custom Plan</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                        <input
                          type="text"
                          value={newPlan.name}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Luxury Plan Pro"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
                        <input
                          type="number"
                          value={newPlan.price}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="4500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Washes</label>
                        <input
                          type="number"
                          value={newPlan.washes}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, washes: e.target.value }))}
                          placeholder="36"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interior Washes</label>
                        <input
                          type="number"
                          value={newPlan.interiorWashes}
                          onChange={(e) => setNewPlan(prev => ({ ...prev, interiorWashes: e.target.value }))}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowCreatePlan(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createCustomPlan}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Create Plan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Details */}
              {monthlyData.totalWashes > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Schedule Wash Details</h4>
                  
                  {/* Summary */}
                  <div className="bg-white p-4 rounded-lg border mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Package:</span>
                        <div className="font-medium">{monthlyData.packageType} ({monthlyData.totalWashes} washes - ₹{monthlyData.totalAmount})</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Interior Wash Allocation:</span>
                        <div className="font-medium">{monthlyData.interiorWashes} of {monthlyData.totalWashes}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining:</span>
                        <div className="font-medium">{monthlyData.interiorWashes}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <div className="font-medium text-green-600">Ready to Schedule</div>
                      </div>
                    </div>
                  </div>

                  {/* For Custom Plans - Show Auto-Schedule Generator */}
                  {monthlyData.packageType === 'Custom' && monthlyData.customPlanName && (
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Zap className="h-4 w-4 mr-2" />
                        Auto-Schedule Generator
                      </h5>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={monthlyData.startDate}
                              onChange={(e) => setMonthlyData(prev => ({ ...prev, startDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Max 30 Days)</label>
                            <input
                              type="date"
                              value={monthlyData.endDate}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                              placeholder="Auto-calculated (30 days)"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Interval (Days)</label>
                          <select
                            value={monthlyData.customerInterval}
                            onChange={(e) => setMonthlyData(prev => ({ ...prev, customerInterval: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={3}>Every 3 Days</option>
                            <option value={5}>Every 5 Days</option>
                            <option value={7}>Every 7 Days</option>
                            <option value={10}>Every 10 Days</option>
                            <option value={15}>Every 15 Days</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Default Washer (Auto-assign to all washes)</label>
                          <select
                            value={monthlyData.defaultWasher}
                            onChange={(e) => setMonthlyData(prev => ({ ...prev, defaultWasher: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">No Default Washer</option>
                            {washers.map((washer) => (
                              <option key={washer._id} value={washer.id}>
                                {washer.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Cars</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Car Names (Auto-numbered)</label>
                            <div className="text-sm text-gray-600 mt-1">
                              Car1: THAR, Car2: FORTUNER, Car3: FERRARI, Car4: ALTO
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={generateScheduledWashes}
                          disabled={!monthlyData.startDate}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Generate {monthlyData.totalWashes} Dates
                        </button>
                      </div>

                      {/* Generated Schedule for Custom Plans */}
                      {monthlyData.scheduledWashes.length > 0 && (
                        <div className="mt-4">
                          <h6 className="font-medium text-gray-900 mb-3">Wash List ({monthlyData.scheduledWashes.length} washes)</h6>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {monthlyData.scheduledWashes.map((wash, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium">Wash {wash.washNumber}</span>
                                </div>
                                <div>
                                  <input
                                    type="date"
                                    value={wash.scheduledDate}
                                    onChange={(e) => updateScheduledWash(index, 'scheduledDate', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="time"
                                    value={wash.scheduledTime}
                                    onChange={(e) => updateScheduledWash(index, 'scheduledTime', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <select
                                    value={wash.serviceType}
                                    onChange={(e) => updateScheduledWash(index, 'serviceType', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  >
                                    <option value="Exterior">Exterior</option>
                                    <option value="Interior">Interior</option>
                                    <option value="Full Service">Full Service</option>
                                  </select>
                                </div>
                                <div>
                                  <select
                                    value={wash.assignedWasher || ''}
                                    onChange={(e) => updateScheduledWash(index, 'assignedWasher', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  >
                                    <option value="">Assign Washer</option>
                                    {washers.map((washer) => (
                                      <option key={washer._id} value={washer.id}>
                                        {washer.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="text-sm text-gray-600 flex items-center">
                                  <Car className="h-3 w-3 mr-1" />
                                  <span className="font-medium">{wash.carName}</span>
                                  <span className="ml-1 text-xs">({wash.carNumber || 'No number'})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* For Existing Packages - Show Simple Manual Entry ONLY */}
                  {(monthlyData.packageType === 'Basic' || monthlyData.packageType === 'Premium' || monthlyData.packageType === 'Deluxe') && (
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Washer (Auto-assign to all washes)</label>
                        <select
                          value={monthlyData.defaultWasher}
                          onChange={(e) => setMonthlyData(prev => ({ ...prev, defaultWasher: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">No Default Washer</option>
                          {washers.map((washer) => (
                            <option key={washer._id} value={washer.id}>
                              {washer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <h5 className="font-medium text-gray-900 mb-4">Wash List ({monthlyData.totalWashes} washes)</h5>
                      {console.log('Rendering wash list with totalWashes:', monthlyData.totalWashes, 'washers:', washers.length)}
                      
                      <div className="space-y-3" key={`${monthlyData.packageType}-${monthlyData.totalWashes}`}>
                        {Array.from({ length: monthlyData.totalWashes }, (_, index) => {
                          // Simple interior wash distribution for existing packages
                          let isInterior = false;
                          if (monthlyData.interiorWashes > 0) {
                            const interval = Math.floor(monthlyData.totalWashes / monthlyData.interiorWashes);
                            isInterior = (index + 1) % interval === 0 && index < monthlyData.interiorWashes * interval;
                          }
                          
                          return (
                            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium min-w-[60px]">Wash {index + 1}</div>
                              <div className="flex-1">
                                <input
                                  type="date"
                                  placeholder="dd-mm-yyyy"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div className="w-20">
                                <input
                                  type="time"
                                  defaultValue="09:00"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div className="w-24">
                                <select
                                  defaultValue={isInterior ? 'Interior' : 'Exterior'}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                >
                                  <option value="Exterior">Exterior</option>
                                  <option value="Interior">Interior</option>
                                </select>
                              </div>
                              <div className="w-32">
                                <div className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                                  {monthlyData.defaultWasher ? 
                                    washers.find(w => w.id.toString() === monthlyData.defaultWasher.toString())?.name || 'Unknown' 
                                    : 'Not Assigned'
                                  }
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 flex items-center min-w-[100px]">
                                <span className="font-medium">Car{index + 1}</span>
                                <span className="ml-1 text-xs">- THAR</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Wash Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWashEntry;
