import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface CreateWashHistoryFormProps {
  leadId: string;
  washers: Array<{ _id: string; name: string }>;
  onSuccess: (washHistory: any) => void;
  onCancel: () => void;
}

const CreateWashHistoryForm: React.FC<CreateWashHistoryFormProps> = ({
  leadId,
  washers,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    washType: '',
    washerId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    feedback: '',
    amountPaid: false,
    washStatus: 'completed',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/leads/${leadId}/wash-history`, formData);
      onSuccess(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to create wash history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
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
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default CreateWashHistoryForm;
