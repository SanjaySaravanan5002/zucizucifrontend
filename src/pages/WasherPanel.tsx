import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, UserPlus, Loader2, RefreshCw, Phone, Mail, CheckCircle, XCircle, Eye, Edit, Trash2, Upload, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';



interface Washer {
  id: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  address?: string;
  salary?: {
    base: number;
    bonus: number;
  };
  summary?: {
    total: number;
    completed: number;
    pending: number;
  };
}

interface WasherFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  salary?: {
    base: number;
    bonus: number;
  };
}



const WasherPanel = () => {
  const navigate = useNavigate();
  const [washers, setWashers] = useState<Washer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [newWasher, setNewWasher] = useState<WasherFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    salary: {
      base: 0,
      bonus: 0
    }
  });
  const [editWasher, setEditWasher] = useState<Washer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedWasher, setSelectedWasher] = useState<Washer | null>(null);

  const API_BASE_URL = 'https://zuci-sbackend-12.onrender.com/api';

  // Fetch washers list (all washers for management)
  useEffect(() => {
    const fetchWashers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/washer/list`);
        setWashers(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch washers');
      } finally {
        setLoading(false);
      }
    };

    fetchWashers();
  }, []);

  const handleViewDetails = (washerId: string) => {
    // Navigate directly to details page - the WasherDetails component will handle data fetching
    navigate(`/washer/${washerId}/details`);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_BASE_URL}/washer/list`);
      setWashers(response.data);
      toast.success('Data refreshed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (washerId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await axios.post(`${API_BASE_URL}/washer/${washerId}/status`, { status: newStatus });
      
      // Fetch updated list of washers (all washers for management)
      const response = await axios.get(`${API_BASE_URL}/washer/list`);
      setWashers(response.data);
      
      toast.success(`Washer status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update washer status');
    }
  };

  const handleCreateWasher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/washer/create`, newWasher);
      setWashers([...washers, { ...response.data, summary: { total: 0, completed: 0, pending: 0 } }]);
      setShowCreateForm(false);
      setNewWasher({ name: '', email: '', phone: '', password: '', salary: { base: 0, bonus: 0 } });
      toast.success('Washer created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create washer');
    }
  };

  const handleEditWasher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWasher) return;
    
    try {
      await axios.put(`${API_BASE_URL}/washer/${editWasher.id}`, {
        name: editWasher.name,
        email: editWasher.email,
        phone: editWasher.phone,
        address: editWasher.address,
        salary: editWasher.salary
      });
      
      setWashers(washers.map(w => w.id === editWasher.id ? editWasher : w));
      setShowEditModal(false);
      setEditWasher(null);
      toast.success('Washer updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update washer');
    }
  };

  const handleDeleteWasher = async (washerId: string) => {
    if (!window.confirm('Are you sure you want to delete this washer?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/washer/${washerId}`);
      setWashers(washers.filter(w => w.id !== washerId));
      toast.success('Washer deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete washer');
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWasher) return;
    
    const formData = new FormData();
    const fileInput = document.getElementById('photoUpload') as HTMLInputElement;
    
    if (fileInput?.files?.[0]) {
      formData.append('profilePhoto', fileInput.files[0]);
      
      try {
        await axios.post(`${API_BASE_URL}/washer/${selectedWasher.id}/upload-photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setShowPhotoModal(false);
        setSelectedWasher(null);
        toast.success('Photo uploaded successfully');
        handleRefresh();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to upload photo');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header with Create Button */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-indigo-100 backdrop-blur-lg bg-opacity-90">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Car Wash Service Providers</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your team of professional car washers</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Provider
          </button>
        </div>
      </div>

      {/* Create Washer Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Washer</h3>
            <form onSubmit={handleCreateWasher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={newWasher.name}
                  onChange={(e) => setNewWasher({ ...newWasher, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter washer's name"
                  pattern="[A-Za-z ]{2,50}"
                  title="Name should be between 2 and 50 characters and contain only letters and spaces"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={newWasher.email}
                  onChange={(e) => setNewWasher({ ...newWasher, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter email address"
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Please enter a valid email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  required
                  value={newWasher.phone}
                  onChange={(e) => setNewWasher({ ...newWasher, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter phone number"
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={newWasher.password}
                  onChange={(e) => setNewWasher({ ...newWasher, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter password"
                  pattern=".{6,}"
                  title="Password must be at least 6 characters long"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Base Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newWasher.salary?.base || ''}
                  onChange={(e) => setNewWasher({ 
                    ...newWasher, 
                    salary: { 
                      ...newWasher.salary, 
                      base: parseFloat(e.target.value) || 0 
                    } 
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter base salary amount"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Washers List */}
      <div className="bg-white rounded-lg shadow-lg border border-indigo-100 overflow-hidden backdrop-blur-lg bg-opacity-90">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Service Providers List</h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {washers.map((washer) => (
                <tr 
                  key={washer._id} 
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ease-in-out cursor-pointer transform hover:scale-[1.01]"
                  onClick={(e) => e.preventDefault()}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{washer.name}</div>
                        <div className="text-sm text-gray-500">Added on {new Date(washer.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {washer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {washer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${washer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {washer.status === 'Active' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {washer.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(washer.id, washer.status);
                        }}
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        style={{
                          backgroundColor: washer.status === 'Active' ? '#10B981' : '#6B7280'
                        }}
                      >
                        <span className="sr-only">{washer.status === 'Active' ? 'Deactivate washer' : 'Activate washer'}</span>
                        <span
                          className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          style={{
                            transform: `translateX(${washer.status === 'Active' ? '20px' : '0px'})`
                          }}
                        >
                          <span
                            className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${washer.status === 'Active' ? 'opacity-0' : 'opacity-100'}`}
                          >
                            <span className="text-[10px] font-semibold text-gray-400">OFF</span>
                          </span>
                          <span
                            className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${washer.status === 'Active' ? 'opacity-100' : 'opacity-0'}`}
                          >
                            <span className="text-[10px] font-semibold text-green-500">ON</span>
                          </span>
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(washer.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-indigo-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWasher(washer.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        title="Delete Washer"
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>




      {/* Edit Washer Modal */}
      {showEditModal && editWasher && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Washer</h3>
            <form onSubmit={handleEditWasher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={editWasher.name}
                  onChange={(e) => setEditWasher({ ...editWasher, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={editWasher.email}
                  onChange={(e) => setEditWasher({ ...editWasher, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  required
                  value={editWasher.phone}
                  onChange={(e) => setEditWasher({ ...editWasher, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Base Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editWasher.salary?.base || ''}
                  onChange={(e) => setEditWasher({ 
                    ...editWasher, 
                    salary: { 
                      ...editWasher.salary, 
                      base: parseFloat(e.target.value) || 0 
                    } 
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter base salary amount"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditWasher(null);
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && selectedWasher && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload Photos for {selectedWasher.name}
            </h3>
            <form onSubmit={handlePhotoUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <input
                  id="photoUpload"
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoModal(false);
                    setSelectedWasher(null);
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WasherPanel;


