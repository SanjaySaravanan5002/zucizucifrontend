import React, { useState } from 'react';
import axios from 'axios';
import AutoAssignmentNotification from './AutoAssignmentNotification';
import MonthlySubscriptionCreator from './MonthlySubscriptionCreator';
import { shouldAutoAssign, getDateLabel } from '../utils/dateUtils';

const API_BASE_URL = 'https://zuci-sbackend-8.onrender.com/api';

interface CreateWashHistoryFormProps {
  leadId: string;
  leadName?: string;
  washers: Array<{ _id: string; name: string }>;
  onSuccess: (washHistory: any) => void;
  onCancel: () => void;
}

const CreateWashHistoryForm: React.FC<CreateWashHistoryFormProps> = ({
  leadId,
  leadName,
  washers,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    washType: '',
    washerId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    time: new Date().toTimeString().slice(0, 5),
    feedback: '',
    amountPaid: false,
    washStatus: 'completed',
    washServiceType: 'Exterior',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    washerName: '',
    customerName: '',
    assignmentDate: ''
  });
  const [washMode, setWashMode] = useState('onetime');
  const [customPlan, setCustomPlan] = useState({ name: '', amount: '', washes: '' });
  const [showScheduler, setShowScheduler] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (washMode === 'monthly') {
      if (!customPlan.name || !customPlan.amount || !customPlan.washes) {
        setError('Please fill all custom plan details');
        return;
      }
      setShowScheduler(true);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/leads/${leadId}/wash-history`, formData);
      
      if (response.data.autoAssigned) {
        const washerName = washers.find(w => w._id === formData.washerId)?.name || 'Unknown';
        setNotificationData({
          washerName,
          customerName: leadName || 'Customer',
          assignmentDate: response.data.assignmentDate
        });
        setShowNotification(true);
      }
      
      onSuccess(response.data.washHistory || response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to create wash history');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlySubscription = async (subscriptionData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/leads/${leadId}/monthly-subscription`, subscriptionData);
      setShowScheduler(false);
      onSuccess(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to create monthly subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AutoAssignmentNotification
        show={showNotification}
        washerName={notificationData.washerName}
        customerName={notificationData.customerName}
        assignmentDate={notificationData.assignmentDate}
        onClose={() => setShowNotification(false)}
      />
      <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {/* Wash Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Wash Type
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="onetime"
              checked={washMode === 'onetime'}
              onChange={(e) => setWashMode(e.target.value)}
              className="mr-2"
            />
            One-time Wash
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="monthly"
              checked={washMode === 'monthly'}
              onChange={(e) => setWashMode(e.target.value)}
              className="mr-2"
            />
            Monthly Subscription
          </label>
        </div>
      </div>

      {washMode === 'monthly' && (
        <div className="bg-blue-50 p-4 rounded-md space-y-3">
          <h4 className="font-medium text-blue-900">Create Custom Plan</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plan Name</label>
              <input
                type="text"
                value={customPlan.name}
                onChange={(e) => setCustomPlan({...customPlan, name: e.target.value})}
                placeholder="e.g., Premium 40"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount (₹)</label>
              <input
                type="number"
                value={customPlan.amount}
                onChange={(e) => setCustomPlan({...customPlan, amount: e.target.value})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Washes</label>
              <input
                type="number"
                value={customPlan.washes}
                onChange={(e) => setCustomPlan({...customPlan, washes: e.target.value})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wash Type
        </label>
        <select
          value={formData.washType}
          onChange={(e) => setFormData({ ...formData, washType: e.target.value })}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="">Select wash type</option>
          <option value="Basic">Basic</option>
          <option value="Premium">Premium</option>
          <option value="Deluxe">Deluxe</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Service Type
        </label>
        <select
          value={formData.washServiceType}
          onChange={(e) => setFormData({ ...formData, washServiceType: e.target.value })}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="Interior">Interior</option>
          <option value="Exterior">Exterior</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Washer
        </label>
        <select
          value={formData.washerId}
          onChange={(e) => setFormData({ ...formData, washerId: e.target.value })}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="">Select washer</option>
          {washers.map((washer) => (
            <option key={washer._id} value={washer._id}>
              {washer.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
          min="0"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Status
        </label>
        <div className="mt-1 flex space-x-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentStatus"
              value="paid"
              checked={formData.amountPaid === true}
              onChange={() => setFormData({ ...formData, amountPaid: true })}
              className="mr-1"
            />
            Paid
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentStatus"
              value="notPaid"
              checked={formData.amountPaid === false}
              onChange={() => setFormData({ ...formData, amountPaid: false })}
              className="mr-1"
            />
            Not Paid
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        />
        {formData.date && shouldAutoAssign(formData.date) && formData.washerId && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center text-sm text-green-700">
              <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Auto-Assignment Active:</span>
              <span className="ml-1">
                Lead will be assigned to {washers.find(w => w._id === formData.washerId)?.name} for {getDateLabel(formData.date)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time
        </label>
        <input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feedback
        </label>
        <textarea
          value={formData.feedback}
          onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        />
      </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
          Wash status
        </label>
        <div className="mt-1 flex space-x-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="washStatus"
              value="completed"
              checked={formData.washStatus === 'completed'}
              onChange={(e) => setFormData({ ...formData, washStatus: e.target.value })}
              className="mr-1"
            />
            Completed
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="washStatus"
              value="notCompleted"
              checked={formData.washStatus === 'notCompleted'}
              onChange={(e) => setFormData({ ...formData, washStatus: e.target.value })}
              className="mr-1"
            />
            Not Completed
          </label>     
             
      </div>
    </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
        >
          {loading ? 'Creating...' : washMode === 'monthly' ? 'Next: Schedule Washes' : 'Create'}
        </button>
      </div>
    </form>
      
      <MonthlySubscriptionCreator
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        onSubmit={handleMonthlySubscription}
        totalWashes={parseInt(customPlan.washes) || 0}
        planName={customPlan.name}
        totalAmount={parseFloat(customPlan.amount) || 0}
      />
    </>
  );
};

export default CreateWashHistoryForm;

