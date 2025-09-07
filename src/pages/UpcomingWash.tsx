import React, { useState, useEffect } from 'react';
import { Search, Calendar, Eye, Phone, Car, MapPin, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';

interface UpcomingWash {
  id: number;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  leadType: string;
  leadSource: string;
  status: string;
  createdAt: string;
  upcomingWash: {
    date: string;
    washType: string;
    washer?: string;
  };
}

interface WashEntry {
  customerId: number;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  leadType: string;
  leadSource: string;
  washDate: string;
  washType: string;
  washer?: string;
}

const UpcomingWash = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<UpcomingWash[]>([]);
  const [washEntries, setWashEntries] = useState<WashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || 'today');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    fetchUpcomingWashes();
  }, [dateFilter, typeFilter, sourceFilter, searchQuery]);

  const fetchUpcomingWashes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUpcomingWashes({
        date: dateFilter,
        type: typeFilter,
        source: sourceFilter,
        search: searchQuery
      });
      
      if (response.success) {
        const data = response.data || [];
        console.log('API Response:', data);
        setCustomers(data);
        
        // For week view, we need to get all scheduled washes from the backend
        // The current API only returns one upcoming wash per customer
        // We need to make a separate call to get all scheduled washes for the week
        let allWashEntries: WashEntry[] = [];
        
        if (dateFilter === 'week') {
          // For week view, we need to fetch all leads and extract their scheduled washes
          try {
            const allLeadsResponse = await fetch('https://zuci-sbackend-2.onrender.com/api/leads', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (allLeadsResponse.ok) {
              const allLeads = await allLeadsResponse.json();
              
              const now = new Date();
              const weekStart = new Date(now);
              weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
              weekStart.setHours(0, 0, 0, 0);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
              weekEnd.setHours(23, 59, 59, 999);
              
              allLeads.forEach((lead: any) => {
                // Check monthly subscription scheduled washes
                if (lead.leadType === 'Monthly' && lead.monthlySubscription?.scheduledWashes) {
                  lead.monthlySubscription.scheduledWashes.forEach((wash: any) => {
                    const washDate = new Date(wash.scheduledDate);
                    if (washDate >= weekStart && washDate <= weekEnd && 
                        ['scheduled', 'pending'].includes(wash.status)) {
                      allWashEntries.push({
                        customerId: lead.id,
                        customerName: lead.customerName,
                        phone: lead.phone,
                        area: lead.area,
                        carModel: lead.carModel,
                        leadType: lead.leadType,
                        leadSource: lead.leadSource,
                        washDate: wash.scheduledDate,
                        washType: lead.monthlySubscription.packageType || 'Basic',
                        washer: wash.washer?.name || 'Unassigned'
                      });
                    }
                  });
                }
                
                // Check wash history for pending washes
                if (lead.washHistory) {
                  lead.washHistory.forEach((wash: any) => {
                    const washDate = new Date(wash.date);
                    if (washDate >= weekStart && washDate <= weekEnd && 
                        ['scheduled', 'pending'].includes(wash.washStatus)) {
                      allWashEntries.push({
                        customerId: lead.id,
                        customerName: lead.customerName,
                        phone: lead.phone,
                        area: lead.area,
                        carModel: lead.carModel,
                        leadType: lead.leadType,
                        leadSource: lead.leadSource,
                        washDate: wash.date,
                        washType: wash.washType,
                        washer: wash.washer?.name || 'Unassigned'
                      });
                    }
                  });
                }
                
                // Check one-time wash
                if (lead.oneTimeWash?.scheduledDate) {
                  const washDate = new Date(lead.oneTimeWash.scheduledDate);
                  if (washDate >= weekStart && washDate <= weekEnd && 
                      ['scheduled', 'pending'].includes(lead.oneTimeWash.status)) {
                    allWashEntries.push({
                      customerId: lead.id,
                      customerName: lead.customerName,
                      phone: lead.phone,
                      area: lead.area,
                      carModel: lead.carModel,
                      leadType: lead.leadType,
                      leadSource: lead.leadSource,
                      washDate: lead.oneTimeWash.scheduledDate,
                      washType: lead.oneTimeWash.washType,
                      washer: lead.oneTimeWash.washer?.name || 'Unassigned'
                    });
                  }
                }
              });
            }
          } catch (error) {
            console.error('Error fetching all leads for week view:', error);
          }
        } else {
          // For today/tomorrow, use the existing API response
          data.forEach((customer: any) => {
            if (customer.upcomingWash) {
              allWashEntries.push({
                customerId: customer.id,
                customerName: customer.customerName,
                phone: customer.phone,
                area: customer.area,
                carModel: customer.carModel,
                leadType: customer.leadType,
                leadSource: customer.leadSource,
                washDate: customer.upcomingWash.date,
                washType: customer.upcomingWash.washType,
                washer: customer.upcomingWash.washer
              });
            }
          });
        }
        
        // Remove duplicates based on customerId + washDate + washType
        const uniqueWashEntries = allWashEntries.filter((entry, index, self) => 
          index === self.findIndex(e => 
            e.customerId === entry.customerId && 
            e.washDate === entry.washDate && 
            e.washType === entry.washType
          )
        );
        
        setWashEntries(uniqueWashEntries);
      } else {
        console.error('API Error:', response.error);
        setCustomers([]);
        setWashEntries([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming washes:', error);
      setCustomers([]);
      setWashEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Use wash entries for display when showing week view, otherwise use customers
  const displayData = dateFilter === 'week' ? washEntries : customers.map(customer => ({
    customerId: customer.id,
    customerName: customer.customerName,
    phone: customer.phone,
    area: customer.area,
    carModel: customer.carModel,
    leadType: customer.leadType,
    leadSource: customer.leadSource,
    washDate: customer.upcomingWash?.date || '',
    washType: customer.upcomingWash?.washType || '',
    washer: customer.upcomingWash?.washer
  }));
  
  const filteredCustomers = displayData;

  const getDateFilterText = () => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'week': return 'This Week';
      default: return 'Today';
    }
  };

  const downloadCSV = () => {
    if (filteredCustomers.length === 0) {
      alert('No data to download');
      return;
    }

    // Group wash entries by date and time
    const groupedData = filteredCustomers.reduce((acc, entry) => {
      const washDate = new Date(entry.washDate);
      const dateKey = washDate.toLocaleDateString();
      const dayName = washDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          day: dayName,
          date: dateKey,
          customers: []
        };
      }
      
      acc[dateKey].customers.push({
        time: '9:00 AM - 9:00 PM', // Default time range
        customerName: entry.customerName,
        phone: entry.phone,
        area: entry.area,
        carModel: entry.carModel,
        washType: entry.washType,
        customerType: entry.leadType,
        source: entry.leadSource
      });
      
      return acc;
    }, {});

    // Create CSV content
    let csvContent = 'Day,Date,Time,Customer Name,Phone,Area,Car Model,Wash Type,Customer Type,Source\n';
    
    Object.values(groupedData).forEach((dayData: any) => {
      dayData.customers.forEach((customer: any) => {
        csvContent += `${dayData.day},${dayData.date},${customer.time},${customer.customerName},${customer.phone},${customer.area},${customer.carModel},${customer.washType},${customer.customerType},${customer.source}\n`;
      });
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `upcoming-washes-${getDateFilterText().toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-7 w-7 text-blue-600 mr-2" />
              Upcoming Wash Customers
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {filteredCustomers.length} customers with upcoming washes for {getDateFilterText().toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Monthly">Monthly</option>
              <option value="One-time">One-time</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Social Media">Social Media</option>
              <option value="Referral">Referral</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Pamphlet">Pamphlet</option>
              <option value="Website">Website</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => {
              setDateFilter('today');
              setTypeFilter('');
              setSourceFilter('');
              setSearchQuery('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
          
          {dateFilter === 'week' && filteredCustomers.length > 0 && (
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Weekly Schedule
            </button>
          )}
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Car Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wash Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upcoming Wash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((entry, index) => (
                  <tr key={`${entry.customerId}-${entry.washDate}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{entry.customerName}</div>
                        <div className="text-sm text-gray-500">{entry.leadSource}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-4 w-4 mr-1 text-gray-400" />
                        {entry.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {entry.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Car className="h-4 w-4 mr-1 text-gray-400" />
                        {entry.carModel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.leadType === 'Monthly' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.leadType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.washType}</div>
                      {entry.washer && entry.washer !== 'Unassigned' && (
                        <div className="text-xs text-gray-500">Washer: {entry.washer}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(entry.washDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.washDate).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' :
                         new Date(entry.washDate).toLocaleDateString() === new Date(Date.now() + 24*60*60*1000).toLocaleDateString() ? 'Tomorrow' :
                         new Date(entry.washDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/user/${entry.customerId}`)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No upcoming washes found for {getDateFilterText().toLowerCase()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UpcomingWash;
