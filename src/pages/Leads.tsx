import React, { useState } from 'react';
import { 
  Plus, Filter, Search, Phone, Car, MapPin, 
  Calendar, User, UserCheck, ArrowUpDown 
} from 'lucide-react';
import TypeBadge from '../components/common/TypeBadge';
import StatusBadge from '../components/common/StatusBadge';

// Mock data
const leadData = [
  {
    id: 1,
    name: 'Arun Kumar',
    phone: '+91 98765 43210',
    area: 'Kormangala',
    carModel: 'Honda City',
    leadType: 'Monthly',
    leadSource: 'Referral',
    assignedWasher: 'Rahul',
    date: '2023-06-10',
    status: 'New',
    notes: 'Interested in premium monthly plan'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    phone: '+91 87654 32109',
    area: 'Indiranagar',
    carModel: 'Hyundai Creta',
    leadType: 'One-time',
    leadSource: 'Walk-in',
    assignedWasher: 'Suresh',
    date: '2023-06-09',
    status: 'Contacted',
    notes: 'Requested for one-time deep cleaning'
  },
  // More leads...
  {
    id: 3,
    name: 'Vikram Singh',
    phone: '+91 76543 21098',
    area: 'HSR Layout',
    carModel: 'Maruti Swift',
    leadType: 'Monthly',
    leadSource: 'WhatsApp',
    assignedWasher: 'Vikram',
    date: '2023-06-09',
    status: 'Converted',
    notes: 'Signed up for monthly plan'
  },
  {
    id: 4,
    name: 'Meera Patel',
    phone: '+91 65432 10987',
    area: 'Whitefield',
    carModel: 'Toyota Fortuner',
    leadType: 'One-time',
    leadSource: 'Pamphlet',
    assignedWasher: 'Anand',
    date: '2023-06-08',
    status: 'Follow-up',
    notes: 'Will call back tomorrow'
  },
  {
    id: 5,
    name: 'Rajesh Verma',
    phone: '+91 54321 09876',
    area: 'Electronic City',
    carModel: 'Kia Seltos',
    leadType: 'Monthly',
    leadSource: 'Referral',
    assignedWasher: 'Rajesh',
    date: '2023-06-08',
    status: 'New',
    notes: 'Looking for monthly package for 2 cars'
  },
];

// Lead source options
const leadSourceOptions = [
  'Pamphlet', 'WhatsApp', 'Referral', 'Walk-in', 'Social Media', 'Website'
];

// Washer options
const washerOptions = [
  'Rahul', 'Suresh', 'Vikram', 'Anand', 'Rajesh'
];

