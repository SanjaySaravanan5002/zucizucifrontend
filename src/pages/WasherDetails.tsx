import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, IndianRupee, Mail, Phone, Star, Edit, Save, X, LogIn, LogOut } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { apiService } from '../services/apiService';

interface WashHistory {
  id: string;
  customerName: string;
  customerPhone: string;
  area: string;
  carModel: string;
  washType: 'Basic' | 'Premium' | 'Deluxe';
  amount: number;
  date: string;
  status: 'completed' | 'notcompleted';
  feedback?: string;
  isPaid: boolean;
  leadType: 'One-time' | 'Monthly';
  leadSource: 'Pamphlet' | 'WhatsApp' | 'Referral' | 'Walk-in' | 'Other' | 'Social Media';
}

interface AttendanceRecord {
  date: string;
  timeIn?: string;
  timeOut?: string;
  duration?: number;
}

interface WasherDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  address?: string;
  dateOfBirth?: string;
  aadharNumber?: string;
  aadharImage?: {
    data: string;
    contentType: string;
  };
  drivingLicenseImage?: {
    data: string;
    contentType: string;
  };
  stats?: {
    totalEarnings: number;
    totalWashes: number;
    completedWashes: number;
    completionRate: number;
  };
  recentWashes?: WashHistory[];
  allWashes?: WashHistory[];
}

const WasherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAdminAccess, user } = useRoleAccess();
  const [washer, setWasher] = useState<WasherDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [personalDetails, setPersonalDetails] = useState({
    address: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    password: '',
  });
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [attendance, setAttendance] = useState<{ attendance: AttendanceRecord[], stats: any } | null>(null);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryData, setSalaryData] = useState({
    baseSalary: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  const [currentSalary, setCurrentSalary] = useState<any>(null);

  const API_BASE_URL = 'https://zuci-sbackend-12.onrender.com/api';

  const fetchAttendance = async () => {
    if (!id) return;
    
    try {
      const result = await apiService.get(`/washer/${id}/attendance`);
      if (result.success) {
        setAttendance(result.data);
      } else {
        console.error('Failed to load attendance:', result.error);
      }
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
    }
  };

  const fetchCurrentSalary = async () => {
    if (!id) return;
    
    try {
      console.log('Fetching salary for washer ID:', id);
      const result = await apiService.get(`/washer/${id}/salary`);
      console.log('Salary API response:', result);
      if (result.success) {
        console.log('Setting current salary:', result.data);
        setCurrentSalary(result.data);
      } else {
        console.log('Salary API failed:', result.error);
      }
    } catch (err: any) {
      console.error('Failed to load salary:', err);
    }
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await apiService.post(`/washer/${id}/salary`, {
        baseSalary: parseFloat(salaryData.baseSalary),
        effectiveDate: salaryData.effectiveDate
      });
      
      if (result.success) {
        toast.success('Salary updated successfully');
        setShowSalaryModal(false);
        fetchCurrentSalary();
        setSalaryData({ baseSalary: '', effectiveDate: new Date().toISOString().split('T')[0] });
      } else {
        if (result.error?.includes('Cannot POST') || result.error?.includes('Not Found') || result.status === 404) {
          toast.error('Salary feature is not yet implemented in the backend. Please contact the administrator.');
        } else {
          toast.error(result.error || 'Failed to update salary');
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404 || err.message?.includes('404')) {
        toast.error('Salary feature is not yet implemented in the backend. Please contact the administrator.');
      } else {
        toast.error('Failed to update salary');
      }
    }
  };

  const openSalaryModal = () => {
    if (currentSalary) {
      setSalaryData({
        baseSalary: currentSalary.baseSalary?.toString() || '',
        effectiveDate: currentSalary.effectiveDate ? new Date(currentSalary.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setSalaryData({
        baseSalary: '',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }
    setShowSalaryModal(true);
  };

  const markAttendance = async (type: 'in' | 'out') => {
    try {
      setIsMarkingAttendance(true);
      const result = await apiService.post('/washer/attendance', {
        washerId: id,
        type
      });
      
      if (result.success) {
        toast.success(`Time-${type} marked successfully`);
        fetchAttendance(); // Refresh attendance data
      } else {
        toast.error(result.error || `Failed to mark time-${type}`);
      }
    } catch (err: any) {
      toast.error(`Failed to mark time-${type}`);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  useEffect(() => {
    if (washer) {
      setPersonalDetails({
        address: washer.address || '',
        dateOfBirth: washer.dateOfBirth ? new Date(washer.dateOfBirth).toISOString().split('T')[0] : '',
        email: washer.email || '',
        phone: washer.phone || '',
        password: '',
      });
    }
  }, [washer]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchWasherDetails = async () => {
      try {
        setLoading(true);
        
        // Check permissions
        if (!hasAdminAccess()) {
          toast.error('Access denied. Admin privileges required.');
          navigate('/dashboard');
          return;
        }
        
        console.log('Fetching washer details for ID:', id);
        const result = await apiService.get(`/washer/${id}/wash-details`);
        console.log('Washer details API response:', result);
        
        if (!isMounted) return; // Prevent state update if component unmounted
        
        if (result.success) {
          console.log('Washer data received:', result.data);
          setWasher(result.data);
        } else {
          if (result.status === 403) {
            toast.error('Access denied. Insufficient permissions.');
          } else if (result.status === 401) {
            toast.error('Authentication required. Please login again.');
          } else {
            toast.error(result.error || 'Failed to load washer details');
          }
          navigate('/washer');
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error('Failed to load washer details');
          navigate('/washer');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchWasherDetails();
      fetchAttendance();
      fetchCurrentSalary();
    }
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!washer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Washer Not Found</h1>
          <p className="text-gray-600 mb-6">The washer you're looking for doesn't exist or may have been removed.</p>
          <button
            onClick={() => navigate('/washer')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Washer List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/washer')}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{washer.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    washer.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {washer.status}
                  </span>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {washer.email}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {washer.phone}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        {washer.stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-500">Total Earnings</h3>
                <div className="p-2 rounded-lg bg-blue-50">
                  <IndianRupee className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline">
                <IndianRupee className="h-5 w-5 mr-1 text-gray-900" />
                <p className="text-2xl font-semibold text-gray-900">
                  {washer.stats.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-500">Total Washes</h3>
                <div className="p-2 rounded-lg bg-purple-50">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold text-gray-900">
                {washer.stats.totalWashes.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-500">Completed Washes</h3>
                <div className="p-2 rounded-lg bg-green-50">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold text-gray-900">
                {washer.stats.completedWashes.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-500">Completion Rate</h3>
                <div className="p-2 rounded-lg bg-yellow-50">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold text-gray-900">
                {washer.stats.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Personal Details Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                isEditing 
                  ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
                  : 'border-transparent bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors`}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </>
              )}
            </button>
          </div>

          <div className="p-6">
            {isEditing ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const formData = new FormData();
                    formData.append('address', personalDetails.address);
                    formData.append('dateOfBirth', personalDetails.dateOfBirth);
                    formData.append('email', personalDetails.email);
                    formData.append('phone', personalDetails.phone);
                    // Only send password if it's been changed
                    if (personalDetails.password) {
                      formData.append('password', personalDetails.password);
                    } else {
                      // Send a flag to indicate password should not be updated
                      formData.append('keepExistingPassword', 'true');
                    }
                    if (aadharFile) {
                      formData.append('aadharImage', aadharFile);
                    }
                    if (drivingLicenseFile) {
                      formData.append('drivingLicenseImage', drivingLicenseFile);
                    }
                    if (profilePhotoFile) {
                      formData.append('profilePhoto', profilePhotoFile);
                    }

                    const response = await axios.put(
                      `${API_BASE_URL}/washer/${id}/personal-details`,
                      formData,
                      {
                        headers: {
                          'Content-Type': 'multipart/form-data',
                        },
                      }
                    );

                    setWasher(response.data);
                    setIsEditing(false);
                    toast.success('Personal details updated successfully');
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to update personal details');
                  }
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={personalDetails.address}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={personalDetails.dateOfBirth}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={personalDetails.email}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={personalDetails.phone}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Change Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={personalDetails.password}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, password: e.target.value })}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Salary Information
                      </label>
                      <button
                        type="button"
                        onClick={openSalaryModal}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {currentSalary ? 'Update Salary' : 'Set Salary'}
                      </button>
                    </div>
                    {currentSalary ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Base Salary:</span>
                            <p className="text-gray-900 flex items-center mt-1">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {currentSalary.baseSalary?.toLocaleString('en-IN') || 'Not set'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Effective Date:</span>
                            <p className="text-gray-900 mt-1">
                              {currentSalary.effectiveDate ? new Date(currentSalary.effectiveDate).toLocaleDateString('en-IN') : 'Not set'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">No salary information set. Click "Set Salary" to configure.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Photo
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="file"
                        id="profilePhoto"
                        accept="image/*"
                        onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="aadharImage" className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhar Card Image
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="file"
                        id="aadharImage"
                        accept="image/*"
                        onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="drivingLicenseImage" className="block text-sm font-medium text-gray-700 mb-1">
                      Driving License Image
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="file"
                        id="drivingLicenseImage"
                        accept="image/*"
                        onChange={(e) => setDrivingLicenseFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {washer.address || <span className="text-gray-400">Not provided</span>}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      {washer.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      {washer.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-900">
                      <span className="text-gray-500">Password: </span>
                      <span className="ml-2">••••••••</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {washer.dateOfBirth 
                      ? new Date(washer.dateOfBirth).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : <span className="text-gray-400">Not provided</span>}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500">Salary Information</h3>
                    <button
                      onClick={openSalaryModal}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {currentSalary ? 'Update Salary' : 'Set Salary'}
                    </button>
                  </div>
                  {currentSalary ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Base Salary:</span>
                          <p className="text-gray-900 flex items-center mt-1">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {currentSalary.baseSalary?.toLocaleString('en-IN') || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Effective Date:</span>
                          <p className="text-gray-900 mt-1">
                            {currentSalary.effectiveDate ? new Date(currentSalary.effectiveDate).toLocaleDateString('en-IN') : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">No salary information set. Click "Set Salary" to configure.</p>
                    </div>
                  )}
                </div>

                {(washer.aadharImage || washer.drivingLicenseImage) && (
                  <div className="sm:col-span-2 pt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {washer.aadharImage && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b">
                            <h4 className="text-sm font-medium text-gray-700">Aadhar Card</h4>
                          </div>
                          <img
                            src={`data:${washer.aadharImage.contentType};base64,${washer.aadharImage.data}`}
                            alt="Aadhar Card"
                            className="w-full h-auto object-contain"
                          />
                        </div>
                      )}

                      {washer.drivingLicenseImage && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b">
                            <h4 className="text-sm font-medium text-gray-700">Driving License</h4>
                          </div>
                          <img
                            src={`data:${washer.drivingLicenseImage.contentType};base64,${washer.drivingLicenseImage.data}`}
                            alt="Driving License"
                            className="w-full h-auto object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Attendance Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
              {attendance?.stats && (
                <p className="mt-1 text-sm text-gray-500">
                  Present: {attendance.stats.presentDays} days | Total Hours: {attendance.stats.totalHours.toFixed(1)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => markAttendance('in')}
                disabled={isMarkingAttendance}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Time In
              </button>
              <button
                onClick={() => markAttendance('out')}
                disabled={isMarkingAttendance}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Time Out
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance?.attendance.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.timeIn ? new Date(record.timeIn).toLocaleTimeString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.timeOut ? new Date(record.timeOut).toLocaleTimeString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.duration ? `${record.duration.toFixed(1)} hrs` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.timeIn && record.timeOut
                          ? 'bg-green-100 text-green-800'
                          : record.timeIn
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.timeIn && record.timeOut
                          ? 'Complete'
                          : record.timeIn
                          ? 'Incomplete'
                          : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Washes Section */}
        {washer.recentWashes && washer.recentWashes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Washes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wash Info</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {washer.recentWashes.map((wash) => (
                    <tr key={wash.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900">{wash.customerName}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-3.5 w-3.5 mr-1.5" />
                            {wash.customerPhone}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            {wash.area}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{wash.carModel}</div>
                        <div className="text-xs text-gray-500 mt-1">{wash.leadType} Customer</div>
                        <div className="text-xs text-gray-500 mt-1">Source: {wash.leadSource}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{wash.washType}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {new Date(wash.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          wash.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {wash.status === 'completed' ? 'Completed' : 'Not Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          <span>{wash.amount.toFixed(2)}</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          wash.isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {wash.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {wash.feedback || <span className="text-gray-400">No feedback</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Set Salary Information</h3>
                <button
                  onClick={() => setShowSalaryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div>
                  <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700 mb-1">
                    Base Salary (Monthly)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      id="baseSalary"
                      required
                      min="0"
                      step="0.01"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={salaryData.baseSalary}
                      onChange={(e) => setSalaryData({ ...salaryData, baseSalary: e.target.value })}
                      placeholder="Enter base salary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    id="effectiveDate"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={salaryData.effectiveDate}
                    onChange={(e) => setSalaryData({ ...salaryData, effectiveDate: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSalaryModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Salary
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasherDetails;


