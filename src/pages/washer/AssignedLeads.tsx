import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Phone, MapPin, Car, CheckCircle, XCircle, Clock, IndianRupee, RefreshCw, Map, Play, Square, Navigation } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface AssignedLead {
  id: number;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  leadType: string;
  status: string;
  washHistory: Array<{
    _id: string;
    washType: string;
    amount: number;
    date: string;
    washStatus: string;
    is_amountPaid: boolean;
    feedback?: string;
    duration?: number;
    startTime?: string;
    endTime?: string;
  }>;
  monthlySubscription?: {
    packageType: string;
    totalWashes: number;
    completedWashes: number;
    scheduledWashes: Array<{
      _id: string;
      washNumber: number;
      scheduledDate: string;
      status: string;
      completedDate?: string;
      amount?: number;
      is_amountPaid?: boolean;
      feedback?: string;
      duration?: number;
    }>;
    isActive: boolean;
  };
  oneTimeWash?: {
    washType: string;
    amount: number;
    scheduledDate: string;
    status: string;
    washer: {
      _id: string;
      name: string;
    };
    duration?: number;
  };
}

interface AssignedLeadsResponse {
  allLeads: AssignedLead[];
  oneTimeLeads: AssignedLead[];
  monthlyLeads: AssignedLead[];
  summary: {
    total: number;
    oneTime: number;
    monthly: number;
    converted: number;
  };
}

