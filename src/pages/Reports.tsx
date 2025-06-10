import React, { useState } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface RevenueReport {
  totalRevenue: number;
  revenueByMonth: Record<string, number>;
  revenueByService: Record<string, number>;
}

interface CustomerReport {
  _id: string;
  count: number;
  customers: Array<{
    name: string;
    area: string;
    phone: string;
    totalWashes: number;
  }>;
}

interface WasherReport {
  _id: string;
  totalWashes: number;
  totalRevenue: number;
  washerDetails: {
    name: string;
    phone: string;
  };
  completedWashes: Array<{
    date: string;
    type: string;
    amount: number;
    customerName: string;
    area: string;
  }>;
}

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<'revenue' | 'customers' | 'washers' | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const fetchReport = async (type: 'revenue' | 'customers' | 'washers') => {
    try {
      setLoading(true);
      setCurrentReport(type);

      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      const response = await axios.get(`http://localhost:5000/api/reports/${type}`, { params });
      setReportData(response.data);
    } catch (error) {
      console.error(`Error fetching ${type} report:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    let csvContent = '';
    const timestamp = new Date().toISOString().split('T')[0];

    switch (currentReport) {
      case 'revenue':
        csvContent = generateRevenueCSV(reportData);
        break;
      case 'customers':
        csvContent = generateCustomerCSV(reportData);
        break;
      case 'washers':
        csvContent = generateWasherCSV(reportData);
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReport}-report-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        {reportData && (
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        )}
      </div>
      
      {/* Reports Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Financial Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
          <div className="space-y-4">
            <button 
              onClick={() => fetchReport('revenue')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Revenue Report
            </button>
          </div>
        </div>

        {/* Customer Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Reports</h2>
          <div className="space-y-4">
            <button 
              onClick={() => fetchReport('customers')}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Customer Analysis
            </button>
          </div>
        </div>

        {/* Washer Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Washer Reports</h2>
          <div className="space-y-4">
            <button 
              onClick={() => fetchReport('washers')}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              Performance Report
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Report Filters</h2>
          {loading && <span className="text-blue-500">Loading...</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              min={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => currentReport && fetchReport(currentReport)}
              disabled={!currentReport || loading}
              className="w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {currentReport?.charAt(0).toUpperCase()}{currentReport?.slice(1)} Report
          </h2>
          <div className="overflow-x-auto">
            {currentReport === 'revenue' && <RevenueReportView data={reportData} />}
            {currentReport === 'customers' && <CustomerReportView data={reportData} />}
            {currentReport === 'washers' && <WasherReportView data={reportData} />}
          </div>
        </div>
      )}
    </div>
  );
};

const RevenueReportView: React.FC<{ data: RevenueReport }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.totalRevenue)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Revenue by Service</h3>
        <div className="space-y-2">
          {Object.entries(data.revenueByService).map(([service, amount]) => (
            <div key={service} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{service}</span>
              <span>{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Monthly Revenue</h3>
        <div className="space-y-2">
          {Object.entries(data.revenueByMonth).map(([month, amount]) => (
            <div key={month} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{month}</span>
              <span>{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CustomerReportView: React.FC<{ data: CustomerReport[] }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {data.map(group => (
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
                {group.customers.map((customer, idx) => (
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

const WasherReportView: React.FC<{ data: WasherReport[] }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {data.map(washer => (
        <div key={washer._id} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{washer.washerDetails.name}</h3>
            <div className="text-sm text-gray-500">{washer.washerDetails.phone}</div>
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
                {formatCurrency(washer.totalRevenue / washer.totalWashes)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {washer.completedWashes.map((wash, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(wash.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{wash.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{wash.area}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{wash.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(wash.amount)}</td>
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

const generateRevenueCSV = (data: RevenueReport): string => {
  const rows = [
    ['Total Revenue', data.totalRevenue.toString()],
    [],
    ['Service Type', 'Revenue'],
    ...Object.entries(data.revenueByService),
    [],
    ['Month', 'Revenue'],
    ...Object.entries(data.revenueByMonth)
  ];
  return rows.map(row => row.join(',')).join('\n');
};

const generateCustomerCSV = (data: CustomerReport[]): string => {
  const rows = [
    ['Customer Type', 'Name', 'Area', 'Phone', 'Total Washes']
  ];
  
  data.forEach(group => {
    group.customers.forEach(customer => {
      rows.push([
        group._id,
        customer.name,
        customer.area,
        customer.phone,
        customer.totalWashes.toString()
      ]);
    });
  });

  return rows.map(row => row.join(',')).join('\n');
};

const generateWasherCSV = (data: WasherReport[]): string => {
  const rows = [
    ['Washer Name', 'Phone', 'Total Washes', 'Total Revenue', 'Average per Wash']
  ];

  data.forEach(washer => {
    rows.push([
      washer.washerDetails.name,
      washer.washerDetails.phone,
      washer.totalWashes.toString(),
      washer.totalRevenue.toString(),
      (washer.totalRevenue / washer.totalWashes).toString()
    ]);
    
    rows.push([]);
    rows.push(['Date', 'Customer', 'Area', 'Type', 'Amount']);
    
    washer.completedWashes.forEach(wash => {
      rows.push([
        new Date(wash.date).toLocaleDateString(),
        wash.customerName,
        wash.area,
        wash.type,
        wash.amount.toString()
      ]);
    });
    
    rows.push([]);
  });

  return rows.map(row => row.join(',')).join('\n');
};

export default Reports;
