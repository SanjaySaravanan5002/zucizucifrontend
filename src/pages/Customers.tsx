import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, Search, Phone, Car, MapPin, 
  User, ArrowUpDown 
} from 'lucide-react';
import TypeBadge from '../components/common/TypeBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Card from '../components/ui/Card';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Customer {
  id: number;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  leadType: string;
  leadSource: string;
  assignedWasher?: { _id: string; name: string };
  createdAt: string;
  status: string;
  notes: string;
  washHistory: Array<{
    washType: string;
    washer: { _id: string; name: string };
    amount: number;
    date: string;
    feedback?: string;
    washStatus: string;
    washServiceType?: string;
  }>;
  monthlySubscription?: {
    packageType: string;
    scheduledWashes: Array<{
      scheduledDate: string;
      status: string;
      completedDate?: string;
      washServiceType?: string;
    }>;
  };
}

const API_BASE_URL = 'https://zuci-backend-my3h.onrender.com/api';

// API functions
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const api = {
  getCustomers: async (filters: any) => {
    const response = await axios.get(`${API_BASE_URL}/leads`, { 
      params: { ...filters, status: 'Converted' },
      ...getAuthHeaders()
    });
    return response.data;
  },
  updateCustomer: async (id: number | string, updates: any) => {
    const response = await axios.put(`${API_BASE_URL}/leads/${id}`, updates, getAuthHeaders());
    return response.data;
  },
  deleteCustomer: async (id: number | string) => {
    const response = await axios.delete(`${API_BASE_URL}/leads/${id}`, getAuthHeaders());
    return response.data;
  },
  getCustomerStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/customer-stats`, getAuthHeaders());
    return response.data;
  }
};

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    leadType: '',
    leadSource: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        toast.error('Please login to access customers');
        return;
      }
      
      const [customersData, statsData] = await Promise.all([
        api.getCustomers({ ...filters, searchQuery: searchQuery, page }).catch(err => {
          console.warn('Failed to fetch customers:', err);
          return { customers: [], total: 0 };
        }),
        api.getCustomerStats().catch(err => {
          console.warn('Failed to fetch stats:', err);
          return { totalCustomers: 0, totalWashes: 0, activeAreas: 0, monthlyCustomers: 0, monthlyPercentage: '0.0' };
        })
      ]);
      
      setCustomers(Array.isArray(customersData.customers) ? customersData.customers : Array.isArray(customersData) ? customersData : []);
      setTotalPages(Math.ceil((customersData.total || customersData.length || 0) / 10));
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
      } else {
        toast.error('Failed to fetch customers');
      }
      setCustomers([]);
      setStats({ totalCustomers: 0, totalWashes: 0, activeAreas: 0, monthlyCustomers: 0, monthlyPercentage: '0.0' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (id: number, updates: any) => {
    try {
      await api.updateCustomer(id, updates);
      toast.success('Customer updated successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.deleteCustomer(id);
      toast.success('Customer deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete customer');
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, searchQuery, page]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [name]: value }
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      leadType: '',
      leadSource: '',
      dateRange: {
        start: '',
        end: ''
      }
    });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" variant="wash" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Wash Statistics</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalWashes || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Total washes completed
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Area Coverage</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.activeAreas || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Areas with active customers
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Customers</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.monthlyCustomers || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.monthlyPercentage || '0.0'}% of total
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          {stats && (
            <p className="mt-1 text-sm text-gray-500">
              {stats.totalCustomers || customers.length} total customers
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light"
          >
            <Filter className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            Filters
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead Type</label>
            <select
              name="leadType"
              value={filters.leadType}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md"
            >
              <option value="">All Types</option>
              <option value="Monthly">Monthly</option>
              <option value="OneTime">One Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
            <select
              name="leadSource"
              value={filters.leadSource}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md"
            >
              <option value="">All Sources</option>
              <option value="Referral">Referral</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="start"
              value={filters.dateRange.start}
              onChange={handleDateFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="end"
              value={filters.dateRange.end}
              onChange={handleDateFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md"
            />
          </div>
          <div className="col-span-full flex justify-end">
            <button
              onClick={handleResetFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer">
                    Customer
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Car Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Wash
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-4 w-4 mr-1 text-gray-400" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {customer.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Car className="h-4 w-4 mr-1 text-gray-400" />
                        {customer.carModel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TypeBadge type={customer.leadType} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.leadSource}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        // For monthly customers, check both wash history and monthly subscription
                        if (customer.leadType === 'Monthly' && customer.monthlySubscription) {
                          const completedWashes = customer.monthlySubscription.scheduledWashes
                            .filter(w => w.status === 'completed' && w.completedDate)
                            .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime());
                          
                          if (completedWashes.length > 0) {
                            const lastWash = completedWashes[0];
                            return (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {new Date(lastWash.completedDate!).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customer.monthlySubscription.packageType} - {lastWash.washServiceType || 'Exterior'}
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        // Fallback to wash history
                        if (customer.washHistory && customer.washHistory.length > 0) {
                          const completedWashes = customer.washHistory
                            .filter(w => w.washStatus === 'completed')
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                          
                          if (completedWashes.length > 0) {
                            const lastWash = completedWashes[0];
                            return (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {new Date(lastWash.date).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {lastWash.washType} - {lastWash.washServiceType || 'Exterior'}
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        return <span className="text-sm text-gray-500">No washes yet</span>;
                      })()} 
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TypeBadge type={customer.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button
                        onClick={() => navigate(`/user/${customer.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {/* <button
                        onClick={() => handleUpdateCustomer(customer.id, { status: 'Active' })}
                        className="text-green-600 hover:text-green-900"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button> */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * 10, customers.length)}</span> of{' '}
                <span className="font-medium">{customers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === i + 1
                        ? 'z-10 bg-primary-light border-primary text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
