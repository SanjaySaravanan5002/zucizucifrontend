import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Filter, Search, Phone, Car, MapPin, 
  Calendar, User, UserCheck, ArrowUpDown 
} from 'lucide-react';
import TypeBadge from '../components/common/TypeBadge';
import StatusBadge from '../components/common/StatusBadge';

import axios from 'axios';

interface Lead {
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
}

const API_BASE_URL = 'http://localhost:5000/api';

// API functions
const api = {
  getLeads: async (filters: any) => {
    const response = await axios.get(`${API_BASE_URL}/leads`, { params: filters });
    return response.data;
  },
  createLead: async (leadData: any) => {
    const response = await axios.post(`${API_BASE_URL}/leads`, leadData);
    return response.data;
  },
  updateLead: async (id: number | string, updates: any) => {
    const response = await axios.put(`${API_BASE_URL}/leads/${id}`, updates);
    return response.data;
  },
  deleteLead: async (id: number | string) => {
    const response = await axios.delete(`${API_BASE_URL}/leads/${id}`);
    return response.data;
  },
  getLeadStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/leads/stats/overview`);
    return response.data;
  }
};

const Leads = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [filters, setFilters] = useState({
    leadType: '',
    leadSource: '',
    status: 'New',
    dateRange: {
      start: '',
      end: ''
    }
  });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Add OpenLayers CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/ol@v7.4.0/ol.css';
    document.head.appendChild(link);

    // Load OpenLayers script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/ol@v7.4.0/dist/ol.js';
    script.async = true;
    script.onload = () => {
      const { Map, View, Feature } = (window as any).ol;
      const { Tile } = (window as any).ol.layer;
      const { OSM } = (window as any).ol.source;
      const { Point } = (window as any).ol.geom;
      const { Vector: VectorLayer } = (window as any).ol.layer;
      const { Vector: VectorSource } = (window as any).ol.source;
      const { Style, Icon } = (window as any).ol.style;

      // Create map
      const initialMap = new Map({
        target: mapRef.current,
        layers: [
          new Tile({
            source: new OSM()
          })
        ],
        view: new View({
          center: [8897739.126, 1483919.412], // Chennai coordinates in Web Mercator
          zoom: 12
        })
      });

      // Create marker layer
      const markerFeature = new Feature({
        geometry: new Point([8897739.126, 1483919.412])
      });

      const markerStyle = new Style({
        image: new Icon({
          src: 'https://cdn.jsdelivr.net/npm/ol/examples/data/icon.png',
          scale: 0.7
        })
      });

      markerFeature.setStyle(markerStyle);

      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [markerFeature]
        })
      });

      initialMap.addLayer(vectorLayer);
      setMap(initialMap);
      setMarker(markerFeature);

      // Add click handler
      initialMap.on('click', (evt: any) => {
        const coords = evt.coordinate;
        markerFeature.getGeometry()?.setCoordinates(coords);
        // Convert to lat/lng
        const lonLat = (window as any).ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326');
        setNewLead(prev => ({
          ...prev,
          coordinates: lonLat
        }));
      });
    };

    document.body.appendChild(script);

    return () => {
      if (map) {
        map.setTarget(undefined);
      }
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  // New lead form state
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    area: '',
    carModel: '',
    leadType: 'One-time',
    leadSource: '',
    notes: '',
    coordinates: [0, 0]
  });
  
  // Initial state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Lead source options
  const leadSourceOptions = [
    'Pamphlet', 'WhatsApp', 'Referral', 'Walk-in', 'Social Media', 'Website'
  ];

  // Washer options
  const washerOptions = [
    'Rahul', 'Suresh', 'Vikram', 'Anand', 'Rajesh'
  ];

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {
        searchQuery,
        leadType: filters.leadType,
        leadSource: filters.leadSource,
        status: filters.status,
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end
      };
      const data = await api.getLeads(queryParams);
      setLeads(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getLeadStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
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
  
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead({
        name: newLead.name,
        phone: newLead.phone,
        area: newLead.area,
        carModel: newLead.carModel,
        leadType: newLead.leadType,
        leadSource: newLead.leadSource,
        notes: newLead.notes,
        coordinates: newLead.coordinates
      });
      
      setAddLeadOpen(false);
      // Reset form
      setNewLead({
        name: '',
        phone: '',
        area: '',
        carModel: '',
        leadType: 'One-time',
        leadSource: '',
        notes: '',
        coordinates: [0, 0]
      });
      
      // Refresh leads list
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
    }
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

  const handleUpdateLead = async (id: number, updates: any) => {
    try {
      setLoading(true);
      await api.updateLead(id, updates);
      fetchLeads();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      setLoading(true);
      await api.deleteLead(id);
      fetchLeads();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete lead');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen p-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Leads Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shadow-lg rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-white/20 rounded-md p-3 transition duration-300 ease-in-out transform group-hover:scale-110">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/90 truncate">Total Leads</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white transition-all duration-300 ease-in-out">{stats?.totalLeads || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shadow-lg rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-white/20 rounded-md p-3 transition duration-300 ease-in-out transform group-hover:scale-110">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/90 truncate">New Today</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white transition-all duration-300 ease-in-out">{stats?.newLeadsToday || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shadow-lg rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-white/20 rounded-md p-3 transition duration-300 ease-in-out transform group-hover:scale-110">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/90 truncate">Pending Follow-ups</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white transition-all duration-300 ease-in-out">{stats?.pendingFollowUps || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shadow-lg rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-white/20 rounded-md p-3 transition duration-300 ease-in-out transform group-hover:scale-110">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/90 truncate">Converted Leads</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white transition-all duration-300 ease-in-out">{stats?.convertedLeads || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-6 border border-white/50">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <UserCheck className="h-7 w-7 text-primary mr-2" />
              Leads Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Efficiently manage leads, track conversions, and assign washers to optimize your business workflow.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={handleAddLeadToggle}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add New Lead
            </button>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border border-white/50">
        <div className="p-6 border-b border-gray-200 sm:flex sm:items-center sm:justify-between bg-gray-50">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or area..."
              className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out sm:text-sm shadow-sm"
            />
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button
              type="button"
              onClick={handleFilterToggle}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ease-in-out"
            >
              <Filter className="-ml-0.5 mr-2 h-4 w-4" />
              Advanced Filters
              {Object.values(filters).some(val => val !== '' && (typeof val === 'string' ? val : Object.values(val).some(v => v !== ''))) && 
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">Active</span>
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
                  {/* <label htmlFor="assignedWasher" className="block text-sm font-medium text-gray-700">
                    Assigned Washer
                  </label> */}
                  {/* <div className="mt-1 relative rounded-md shadow-sm">
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
                  </div> */}
                </div>
                
                <div className="sm:col-span-6 space-y-4">
                  <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-md">
                    <div ref={mapRef} className="h-full w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Latitude</label>
                      <input
                        type="text"
                        value={newLead.coordinates[1] || ''}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Longitude</label>
                      <input
                        type="text"
                        value={newLead.coordinates[0] || ''}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                      />
                    </div>
                  </div>
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
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
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
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
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
                      {lead.assignedWasher?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button
                        onClick={() => navigate(`/user/${lead.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleUpdateLead(lead.id, { status: 'completed' })}
                        className="text-green-600 hover:text-green-900"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
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
                Showing <span className="font-medium">1</span> to <span className="font-medium">{leads.length}</span> of{' '}
                <span className="font-medium">{leads.length}</span> results
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