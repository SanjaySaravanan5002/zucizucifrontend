import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MapPin, Car, Calendar, ArrowLeft, UserPlus, User } from 'lucide-react';
import axios from 'axios';
import CreateWashHistoryForm from '../components/CreateWashHistoryForm';
import TypeBadge from '../components/common/TypeBadge';
import StatusBadge from '../components/common/StatusBadge';

const API_BASE_URL = 'http://localhost:5000/api';

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
}

interface Lead {
  id: number;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  leadType: string;
  leadSource: string;
  assignedWasher?: { _id: string; id: number; name: string };
  createdAt: string;
  status: string;
  notes: string;
}

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Fetch washers list
  useEffect(() => {
    const fetchWashers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/washer/list`);
        setWashers(response.data);
      } catch (err) {
        console.error('Failed to fetch washers:', err);
      }
    };

    fetchWashers();
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
                <span>{lead.assignedWasher?.name || 'Unassigned'}</span>
                {lead.assignedWasher && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await axios.get(`${API_BASE_URL}/washer/${lead.assignedWasher?._id}`);
                        setWasherDetails(response.data);
                        setShowDetailsModal(true);
                      } catch (err: any) {
                        alert(err.message || 'Failed to fetch washer details');
                      }
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <User className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                )}
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {lead.assignedWasher ? 'Reassign' : 'Assign Washer'}
                </button>

              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-lg text-gray-900 whitespace-pre-line">
                {lead.notes || 'No notes available'}
              </dd>
            </div>

            <div className="sm:col-span-2 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Wash History</h3>
                <button
                  onClick={() => setShowCreateWashHistoryModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Wash Entry
                </button>
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
                            {entry.washer.name}
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
                  value={editingEntry.washer._id}
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
                  {washers.map((washer) => (
                    <option key={washer._id} value={washer._id}>
                      {washer.name}
                    </option>
                  ))}
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
                        washerId: editingEntry.washer._id,
                        feedback: editingEntry.feedback,
                        washStatus: editingEntry.washStatus
                      }
                    );
                    setWashHistory(response.data);
                    setShowEditModal(false);
                  } catch (err: any) {
                    alert(err.message || 'Failed to update wash entry');
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

      {/* Assign Washer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Washer</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Washer
              </label>
              <select
                value={selectedWasher}
                onChange={(e) => setSelectedWasher(e.target.value ? parseInt(e.target.value) : '')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">Select a washer</option>
                {washers.map((washer) => (
                  <option key={washer._id} value={washer.id}>
                    {washer.name} (ID: {washer.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedWasher('');
                }}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedWasher) return;
                  try {
                    const response = await axios.put(`${API_BASE_URL}/leads/${id}/assign`, {
                      washerId: selectedWasher.toString()
                    });
                    setLead(response.data);
                    setShowAssignModal(false);
                    setSelectedWasher('');
                  } catch (err: any) {
                    alert(err.message || 'Failed to assign washer');
                  }
                }}
                disabled={!selectedWasher}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${!selectedWasher ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;
