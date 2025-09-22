import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
const api = apiService; // For debug button
import { Download, Filter, Users, DollarSign, BarChart3, FileText, RefreshCw, Calendar, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { createStyledWorkbook, createProfessionalWorkbook } from '../utils/excelStyles';

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
    customerType: '',
    reportType: ''
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
        ...(filters.washType && { washType: filters.washType }),
        ...(filters.area && { area: filters.area }),
        ...(filters.customerType && { leadType: filters.customerType }), // Fix: use leadType for backend
        ...(filters.reportType === 'monthly' && { monthly: 'true' })
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

      console.log('Fetching report with params:', params);
      console.log('Active filters:', { dateRange, filters, activeTab });
      const queryString = new URLSearchParams(params).toString();
      console.log('Query string:', queryString);
      const response = await apiService.get(`/reports/${endpoint}${queryString ? '?' + queryString : ''}`);
      console.log('Report response:', response);
      
      if (response.success) {
        if (type === 'washers') {
          console.log('Washer data structure:', response.data);
          // Backend returns { washers: [...], totalWashers: n, message: '...' }
          setReportData(response.data.washers || []);
        } else {
          let filteredData = response.data;
          
          // Apply client-side filtering for customer reports if backend doesn't filter properly
          if (type === 'customers' && filters.customerType && Array.isArray(filteredData)) {
            console.log('Applying client-side customer type filter:', filters.customerType);
            filteredData = filteredData.filter(group => {
              // For monthly reports, check group._id.leadType
              if (group._id && typeof group._id === 'object' && group._id.leadType) {
                return group._id.leadType === filters.customerType;
              }
              // For regular reports, check group._id
              return group._id === filters.customerType;
            });
            console.log('Filtered data:', filteredData);
          }
          
          // Apply client-side filtering for transaction reports
          if (type === 'transactions' && filteredData?.recentTransactions) {
            let transactions = filteredData.recentTransactions;
            console.log('Original transactions:', transactions.length);
            console.log('Applying filters:', filters);
            
            if (filters.washType) {
              const beforeFilter = transactions.length;
              transactions = transactions.filter((t: any) => t.washType && t.washType.toLowerCase().includes(filters.washType.toLowerCase()));
              console.log(`Wash type filter: ${beforeFilter} -> ${transactions.length}`);
            }
            
            if (filters.customerType) {
              const beforeFilter = transactions.length;
              transactions = transactions.filter((t: any) => 
                (t.leadType && t.leadType === filters.customerType) || 
                (t.customerType && t.customerType === filters.customerType)
              );
              console.log(`Customer type filter: ${beforeFilter} -> ${transactions.length}`);
            }
            
            if (filters.area) {
              const beforeFilter = transactions.length;
              transactions = transactions.filter((t: any) => t.area && t.area.toLowerCase().includes(filters.area.toLowerCase()));
              console.log(`Area filter: ${beforeFilter} -> ${transactions.length}`);
            }
            
            console.log('Final filtered transactions:', transactions.length);
            
            filteredData = {
              ...filteredData,
              recentTransactions: transactions
            };
          }
          
          setReportData(filteredData);
        }
      } else {
        console.error('API Error:', response.error);
        setReportData({ error: response.error || 'Failed to fetch data' });
      }
    } catch (error) {
      console.error(`Error fetching ${type} report:`, error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (activeTab) {
      case 'revenue':
        generateRevenueExcel(reportData, timestamp);
        break;
      case 'customers':
        generateCustomerExcel(reportData, timestamp);
        break;
      case 'washers':
        generateWasherExcel(reportData, timestamp);
        break;
      case 'transactions':
        generateTransactionExcel(reportData, timestamp);
        break;
    }
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
        
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${activeTab !== 'transactions' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                // Auto-refresh for customer reports when date changes
                if (activeTab === 'customers' && filters.reportType === 'monthly') {
                  setTimeout(() => fetchReport('customers'), 500);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              min={dateRange.startDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                // Auto-refresh for customer reports when date changes
                if (activeTab === 'customers' && filters.reportType === 'monthly') {
                  setTimeout(() => fetchReport('customers'), 500);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {activeTab !== 'transactions' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={filters.reportType || ''}
                onChange={(e) => {
                  console.log('Report type changed to:', e.target.value);
                  setFilters(prev => ({ ...prev, reportType: e.target.value }));
                  // Auto-generate report when switching to monthly
                  if (e.target.value === 'monthly') {
                    console.log('Switching to monthly breakdown, fetching report...');
                    setTimeout(() => fetchReport(activeTab), 100);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Standard Report</option>
                <option value="monthly">Monthly Breakdown</option>
              </select>
            </div>
          )}
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
          <div className="flex items-end space-x-2">
            <button
              onClick={() => {
                console.log('Generating report with filters:', { dateRange, filters, activeTab });
                console.log('Customer type filter:', filters.customerType);
                // Force refresh by clearing cache
                setReportData(null);
                fetchReport(activeTab);
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>

            {activeTab === 'customers' && (
              <button
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setFilters({ washType: '', area: '', customerType: '', reportType: '' });
                  setTimeout(() => fetchReport(activeTab), 100);
                }}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                title="Clear all filters"
              >
                Clear
              </button>
            )}
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
              <div className="text-gray-600 mb-2">No data available for the selected filters</div>
              <div className="text-sm text-gray-500">
                Try adjusting your filters or check if data exists for the selected period
              </div>
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

  const isMonthlyReport = data.some((group: any) => group._id && typeof group._id === 'object' && group._id.month);

  return (
    <div className="space-y-6">
      {/* Summary Cards for Monthly Report */}
      {isMonthlyReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Total Months</h3>
            <p className="text-2xl font-bold text-blue-900">{data.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Total Customers</h3>
            <p className="text-2xl font-bold text-green-900">
              {data.reduce((sum: number, group: any) => sum + (group.count || 0), 0)}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Avg per Month</h3>
            <p className="text-2xl font-bold text-purple-900">
              {Math.round(data.reduce((sum: number, group: any) => sum + (group.count || 0), 0) / data.length)}
            </p>
          </div>
        </div>
      )}

      {data.map((group: any, groupIdx: number) => {
        // Handle both monthly and regular report titles
        let groupTitle;
        if (isMonthlyReport) {
          const monthName = new Date(0, group._id.month - 1).toLocaleString('default', { month: 'long' });
          const customerType = group._id.leadType || group._id || 'All';
          groupTitle = `${monthName} ${group._id.year} - ${customerType} Customers (${group.count})`;
        } else {
          // For regular reports, group._id is the customer type
          const customerType = typeof group._id === 'string' ? group._id : 'All';
          groupTitle = `${customerType} Customers (${group.count})`;
        }
        
        console.log('Group data:', group);
        console.log('Group title:', groupTitle);
          
        return (
          <div key={groupIdx} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{groupTitle}</h3>
              {isMonthlyReport && (
                <span className="text-sm text-gray-500">
                  {group.customers?.length || 0} customers
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Washes</th>
                    {isMonthlyReport && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.customers?.map((customer: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{customer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.area}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {customer.totalWashes || 0}
                        </span>
                      </td>
                      {isMonthlyReport && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      )}
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={isMonthlyReport ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                        No customers found for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
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

  if (data?.error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading washer data</div>
        <div className="text-sm text-gray-500">{data.error}</div>
      </div>
    );
  }

  if (!data || !Array.isArray(data)) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 mb-2">No washer data available</div>
        <div className="text-sm text-gray-500">
          This could be because:
          <ul className="mt-2 text-left inline-block">
            <li>• No washers have been assigned to any washes</li>
            <li>• No washes have been completed in the selected date range</li>
            <li>• Backend service is unavailable</li>
          </ul>
        </div>
      </div>
    );
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

          {/* Monthly wash count */}
          {washer.monthlyWashCount && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Wash Count</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {washer.monthlyWashCount.map((month: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">
                      {new Date(0, month._id.month - 1).toLocaleString('default', { month: 'short' })} {month._id.year}:
                    </span>
                    <span className="ml-2">{month.count} washes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer details */}
          {washer.customerDetails && washer.customerDetails.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Customer Details</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {washer.customerDetails.slice(0, 5).map((customer: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm">{customer.customerName}</td>
                        <td className="px-3 py-2 text-sm">{customer.area}</td>
                        <td className="px-3 py-2 text-sm">{formatCurrency(customer.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance and Performance */}
          {washer.attendance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-600">Attendance</h4>
                <p className="text-lg font-bold text-blue-900">
                  {washer.attendance.presentDays}/{washer.attendance.totalDays} days ({washer.attendance.percentage}%)
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-orange-600">Performance</h4>
                <p className="text-sm text-orange-900">
                  Avg: {washer.performance?.avgWashesPerDay} washes/day
                </p>
                <p className="text-sm text-orange-900">
                  Avg Revenue: {formatCurrency(washer.performance?.avgRevenuePerWash || 0)}/wash
                </p>
              </div>
            </div>
          )}
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

  console.log('Transaction data:', data);

  if (!data?.recentTransactions || !Array.isArray(data.recentTransactions)) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 mb-2">No transaction data available</div>
        <div className="text-sm text-gray-500">
          {data ? 'Available keys: ' + Object.keys(data).join(', ') : 'No data received'}
        </div>
      </div>
    );
  }
  
  if (data.recentTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 mb-2">No transactions found for the selected filters</div>
        <div className="text-sm text-gray-500">
          Try adjusting your date range or filter criteria
        </div>
      </div>
    );
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

const generateRevenueExcel = (data: any, timestamp: string) => {
  const title = `Revenue & Financial Report - ${timestamp}`;
  const headers = ['Financial Metric', 'Amount (₹)', 'Percentage', 'Status'];
  
  const totalAmount = data.paymentSummary?.total || 0;
  const paidAmount = data.paymentSummary?.paid || 0;
  const unpaidAmount = data.paymentSummary?.unpaid || 0;
  const paymentRate = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : '0';
  
  const mainData = [
    ['Total Revenue Generated', data.totalRevenue || 0, '100%', 'Complete'],
    ['Total Washes Completed', data.totalWashes || 0, '', 'Active'],
    ['Total Customers Served', data.totalCustomers || 0, '', 'Active'],
    ['Average Revenue per Wash', data.totalWashes ? Math.round(data.totalRevenue / data.totalWashes) : 0, '', 'Calculated'],
    ['Total Amount Due', totalAmount, '100%', 'Pending Collection'],
    ['Amount Collected', paidAmount, paymentRate + '%', 'Collected'],
    ['Outstanding Amount', unpaidAmount, (100 - parseFloat(paymentRate)).toFixed(1) + '%', 'Pending']
  ];
  
  const analyticsData = [
    { label: 'Payment Collection Rate', value: paymentRate + '%' },
    { label: 'Revenue per Customer', value: data.totalCustomers > 0 ? Math.round(data.totalRevenue / data.totalCustomers) : 0 },
    { label: 'Business Performance', value: parseFloat(paymentRate) >= 80 ? 'Excellent' : parseFloat(paymentRate) >= 60 ? 'Good' : 'Needs Improvement' },
    { label: 'Outstanding Risk Level', value: parseFloat(paymentRate) >= 80 ? 'Low' : parseFloat(paymentRate) >= 60 ? 'Medium' : 'High' },
    { label: 'Monthly Revenue Target', value: Math.round(data.totalRevenue * 1.1) },
    { label: 'Collection Efficiency', value: paymentRate + '%' }
  ];
  
  const { wb, ws } = createProfessionalWorkbook(title, headers, mainData, analyticsData);
  
  XLSX.utils.book_append_sheet(wb, ws, 'Revenue Report');
  XLSX.writeFile(wb, `Revenue-Financial-Report-${timestamp}.xlsx`);
};

const generateCustomerExcel = (data: any[], timestamp: string) => {
  const isMonthlyReport = data?.some((group: any) => group._id && typeof group._id === 'object' && group._id.month);
  
  if (isMonthlyReport) {
    // Create comprehensive monthly breakdown report
    const wb = XLSX.utils.book_new();
    
    // Group data by month for better organization
    const monthlyGroups = new Map();
    data?.forEach(group => {
      const monthKey = `${group._id.year}-${group._id.month}`;
      const monthName = `${new Date(0, group._id.month - 1).toLocaleString('default', { month: 'long' })} ${group._id.year}`;
      
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, {
          monthName,
          groups: [],
          totalCustomers: 0,
          oneTimeCount: 0,
          monthlyCount: 0,
          totalWashes: 0
        });
      }
      
      const monthData = monthlyGroups.get(monthKey);
      monthData.groups.push(group);
      monthData.totalCustomers += group.customers?.length || 0;
      
      if (group._id.leadType === 'One-time') {
        monthData.oneTimeCount += group.customers?.length || 0;
      } else if (group._id.leadType === 'Monthly') {
        monthData.monthlyCount += group.customers?.length || 0;
      }
      
      monthData.totalWashes += group.customers?.reduce((sum: number, c: any) => sum + (c.totalWashes || 0), 0) || 0;
    });
    
    // Create summary sheet
    const summaryData: any[][] = [];
    const summaryHeaders = ['Month', 'One-time Customers', 'Monthly Customers', 'Total Customers', 'Total Washes', 'Avg Washes/Customer', 'Growth Rate'];
    
    let previousTotal = 0;
    Array.from(monthlyGroups.values()).forEach((monthData: any, index) => {
      const avgWashes = monthData.totalCustomers > 0 ? Math.round(monthData.totalWashes / monthData.totalCustomers * 10) / 10 : 0;
      const growthRate = previousTotal > 0 ? Math.round(((monthData.totalCustomers - previousTotal) / previousTotal) * 100) + '%' : 'N/A';
      
      summaryData.push([
        monthData.monthName,
        monthData.oneTimeCount,
        monthData.monthlyCount,
        monthData.totalCustomers,
        monthData.totalWashes,
        avgWashes,
        growthRate
      ]);
      
      previousTotal = monthData.totalCustomers;
    });
    
    // Overall analytics - filtered data only
    const filteredData = data || [];
    const totalCustomers = filteredData.reduce((sum: number, group: any) => sum + (group.customers?.length || 0), 0);
    const totalOneTime = filteredData.filter((g: any) => g._id.leadType === 'One-time').reduce((sum: number, g: any) => sum + (g.customers?.length || 0), 0);
    const totalMonthly = filteredData.filter((g: any) => g._id.leadType === 'Monthly').reduce((sum: number, g: any) => sum + (g.customers?.length || 0), 0);
    const totalWashes = filteredData.reduce((sum: number, group: any) => sum + (group.customers?.reduce((s: number, c: any) => s + (c.totalWashes || 0), 0) || 0), 0);
    
    const summaryAnalytics = [
      { label: 'Report Period', value: filteredData.length > 0 ? `${Array.from(monthlyGroups.values())[0]?.monthName} to ${Array.from(monthlyGroups.values())[monthlyGroups.size - 1]?.monthName}` : 'No Data' },
      { label: 'Total Months Analyzed', value: monthlyGroups.size },
      { label: 'Total Customers (Filtered)', value: totalCustomers },
      { label: 'One-time Customers (Filtered)', value: totalOneTime },
      { label: 'Monthly Subscription Customers (Filtered)', value: totalMonthly },
      { label: 'Customer Type Ratio (Monthly:One-time)', value: totalOneTime > 0 ? `1:${Math.round(totalOneTime / Math.max(totalMonthly, 1))}` : totalMonthly > 0 ? 'All Monthly' : 'No Data' },
      { label: 'Total Service Completions (Filtered)', value: totalWashes },
      { label: 'Average Monthly Customer Acquisition', value: monthlyGroups.size > 0 ? Math.round(totalCustomers / monthlyGroups.size) : 0 },
      { label: 'Monthly Customer Conversion Rate', value: totalCustomers > 0 ? Math.round((totalMonthly / totalCustomers) * 100) + '%' : '0%' },
      { label: 'Business Growth Trend', value: summaryData.length > 1 && summaryData[summaryData.length - 1][6] !== 'N/A' ? 
        (parseInt(summaryData[summaryData.length - 1][6]) > 0 ? 'Growing 📈' : 'Declining 📉') : 'Stable' }
    ];
    
    // Create enhanced summary with customer list first, then analytics
    const wsData: any[][] = [];
    
    // Title and headers
    wsData.push([`📊 MONTHLY CUSTOMER ANALYSIS SUMMARY - ${timestamp.toUpperCase()}`]);
    wsData.push([`📅 Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`]);
    wsData.push([]);
    
    // Customer list section first
    wsData.push(['📋 COMPLETE CUSTOMER LIST']);
    wsData.push(['Customer Name', 'Month Added', 'Customer Type', 'Total Washes', 'Phone', 'Area']);
    
    // Add all customers with details - only filtered data
    filteredData.forEach(group => {
      const monthName = `${new Date(0, group._id.month - 1).toLocaleString('default', { month: 'long' })} ${group._id.year}`;
      group.customers?.forEach((customer: any) => {
        wsData.push([
          customer.name,
          monthName,
          group._id.leadType,
          customer.totalWashes || 0,
          customer.phone || 'N/A',
          customer.area || 'N/A'
        ]);
      });
    });
    
    // Monthly summary data section
    const customerListEnd = wsData.length;
    wsData.push([]);
    wsData.push(['📋 MONTHLY SUMMARY DATA']);
    wsData.push(summaryHeaders);
    
    // Add summary data
    summaryData.forEach(row => wsData.push(row));
    
    // Analytics section last
    wsData.push([]);
    wsData.push(['📈 ANALYTICS & INSIGHTS']);
    wsData.push(['Metric', 'Value']);
    
    summaryAnalytics.forEach(item => {
      wsData.push([item.label, item.value]);
    });
    
    const summaryWs = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    summaryWs['!cols'] = [
      { width: 25 }, // Customer Name
      { width: 15 }, // Month Added
      { width: 15 }, // Customer Type
      { width: 12 }, // Total Washes
      { width: 15 }, // Phone
      { width: 20 }  // Area
    ];
    
    // Create merges
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Date
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }, // Customer list header
      { s: { r: customerListEnd + 1, c: 0 }, e: { r: customerListEnd + 1, c: summaryHeaders.length - 1 } }, // Monthly summary header
      { s: { r: customerListEnd + 4 + summaryData.length, c: 0 }, e: { r: customerListEnd + 4 + summaryData.length, c: 1 } } // Analytics header
    ];
    
    summaryWs['!merges'] = merges;
    
    // Freeze panes at customer list
    summaryWs['!freeze'] = { xSplit: 0, ySplit: 5 };
    
    // Auto-filter for customer list - use filtered data count
    const customerCount = filteredData.reduce((sum, group) => sum + (group.customers?.length || 0), 0);
    summaryWs['!autofilter'] = { ref: `A5:F${5 + customerCount}` };
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Monthly Summary');
    
    // Create detailed sheets for each month
    Array.from(monthlyGroups.entries()).forEach(([monthKey, monthData]: [string, any]) => {
      const detailData: any[][] = [];
      const detailHeaders = ['Customer Type', 'Name', 'Area', 'Phone', 'Total Washes', 'Created Date', 'Customer Value'];
      
      monthData.groups.forEach((group: any) => {
        group.customers?.forEach((customer: any) => {
          const customerValue = (customer.totalWashes || 0) > 5 ? 'High Value' : 
                               (customer.totalWashes || 0) > 2 ? 'Medium Value' : 'New Customer';
          
          detailData.push([
            group._id.leadType,
            customer.name,
            customer.area,
            customer.phone,
            customer.totalWashes || 0,
            new Date(customer.createdAt).toLocaleDateString('en-GB'),
            customerValue
          ]);
        });
      });
      
      const monthAnalytics = [
        { label: 'Month Performance', value: monthData.monthName },
        { label: 'New Customers Acquired', value: monthData.totalCustomers },
        { label: 'One-time Customers', value: monthData.oneTimeCount },
        { label: 'Monthly Subscribers', value: monthData.monthlyCount },
        { label: 'Services Completed', value: monthData.totalWashes },
        { label: 'Average Services per Customer', value: monthData.totalCustomers > 0 ? Math.round(monthData.totalWashes / monthData.totalCustomers * 10) / 10 : 0 },
        { label: 'Subscription Rate', value: monthData.totalCustomers > 0 ? Math.round((monthData.monthlyCount / monthData.totalCustomers) * 100) + '%' : '0%' },
        { label: 'Customer Retention Indicator', value: monthData.totalWashes > monthData.totalCustomers ? 'Good Retention' : 'Focus on Retention' }
      ];
      
      const { ws: monthWs } = createProfessionalWorkbook(
        `${monthData.monthName} - Customer Details`,
        detailHeaders,
        detailData,
        monthAnalytics
      );
      
      // Clean sheet name for Excel compatibility
      const sheetName = monthData.monthName.replace(/[\[\]\*\?\/\\]/g, '-').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, monthWs, sheetName);
    });
    
    XLSX.writeFile(wb, `Monthly-Customer-Analysis-${timestamp}.xlsx`);
    
  } else {
    // Standard customer report
    const title = `Customer Report - ${timestamp}`;
    const headers = ['Customer Type', 'Name', 'Area', 'Phone', 'Total Washes'];
    
    const customerData: any[][] = [];
    let oneTimeCount = 0;
    let monthlyCount = 0;
    
    data?.forEach(group => {
      const customerType = group._id;
      
      group.customers?.forEach((customer: any) => {
        if (customerType === 'One-time') oneTimeCount++;
        if (customerType === 'Monthly') monthlyCount++;
        
        customerData.push([
          customerType,
          customer.name,
          customer.area,
          customer.phone,
          customer.totalWashes || 0
        ]);
      });
    });
    
    const totalCustomers = data?.reduce((sum, group) => sum + (group.customers?.length || 0), 0) || 0;
    const totalWashes = data?.reduce((sum, group) => sum + group.customers?.reduce((s: number, c: any) => s + (c.totalWashes || 0), 0), 0) || 0;
    
    const analyticsData = [
      { label: 'Total Customer Groups', value: data?.length || 0 },
      { label: 'Total Customers', value: totalCustomers },
      { label: 'One-time Customers', value: oneTimeCount },
      { label: 'Monthly Customers', value: monthlyCount },
      { label: 'Total Washes Completed', value: totalWashes },
      { label: 'Average Washes per Customer', value: totalCustomers > 0 ? Math.round(totalWashes / totalCustomers * 10) / 10 : 0 },
      { label: 'Monthly Customer Percentage', value: totalCustomers > 0 ? Math.round((monthlyCount / totalCustomers) * 100) + '%' : '0%' }
    ];
    
    const { wb, ws } = createProfessionalWorkbook(title, headers, customerData, analyticsData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Report');
    XLSX.writeFile(wb, `Customer-Report-${timestamp}.xlsx`);
  }
};

const generateWasherExcel = (data: any[], timestamp: string) => {
  // Check if this is monthly breakdown data
  const hasMonthlyData = data?.some(washer => washer.monthlyWashCount && washer.monthlyWashCount.length > 0);
  
  if (hasMonthlyData) {
    // Generate monthly breakdown report
    const wb = XLSX.utils.book_new();
    
    // Create summary sheet with monthly analytics
    const summaryHeaders = ['Washer Name', 'Phone', 'Total Washes', 'Total Revenue (₹)', 'Avg per Wash (₹)', 'Active Months', 'Best Month', 'Best Month Revenue'];
    const summaryData: any[][] = [];
    
    data?.forEach(washer => {
      const monthlyData = washer.monthlyWashCount || [];
      const activeMonths = monthlyData.length;
      const bestMonth = monthlyData.reduce((best: any, month: any) => 
        (month.revenue || 0) > (best.revenue || 0) ? month : best, monthlyData[0] || {});
      const bestMonthName = bestMonth._id ? 
        `${new Date(0, bestMonth._id.month - 1).toLocaleString('default', { month: 'short' })} ${bestMonth._id.year}` : 'N/A';
      
      summaryData.push([
        washer.washerName || 'Unknown',
        washer.washerPhone || 'N/A',
        washer.totalWashes || 0,
        washer.totalRevenue || 0,
        washer.totalWashes ? Math.round(washer.totalRevenue / washer.totalWashes) : 0,
        activeMonths,
        bestMonthName,
        bestMonth.revenue || 0
      ]);
    });
    
    const totalWashes = data?.reduce((sum, w) => sum + (w.totalWashes || 0), 0) || 0;
    const totalRevenue = data?.reduce((sum, w) => sum + (w.totalRevenue || 0), 0) || 0;
    const topPerformer = data?.reduce((top, w) => (w.totalRevenue || 0) > (top.totalRevenue || 0) ? w : top, data?.[0]) || null;
    
    // Get all unique months from all washers
    const allMonths = new Set();
    data?.forEach(washer => {
      washer.monthlyWashCount?.forEach((month: any) => {
        if (month._id) {
          allMonths.add(`${month._id.year}-${month._id.month}`);
        }
      });
    });
    
    const summaryAnalytics = [
      { label: 'Report Period Analysis', value: `${allMonths.size} months tracked` },
      { label: 'Total Active Washers', value: data?.length || 0 },
      { label: 'Total Washes Completed', value: totalWashes },
      { label: 'Total Revenue Generated', value: totalRevenue },
      { label: 'Average Monthly Performance', value: allMonths.size > 0 ? Math.round(totalRevenue / allMonths.size) : 0 },
      { label: 'Top Monthly Performer', value: topPerformer?.washerName || 'N/A' },
      { label: 'Best Performer Total Revenue', value: topPerformer?.totalRevenue || 0 },
      { label: 'Average Washes per Washer per Month', value: data?.length && allMonths.size ? Math.round(totalWashes / (data.length * allMonths.size)) : 0 },
      { label: 'Monthly Revenue Consistency', value: 'View individual sheets for details' }
    ];
    
    const { ws: summaryWs } = createProfessionalWorkbook(
      `Monthly Washer Performance Summary - ${timestamp}`,
      summaryHeaders,
      summaryData,
      summaryAnalytics
    );
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Monthly Summary');
    
    // Create individual sheets for each washer with monthly breakdown
    data?.forEach(washer => {
      if (washer.monthlyWashCount && washer.monthlyWashCount.length > 0) {
        const monthlyHeaders = ['Month', 'Year', 'Washes', 'Revenue (₹)', 'Avg per Wash (₹)', 'Performance vs Avg'];
        const monthlyData: any[][] = [];
        
        const washerAvgRevenue = washer.totalWashes ? washer.totalRevenue / washer.totalWashes : 0;
        
        washer.monthlyWashCount.forEach((month: any) => {
          const monthName = new Date(0, month._id.month - 1).toLocaleString('default', { month: 'long' });
          const monthRevenue = month.revenue || (month.count * washerAvgRevenue); // Estimate if not provided
          const avgPerWash = month.count ? monthRevenue / month.count : 0;
          const performance = washerAvgRevenue > 0 ? Math.round((avgPerWash / washerAvgRevenue) * 100) + '%' : 'N/A';
          
          monthlyData.push([
            monthName,
            month._id.year,
            month.count,
            Math.round(monthRevenue),
            Math.round(avgPerWash),
            performance
          ]);
        });
        
        const washerAnalytics = [
          { label: 'Washer Performance', value: washer.washerName },
          { label: 'Contact', value: washer.washerPhone || 'N/A' },
          { label: 'Total Active Months', value: washer.monthlyWashCount.length },
          { label: 'Total Washes', value: washer.totalWashes || 0 },
          { label: 'Total Revenue', value: washer.totalRevenue || 0 },
          { label: 'Average Monthly Washes', value: Math.round((washer.totalWashes || 0) / washer.monthlyWashCount.length) },
          { label: 'Average Monthly Revenue', value: Math.round((washer.totalRevenue || 0) / washer.monthlyWashCount.length) },
          { label: 'Best Month', value: monthlyData.reduce((best, month) => month[2] > best[2] ? month : best, monthlyData[0])?.[0] || 'N/A' },
          { label: 'Consistency Rating', value: washer.monthlyWashCount.length >= 3 ? 'Regular' : 'Irregular' }
        ];
        
        const { ws: washerWs } = createProfessionalWorkbook(
          `${washer.washerName} - Monthly Performance`,
          monthlyHeaders,
          monthlyData,
          washerAnalytics
        );
        
        const sheetName = (washer.washerName || 'Unknown').replace(/[\[\]\*\?\/\\]/g, '-').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, washerWs, sheetName);
      }
    });
    
    XLSX.writeFile(wb, `Monthly-Washer-Performance-${timestamp}.xlsx`);
    
  } else {
    // Standard washer report
    const title = `Washer Performance Report - ${timestamp}`;
    const headers = ['Washer Name', 'Phone', 'Total Washes', 'Total Revenue (₹)', 'Avg per Wash (₹)', 'Performance Rating', 'Efficiency Score'];
    
    const totalRevenue = data?.reduce((sum, w) => sum + (w.totalRevenue || 0), 0) || 0;
    const avgRevenuePerWasher = data?.length ? totalRevenue / data.length : 0;
    
    const washerData = data?.map(washer => {
      const avgPerWash = washer.totalWashes ? washer.totalRevenue / washer.totalWashes : 0;
      const performanceRating = washer.totalRevenue >= avgRevenuePerWasher * 1.2 ? 'Excellent' : 
                               washer.totalRevenue >= avgRevenuePerWasher ? 'Good' : 
                               washer.totalRevenue >= avgRevenuePerWasher * 0.7 ? 'Average' : 'Below Average';
      const efficiencyScore = avgRevenuePerWasher > 0 ? Math.round((washer.totalRevenue / avgRevenuePerWasher) * 100) : 0;
      
      return [
        washer.washerName || 'Unknown',
        washer.washerPhone || 'N/A',
        washer.totalWashes || 0,
        washer.totalRevenue || 0,
        Math.round(avgPerWash),
        performanceRating,
        efficiencyScore + '%'
      ];
    }) || [];
    
    const topPerformer = data?.length ? data.reduce((top, w) => (w.totalRevenue || 0) > (top.totalRevenue || 0) ? w : top, data[0]) : null;
    const totalWashes = data?.reduce((sum, w) => sum + (w.totalWashes || 0), 0) || 0;
    
    const analyticsData = [
      { label: 'Total Active Washers', value: data?.length || 0 },
      { label: 'Total Washes Completed', value: totalWashes },
      { label: 'Total Revenue Generated', value: totalRevenue },
      { label: 'Average Revenue per Washer', value: Math.round(avgRevenuePerWasher) },
      { label: 'Average Washes per Washer', value: data?.length ? Math.round(totalWashes / data.length) : 0 },
      { label: 'Top Performer', value: topPerformer?.washerName || 'N/A' },
      { label: 'Top Performer Revenue', value: topPerformer?.totalRevenue || 0 },
      { label: 'Performance Spread', value: data?.length ? Math.round((Math.max(...data.map(w => w.totalRevenue || 0)) - Math.min(...data.map(w => w.totalRevenue || 0)))) : 0 }
    ];
    
    const { wb, ws } = createProfessionalWorkbook(title, headers, washerData, analyticsData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Washer Performance');
    XLSX.writeFile(wb, `Washer-Performance-Report-${timestamp}.xlsx`);
  }
};

const generateTransactionExcel = (data: any, timestamp: string) => {
  // Use the filtered transactions from reportData
  const transactions = data?.recentTransactions || [];
  console.log('Excel generation - transactions count:', transactions.length);
  console.log('Excel generation - sample transaction:', transactions[0]);
  
  const title = `Transaction & Payment Report - ${timestamp}`;
  const headers = ['Transaction Date', 'Customer Name', 'Location', 'Service Type', 'Customer Type', 'Assigned Washer', 'Amount (₹)', 'Payment Status', 'Days Pending'];
  
  const transactionData = transactions.map((transaction: any) => {
    const transactionDate = new Date(transaction.date);
    const daysPending = !transaction.isPaid ? Math.floor((new Date().getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return [
      transactionDate.toLocaleDateString('en-GB'),
      transaction.customerName || 'N/A',
      transaction.area || 'N/A',
      transaction.washType || 'N/A',
      transaction.leadType || 'N/A',
      transaction.washerName || 'Unassigned',
      transaction.amount || 0,
      transaction.isPaid ? 'Paid ✓' : 'Pending ⏳',
      daysPending > 0 ? daysPending + ' days' : 'N/A'
    ];
  });
  
  const totalTransactions = transactions.length;
  const paidTransactions = transactions.filter((t: any) => t.isPaid).length;
  const unpaidTransactions = totalTransactions - paidTransactions;
  const totalAmount = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const paidAmount = transactions.filter((t: any) => t.isPaid).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  const paymentRate = totalTransactions > 0 ? ((paidTransactions / totalTransactions) * 100).toFixed(1) : '0';
  
  // Get filter summary for analytics
  const washTypes = [...new Set(transactions.map((t: any) => t.washType).filter(Boolean))];
  const customerTypes = [...new Set(transactions.map((t: any) => t.leadType).filter(Boolean))];
  const areas = [...new Set(transactions.map((t: any) => t.area).filter(Boolean))];
  
  const analyticsData = [
    { label: 'Filtered Transactions Count', value: totalTransactions },
    { label: 'Total Transaction Value (Filtered)', value: totalAmount },
    { label: 'Successfully Paid Transactions', value: paidTransactions },
    { label: 'Pending Payment Transactions', value: unpaidTransactions },
    { label: 'Amount Successfully Collected', value: paidAmount },
    { label: 'Outstanding Payment Amount', value: pendingAmount },
    { label: 'Payment Collection Rate', value: paymentRate + '%' },
    { label: 'Average Transaction Value', value: totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0 },
    { label: 'Service Types in Report', value: washTypes.length > 0 ? washTypes.join(', ') : 'All Types' },
    { label: 'Customer Types in Report', value: customerTypes.length > 0 ? customerTypes.join(', ') : 'All Types' },
    { label: 'Areas Covered', value: areas.length > 0 ? areas.slice(0, 3).join(', ') + (areas.length > 3 ? '...' : '') : 'All Areas' },
    { label: 'Collection Efficiency Rating', value: parseFloat(paymentRate) >= 90 ? 'Excellent' : parseFloat(paymentRate) >= 75 ? 'Good' : 'Needs Improvement' }
  ];
  
  const { wb, ws } = createProfessionalWorkbook(title, headers, transactionData, analyticsData);
  
  XLSX.utils.book_append_sheet(wb, ws, 'Transaction Report');
  XLSX.writeFile(wb, `Transaction-Payment-Report-${timestamp}.xlsx`);
};


export default Reports;

