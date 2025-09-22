import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MapPin, Car, Calendar, ArrowLeft, UserPlus, User, Plus, Copy, ExternalLink } from 'lucide-react';
import axios from 'axios';
import CreateWashHistoryForm from '../components/CreateWashHistoryForm';
import TypeBadge from '../components/common/TypeBadge';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../contexts/ToastContext';

const API_BASE_URL = 'https://zuci-sbackend-8.onrender.com/api';

interface WasherDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  todayLeads: Array<{
    id: number;
    customerName: string;
    status: string;
    area: string;
  }>;
}

interface Washer {
  _id: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
}

interface WashHistory {
  _id: string;
  washType: string;
  washer: {
    _id: string;
    name: string;
  };
  amount: number;
  date: string;
  createdAt: string;
  feedback?: string;
  is_amountPaid: boolean;
  washStatus: string;
  washServiceType?: string;
}

interface Lead {
  id: number;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  vehicleNumber?: string;
  leadType: string;
  leadSource: string;
  assignedWasher?: { _id: string; id: number; name: string };
  createdAt: string;
  status: string;
  notes: string;
  location?: {
    coordinates: [number, number]; // [lng, lat]
  };
}

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [washers, setWashers] = useState<Washer[]>([]);
  const [selectedWasher, setSelectedWasher] = useState<number | ''>('');
  const [washHistory, setWashHistory] = useState<WashHistory[]>([]);
  const [showCreateWashHistoryModal, setShowCreateWashHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [washerDetails, setWasherDetails] = useState<WasherDetails | null>(null);
  const [editingEntry, setEditingEntry] = useState<WashHistory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddWashModal, setShowAddWashModal] = useState(false);
  const [washType, setWashType] = useState<'onetime' | 'monthly'>('onetime');
  const [existingCustomPlans, setExistingCustomPlans] = useState<Array<{name: string, washes: number, price: number, interiorWashes: number}>>([]);
  const [oneTimeWashData, setOneTimeWashData] = useState({
    washType: 'Basic',
    amount: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    washerId: '',
    paymentStatus: false,
    completionStatus: 'pending',
    washServiceType: 'Exterior'
  });
  const [monthlyPackageData, setMonthlyPackageData] = useState({
    packageType: 'Basic',
    customWashes: 3,
    customAmount: '',
    customPlanName: '',
    totalInteriorWashes: 0,
    scheduledDates: ['', '', ''],
    washDetails: [{ serviceType: 'Exterior' }, { serviceType: 'Exterior' }, { serviceType: 'Exterior' }],
    paymentStatus: false,
    completionStatus: 'scheduled'
  });
  const [schedulePattern, setSchedulePattern] = useState('weekly');
  const [customInterval, setCustomInterval] = useState(7);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllDates, setShowAllDates] = useState(false);
  const [numberOfCars, setNumberOfCars] = useState(1);
  const [carNames, setCarNames] = useState([lead?.carModel || 'THAR']);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchWashHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get(`${API_BASE_URL}/leads/${id}/wash-history`);
      setWashHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch wash history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateSchedule = () => {
    if (!startDate || !monthlyPackageData.customWashes) return;
    
    const dates = [];
    const washDetails = [];
    const start = new Date(startDate);
    const interval = customInterval || 7;
    
    // Time slots to distribute across (avoid peak hours)
    const timeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30', '17:00'];
    
    // Calculate interior wash distribution
    const totalWashes = monthlyPackageData.customWashes;
    const interiorCount = monthlyPackageData.totalInteriorWashes || 0;
    const interiorInterval = interiorCount > 0 ? Math.floor(totalWashes / interiorCount) : 0;
    
    for (let i = 0; i < totalWashes; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + (i * interval));
      dates.push(date.toISOString().split('T')[0]);
      
      // Distribute interior washes evenly
      let serviceType = 'Exterior';
      if (interiorCount > 0) {
        const isInteriorWash = (i % interiorInterval === 0 || i % interiorInterval === Math.floor(interiorInterval/2)) && 
                              washDetails.filter(w => w.serviceType === 'Interior').length < interiorCount;
        serviceType = isInteriorWash ? 'Interior' : 'Exterior';
      }
      
      // Distribute time slots to avoid conflicts
      const timeSlot = timeSlots[i % timeSlots.length];
      
      // Auto-assign cars cyclically
      const carIndex = i % numberOfCars;
      const carName = carNames[carIndex] || `CAR${carIndex + 1}`;
      const carNumber = `Car${carIndex + 1}`;
      
      washDetails.push({ 
        serviceType, 
        time: timeSlot, 
        carNumber: carNumber,
        carName: carName
      });
    }
    
    setMonthlyPackageData({
      ...monthlyPackageData,
      scheduledDates: dates,
      washDetails: washDetails
    });
  };

  // Fetch washers list and custom plans
  const fetchWashers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/washer/list?forAssignment=true`);
      setWashers(response.data);
    } catch (err) {
      console.error('Failed to fetch washers:', err);
    }
  };

  useEffect(() => {
    const fetchCustomPlans = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/leads/custom-plans`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        setExistingCustomPlans(response.data);
      } catch (err) {
        console.error('Failed to fetch custom plans:', err);
      }
    };

    fetchWashers();
    fetchCustomPlans();
  }, []);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/leads/${id}`);
        setLead(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch lead details');
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
    if (id) {
      fetchWashHistory();
    }

    // Set up polling to refresh data every 30 seconds for dynamic updates
    const interval = setInterval(() => {
      if (id) {
        fetchWashHistory();
        fetchLead();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!lead) return <div className="p-8 text-center">Lead not found</div>;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back 
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-2xl font-semibold text-gray-900">User Details</h3>
          <div className="mt-4 flex items-center space-x-4">
            <TypeBadge type={lead.leadType} />
            <StatusBadge status={lead.status} />
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
              <dd className="mt-1 text-lg text-gray-900">{lead.customerName}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-lg text-gray-900 flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                {lead.phone}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Area</dt>
              <dd className="mt-1 text-lg text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                {lead.area}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Car Model</dt>
              <dd className="mt-1 text-lg text-gray-900 flex items-center">
                <Car className="h-5 w-5 text-gray-400 mr-2" />
                {lead.carModel}
              </dd>
            </div>

            {lead.vehicleNumber && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Vehicle Number</dt>
                <dd className="mt-1 text-lg text-gray-900 flex items-center">
                  <Car className="h-5 w-5 text-gray-400 mr-2" />
                  {lead.vehicleNumber}
                </dd>
              </div>
            )}

            {lead.vehicleNumber && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Vehicle Number</dt>
                <dd className="mt-1 text-lg text-gray-900 flex items-center">
                  <Car className="h-5 w-5 text-gray-400 mr-2" />
                  {lead.vehicleNumber}
                </dd>
              </div>
            )}

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Lead Source</dt>
              <dd className="mt-1 text-lg text-gray-900">{lead.leadSource}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created Date</dt>
              <dd className="mt-1 text-lg text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                {new Date(lead.createdAt).toLocaleDateString()}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-lg text-gray-900 flex items-center justify-between">
                {(() => {
                  // Check if there's a washer assigned in wash history
                  const assignedWasherFromHistory = washHistory.find(entry => entry.washer?.name)?.washer;
                  const displayWasher = lead.assignedWasher || assignedWasherFromHistory;
                  
                  return displayWasher ? (
                    <>
                      <span className="text-green-700 font-medium">{displayWasher.name}</span>
                      <button
                        onClick={async () => {
                          try {
                            const response = await axios.get(`${API_BASE_URL}/washer/${displayWasher._id}`);
                            setWasherDetails(response.data);
                            setShowDetailsModal(true);
                          } catch (err: any) {
                            showToast('error', err.message || 'Failed to fetch washer details');
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <User className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </>
                  ) : (
                    <select
                      value=""
                      onChange={async (e) => {
                        if (!e.target.value) return;
                        try {
                          const response = await axios.put(`${API_BASE_URL}/leads/${id}`, {
                            assignedWasher: e.target.value
                          });
                          setLead(response.data);
                          fetchWashHistory();
                          showToast('success', 'Washer assigned successfully!');
                        } catch (err) {
                          showToast('error', 'Failed to assign washer');
                        }
                      }}
                      className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Assign Washer</option>
                      {washers.map((washer) => (
                        <option key={washer._id} value={washer._id}>
                          {washer.name} (ID: {washer.id})
                        </option>
                      ))}
                    </select>
                  );
                })()
                }
              </dd>
            </div>

            {lead.location?.coordinates && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        const coords = lead.location?.coordinates;
                        if (coords) {
                          const mapUrl = `https://www.google.com/maps?q=${coords[1]},${coords[0]}`;
                          navigator.clipboard.writeText(mapUrl);
                          showToast('success', 'Location link copied!');
                        }
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Link
                    </button>
                    <a
                      href={`https://www.google.com/maps?q=${lead.location.coordinates[1]},${lead.location.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Map
                    </a>
                  </div>
                </dd>
              </div>
            )}

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-lg text-gray-900 whitespace-pre-line">
                {lead.notes || 'No notes available'}
              </dd>
            </div>



            <div className="sm:col-span-2 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Wash History</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      fetchWashHistory();
                      fetchWashers();
                      setRefreshKey(prev => prev + 1);
                      showToast('info', 'Data refreshed!');
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => {
                      fetchWashers(); // Refresh washers to get latest active status
                      setShowAddWashModal(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Add Wash Entry
                  </button>
                </div>
              </div>
              {historyLoading ? (
                <div className="text-center py-4">Loading wash history...</div>
              ) : washHistory.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No wash history available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wash Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Washer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {washHistory.map((entry) => (
                        <tr key={entry._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.washType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.washServiceType === 'Interior' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {entry.washServiceType || 'Exterior'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              // Check if there's a washer assigned in wash history or from lead
                              const assignedWasher = entry.washer || lead.assignedWasher;
                              return assignedWasher ? (
                                <span className="text-green-700 font-medium">{assignedWasher.name}</span>
                              ) : (
                                <span className="text-gray-500">Not Assigned</span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{entry.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 rounded-full ${entry.washStatus === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {entry.washStatus === 'completed' ? 'Completed' : 'Not Completed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 rounded-full ${entry.is_amountPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {entry.is_amountPaid ? 'Paid' : 'Not Paid'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center justify-between">
                            <span>{entry.feedback}</span>
                            <button
                              onClick={() => {
                                setEditingEntry(entry);
                                setShowEditModal(true);
                              }}
                              className="ml-2 text-primary hover:text-primary-dark focus:outline-none"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </dl>
        </div>
    </div>

    {/* Create Wash History Modal */}
    {showCreateWashHistoryModal && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Wash History</h3>
            <button
              onClick={() => setShowCreateWashHistoryModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          <CreateWashHistoryForm
            leadId={id || ''}
            washers={washers}
            onSuccess={(newHistory) => {
              setWashHistory(newHistory);
              setShowCreateWashHistoryModal(false);
            }}
            onCancel={() => setShowCreateWashHistoryModal(false)}
          />
        </div>
      </div>
    )}

    {/* Washer Details Modal */}
      {showDetailsModal && washerDetails && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Washer Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{washerDetails.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{washerDetails.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{washerDetails.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{washerDetails.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">{washerDetails.status}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned Leads</h4>
              {washerDetails.todayLeads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Area</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {washerDetails.todayLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-500">{lead.id}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{lead.customerName}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{lead.area}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{lead.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No leads assigned</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Wash History Modal */}
      {showCreateWashHistoryModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Wash History</h3>
            <CreateWashHistoryForm
              leadId={id || ''}
              washers={washers}
              onSuccess={(newHistory) => {
                setWashHistory(newHistory);
                setShowCreateWashHistoryModal(false);
              }}
              onCancel={() => setShowCreateWashHistoryModal(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Wash History Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Wash Entry</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Wash Type</label>
                <input
                  type="text"
                  value={editingEntry.washType}
                  onChange={(e) => setEditingEntry({ ...editingEntry, washType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={editingEntry.amount}
                  onChange={(e) => setEditingEntry({ ...editingEntry, amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={new Date(editingEntry.date).toISOString().split('T')[0]}
                  onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Washer</label>
                <select
                  value={editingEntry.washer?._id || ''}
                  onChange={(e) => {
                    const selectedWasher = washers.find(w => w._id === e.target.value);
                    if (selectedWasher) {
                      setEditingEntry({
                        ...editingEntry,
                        washer: { _id: selectedWasher._id, name: selectedWasher.name }
                      });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">Select Washer</option>
                  {washers.map((washer) => (
                    <option key={washer._id} value={washer._id}>
                      {washer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                <select
                  value={editingEntry.washServiceType || 'Exterior'}
                  onChange={(e) => setEditingEntry({ ...editingEntry, washServiceType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="Interior">Interior</option>
                  <option value="Exterior">Exterior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback</label>
                <textarea
                  value={editingEntry.feedback || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, feedback: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter feedback here..."
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wash Status</label>
                  <div className="mt-2 space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={editingEntry.washStatus === 'completed'}
                        onChange={() => setEditingEntry({ ...editingEntry, washStatus: 'completed' })}
                        className="form-radio text-primary focus:ring-primary"
                      />
                      <span className="ml-2">Completed</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={editingEntry.washStatus === 'notcompleted'}
                        onChange={() => setEditingEntry({ ...editingEntry, washStatus: 'notcompleted' })}
                        className="form-radio text-primary focus:ring-primary"
                      />
                      <span className="ml-2">Not Completed</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <div className="mt-2 space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={editingEntry.is_amountPaid}
                        onChange={() => setEditingEntry({ ...editingEntry, is_amountPaid: true })}
                        className="form-radio text-primary focus:ring-primary"
                      />
                      <span className="ml-2">Paid</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={!editingEntry.is_amountPaid}
                        onChange={() => setEditingEntry({ ...editingEntry, is_amountPaid: false })}
                        className="form-radio text-primary focus:ring-primary"
                      />
                      <span className="ml-2">Not Paid</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await axios.put(
                      `${API_BASE_URL}/leads/${id}/wash-history/${editingEntry._id}`,
                      {
                        washType: editingEntry.washType,
                        amount: editingEntry.amount,
                        date: editingEntry.date,
                        amountPaid: editingEntry.is_amountPaid,
                        washerId: editingEntry.washer?._id,
                        feedback: editingEntry.feedback,
                        washStatus: editingEntry.washStatus,
                        washServiceType: editingEntry.washServiceType
                      }
                    );
                    setWashHistory(response.data);
                    setShowEditModal(false);
                  } catch (err: any) {
                    showToast('error', err.message || 'Failed to update wash entry');
                  }
                }}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Wash Entry Modal */}
      {showAddWashModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add Wash Entry</h3>
              <button
                onClick={() => setShowAddWashModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            {/* Wash Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Wash Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="washType"
                    checked={washType === 'onetime'}
                    onChange={() => setWashType('onetime')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">One-time Wash</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="washType"
                    checked={washType === 'monthly'}
                    onChange={() => setWashType('monthly')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Monthly Subscription
                    {lead?.leadType === 'One-time' && (
                      <span className="ml-1 text-xs text-orange-600 font-medium">(Convert to Monthly)</span>
                    )}
                  </span>
                </label>
              </div>
            </div>

            {/* One-time Wash Form */}
            {washType === 'onetime' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wash Type</label>
                    <select
                      value={oneTimeWashData.washType}
                      onChange={(e) => setOneTimeWashData({...oneTimeWashData, washType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="Deluxe">Deluxe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <select
                      value={oneTimeWashData.washServiceType}
                      onChange={(e) => setOneTimeWashData({...oneTimeWashData, washServiceType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Interior">Interior</option>
                      <option value="Exterior">Exterior</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      value={oneTimeWashData.amount}
                      onChange={(e) => setOneTimeWashData({...oneTimeWashData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                    <input
                      type="date"
                      value={oneTimeWashData.scheduledDate}
                      onChange={(e) => setOneTimeWashData({...oneTimeWashData, scheduledDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={oneTimeWashData.scheduledTime}
                      onChange={(e) => setOneTimeWashData({...oneTimeWashData, scheduledTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign Washer</label>
                    <select
                      value={oneTimeWashData.washerId}
                      onChange={(e) => setOneTimeWashData({...oneTimeWashData, washerId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a washer</option>
                      {washers.map((washer) => (
                        <option key={washer._id} value={washer.id}>
                          {washer.name} (ID: {washer.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Payment and Completion Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!oneTimeWashData.paymentStatus}
                          onChange={() => setOneTimeWashData({...oneTimeWashData, paymentStatus: false})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Not Paid</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={oneTimeWashData.paymentStatus}
                          onChange={() => setOneTimeWashData({...oneTimeWashData, paymentStatus: true})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Paid</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Completion Status</label>
                    <select
                      value={oneTimeWashData.completionStatus}
                      onChange={(e) => setOneTimeWashData({...oneTimeWashData, completionStatus: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Subscription Form */}
            {washType === 'monthly' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Package Type</label>
                  <select
                    value={monthlyPackageData.packageType}
                    onChange={(e) => {
                      const newPackageType = e.target.value;
                      let washCount = 3;
                      let interiorCount = 0;
                      let planName = '';
                      let planPrice = '';
                      
                      if (newPackageType === 'Premium') { washCount = 4; interiorCount = 2; }
                      else if (newPackageType === 'Deluxe') { washCount = 5; interiorCount = 3; }
                      else if (newPackageType === 'Custom') { 
                        washCount = monthlyPackageData.customWashes; 
                        interiorCount = monthlyPackageData.totalInteriorWashes; 
                      }
                      else if (newPackageType === 'Basic') { washCount = 3; interiorCount = 1; }
                      else {
                        // Existing custom plan selected
                        const selectedPlan = existingCustomPlans.find(p => p.name === newPackageType);
                        if (selectedPlan) {
                          washCount = selectedPlan.washes;
                          interiorCount = selectedPlan.interiorWashes;
                          planName = selectedPlan.name;
                          planPrice = selectedPlan.price.toString();
                        }
                      }
                      
                      const newDates = Array(washCount).fill('');
                      const newWashDetails = Array(washCount).fill(null).map(() => ({ serviceType: 'Exterior' }));
                      setMonthlyPackageData({
                        ...monthlyPackageData,
                        packageType: newPackageType,
                        scheduledDates: newDates,
                        washDetails: newWashDetails,
                        totalInteriorWashes: interiorCount,
                        customPlanName: planName,
                        customAmount: planPrice,
                        customWashes: washCount
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Basic">Basic (3 washes - ₹300)</option>
                    <option value="Premium">Premium (4 washes - ₹400)</option>
                    <option value="Deluxe">Deluxe (5 washes - ₹500)</option>
                    {existingCustomPlans.map((plan) => (
                      <option key={plan.name} value={plan.name}>
                        {plan.name} ({plan.washes} washes - ₹{plan.price})
                      </option>
                    ))}
                    <option value="Custom">+ Create New Custom Plan</option>
                  </select>
                </div>

                {/* Custom Package Options - Only show for new custom plans */}
                {monthlyPackageData.packageType === 'Custom' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                      <input
                        type="text"
                        value={monthlyPackageData.customPlanName}
                        onChange={(e) => setMonthlyPackageData({
                          ...monthlyPackageData,
                          customPlanName: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Luxury Plan Pro"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (₹)</label>
                        <input
                          type="number"
                          value={monthlyPackageData.customAmount}
                          onChange={(e) => setMonthlyPackageData({
                            ...monthlyPackageData,
                            customAmount: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="4500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Washes</label>
                        <input
                          type="number"
                          min="1"
                          max="400"
                          value={monthlyPackageData.customWashes}
                          onChange={(e) => {
                            const washCount = parseInt(e.target.value) || 3;
                            const newDates = Array(washCount).fill('');
                            const newWashDetails = Array(washCount).fill(null).map(() => ({ serviceType: 'Exterior' }));
                            setMonthlyPackageData({
                              ...monthlyPackageData,
                              customWashes: washCount,
                              scheduledDates: newDates,
                              washDetails: newWashDetails
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="6"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Interior Washes</label>
                        <input
                          type="number"
                          min="0"
                          max={monthlyPackageData.customWashes}
                          value={monthlyPackageData.totalInteriorWashes}
                          onChange={(e) => {
                            const interiorCount = parseInt(e.target.value) || 0;
                            setMonthlyPackageData({
                              ...monthlyPackageData,
                              totalInteriorWashes: Math.min(interiorCount, monthlyPackageData.customWashes)
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5"
                        />
                      </div>
                    </div>
                    
                    {/* Create Plan Button */}
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={async () => {
                          if (!monthlyPackageData.customPlanName || !monthlyPackageData.customAmount || !monthlyPackageData.customWashes) {
                            showToast('warning', 'Please fill all plan details before creating the plan');
                            return;
                          }
                          
                          try {
                            const token = localStorage.getItem('auth_token');
                            await axios.post(`${API_BASE_URL}/leads/custom-plans`, {
                              name: monthlyPackageData.customPlanName,
                              price: parseFloat(monthlyPackageData.customAmount),
                              washes: parseInt(monthlyPackageData.customWashes),
                              interiorWashes: parseInt(monthlyPackageData.totalInteriorWashes)
                            }, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            
                            // Refresh custom plans list
                            const response = await axios.get(`${API_BASE_URL}/leads/custom-plans`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            setExistingCustomPlans(response.data);
                            
                            // Switch to the newly created plan and update the package type
                            const newPlanName = monthlyPackageData.customPlanName;
                            setMonthlyPackageData({
                              ...monthlyPackageData,
                              packageType: newPlanName
                            });
                            
                            showToast('success', 'Plan created successfully! You can now scroll down and create the package.');
                          } catch (err) {
                            console.error('Error creating plan:', err);
                            // Check if it's a duplicate name error
                            if (err.response?.status === 400 && err.response?.data?.message?.includes('already exists')) {
                              showToast('error', 'A plan with this name already exists. Please choose a different name.');
                            } else {
                              showToast('error', err.response?.data?.message || 'Failed to create plan');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                      >
                        Create Plan
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Custom Plan Display */}
                {monthlyPackageData.packageType !== 'Basic' && monthlyPackageData.packageType !== 'Premium' && monthlyPackageData.packageType !== 'Deluxe' && monthlyPackageData.packageType !== 'Custom' && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-green-800">
                          Selected Plan: {monthlyPackageData.packageType}
                        </span>
                        <div className="text-xs text-green-600 mt-1">
                          {monthlyPackageData.customWashes} washes • ₹{monthlyPackageData.customAmount} • {monthlyPackageData.totalInteriorWashes} interior washes
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Existing Plan
                      </span>
                    </div>
                  </div>
                )}

                {/* Interior Allocation Display */}
                {monthlyPackageData.totalInteriorWashes > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-purple-800">
                        Interior Wash Allocation: {monthlyPackageData.totalInteriorWashes} of {monthlyPackageData.customWashes || 3}
                      </span>
                      <span className="text-xs text-purple-600">
                        Remaining: {Math.max(0, (monthlyPackageData.totalInteriorWashes || 0) - (monthlyPackageData.washDetails?.filter(w => w && w.serviceType === 'Interior').length || 0))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Schedule Wash Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Schedule Wash Details</label>
                  
                  {/* Auto-Schedule Generator - Only for Custom Plans with >3 washes */}
                  {(monthlyPackageData.packageType === 'Custom' || !['Basic', 'Premium', 'Deluxe'].includes(monthlyPackageData.packageType)) && monthlyPackageData.customWashes > 3 && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-3">Auto-Schedule Generator</h4>
                      <div className="space-y-3 mb-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">End Date (30 Days Max)</label>
                            <input
                              type="date"
                              value={startDate ? new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''}
                              readOnly
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-gray-600"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Interval (days)</label>
                            <select
                              value={customInterval}
                              onChange={(e) => setCustomInterval(parseInt(e.target.value) || 7)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value={3}>Every 3 Days</option>
                              <option value={5}>Every 5 Days</option>
                              <option value={7}>Every 7 Days</option>
                              <option value={10}>Every 10 Days</option>
                              <option value={15}>Every 15 Days</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Number of Cars</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={numberOfCars}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 1;
                                setNumberOfCars(count);
                                const newCarNames = Array(count).fill('').map((_, i) => 
                                  carNames[i] || (i === 0 ? lead?.carModel || 'THAR' : `CAR${i + 1}`)
                                );
                                setCarNames(newCarNames);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="1"
                            />
                          </div>
                        </div>
                        
                        {/* Car Names Input */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">Car Names (Auto-numbered)</label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {Array(numberOfCars).fill('').map((_, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 w-12">Car{index + 1}:</span>
                                <input
                                  type="text"
                                  value={carNames[index] || ''}
                                  onChange={(e) => {
                                    const newCarNames = [...carNames];
                                    newCarNames[index] = e.target.value;
                                    setCarNames(newCarNames);
                                  }}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder={index === 0 ? 'THAR' : `CAR${index + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={generateSchedule}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Generate {monthlyPackageData.customWashes} Dates
                      </button>
                      

                    </div>
                  )}
                  
                  {/* Wash List - Direct reflection of generated results */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-sm font-medium text-gray-700">Wash List ({monthlyPackageData.scheduledDates.filter(d => d).length} washes)</h5>
                      {monthlyPackageData.scheduledDates.some(d => d) && (
                        <button
                          type="button"
                          onClick={() => setShowAllDates(!showAllDates)}
                          className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded"
                        >
                          {showAllDates ? 'Collapse' : 'Edit All'}
                        </button>
                      )}
                    </div>
                    
                    {monthlyPackageData.scheduledDates.map((date, index) => {
                      const washDetail = (monthlyPackageData.washDetails && monthlyPackageData.washDetails[index]) || { serviceType: 'Exterior', time: '09:00' };
                      const usedInteriorCount = monthlyPackageData.washDetails?.filter(w => w && w.serviceType === 'Interior').length || 0;
                      const canSelectInterior = washDetail.serviceType === 'Interior' || usedInteriorCount < (monthlyPackageData.totalInteriorWashes || 0);
                      
                      return (
                        <div key={index} className={`p-3 border rounded-lg transition-colors ${
                          washDetail.serviceType === 'Interior' ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'
                        } ${date ? 'border-green-300 bg-green-50' : ''}`}>
                          
                          {/* Compact View */}
                          {!showAllDates && date && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-gray-700 text-sm">Wash {index + 1}</span>
                                <span className="text-sm text-gray-600">
                                  {new Date(date).toLocaleDateString()} • {washDetail.time || '09:00'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  washDetail.serviceType === 'Interior' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {washDetail.serviceType || 'Exterior'}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-green-700">
                                {washDetail.carNumber || `Car${index + 1}`} - {washDetail.carName || carNames[index % numberOfCars] || 'THAR'}
                              </span>
                            </div>
                          )}
                          
                          {/* Expanded Edit View */}
                          {(showAllDates || !date) && (
                            <>
                              <div className="grid grid-cols-2 gap-3 mb-2">
                                <div>
                                  <label className="text-xs text-gray-600">Wash {index + 1}</label>
                                  <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => {
                                      const newDates = [...monthlyPackageData.scheduledDates];
                                      newDates[index] = e.target.value;
                                      setMonthlyPackageData({...monthlyPackageData, scheduledDates: newDates});
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    min={new Date().toISOString().split('T')[0]}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">Time</label>
                                  <input
                                    type="time"
                                    value={washDetail.time || '09:00'}
                                    onChange={(e) => {
                                      const newWashDetails = [...(monthlyPackageData.washDetails || [])];
                                      newWashDetails[index] = { ...washDetail, time: e.target.value };
                                      setMonthlyPackageData({...monthlyPackageData, washDetails: newWashDetails});
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600">Service Type</label>
                                  <select
                                    value={washDetail.serviceType}
                                    onChange={(e) => {
                                      if (e.target.value === 'Interior' && !canSelectInterior) return;
                                      const newWashDetails = [...(monthlyPackageData.washDetails || [])];
                                      newWashDetails[index] = { ...washDetail, serviceType: e.target.value };
                                      setMonthlyPackageData({...monthlyPackageData, washDetails: newWashDetails});
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="Exterior">Exterior</option>
                                    <option value="Interior" disabled={!canSelectInterior}>Interior {!canSelectInterior ? '(Limit Reached)' : ''}</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">Car Assignment</label>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={washDetail.carNumber || `Car${index + 1}`}
                                      readOnly
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-xs"
                                    />
                                    <span className="text-xs text-gray-500">-</span>
                                    <input
                                      type="text"
                                      value={washDetail.carName || carNames[index % numberOfCars] || 'THAR'}
                                      onChange={(e) => {
                                        const newWashDetails = [...(monthlyPackageData.washDetails || [])];
                                        newWashDetails[index] = { ...washDetail, carName: e.target.value };
                                        setMonthlyPackageData({...monthlyPackageData, washDetails: newWashDetails});
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="Car name"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  

                </div>
                
                {/* Admin Controls */}
                {monthlyPackageData.scheduledDates.some(d => d) && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Admin Controls</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={!monthlyPackageData.paymentStatus}
                              onChange={() => setMonthlyPackageData({...monthlyPackageData, paymentStatus: false})}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Not Paid</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={monthlyPackageData.paymentStatus}
                              onChange={() => setMonthlyPackageData({...monthlyPackageData, paymentStatus: true})}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Paid</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Completion Status</label>
                        <select
                          value={monthlyPackageData.completionStatus}
                          onChange={(e) => setMonthlyPackageData({...monthlyPackageData, completionStatus: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddWashModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const button = document.activeElement;
                  if (button) button.disabled = true;
                  
                  try {
                    if (washType === 'onetime') {
                      if (!oneTimeWashData.washType || !oneTimeWashData.amount || !oneTimeWashData.scheduledDate || !oneTimeWashData.washerId) {
                        showToast('warning', 'Please fill all fields');
                        return;
                      }
                      
                      // Add to wash history directly
                      await axios.post(`${API_BASE_URL}/leads/${id}/wash-history`, {
                        washType: oneTimeWashData.washType,
                        amount: parseFloat(oneTimeWashData.amount),
                        date: oneTimeWashData.scheduledDate,
                        washerId: oneTimeWashData.washerId,
                        is_amountPaid: oneTimeWashData.paymentStatus,
                        washStatus: oneTimeWashData.completionStatus,
                        washServiceType: oneTimeWashData.washServiceType,
                        feedback: ''
                      });
                    } else {
                      // Validation
                      if (!monthlyPackageData.packageType) {
                        showToast('warning', 'Please select a package type');
                        return;
                      }
                      
                      const validDates = monthlyPackageData.scheduledDates.filter(date => date !== '');
                      if (validDates.length === 0) {
                        showToast('warning', 'Please select at least one wash date');
                        return;
                      }
                      
                      if (validDates.length !== monthlyPackageData.scheduledDates.length) {
                        showToast('warning', 'Please select all wash dates');
                        return;
                      }
                      
                      // For custom packages (either new or existing custom plans)
                      const isCustomPackage = monthlyPackageData.packageType === 'Custom' || 
                        (!['Basic', 'Premium', 'Deluxe'].includes(monthlyPackageData.packageType));
                      
                      if (monthlyPackageData.packageType === 'Custom') {
                        if (!monthlyPackageData.customPlanName) {
                          showToast('warning', 'Please enter a plan name for custom package');
                          return;
                        }
                        if (!monthlyPackageData.customAmount) {
                          showToast('warning', 'Please enter amount for custom package');
                          return;
                        }
                        if (!monthlyPackageData.customWashes) {
                          showToast('warning', 'Please enter number of washes for custom package');
                          return;
                        }
                      }
                      
                      // Check if lead is one-time and convert to monthly
                      if (lead?.leadType === 'One-time') {
                        const confirmConversion = window.confirm(
                          `This will convert the lead from "One-time" to "Monthly Subscription". Are you sure you want to proceed?`
                        );
                        
                        if (!confirmConversion) {
                          return;
                        }
                        
                        // Determine if this is a custom package
                        const isCustomPackage = monthlyPackageData.packageType === 'Custom' || 
                          !['Basic', 'Premium', 'Deluxe'].includes(monthlyPackageData.packageType);
                        
                        const convertData = {
                          packageType: isCustomPackage ? 'Custom' : monthlyPackageData.packageType,
                          scheduledDates: validDates,
                          customWashes: monthlyPackageData.customWashes,
                          customAmount: monthlyPackageData.customAmount,
                          customPlanName: isCustomPackage ? (monthlyPackageData.customPlanName || monthlyPackageData.packageType) : monthlyPackageData.packageType,
                          totalInteriorWashes: monthlyPackageData.totalInteriorWashes,
                          washDetails: monthlyPackageData.washDetails,
                          paymentStatus: monthlyPackageData.paymentStatus,
                          completionStatus: monthlyPackageData.completionStatus
                        };
                        
                        console.log('Converting to monthly with data:', convertData);
                        const response = await axios.put(`${API_BASE_URL}/leads/${id}/convert-to-monthly`, convertData);
                        // Update the lead state to reflect the conversion
                        setLead(response.data);
                      } else {
                        // Determine if this is a custom package
                        const isCustomPackage = monthlyPackageData.packageType === 'Custom' || 
                          !['Basic', 'Premium', 'Deluxe'].includes(monthlyPackageData.packageType);
                        
                        const requestData = {
                          packageType: isCustomPackage ? 'Custom' : monthlyPackageData.packageType,
                          scheduledDates: validDates,
                          customWashes: monthlyPackageData.customWashes,
                          customAmount: monthlyPackageData.customAmount,
                          customPlanName: isCustomPackage ? (monthlyPackageData.customPlanName || monthlyPackageData.packageType) : monthlyPackageData.packageType,
                          totalInteriorWashes: monthlyPackageData.totalInteriorWashes,
                          washDetails: monthlyPackageData.washDetails,
                          paymentStatus: monthlyPackageData.paymentStatus,
                          completionStatus: monthlyPackageData.completionStatus
                        };
                        
                        console.log('Sending monthly subscription data:', requestData);
                        await axios.post(`${API_BASE_URL}/leads/${id}/monthly-subscription`, requestData);
                        
                        // Refresh custom plans if a new custom plan was created
                        if (monthlyPackageData.packageType === 'Custom' && monthlyPackageData.customPlanName) {
                          const token = localStorage.getItem('auth_token');
                          const response = await axios.get(`${API_BASE_URL}/leads/custom-plans`, {
                            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                          });
                          setExistingCustomPlans(response.data);
                        }
                      }
                    }
                    setShowAddWashModal(false);
                    
                    // Show success message
                    if (washType === 'onetime') {
                      showToast('success', 'Wash entry added successfully!');
                    } else if (lead?.leadType === 'One-time' && washType === 'monthly') {
                      showToast('success', 'Lead successfully converted to Monthly Subscription!');
                    } else {
                      showToast('success', 'Monthly subscription package created successfully!');
                    }
                    
                    // Refresh both lead data and wash history
                    const leadResponse = await axios.get(`${API_BASE_URL}/leads/${id}`);
                    setLead(leadResponse.data);
                    await fetchWashHistory();
                    
                    // Reset form data
                    setOneTimeWashData({
                      washType: 'Basic',
                      amount: '',
                      scheduledDate: '',
                      scheduledTime: '09:00',
                      washerId: '',
                      paymentStatus: false,
                      completionStatus: 'pending',
                      washServiceType: 'Exterior'
                    });
                    setMonthlyPackageData({
                      packageType: 'Basic',
                      customWashes: 3,
                      customAmount: '',
                      customPlanName: '',
                      totalInteriorWashes: 0,
                      scheduledDates: ['', '', ''],
                      washDetails: [{ serviceType: 'Exterior' }, { serviceType: 'Exterior' }, { serviceType: 'Exterior' }],
                      paymentStatus: false,
                      completionStatus: 'scheduled'
                    });
                    setSchedulePattern('weekly');
                    setCustomInterval(7);
                    setStartDate(new Date().toISOString().split('T')[0]);
                    setShowAllDates(false);
                    setNumberOfCars(1);
                    setCarNames([lead?.carModel || 'THAR']);
                  } catch (err: any) {
                    console.error('Error creating package:', err);
                    const errorMessage = err.response?.data?.message || err.message || 'Failed to create package';
                    showToast('error', errorMessage);
                  } finally {
                    const button = document.activeElement;
                    if (button) button.disabled = false;
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {washType === 'onetime' 
                  ? 'Assign Wash' 
                  : (lead?.leadType === 'One-time' ? 'Convert to Monthly & Create Package' : 'Create Package')
                }
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default LeadDetails;

