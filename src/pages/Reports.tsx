import React, { useState, useEffect } from 'react';
import api from '../services/apiService';
import { Download, Filter, Users, DollarSign, BarChart3, FileText, RefreshCw, Calendar, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DateRange {
  startDate: string;
  endDate: string;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  // Initialize with empty dates to show all-time data by default
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'revenue' | 'customers' | 'washers' | 'transactions'>(
    user?.role === 'limited_admin' || user?.role === 'admin' ? 'customers' : 'revenue'
  );
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState({
    washType: '',
    area: '',
    customerType: ''
  });

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const fetchReport = async (type: 'revenue' | 'customers' | 'washers' | 'transactions') => {
    try {
      setLoading(true);
      
      const params = {
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
        ...filters
      };

      let endpoint = '';
      switch (type) {
        case 'revenue':
        case 'transactions':
          endpoint = 'revenue_and_income';
          break;
        case 'customers':
          endpoint = 'customers';
          break;
        case 'washers':
          endpoint = 'washers';
          break;
      }

      const response = await api.get(`/reports/${endpoint}`, { params });
      setReportData(response.data);
    } catch (error) {
      console.error(`Error fetching ${type} report:`, error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    let csvContent = '';
    const timestamp = new Date().toISOString().split('T')[0];

    switch (activeTab) {
      case 'revenue':
        csvContent = generateRevenueCSV(reportData);
        break;
      case 'customers':
        csvContent = generateCustomerCSV(reportData);
        break;
      case 'washers':
        csvContent = generateWasherCSV(reportData);
        break;
      case 'transactions':
        csvContent = generateTransactionCSV(reportData);
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-report-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business reports and insights</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchReport(activeTab)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {reportData && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              min={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wash Type</label>
            <select
              value={filters.washType}
              onChange={(e) => setFilters(prev => ({ ...prev, washType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="Deluxe">Deluxe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
            <select
              value={filters.customerType}
              onChange={(e) => setFilters(prev => ({ ...prev, customerType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Monthly">Monthly</option>
              <option value="One-time">One-time</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => fetchReport(activeTab)}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              ...(user?.role === 'superadmin' ? [{ id: 'revenue', name: 'Revenue', icon: DollarSign }] : []),
              { id: 'customers', name: 'Customers', icon: Users },
              { id: 'washers', name: 'Washers', icon: BarChart3 },
              ...(user?.role === 'superadmin' ? [{ id: 'transactions', name: 'Transactions', icon: FileText }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reportData ? (
            <div>
              {activeTab === 'revenue' && user?.role === 'superadmin' && <RevenueReportView data={reportData} />}
              {activeTab === 'customers' && <CustomerReportView data={reportData} />}
              {activeTab === 'washers' && <WasherReportView data={reportData} />}
              {activeTab === 'transactions' && user?.role === 'superadmin' && <TransactionReportView data={reportData} />}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No data available for the selected filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RevenueReportView: React.FC<{ data: any }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.totalRevenue || 0)}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Total Washes</h3>
          <p className="text-2xl font-bold text-green-900">{data.totalWashes || 0}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Total Customers</h3>
          <p className="text-2xl font-bold text-purple-900">{data.totalCustomers || 0}</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="text-sm font-medium text-orange-600">Avg per Wash</h3>
          <p className="text-2xl font-bold text-orange-900">
            {formatCurrency(data.totalWashes ? data.totalRevenue / data.totalWashes : 0)}
          </p>
        </div>
      </div>

      {/* Payment Summary */}
      {data.paymentSummary && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Payment Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold">{formatCurrency(data.paymentSummary.total)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Paid</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(data.paymentSummary.paid)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-red-600">Unpaid</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(data.paymentSummary.unpaid)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerReportView: React.FC<{ data: any }> = ({ data }) => {
  if (!data || !Array.isArray(data)) {
    return <div className="text-center py-8">No customer data available</div>;
  }

  return (
    <div className="space-y-6">
      {data.map((group: any) => (
        <div key={group._id} className="space-y-4">
          <h3 className="text-lg font-medium">{group._id} Customers ({group.count})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Washes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {group.customers?.map((customer: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.area}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.totalWashes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

const WasherReportView: React.FC<{ data: any }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!data || !Array.isArray(data)) {
    return <div className="text-center py-8">No washer data available</div>;
  }

  return (
    <div className="space-y-6">
      {data.map((washer: any) => (
        <div key={washer._id} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{washer.washerName || 'Unknown Washer'}</h3>
            <div className="text-sm text-gray-500">{washer.washerPhone}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-600">Total Washes</h4>
              <p className="text-2xl font-bold text-purple-900">{washer.totalWashes}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-600">Total Revenue</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(washer.totalRevenue)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-600">Average per Wash</h4>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(washer.totalWashes ? washer.totalRevenue / washer.totalWashes : 0)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const TransactionReportView: React.FC<{ data: any }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!data?.recentTransactions || !Array.isArray(data.recentTransactions)) {
    return <div className="text-center py-8">No transaction data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wash Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Washer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.recentTransactions.map((transaction: any, idx: number) => (
            <tr key={idx}>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(transaction.date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{transaction.customerName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{transaction.area}</td>
              <td className="px-6 py-4 whitespace-nowrap">{transaction.washType}</td>
              <td className="px-6 py-4 whitespace-nowrap">{transaction.washerName || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(transaction.amount)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  transaction.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const generateRevenueCSV = (data: any): string => {
  const rows = [
    ['Total Revenue', data.totalRevenue?.toString() || '0'],
    ['Total Washes', data.totalWashes?.toString() || '0'],
    ['Total Customers', data.totalCustomers?.toString() || '0'],
    [],
    ['Payment Status', 'Amount'],
    ['Total', data.paymentSummary?.total?.toString() || '0'],
    ['Paid', data.paymentSummary?.paid?.toString() || '0'],
    ['Unpaid', data.paymentSummary?.unpaid?.toString() || '0']
  ];
  return rows.map(row => row.join(',')).join('\n');
};

const generateCustomerCSV = (data: any[]): string => {
  const rows = [
    ['Customer Type', 'Name', 'Area', 'Phone', 'Total Washes']
  ];
  
  data?.forEach(group => {
    group.customers?.forEach((customer: any) => {
      rows.push([
        group._id,
        customer.name,
        customer.area,
        customer.phone,
        customer.totalWashes?.toString() || '0'
      ]);
    });
  });

  return rows.map(row => row.join(',')).join('\n');
};

const generateWasherCSV = (data: any[]): string => {
  const rows = [
    ['Washer Name', 'Phone', 'Total Washes', 'Total Revenue', 'Average per Wash']
  ];

  data?.forEach(washer => {
    rows.push([
      washer.washerName || 'Unknown',
      washer.washerPhone || 'N/A',
      washer.totalWashes?.toString() || '0',
      washer.totalRevenue?.toString() || '0',
      (washer.totalWashes ? washer.totalRevenue / washer.totalWashes : 0).toString()
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
};

const generateTransactionCSV = (data: any): string => {
  const rows = [
    ['Date', 'Customer', 'Area', 'Wash Type', 'Washer', 'Amount', 'Status']
  ];

  data?.recentTransactions?.forEach((transaction: any) => {
    rows.push([
      new Date(transaction.date).toLocaleDateString(),
      transaction.customerName,
      transaction.area,
      transaction.washType,
      transaction.washerName || 'N/A',
      transaction.amount?.toString() || '0',
      transaction.isPaid ? 'Paid' : 'Unpaid'
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
};



export default Reports;