const Leads = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [filters, setFilters] = useState({
    leadType: '',
    leadSource: '',
    status: '',
    dateRange: {
      start: '',
      end: ''
    }
  });
  
  // New lead form state
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    area: '',
    carModel: '',
    leadType: 'One-time',
    leadSource: '',
    assignedWasher: '',
    notes: ''
  });
  
  // Filtered leads
  const filteredLeads = leadData.filter(lead => {
    // Search filter
    if (searchQuery && !lead.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !lead.phone.includes(searchQuery) && 
        !lead.area.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filters.leadType && lead.leadType !== filters.leadType) {
      return false;
    }
    
    // Source filter
    if (filters.leadSource && lead.leadSource !== filters.leadSource) {
      return false;
    }
    
    // Status filter
    if (filters.status && lead.status !== filters.status) {
      return false;
    }
    
    // Date filter
    if (filters.dateRange.start && new Date(lead.date) < new Date(filters.dateRange.start)) {
      return false;
    }
    
    if (filters.dateRange.end && new Date(lead.date) > new Date(filters.dateRange.end)) {
      return false;
    }
    
    return true;
  });
  
  const handleFilterToggle = () => setFilterOpen(!filterOpen);
  const handleAddLeadToggle = () => setAddLeadOpen(!addLeadOpen);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [name]: value
      }
    });
  };
  
  const handleNewLeadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLead({
      ...newLead,
      [name]: value
    });
  };
  
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would make an API call to add the lead
    console.log('Adding new lead:', newLead);
    setAddLeadOpen(false);
    // Reset form
    setNewLead({
      name: '',
      phone: '',
      area: '',
      carModel: '',
      leadType: 'One-time',
      leadSource: '',
      assignedWasher: '',
      notes: ''
    });
  };
  
  const handleResetFilters = () => {
    setFilters({
      leadType: '',
      leadSource: '',
      status: '',
      dateRange: {
        start: '',
        end: ''
      }
    });
    setSearchQuery('');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your leads, track conversions, and assign washers.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={handleAddLeadToggle}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Lead
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button
              type="button"
              onClick={handleFilterToggle}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Filter className="-ml-0.5 mr-2 h-4 w-4" />
              Filters
              {Object.values(filters).some(val => val !== '' && (typeof val === 'string' ? val : Object.values(val).some(v => v !== ''))) && 
                <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>
              }
            </button>
          </div>
        </div>
        
        {/* Filter Panel */}
        {filterOpen && (
          <div className="p-4 border-b border-gray-200 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
            <div className="sm:col-span-1">
              <label htmlFor="leadType" className="block text-sm font-medium text-gray-700">
                Lead Type
              </label>
              <select
                id="leadType"
                name="leadType"
                value={filters.leadType}
                onChange={handleFilterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">All Types</option>
                <option value="Monthly">Monthly</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
            
            <div className="sm:col-span-1">
              <label htmlFor="leadSource" className="block text-sm font-medium text-gray-700">
                Lead Source
              </label>
              <select
                id="leadSource"
                name="leadSource"
                value={filters.leadSource}
                onChange={handleFilterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">All Sources</option>
                {leadSourceOptions.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            
            <div className="sm:col-span-1">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
              </select>
            </div>
            
            <div className="sm:col-span-1">
              <label htmlFor="start" className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                name="start"
                id="start"
                value={filters.dateRange.start}
                onChange={handleDateFilterChange}
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              />
            </div>
            
            <div className="sm:col-span-1">
              <label htmlFor="end" className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                name="end"
                id="end"
                value={filters.dateRange.end}
                onChange={handleDateFilterChange}
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              />
            </div>
            
            <div className="sm:col-span-1 flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Add Lead Form */}
        {addLeadOpen && (
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleAddLead}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={newLead.name}
                      onChange={handleNewLeadChange}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={newLead.phone}
                      onChange={handleNewLeadChange}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                    Area
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="area"
                      id="area"
                      value={newLead.area}
                      onChange={handleNewLeadChange}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="carModel" className="block text-sm font-medium text-gray-700">
                    Car Model
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Car className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="carModel"
                      id="carModel"
                      value={newLead.carModel}
                      onChange={handleNewLeadChange}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="leadType" className="block text-sm font-medium text-gray-700">
                    Lead Type
                  </label>
                  <select
                    id="leadType"
                    name="leadType"
                    value={newLead.leadType}
                    onChange={handleNewLeadChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  >
                    <option value="One-time">One-time</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="leadSource" className="block text-sm font-medium text-gray-700">
                    Lead Source
                  </label>
                  <select
                    id="leadSource"
                    name="leadSource"
                    value={newLead.leadSource}
                    onChange={handleNewLeadChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  >
                    <option value="">Select source</option>
                    {leadSourceOptions.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="assignedWasher" className="block text-sm font-medium text-gray-700">
                    Assigned Washer
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCheck className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="assignedWasher"
                      name="assignedWasher"
                      value={newLead.assignedWasher}
                      onChange={handleNewLeadChange}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="">Select washer</option>
                      {washerOptions.map(washer => (
                        <option key={washer} value={washer}>{washer}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={newLead.notes}
                    onChange={handleNewLeadChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleAddLeadToggle}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Leads List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Customer Info
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Type
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Source
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Car Model
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Assigned To
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Status
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-3 w-3 text-gray-400 mr-1" />
                            {lead.phone}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                            {lead.area}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TypeBadge type={lead.leadType} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.leadSource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.carModel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.assignedWasher}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        {new Date(lead.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-primary hover:text-primary-dark mr-3">
                        View
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No leads found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredLeads.length}</span> of{' '}
                <span className="font-medium">{filteredLeads.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-primary-dark">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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

export default Leads;