const AssignedLeads = () => {
  const { user } = useAuth();
  const [leadsData, setLeadsData] = useState<AssignedLeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const [selectedLead, setSelectedLead] = useState<AssignedLead | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    washType: 'Basic',
    amount: 0,
    washStatus: 'completed',
    is_amountPaid: false,
    feedback: '',
    washId: '',
    isScheduledWash: false
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [washTimer, setWashTimer] = useState<{[key: string]: {startTime: Date, elapsed: number, isRunning: boolean}}>({});
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);


  useEffect(() => {
    if (user?.id) {
      fetchAssignedLeads();
      
      // Set up auto-refresh for assigned leads every 60 seconds for updates
      const interval = setInterval(() => {
        fetchAssignedLeads();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setWashTimer(prev => {
        const updated = {...prev};
        Object.keys(updated).forEach(key => {
          if (updated[key].isRunning) {
            updated[key].elapsed = Date.now() - updated[key].startTime.getTime();
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add focus event listener to refresh when window gains focus (with debounce)
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout;
    const handleFocus = () => {
      if (user?.id) {
        clearTimeout(focusTimeout);
        focusTimeout = setTimeout(() => {
          fetchAssignedLeads();
        }, 1000); // Debounce focus refresh by 1 second
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(focusTimeout);
    };
  }, [user]);

  const fetchAssignedLeads = async () => {
    try {
      console.log('Fetching assigned leads for user ID:', user?.id);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`https://zuci-sbackend.onrender.com/api/washer/${user?.id}/assigned-leads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Assigned leads response:', response.data);
      setLeadsData(response.data);
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(`Failed to fetch assigned leads: ${error.response.data.message}`);
      } else {
        toast.error('Failed to fetch assigned leads');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWash = async (leadId: number, washId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const timer = washTimer[washId];
      
      const requestData: any = {
        washStatus: updateData.washStatus,
        amountPaid: updateData.is_amountPaid,
        feedback: updateData.feedback,
        washerId: user?.id
      };
      
      if (timer && updateData.washStatus === 'completed') {
        requestData.duration = Math.round(timer.elapsed / (1000 * 60));
      }
      
      await axios.put(`https://zuci-sbackend.onrender.com/api/leads/${leadId}/wash-history/${washId}`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Wash status updated successfully');
      setShowUpdateModal(false);
      // Immediate refresh after update
      setTimeout(() => fetchAssignedLeads(), 500);
    } catch (error) {
      console.error('Error updating wash:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update wash status';
      toast.error(errorMsg);
    }
  };

  // Washers can only update existing wash entries, not create new ones

  const openUpdateModal = (lead: AssignedLead, washEntry: any) => {
    setSelectedLead(lead);
    setIsAddingNew(false);
    setUpdateData({
      washType: washEntry.washType,
      amount: washEntry.amount,
      washStatus: washEntry.washStatus,
      is_amountPaid: washEntry.is_amountPaid,
      feedback: washEntry.feedback || ''
    });
    setShowUpdateModal(true);
  };

  // Removed: Washers cannot add new wash entries





  const handleMarkWashCompleted = async (leadId: number, washId: string) => {
    try {
      console.log('Marking wash completed:', { leadId, washId, updateData });
      
      const token = localStorage.getItem('auth_token');
      const timerKey = washId;
      const timer = washTimer[timerKey];
      
      const requestData: any = {
        status: 'completed',
        washerId: user?._id || user?.id,
        feedback: updateData.feedback || '',
        amountPaid: updateData.is_amountPaid
      };
      
      // Add duration data if timer was used
      if (timer) {
        requestData.startTime = timer.startTime;
        requestData.endTime = new Date();
        requestData.duration = Math.round(timer.elapsed / (1000 * 60)); // in minutes
      }
      
      const response = await axios.put(`https://zuci-sbackend.onrender.com/api/leads/${leadId}/monthly-subscription/wash/${washId}`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response:', response.data);
      toast.success('Wash marked as completed');
      setShowUpdateModal(false);
      // Immediate refresh after completion
      setTimeout(() => fetchAssignedLeads(), 500);
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.message || 'Failed to mark wash as completed';
      toast.error(errorMsg);
    }
  };

  const handleUpdateOneTimeWash = async (leadId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const timerKey = `onetime-${leadId}`;
      const timer = washTimer[timerKey];
      
      const response = await axios.put(`https://zuci-sbackend.onrender.com/api/leads/${leadId}/onetime-wash/update`, {
        status: 'completed',
        feedback: updateData.feedback || '',
        startTime: timer?.startTime,
        endTime: new Date(),
        duration: timer ? Math.round(timer.elapsed / (1000 * 60)) : 0
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('One-time wash completed successfully');
      setShowUpdateModal(false);
      // Immediate refresh after completion
      setTimeout(() => fetchAssignedLeads(), 500);
    } catch (error) {
      console.error('Error updating one-time wash:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update one-time wash';
      toast.error(errorMsg);
    }
  };

  const handleOpenMap = async (lead: AssignedLead) => {
    try {
      // Fetch lead details with location data
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`https://zuci-sbackend.onrender.com/api/leads/${lead.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const leadData = response.data;
      
      if (leadData.location && leadData.location.coordinates && leadData.location.coordinates.length === 2) {
        const [longitude, latitude] = leadData.location.coordinates;
        
        if (longitude !== 0 && latitude !== 0) {
          // Open Google Maps with the coordinates
          const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
          window.open(googleMapsUrl, '_blank');
          toast.success(`Opening map for ${lead.customerName}`);
        } else {
          toast.error('Location coordinates not available for this lead');
        }
      } else {
        // Fallback to area-based search
        const searchQuery = encodeURIComponent(`${lead.area}, Chennai`);
        const googleMapsUrl = `https://www.google.com/maps/search/${searchQuery}`;
        window.open(googleMapsUrl, '_blank');
        toast.info(`Opening map search for ${lead.area}`);
      }
    } catch (error) {
      console.error('Error fetching lead location:', error);
      // Fallback to area-based search
      const searchQuery = encodeURIComponent(`${lead.area}, Chennai`);
      const googleMapsUrl = `https://www.google.com/maps/search/${searchQuery}`;
      window.open(googleMapsUrl, '_blank');
      toast.info(`Opening map search for ${lead.area}`);
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('Location updated successfully');
        },
        (error) => {
          toast.error('Failed to get location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const startWashTimer = (washId: string) => {
    setWashTimer(prev => ({
      ...prev,
      [washId]: {
        startTime: new Date(),
        elapsed: 0,
        isRunning: true
      }
    }));
    toast.success('Wash timer started');
  };

  const stopWashTimer = (washId: string) => {
    setWashTimer(prev => {
      if (prev[washId]) {
        return {
          ...prev,
          [washId]: {
            ...prev[washId],
            isRunning: false
          }
        };
      }
      return prev;
    });
    toast.success('Wash timer stopped');
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!leadsData) {
    return <div className="p-8 text-center">No data available</div>;
  }

  const getCurrentLeads = () => {
    if (!leadsData || !leadsData.allLeads) {
      return [];
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const filterLeadsByDate = (leads: AssignedLead[], targetDateStr: string) => {
      return leads.filter(lead => {
        try {
          // Check wash history for matching date
          const hasWashHistoryToday = lead.washHistory?.some(wash => {
            if (!wash.date) return false;
            const washDateStr = new Date(wash.date).toISOString().split('T')[0];
            return washDateStr === targetDateStr;
          });

          // Check monthly subscription scheduled washes
          const hasMonthlyWash = lead.monthlySubscription?.scheduledWashes?.some(wash => {
            if (!wash.scheduledDate) return false;
            const washDateStr = new Date(wash.scheduledDate).toISOString().split('T')[0];
            return washDateStr === targetDateStr;
          });

          // Check one-time wash scheduled
          const hasOneTimeWash = lead.oneTimeWash && lead.oneTimeWash.scheduledDate && (() => {
            const washDateStr = new Date(lead.oneTimeWash.scheduledDate).toISOString().split('T')[0];
            return washDateStr === targetDateStr;
          })();

          return hasWashHistoryToday || hasMonthlyWash || hasOneTimeWash;
        } catch (error) {
          console.error('Error filtering lead:', lead.customerName, error);
          return false;
        }
      });
    };

    switch (activeTab) {
      case 'tomorrow':
        return filterLeadsByDate(leadsData.allLeads, tomorrowStr);
      default:
        return filterLeadsByDate(leadsData.allLeads, todayStr);
    }
  };

  const currentLeads = getCurrentLeads();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Assigned Leads</h1>
            <p className="text-gray-600">Manage your assigned car wash leads</p>
            <div className="flex space-x-4 mt-2 text-sm text-gray-500">
              <span>Total: {leadsData.summary.total}</span>
              <span>One-time: {leadsData.summary.oneTime}</span>
              <span>Monthly: {leadsData.summary.monthly}</span>
              <span>Converted: {leadsData.summary.converted}</span>
            </div>
          </div>
          <button
            onClick={fetchAssignedLeads}
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Leads
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('today')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'today'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Today ({activeTab === 'today' ? currentLeads.length : (() => {
                if (!leadsData || !leadsData.allLeads) return 0;
                try {
                  const today = new Date();
                  const todayStr = today.toISOString().split('T')[0];
                  return leadsData.allLeads.filter(lead => {
                    const hasWashHistoryToday = lead.washHistory?.some(wash => {
                      if (!wash.date) return false;
                      const washDateStr = new Date(wash.date).toISOString().split('T')[0];
                      return washDateStr === todayStr;
                    });
                    const hasMonthlyWash = lead.monthlySubscription?.scheduledWashes?.some(wash => {
                      if (!wash.scheduledDate) return false;
                      const washDateStr = new Date(wash.scheduledDate).toISOString().split('T')[0];
                      return washDateStr === todayStr;
                    });
                    const hasOneTimeWash = lead.oneTimeWash && lead.oneTimeWash.scheduledDate && (() => {
                      const washDateStr = new Date(lead.oneTimeWash.scheduledDate).toISOString().split('T')[0];
                      return washDateStr === todayStr;
                    })();
                    return hasWashHistoryToday || hasMonthlyWash || hasOneTimeWash;
                  }).length;
                } catch (error) {
                  return 0;
                }
              })()})
            </button>
            <button
              onClick={() => setActiveTab('tomorrow')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tomorrow'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tomorrow ({activeTab === 'tomorrow' ? currentLeads.length : (() => {
                if (!leadsData || !leadsData.allLeads) return 0;
                try {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowStr = tomorrow.toISOString().split('T')[0];
                  return leadsData.allLeads.filter(lead => {
                    const hasWashHistoryTomorrow = lead.washHistory?.some(wash => {
                      if (!wash.date) return false;
                      const washDateStr = new Date(wash.date).toISOString().split('T')[0];
                      return washDateStr === tomorrowStr;
                    });
                    const hasMonthlyWash = lead.monthlySubscription?.scheduledWashes?.some(wash => {
                      if (!wash.scheduledDate) return false;
                      const washDateStr = new Date(wash.scheduledDate).toISOString().split('T')[0];
                      return washDateStr === tomorrowStr;
                    });
                    const hasOneTimeWash = lead.oneTimeWash && lead.oneTimeWash.scheduledDate && (() => {
                      const washDateStr = new Date(lead.oneTimeWash.scheduledDate).toISOString().split('T')[0];
                      return washDateStr === tomorrowStr;
                    })();
                    return hasWashHistoryTomorrow || hasMonthlyWash || hasOneTimeWash;
                  }).length;
                } catch (error) {
                  return 0;
                }
              })()})
            </button>

          </nav>
        </div>

        <div className="p-6">
          {/* Date Display */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {activeTab === 'today' ? 'Today\'s Schedule' : 'Tomorrow\'s Schedule'}
                </h3>
                <p className="text-blue-700">
                  {activeTab === 'today' 
                    ? new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">{currentLeads.length}</div>
                <div className="text-sm text-blue-700">Scheduled Washes</div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6">
              {currentLeads.map((lead) => (
          <div key={lead.id} className="bg-white rounded-lg shadow p-6">
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
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Car className="h-4 w-4 mr-1" />
                  {lead.carModel}
                  <button
                    onClick={() => handleOpenMap(lead)}
                    className="ml-3 flex items-center px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                  >
                    <Map className="h-3 w-3 mr-1" />
                    Map
                  </button>
                  <button
                    onClick={updateLocation}
                    className="ml-2 flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Update Location
                  </button>
                </div>
                {currentLocation && (
                  <div className="text-xs text-green-600 mt-1">
                    📍 Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </div>
                )}
                {(() => {
                  const targetDateStr = activeTab === 'today' 
                    ? new Date().toISOString().split('T')[0]
                    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  
                  const todaysWashHistory = lead.washHistory?.filter(wash => {
                    if (!wash.date) return false;
                    const washDateStr = new Date(wash.date).toISOString().split('T')[0];
                    return washDateStr === targetDateStr;
                  }) || [];
                  
                  const stoppedTimer = todaysWashHistory.find(wash => {
                    const timer = washTimer[wash._id];
                    return timer && !timer.isRunning;
                  });
                  
                  return stoppedTimer && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      Duration: {formatTime(washTimer[stoppedTimer._id].elapsed)}
                    </div>
                  );
                })()}
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  lead.leadType === 'Monthly' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {lead.leadType}
                </span>
                {lead.leadType === 'Monthly' && lead.monthlySubscription && (
                  <div className="text-xs text-gray-500">
                    {lead.monthlySubscription.packageType} - {lead.monthlySubscription.completedWashes}/{lead.monthlySubscription.totalWashes}
                    {lead.monthlySubscription.completedWashes >= lead.monthlySubscription.totalWashes && (
                      <div className="text-xs font-medium text-green-600 mt-1">✓ COMPLETED</div>
                    )}
                  </div>
                )}
                {lead.leadType === 'Monthly' && !lead.monthlySubscription && (
                  <div className="text-xs text-orange-600 font-medium">
                    Package Not Set
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Package Section */}
            {lead.leadType === 'Monthly' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Today's Scheduled Washes</h4>
                
                {!lead.monthlySubscription ? (
                  <div className="space-y-3">
                    <p className="text-sm text-orange-700">Monthly package not set up yet. Please contact admin to create the subscription package.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const targetDateStr = activeTab === 'today' 
                        ? new Date().toISOString().split('T')[0]
                        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      
                      const todaysWashes = lead.monthlySubscription.scheduledWashes.filter(wash => {
                        if (!wash.scheduledDate) return false;
                        const washDateStr = new Date(wash.scheduledDate).toISOString().split('T')[0];
                        return washDateStr === targetDateStr;
                      });
                      
                      return todaysWashes.map((wash) => (
                        <div key={wash._id} className="flex justify-between items-center p-3 bg-white rounded border">
                          <div>
                            <span className="text-sm font-medium">Wash {wash.washNumber}</span>
                            <div className="text-xs text-gray-500">
                              {new Date(wash.scheduledDate).toLocaleDateString('en-IN', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            {wash.amount && (
                              <div className="text-xs text-green-600">₹{wash.amount}</div>
                            )}
                          </div>
                          {wash.status === 'completed' ? (
                            <div className="text-right">
                              <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                              {wash.completedDate && (
                                <div className="text-xs text-gray-500">
                                  {new Date(wash.completedDate).toLocaleDateString('en-IN', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                              )}
                              <div className={`text-xs font-medium ${
                                wash.is_amountPaid ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {wash.is_amountPaid ? 'Paid' : 'Unpaid'}
                              </div>
                              {wash.duration && (
                                <div className="text-xs text-blue-600 font-medium">
                                  Duration: {wash.duration} min
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-2">
                              {washTimer[wash._id]?.isRunning ? (
                                <div className="text-right">
                                  <div className="text-sm font-medium text-blue-600">
                                    {formatTime(washTimer[wash._id].elapsed)}
                                  </div>
                                  <button 
                                    onClick={() => stopWashTimer(wash._id)}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center"
                                  >
                                    <Square className="h-3 w-3 mr-1" />
                                    Stop
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => startWashTimer(wash._id)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center"
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Start
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  if (!washTimer[wash._id]?.isRunning) {
                                    setSelectedLead(lead);
                                    setUpdateData({
                                      washType: lead.monthlySubscription?.packageType || 'Basic',
                                      amount: wash.amount || 0,
                                      washStatus: 'completed',
                                      is_amountPaid: false,
                                      feedback: '',
                                      washId: wash._id,
                                      isScheduledWash: true
                                    });
                                    setShowUpdateModal(true);
                                  } else {
                                    toast.error('Please stop the timer first');
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                disabled={washTimer[wash._id]?.isRunning}
                              >
                                Mark Done
                              </button>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}



            {/* Note: Washers can only update existing wash entries created by admin */}

            {/* Today's Washes */}
            {(() => {
              const targetDateStr = activeTab === 'today' 
                ? new Date().toISOString().split('T')[0]
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              
              const todaysWashHistory = lead.washHistory?.filter(wash => {
                if (!wash.date) return false;
                const washDateStr = new Date(wash.date).toISOString().split('T')[0];
                return washDateStr === targetDateStr;
              }) || [];
              
              return todaysWashHistory.length > 0 && (
                <div className="mt-4">
                  <div className="space-y-2">
                    {todaysWashHistory.map((wash) => (
                      <div key={wash._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{wash.washType}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(wash.date).toLocaleDateString('en-IN', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            {wash.duration > 0 && (
                              <div className="text-xs text-blue-600 font-medium">
                                Duration: {wash.duration} min
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            ₹{wash.amount}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            wash.washStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {wash.washStatus === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            wash.is_amountPaid ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {wash.is_amountPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {washTimer[wash._id]?.isRunning ? (
                            <div className="text-right">
                              <div className="text-xs font-medium text-blue-600">
                                {formatTime(washTimer[wash._id].elapsed)}
                              </div>
                              <button 
                                onClick={() => stopWashTimer(wash._id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center"
                              >
                                <Square className="h-3 w-3 mr-1" />
                                Stop
                              </button>
                            </div>
                          ) : washTimer[wash._id] && !washTimer[wash._id].isRunning ? (
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setUpdateData({
                                  washType: wash.washType,
                                  amount: wash.amount,
                                  washStatus: wash.washStatus,
                                  is_amountPaid: wash.is_amountPaid,
                                  feedback: wash.feedback || '',
                                  washId: wash._id,
                                  isScheduledWash: false
                                });
                                setIsAddingNew(false);
                                setShowUpdateModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Update Status
                            </button>
                          ) : wash.washStatus === 'pending' ? (
                            <button 
                              onClick={() => startWashTimer(wash._id)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
              ))}
            {currentLeads.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Washes Scheduled
                  </h3>
                  <p className="text-gray-500 mb-4">
                    No car wash appointments scheduled for {activeTab === 'today' ? 'today' : 'tomorrow'}.
                  </p>
                  <div className="text-sm text-gray-400">
                    {activeTab === 'today' ? 'Check tomorrow\'s schedule or contact admin for new assignments.' : 'New assignments will appear here when scheduled.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Update/Add Modal */}
      {showUpdateModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedLead.leadType === 'Monthly' ? 'Complete Wash' : 'Update Wash Status'}
            </h3>
            
            <div className="space-y-4">
              {/* Washers cannot set wash type or amount - these are controlled by admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wash Status</label>
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="completed"
                      checked={updateData.washStatus === 'completed'}
                      onChange={(e) => setUpdateData({...updateData, washStatus: e.target.value})}
                      className="form-radio text-primary"
                    />
                    <span className="ml-2">Completed</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="notcompleted"
                      checked={updateData.washStatus === 'notcompleted'}
                      onChange={(e) => setUpdateData({...updateData, washStatus: e.target.value})}
                      className="form-radio text-primary"
                    />
                    <span className="ml-2">Not Completed</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={updateData.is_amountPaid === true}
                      onChange={() => setUpdateData({...updateData, is_amountPaid: true})}
                      className="form-radio text-primary"
                    />
                    <span className="ml-2">Paid</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={updateData.is_amountPaid === false}
                      onChange={() => setUpdateData({...updateData, is_amountPaid: false})}
                      className="form-radio text-primary"
                    />
                    <span className="ml-2">Not Paid</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={updateData.feedback}
                  onChange={(e) => setUpdateData({...updateData, feedback: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Add any feedback or notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (updateData.isScheduledWash && updateData.washId) {
                    // For monthly subscription scheduled washes
                    handleMarkWashCompleted(selectedLead.id, updateData.washId);
                  } else if (updateData.washId) {
                    // For wash history entries
                    handleUpdateWash(selectedLead.id, updateData.washId);
                  } else if (selectedLead.leadType === 'One-time' && selectedLead.oneTimeWash) {
                    // For one-time washes
                    handleUpdateOneTimeWash(selectedLead.id);
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedLeads;
