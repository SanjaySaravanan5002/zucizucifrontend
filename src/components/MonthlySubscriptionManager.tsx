import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/apiService';

interface ScheduledWash {
  _id: string;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'missed';
  completedDate?: string;
  washer?: { name: string };
  feedback?: string;
  amount?: number;
  is_amountPaid: boolean;
}

interface MonthlySubscription {
  packageType: 'Basic' | 'Premium' | 'Deluxe';
  totalWashes: number;
  completedWashes: number;
  monthlyPrice: number;
  startDate: string;
  endDate: string;
  scheduledWashes: ScheduledWash[];
  isActive: boolean;
}

interface Props {
  leadId: number;
  leadType: string;
  onSubscriptionUpdate?: () => void;
}

const MonthlySubscriptionManager: React.FC<Props> = ({ leadId, leadType, onSubscriptionUpdate }) => {
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState<MonthlySubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'Basic' | 'Premium' | 'Deluxe'>('Basic');
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);

  const packageDetails = {
    Basic: { washes: 3, price: 300 },
    Premium: { washes: 4, price: 400 },
    Deluxe: { washes: 5, price: 500 }
  };

  useEffect(() => {
    if (leadType === 'Monthly') {
      fetchSubscription();
    }
  }, [leadId, leadType]);

  const fetchSubscription = async () => {
    try {
      const response = await apiService.getMonthlySubscription(leadId);
      if (response.success) {
        setSubscription(response.data);
      } else {
        showToast('error', response.error || 'Failed to fetch subscription details');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      showToast('error', 'Error loading subscription data');
    }
  };

  const createSubscription = async () => {
    if (scheduledDates.length !== packageDetails[selectedPackage].washes) {
      showToast('warning', `Please select exactly ${packageDetails[selectedPackage].washes} dates for ${selectedPackage} package`);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createMonthlySubscription(leadId, {
        packageType: selectedPackage,
        scheduledDates
      });

      if (response.success) {
        await fetchSubscription();
        setShowCreateForm(false);
        setScheduledDates([]);
        onSubscriptionUpdate?.();
        showToast('success', 'Monthly subscription created successfully');
      } else {
        showToast('error', response.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      showToast('error', 'Error creating subscription');
    } finally {
      setLoading(false);
    }
  };

  const updateWashStatus = async (washId: string, status: string, amount?: number, feedback?: string) => {
    try {
      const response = await apiService.updateWashStatus(leadId, washId, {
        status,
        amount,
        feedback,
        washerId: subscription?.scheduledWashes.find(w => w._id === washId)?.washer
      });

      if (response.success) {
        await fetchSubscription();
        onSubscriptionUpdate?.();
        showToast('success', 'Wash status updated successfully');
      } else {
        showToast('error', response.error || 'Failed to update wash status');
      }
    } catch (error) {
      console.error('Error updating wash status:', error);
      showToast('error', 'Error updating wash status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'missed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (leadType !== 'Monthly') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Monthly Subscription
        </h3>
        {!subscription && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Subscription
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Create Monthly Subscription</h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            {Object.entries(packageDetails).map(([type, details]) => (
              <div
                key={type}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedPackage === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPackage(type as any)}
              >
                <div className="font-medium">{type}</div>
                <div className="text-sm text-gray-600">{details.washes} washes</div>
                <div className="text-sm font-medium">₹{details.price}</div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select {packageDetails[selectedPackage].washes} wash dates:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: packageDetails[selectedPackage].washes }, (_, i) => (
                <input
                  key={i}
                  type="date"
                  className="px-3 py-2 border rounded-md"
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduledDates[i] || ''}
                  onChange={(e) => {
                    const newDates = [...scheduledDates];
                    newDates[i] = e.target.value;
                    setScheduledDates(newDates);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={createSubscription}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Subscription'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setScheduledDates([]);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {subscription && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{subscription.packageType}</div>
              <div className="text-sm text-gray-600">Package</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {subscription.completedWashes}/{subscription.totalWashes}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">₹{subscription.monthlyPrice}</div>
              <div className="text-sm text-gray-600">Monthly Price</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(((subscription.completedWashes / subscription.totalWashes) * 100))}%
              </div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Scheduled Washes</h4>
            {subscription.scheduledWashes.map((wash, index) => (
              <div key={wash._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(wash.status)}
                  <div>
                    <div className="font-medium">Wash #{index + 1}</div>
                    <div className="text-sm text-gray-600">
                      Scheduled: {new Date(wash.scheduledDate).toLocaleDateString()}
                    </div>
                    {wash.completedDate && (
                      <div className="text-sm text-gray-600">
                        Completed: {new Date(wash.completedDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wash.status)}`}>
                    {wash.status}
                  </span>
                  
                  {wash.status === 'scheduled' && (
                    <button
                      onClick={() => {
                        const amount = prompt('Enter wash amount:');
                        const feedback = prompt('Enter feedback (optional):');
                        if (amount && !isNaN(parseInt(amount))) {
                          updateWashStatus(wash._id, 'completed', parseInt(amount), feedback || '');
                        } else if (amount) {
                          showToast('error', 'Please enter a valid amount');
                        }
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlySubscriptionManager;
