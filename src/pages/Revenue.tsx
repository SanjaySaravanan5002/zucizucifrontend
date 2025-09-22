import { useState, useEffect, useMemo } from 'react';
import api from '../services/apiService';
import { BarChart2, Download, Filter, ListFilter, RefreshCcw, Search, CreditCard, DollarSign, Calendar, Users, Droplets, ArrowUp, ArrowDown, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { createStyledWorkbook } from '../utils/excelStyles';

interface RevenueStats {
  totalRevenue: number;
  netRevenue: number;
  totalExpenses: number;
  totalWashes: number;
  totalCustomers: number;
  revenueByWashType: Record<string, number>;
  washesByType: Record<string, number>;
  revenueByCustomerType: Record<string, number>;
  customersByType: Record<string, number>;
  recentTransactions: Transaction[];
  paymentSummary: {
    total: number;
    paid: number;
    unpaid: number;
  };
  expenses: any[];
}

type SortField = 'customerName' | 'area' | 'washType' | 'washerName' | 'date' | 'amount' | 'isPaid';
type SortDirection = 'asc' | 'desc';

interface Transaction {
  transactionId: string;
  customerId: string;
  customerName: string;
  area: string;
  washType: string;
  amount: number;
  date: string;
  washerName: string;
  customerType: string;
  isPaid: boolean;
}

interface Filters {
  startDate: string;
  endDate: string;
  washType: string;
  area: string;
  customerType: string;
}

const Revenue = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Redirect limited admins away from revenue page (admins can access for expense integration)
  if (user?.role === 'limited_admin') {
    return <Navigate to="/" replace />;
  }
  // Initialize date filters with current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState<Filters>({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth,
    washType: '',
    area: '',
    customerType: ''
  });
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'summary' | 'transactions'>('summary');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const washTypes = ['Premium', 'Deluxe', 'Standard'];
  const customerTypes = ['Monthly', 'One-time'];
  
  // Memoize filtered and sorted transactions to avoid recalculation on every render
  const filteredTransactions = useMemo(() => {
    if (!stats?.recentTransactions) return [];
    
    return [...stats.recentTransactions]
      .filter(transaction => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.customerName.toLowerCase().includes(searchLower) ||
          transaction.area.toLowerCase().includes(searchLower) ||
          transaction.washType.toLowerCase().includes(searchLower) ||
          (transaction.washerName && transaction.washerName.toLowerCase().includes(searchLower)) ||
          transaction.customerType.toLowerCase().includes(searchLower) ||
          formatCurrency(transaction.amount).includes(searchLower) ||
          (transaction.isPaid ? 'paid' : 'unpaid').includes(searchLower) ||
          new Date(transaction.date).toLocaleDateString().toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // Handle sorting based on the selected field and direction
        if (sortField === 'date') {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (sortField === 'amount') {
          return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        } else if (sortField === 'isPaid') {
          return sortDirection === 'asc' 
            ? (a.isPaid === b.isPaid ? 0 : a.isPaid ? 1 : -1)
            : (a.isPaid === b.isPaid ? 0 : a.isPaid ? -1 : 1);
        } else {
          // For string fields like customerName, area, washType, washerName
          const valueA = a[sortField] || '';
          const valueB = b[sortField] || '';
          return sortDirection === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
      });
  }, [stats, searchTerm, sortField, sortDirection]);

  const totalPages = useMemo(() => Math.ceil(filteredTransactions.length / transactionsPerPage), [filteredTransactions.length, transactionsPerPage]);

  useEffect(() => {
    fetchStatsWithFilters(filters);
  }, []); // Only fetch on component mount
  
  // Add a useEffect to update filters when date inputs change
  useEffect(() => {
    // Clear any previous errors when filters change
    if (error && error.includes('date')) {
      setError(null);
    }
  }, [filters.startDate, filters.endDate]);

  const fetchStatsWithFilters = async (filtersToUse: Filters) => {
    try {
      setLoading(true);
      setCurrentPage(1); // Reset to first page when fetching new data
      
      // Create params object with only non-empty values
      const params: Record<string, string> = {};
      
      // Add date parameters if they exist (keep original format)
      if (filtersToUse.startDate) params.startDate = filtersToUse.startDate;
      if (filtersToUse.endDate) params.endDate = filtersToUse.endDate;
      
      // Add other filter parameters only if they have values
      if (filtersToUse.washType) params.washType = filtersToUse.washType;
      if (filtersToUse.area) params.area = filtersToUse.area;
      if (filtersToUse.customerType) params.customerType = filtersToUse.customerType;

      console.log('Fetching with params:', params);
      const token = localStorage.getItem('auth_token');
      
      const response = await api.get('/reports/revenue_and_income', { 
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Revenue API Response:', response.data);
      setStats(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching revenue stats:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Insufficient permissions.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to fetch revenue data. Please check your connection and try again.');
      }
      setStats(null);
    } finally {
      setLoading(false);
    }
  };



  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Validate dates if both are present
    if (key === 'startDate' || key === 'endDate') {
      if (newFilters.startDate && newFilters.endDate) {
        const start = new Date(newFilters.startDate);
        const end = new Date(newFilters.endDate);
        if (start > end) {
          setError('Start date cannot be after end date');
          return;
        }
      }
    }
    
    // Clear any previous errors
    if (error) setError(null);
    
    // Update filters and fetch immediately
    setFilters(newFilters);
    
    // Call fetchStats with new filters directly
    fetchStatsWithFilters(newFilters);
  };
  
  // Date format conversion helper - removing unused function to fix lint warning
  // const formatDateForInput = (date: Date): string => {
  //   return date.toISOString().split('T')[0];
  // };
  
  const handleSort = (field: SortField) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as the sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleExport = () => {
    if (!stats) return;

    const timestamp = filters.startDate || 'all-time';

    if (view === 'summary') {
      generateRevenueSummaryExcel(stats, timestamp);
    } else {
      generateTransactionsExcel(stats, timestamp);
    }
  };

  const generateRevenueSummaryExcel = (data: RevenueStats, timestamp: string) => {
    const title = `Revenue Summary Report - ${timestamp}`;
    const headers = ['Metric', 'Value', 'Details'];
    
    const summaryData = [
      ['Gross Revenue', data.totalRevenue, `From ${data.totalCustomers} customers`],
      ['Net Revenue', data.netRevenue, `After expenses: ${formatCurrency(data.totalExpenses || 0)}`],
      ['Total Washes', data.totalWashes, 'Completed washes'],
      ['Avg Revenue/Customer', data.totalCustomers ? data.totalRevenue / data.totalCustomers : 0, 'Per customer average'],
      ['Avg Revenue/Wash', data.totalWashes ? data.totalRevenue / data.totalWashes : 0, 'Per wash average']
    ];
    
    const analyticsData = [
      { label: 'Payment Success Rate', value: data.paymentSummary?.total ? `${Math.round((data.paymentSummary.paid / data.paymentSummary.total) * 100)}%` : '0%' },
      { label: 'Outstanding Amount', value: data.paymentSummary?.unpaid || 0 },
      { label: 'Profit Margin', value: data.totalRevenue ? `${Math.round((data.netRevenue / data.totalRevenue) * 100)}%` : '0%' },
      { label: 'Total Revenue', value: data.paymentSummary?.total || 0 },
      { label: 'Paid Amount', value: data.paymentSummary?.paid || 0 },
      { label: 'Unpaid Amount', value: data.paymentSummary?.unpaid || 0 }
    ];
    
    const { wb, ws } = createStyledWorkbook(title, headers, summaryData, analyticsData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Revenue Summary');
    XLSX.writeFile(wb, `Revenue-Summary-${timestamp}.xlsx`);
  };

  const generateTransactionsExcel = (data: RevenueStats, timestamp: string) => {
    const title = `Transaction Report - ${timestamp}`;
    const headers = ['Customer Name', 'Customer Type', 'Area', 'Wash Type', 'Washer', 'Date', 'Amount', 'Payment Status'];
    
    const transactionData = data.recentTransactions.map(transaction => [
      transaction.customerName,
      transaction.customerType,
      transaction.area,
      transaction.washType,
      transaction.washerName || 'N/A',
      new Date(transaction.date).toLocaleDateString('en-GB'),
      transaction.amount,
      transaction.isPaid ? 'Paid' : 'Unpaid'
    ]);
    
    const analyticsData = [
      { label: 'Total Transactions', value: data.recentTransactions.length },
      { label: 'Total Amount', value: data.recentTransactions.reduce((sum, t) => sum + t.amount, 0) },
      { label: 'Paid Transactions', value: data.recentTransactions.filter(t => t.isPaid).length },
      { label: 'Unpaid Transactions', value: data.recentTransactions.filter(t => !t.isPaid).length },
      { label: 'Payment Success Rate', value: data.recentTransactions.length ? `${Math.round((data.recentTransactions.filter(t => t.isPaid).length / data.recentTransactions.length) * 100)}%` : '0%' },
      { label: 'Average Transaction Value', value: data.recentTransactions.length ? Math.round(data.recentTransactions.reduce((sum, t) => sum + t.amount, 0) / data.recentTransactions.length) : 0 }
    ];
    
    const { wb, ws } = createStyledWorkbook(title, headers, transactionData, analyticsData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `Transactions-${timestamp}.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow space-y-3">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Income & Revenue</h1>
          {user?.role === 'admin' && (
            <p className="text-sm text-gray-600 mt-1">
              Revenue calculations include expenses managed in Expenses tab
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <div className="flex bg-gray-100 rounded-md p-1 mr-4">
            <button
              onClick={() => setView('summary')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${view === 'summary' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Summary</span>
            </button>
            <button
              onClick={() => setView('transactions')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${view === 'transactions' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              <ListFilter className="h-4 w-4" />
              <span>Transactions</span>
            </button>
          </div>
          <button
            onClick={handleExport}
            disabled={!stats}
            className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Export {view === 'transactions' ? 'Transactions' : 'Summary'}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap items-end gap-5">
          {/* Date Range */}
          <div className="flex-1 min-w-[320px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 hover:border-blue-400 transition-colors">
                  <Calendar className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full focus:outline-none text-sm"
                  />
                </div>
              </div>
              <span className="text-gray-500 font-medium px-1">to</span>
              <div className="flex-1">
                <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 hover:border-blue-400 transition-colors">
                  <Calendar className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                  <input
                    type="date"
                    value={filters.endDate}
                    min={filters.startDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Wash Type */}
          <div className="w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Wash Type</label>
            <div className="relative">
              <select
                value={filters.washType}
                onChange={e => handleFilterChange('washType', e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors"
              >
                <option value="">All Types</option>
                {washTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Customer Type */}
          <div className="w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
            <div className="relative">
              <select
                value={filters.customerType}
                onChange={e => handleFilterChange('customerType', e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors"
              >
                <option value="">All Types</option>
                {customerTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => {
              // Reset filters to default values
              const resetFilters = {
                startDate: firstDayOfMonth,
                endDate: lastDayOfMonth,
                washType: '',
                area: '',
                customerType: ''
              };
              setFilters(resetFilters);
              // Clear any errors
              setError(null);
              // Fetch with reset filters
              fetchStatsWithFilters(resetFilters);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      {stats && view === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-500 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-medium text-blue-800">Gross Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <div className="flex items-center mt-3">
              <Users className="h-4 w-4 text-blue-600 mr-1" />
              <p className="text-sm text-blue-700">
                From {stats.totalCustomers} customers
              </p>
            </div>
          </div>

          <div className={`bg-gradient-to-br p-6 rounded-xl shadow-sm border ${
            stats.netRevenue >= 0 
              ? 'from-green-50 to-green-100 border-green-200' 
              : 'from-red-50 to-red-100 border-red-200'
          }`}>
            <div className="flex items-center mb-3">
              <div className={`p-2 rounded-lg mr-3 ${
                stats.netRevenue >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h3 className={`text-sm font-medium ${
                stats.netRevenue >= 0 ? 'text-green-800' : 'text-red-800'
              }`}>Net Revenue</h3>
            </div>
            <p className={`text-3xl font-bold ${
              stats.netRevenue >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              {formatCurrency(stats.netRevenue)}
            </p>
            <div className="flex items-center mt-3">
              <DollarSign className={`h-4 w-4 mr-1 ${
                stats.netRevenue >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
              <p className={`text-sm ${
                stats.netRevenue >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                After expenses: {formatCurrency(stats.totalExpenses || 0)}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-500 rounded-lg mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-medium text-purple-800">Avg Revenue/Customer</h3>
            </div>
            <p className="text-3xl font-bold text-purple-900">
              {formatCurrency(stats.totalCustomers ? stats.totalRevenue / stats.totalCustomers : 0)}
            </p>
            <div className="flex items-center mt-3">
              <DollarSign className="h-4 w-4 text-purple-600 mr-1" />
              <p className="text-sm text-purple-700">
                Per customer average
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-500 rounded-lg mr-3">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-medium text-green-800">Total Washes</h3>
            </div>
            <p className="text-3xl font-bold text-green-900">
              {stats.totalWashes}
            </p>
            <div className="flex items-center mt-3">
              <Calendar className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-sm text-green-700">
                Completed washes
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-sm border border-amber-200">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-amber-500 rounded-lg mr-3">
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-medium text-amber-800">Average Revenue/Wash</h3>
            </div>
            <p className="text-3xl font-bold text-amber-900">
              {formatCurrency(stats.totalWashes ? stats.totalRevenue / stats.totalWashes : 0)}
            </p>
            <div className="flex items-center mt-3">
              <DollarSign className="h-4 w-4 text-amber-600 mr-1" />
              <p className="text-sm text-amber-700">
                Per wash average
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Summary */}
      {stats && view === 'summary' && stats.paymentSummary && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Payment Status</h3>
          </div>
          
          <div className="relative pt-4">
            {/* Progress bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${stats.paymentSummary.total ? Math.round((stats.paymentSummary.paid / stats.paymentSummary.total) * 100) : 100}%` }}
              ></div>
            </div>
            
            {/* Percentage label */}
            <div className="absolute top-0 right-0 text-sm font-medium text-green-600">
              {stats.paymentSummary.total ? 
                Math.round((stats.paymentSummary.paid / stats.paymentSummary.total) * 100) : 100}% Paid
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-indigo-600 mr-2" />
                  <p className="text-sm font-medium text-indigo-900">Total Revenue</p>
                </div>
                <span className="text-xs px-2 py-1 bg-indigo-200 text-indigo-800 rounded-full">100%</span>
              </div>
              <p className="text-2xl font-bold text-indigo-900 mt-2">{formatCurrency(stats.paymentSummary.total)}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm font-medium text-green-900">Paid Amount</p>
                </div>
                <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full">
                  {stats.paymentSummary.total ? 
                    Math.round((stats.paymentSummary.paid / stats.paymentSummary.total) * 100) : 0}%
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">{formatCurrency(stats.paymentSummary.paid)}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm font-medium text-red-900">Unpaid Amount</p>
                </div>
                <span className="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-full">
                  {stats.paymentSummary.total ? 
                    Math.round((stats.paymentSummary.unpaid / stats.paymentSummary.total) * 100) : 0}%
                </span>
              </div>
              <p className="text-2xl font-bold text-red-900 mt-2">{formatCurrency(stats.paymentSummary.unpaid)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Breakdown */}
      {stats && view === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Revenue by Wash Type</h3>
            </div>
            
            <div className="space-y-6">
              {Object.entries(stats.revenueByWashType || {}).map(([type, revenue]: [string, any]) => {
                const percentage = Math.round((Number(revenue) / stats.totalRevenue) * 100);
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{type}</p>
                        <p className="text-sm text-gray-500">{stats.washesByType[type] || 0} washes</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(revenue as number)}</p>
                        <p className="text-xs text-gray-500">{percentage}% of total</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${type === 'Premium' ? 'bg-purple-500' : type === 'Deluxe' ? 'bg-blue-500' : 'bg-green-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Revenue by Customer Type</h3>
            </div>
            
            <div className="space-y-6">
              {Object.entries(stats.revenueByCustomerType || {}).map(([type, revenue]: [string, any]) => {
                const percentage = Math.round((Number(revenue) / stats.totalRevenue) * 100);
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{type}</p>
                        <p className="text-sm text-gray-500">
                          {stats.customersByType[type] || 0} customers
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(revenue as number)}</p>
                        <p className="text-xs text-gray-500">{percentage}% of total</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${type === 'Monthly' ? 'bg-indigo-500' : 'bg-amber-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Transactions */}
      {stats && view === 'transactions' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                  <ListFilter className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              </div>
              <div className="text-sm font-medium px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                {filteredTransactions.length === stats.recentTransactions.length ? 
                  `Total: ${stats.recentTransactions.length} transactions` : 
                  `Showing ${filteredTransactions.length} of ${stats.recentTransactions.length} transactions`
                }
              </div>
            </div>
            
            {/* Search bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions by customer, area, wash type or washer..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('customerName')}
                  >
                    <div className="flex items-center">
                      <span>Customer</span>
                      {sortField === 'customerName' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <ArrowUp className="h-3 w-3 text-gray-500" /> : 
                            <ArrowDown className="h-3 w-3 text-gray-500" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('area')}
                  >
                    <div className="flex items-center">
                      <span>Area</span>
                      {sortField === 'area' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <ArrowUp className="h-3 w-3 text-gray-500" /> : 
                            <ArrowDown className="h-3 w-3 text-gray-500" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('washType')}
                  >
                    <div className="flex items-center">
                      <span>Wash Type</span>
                      {sortField === 'washType' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <ArrowUp className="h-3 w-3 text-gray-500" /> : 
                            <ArrowDown className="h-3 w-3 text-gray-500" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('washerName')}
                  >
                    <div className="flex items-center">
                      <span>Washer</span>
                      {sortField === 'washerName' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <ArrowUp className="h-3 w-3 text-gray-500" /> : 
                            <ArrowDown className="h-3 w-3 text-gray-500" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      <span>Date</span>
                      {sortField === 'date' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <ArrowUp className="h-3 w-3 text-gray-500" /> : 
                            <ArrowDown className="h-3 w-3 text-gray-500" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      <span>Amount</span>
                      {sortField === 'amount' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <ArrowUp className="h-3 w-3 text-gray-500" /> : 
                            <ArrowDown className="h-3 w-3 text-gray-500" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('isPaid')}
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      {sortField === 'isPaid' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? 
                            <ArrowUp className="h-3 w-3 text-gray-500" /> : 
                            <ArrowDown className="h-3 w-3 text-gray-500" />}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length > 0 ? (
                  // Use the memoized filtered and sorted transactions for pagination
                  filteredTransactions
                    .slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage)
                    .map((transaction) => (
                      <tr key={transaction.transactionId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-indigo-800">
                                {transaction.customerName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{transaction.customerName}</div>
                              <div className="text-xs text-gray-500">{transaction.customerType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.area}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full
                            ${transaction.washType === 'Premium' ? 'bg-purple-100 text-purple-800' : 
                              transaction.washType === 'Deluxe' ? 'bg-blue-100 text-blue-800' : 
                              'bg-green-100 text-green-800'}`}>
                            {transaction.washType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.washerName || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            <div className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {transaction.isPaid ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-sm text-green-600 font-medium">Paid</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-sm text-red-600 font-medium">Unpaid</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <Search className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500 font-medium">No transactions found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredTransactions.length > transactionsPerPage && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 px-4 gap-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * transactionsPerPage) + 1}</span> to <span className="font-medium">
                  {Math.min(currentPage * transactionsPerPage, filteredTransactions.length)}
                </span> of <span className="font-medium">{filteredTransactions.length}</span> transactions
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center px-3 py-2 rounded-md border transition-colors ${currentPage === 1 ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'}`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span>Previous</span>
                </button>
                
                {/* Page indicators */}
                <div className="hidden md:flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-3 py-2 rounded-md border transition-colors ${currentPage === totalPages ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'}`}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Revenue;

