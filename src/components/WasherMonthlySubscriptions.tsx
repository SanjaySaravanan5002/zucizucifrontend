import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, CheckCircle, Clock, Phone, MapPin, Car } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface ScheduledWash {
  _id: string;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'missed';
  completedDate?: string;
  washer?: { name: string };
  feedback?: string;
  amount?: number;
  is_amountPaid: boolean;
  washServiceType?: string;
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

interface SubscriptionLead {
  id: number;
  customerName: string;
  phone: string;
  area: string;
  monthlySubscription: MonthlySubscription;
}

const WasherMonthlySubscriptions: React.FC = () => {
  const { user } = useAuth();
  const [subscriptionLeads, setSubscriptionLeads] = useState<SubscriptionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWash, setSelectedWash] = useState<{
    leadId: number;
    washId: string;
    customerName: string;
  } | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    amount: 0,
    feedback: '',
    washServiceType: 'Exterior'
  });

  useEffect(() => {
    if (user?.id) {
      fetchMonthlySubscriptions();
    }
  }, [user]);

  const fetchMonthlySubscriptions = async () => {
    try {
      const response = await axios.get(`https://zuci-backend-my3h.onrender.com/api/leads/washer/${user?.id}/monthly-subscriptions`);
      setSubscriptionLeads(response.data);
    } catch (error) {
      console.error('Error fetching monthly subscriptions:', error);
      toast.error('Failed to fetch monthly subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWash = async () => {
    if (!selectedWash) return;

    try {
      await axios.put(
        `https://zuci-backend-my3h.onrender.com/api/leads/${selectedWash.leadId}/monthly-subscription/wash/${selectedWash.washId}`,
        {
          status: 'completed',
          feedback: completionData.feedback,
          washerId: user?.id,
          amountPaid: true, // Washers can only mark as paid/unpaid
          washServiceType: completionData.washServiceType
        }
      );

      toast.success('Wash marked as completed! Wash history updated.');
      setShowCompleteModal(false);
      setSelectedWash(null);
      setCompletionData({ amount: 0, feedback: '', washServiceType: 'Exterior' });
      
      // Refresh data to show updated status
      await fetchMonthlySubscriptions();
    } catch (error) {
      console.error('Error completing wash:', error);
      toast.error('Failed to complete wash');
    }
  };

  const getTodaysWashes = (subscription: MonthlySubscription) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return subscription.scheduledWashes.filter(wash => {
      const washDate = new Date(wash.scheduledDate);
      return washDate >= today && washDate < tomorrow && wash.status === 'scheduled';
    });
  };

  const getRecentWashes = (subscription: MonthlySubscription) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return subscription.scheduledWashes.filter(wash => {
      if (wash.status === 'completed' && wash.completedDate) {
        const completedDate = new Date(wash.completedDate);
        return completedDate >= sevenDaysAgo;
      }
      return false;
    });
  };

  const isSubscriptionCompleted = (subscription: MonthlySubscription) => {
    return !subscription.isActive && subscription.completedWashes >= subscription.totalWashes;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'missed':
        return <Clock className="w-5 h-5 text-red-500" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const todaysSubscriptions = subscriptionLeads.filter(lead => {
    const todaysWashes = getTodaysWashes(lead.monthlySubscription);
    const isCompleted = isSubscriptionCompleted(lead.monthlySubscription);
    return todaysWashes.length > 0 || isCompleted;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Today's Monthly Subscriptions
            </h2>
            <p className="text-gray-600">Scheduled washes for today</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{todaysSubscriptions.length}</div>
            <div className="text-sm text-gray-500">Customers Today</div>
          </div>
        </div>
      </div>

      {todaysSubscriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled washes today</h3>
          <p className="text-gray-500">Check back tomorrow for new scheduled washes.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {todaysSubscriptions.map((lead) => {
            const todaysWashes = getTodaysWashes(lead.monthlySubscription);
            const isCompleted = isSubscriptionCompleted(lead.monthlySubscription);
            const recentWashes = getRecentWashes(lead.monthlySubscription);
            
            return (
              <div key={lead.id} className={`rounded-lg shadow p-6 ${
                isCompleted ? 'bg-green-50 border-2 border-green-200' : 'bg-white'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{lead.customerName}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Phone className="h-4 w-4 mr-1" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {lead.area}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isCompleted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.monthlySubscription.packageType}
                      </span>
                      {isCompleted && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                          ✓ COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {lead.monthlySubscription.completedWashes}/{lead.monthlySubscription.totalWashes} completed
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {isCompleted ? (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Monthly Subscription - Completed</h4>
                      <div className="space-y-2">
                        {lead.monthlySubscription.scheduledWashes.map((wash, index) => (
                          <div key={wash._id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(wash.status)}
                              <div>
                                <div className="font-medium">Wash {wash.washNumber || index + 1}</div>
                                <div className="text-sm text-gray-600">
                                  {wash.status === 'completed' && wash.completedDate
                                    ? `Completed: ${new Date(wash.completedDate).toLocaleDateString()}`
                                    : `Scheduled: ${new Date(wash.scheduledDate).toLocaleDateString()}`
                                  }
                                </div>
                                <div className="text-sm text-gray-500">
                                  ₹{wash.amount || 100}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wash.status)}`}>
                                ✓ {wash.status === 'completed' ? 'Completed' : wash.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                wash.is_amountPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {wash.is_amountPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium text-gray-900">Today's Scheduled Washes</h4>
                      {todaysWashes.map((wash, index) => (
                        <div key={wash._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(wash.status)}
                            <div>
                              <div className="font-medium">Wash #{wash.washNumber || index + 1}</div>
                              <div className="text-sm text-gray-600">
                                Scheduled: {new Date(wash.scheduledDate).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wash.status)}`}>
                              {wash.status}
                            </span>
                            
                            {wash.status === 'scheduled' && (
                              <button
                                onClick={() => {
                                  setSelectedWash({
                                    leadId: lead.id,
                                    washId: wash._id,
                                    customerName: lead.customerName
                                  });
                                  setShowCompleteModal(true);
                                }}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Complete Wash
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{isCompleted ? 'Package Completed' : 'Monthly Progress'}</span>
                    <span>{Math.round((lead.monthlySubscription.completedWashes / lead.monthlySubscription.totalWashes) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}
                      style={{ 
                        width: `${(lead.monthlySubscription.completedWashes / lead.monthlySubscription.totalWashes) * 100}%` 
                      }}
                    ></div>
                  </div>
                  {isCompleted && (
                    <div className="text-center mt-2">
                      <span className="text-sm font-medium text-green-600">All washes completed! 🎉</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Wash Modal */}
      {showCompleteModal && selectedWash && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Complete Wash for {selectedWash.customerName}
            </h3>
            
            <div className="space-y-4">
              {/* Amount is set by admin during subscription creation */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={completionData.washServiceType}
                  onChange={(e) => setCompletionData({
                    ...completionData, 
                    washServiceType: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="Interior">Interior</option>
                  <option value="Exterior">Exterior</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={completionData.feedback}
                  onChange={(e) => setCompletionData({
                    ...completionData, 
                    feedback: e.target.value
                  })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Add any feedback or notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedWash(null);
                  setCompletionData({ amount: 0, feedback: '', washServiceType: 'Exterior' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteWash}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Complete Wash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasherMonthlySubscriptions;