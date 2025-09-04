import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Filter, Search, Phone, Car, MapPin, 
  Calendar, User, UserCheck, ArrowUpDown, Edit 
} from 'lucide-react';
import TypeBadge from '../components/common/TypeBadge';
import StatusBadge from '../components/common/StatusBadge';
import GPSMapPicker from '../components/GPSMapPicker';
import { useToast } from '../contexts/ToastContext';

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

const API_BASE_URL = 'https://zuci-sbackend.onrender.com/api';

// API functions with authentication
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const api = {
  getLeads: async (filters: any) => {
    const response = await axios.get(`${API_BASE_URL}/leads`, { 
      params: filters,
      headers: getAuthHeaders()
    });
    return response.data;
  },
  createLead: async (leadData: any) => {
    const response = await axios.post(`${API_BASE_URL}/leads`, leadData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },
  updateLead: async (id: number | string, updates: any) => {
    const response = await axios.put(`${API_BASE_URL}/leads/${id}`, updates, {
      headers: getAuthHeaders()
    });
    return response.data;
  },
  deleteLead: async (id: number | string) => {
    const response = await axios.delete(`${API_BASE_URL}/leads/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },
  getLeadStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/leads/stats/overview`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

const Leads = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [locationTab, setLocationTab] = useState<'current'>('current');
  const [filters, setFilters] = useState({
    leadType: '',
    leadSource: '',
    status: '',
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
    vehicleNumber: '',
    leadType: 'One-time',
    leadSource: '',
    notes: '',
    coordinates: [80.2707, 13.0827] // [lng, lat] format for backend
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

  // Washer state
  const [washers, setWashers] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedWasher, setSelectedWasher] = useState<string>('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    packageType: 'Basic',
    scheduledDates: ['', '', '']
  });
  const [showOneTimeModal, setShowOneTimeModal] = useState(false);
  const [oneTimeData, setOneTimeData] = useState({
    washType: 'Basic',
    amount: '',
    scheduledDate: '',
    washerId: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);

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
      // Filter out converted leads from the frontend display
      const filteredData = data.filter(lead => lead.status !== 'Converted');
      setLeads(filteredData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getLeadStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch washers (only active ones for assignment)
  const fetchWashers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/washer/list?forAssignment=true`, {
        headers: getAuthHeaders()
      });
      setWashers(response.data);
    } catch (err) {
      console.error('Failed to fetch washers:', err);
    }
  }, []);

  // Load data on mount only
  useEffect(() => {
    fetchLeads();
    fetchWashers();
  }, []);

  // Manual refresh when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLeads();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters.leadType, filters.leadSource, filters.status, filters.dateRange.start, filters.dateRange.end]);

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
  
  // Geocoding function to get coordinates from area name
  const getCoordinatesFromArea = async (areaName: string) => {
    try {
      // Common Chennai areas with their coordinates
      const chennaiAreas: { [key: string]: [number, number] } = {
        'adyar': [80.2574, 13.0067],
        'anna nagar': [80.2093, 13.0850],
        'besant nagar': [80.2669, 13.0067],
        'chrompet': [80.1462, 12.9516],
        'egmore': [80.2609, 13.0732],
        'guindy': [80.2206, 13.0067],
        'kodambakkam': [80.2248, 13.0524],
        'mylapore': [80.2707, 13.0339],
        'nungambakkam': [80.2403, 13.0594],
        'porur': [80.1564, 13.0381],
        't nagar': [80.2340, 13.0418],
        'tambaram': [80.1000, 12.9249],
        'velachery': [80.2206, 12.9759],
        'anna salai': [80.2707, 13.0827],
        'omr': [80.2707, 12.8797],
        'ecr': [80.2707, 12.7797]
      };
      
      const normalizedArea = areaName.toLowerCase().trim();
      const coordinates = chennaiAreas[normalizedArea];
      
      if (coordinates) {
        return coordinates;
      }
      
      // Default to Chennai center if area not found
      return [80.2707, 13.0827];
    } catch (error) {
      console.error('Geocoding error:', error);
      return [80.2707, 13.0827]; // Default Chennai coordinates
    }
  };

  const handleNewLeadChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'area' && value.trim()) {
      // Auto-geocode when area is entered
      const coordinates = await getCoordinatesFromArea(value);
      setNewLead({
        ...newLead,
        [name]: value,
        coordinates: coordinates
      });
      
      // Update map marker if map is loaded
      if (map && marker && (window as any).ol) {
        const { transform } = (window as any).ol.proj;
        const webMercatorCoords = transform(coordinates, 'EPSG:4326', 'EPSG:3857');
        marker.getGeometry()?.setCoordinates(webMercatorCoords);
        map.getView().setCenter(webMercatorCoords);
      }
    } else {
      setNewLead({
        ...newLead,
        [name]: value
      });
    }
  };
  
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newLead.name || !newLead.phone || !newLead.area || !newLead.carModel || !newLead.leadSource) {
      showToast('error', 'Please fill in all required fields');
      return;
    }
    
    try {
      const leadData = {
        name: newLead.name,
        phone: newLead.phone,
        area: newLead.area,
        carModel: newLead.carModel,
        vehicleNumber: newLead.vehicleNumber,
        leadType: newLead.leadType,
        leadSource: newLead.leadSource,
        notes: newLead.notes,
        coordinates: newLead.coordinates
      };
      
      console.log('Creating lead with data:', leadData);
      await api.createLead(leadData);
      
      showToast('success', 'Lead created successfully!');
      setAddLeadOpen(false);
      
      // Reset form
      setNewLead({
        name: '',
        phone: '',
        area: '',
        carModel: '',
        vehicleNumber: '',
        leadType: 'One-time',
        leadSource: '',
        notes: '',
        coordinates: [80.2707, 13.0827]
      });
      
      // Refresh leads list
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      console.error('Lead creation error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create lead';
      showToast('error', errorMessage);
      setError(errorMessage);
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
    
    // Store original leads for potential restoration
    const originalLeads = [...leads];
    
    try {
      // Immediately remove from UI for better UX
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
      
      await api.deleteLead(id);
      showToast('success', 'Lead deleted successfully');
      setError(null);
    } catch (err: any) {
      // Restore the original leads if deletion failed
      setLeads(originalLeads);
      showToast('error', err.message || 'Failed to delete lead');
      setError(err.message || 'Failed to delete lead');
    }
  };

  const handleAssignWasher = async () => {
    if (!selectedLead || !selectedWasher) return;
    
    try {
      await axios.put(`${API_BASE_URL}/leads/${selectedLead.id}/assign`, {
        washerId: selectedWasher
      }, {
        headers: getAuthHeaders()
      });
      setShowAssignModal(false);
      setSelectedLead(null);
      setSelectedWasher('');
      fetchLeads();
    } catch (err: any) {
      setError(err.message || 'Failed to assign washer');
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedLead) return;
    
    const validDates = subscriptionData.scheduledDates.filter(date => date !== '');
    const packageDetails = {
      'Basic': 3,
      'Premium': 4,
      'Deluxe': 5
    };
    
    if (validDates.length !== packageDetails[subscriptionData.packageType]) {
      showToast('warning', `Please select ${packageDetails[subscriptionData.packageType]} dates for ${subscriptionData.packageType} package`);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/leads/${selectedLead.id}/monthly-subscription`, {
        packageType: subscriptionData.packageType,
        scheduledDates: validDates
      }, {
        headers: getAuthHeaders()
      });
      
      setShowSubscriptionModal(false);
      setSelectedLead(null);
      setSubscriptionData({
        packageType: 'Basic',
        scheduledDates: ['', '', '']
      });
      fetchLeads();
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
    }
  };

  const handleAssignOneTimeWash = async () => {
    if (!selectedLead || !oneTimeData.washType || !oneTimeData.amount || !oneTimeData.scheduledDate || !oneTimeData.washerId) {
      showToast('warning', 'Please fill all fields');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/leads/${selectedLead.id}/assign-onetime`, {
        washType: oneTimeData.washType,
        amount: parseFloat(oneTimeData.amount),
        scheduledDate: oneTimeData.scheduledDate,
        washerId: oneTimeData.washerId
      }, {
        headers: getAuthHeaders()
      });
      
      setShowOneTimeModal(false);
      setSelectedLead(null);
      setOneTimeData({
        washType: 'Basic',
        amount: '',
        scheduledDate: '',
        washerId: ''
      });
      fetchLeads();
    } catch (err: any) {
      setError(err.message || 'Failed to assign one-time wash');
    }
  };
  
  return (
    <div className="space-y-6 min-h-screen p-6">
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
      <div className="glass-card animate-slide-up p-6 mb-6">
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
              className="btn-primary btn-liquid animate-pulse-glow"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add New Lead
            </button>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="glass-card floating-card animate-fade-in-up">
        <div className="p-6 border-b border-white/20 sm:flex sm:items-center sm:justify-between bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm rounded-t-xl">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or area..."
              className="block w-full pl-11 pr-4 py-3 border border-white/30 rounded-lg leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out sm:text-sm shadow-sm"
            />
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button
              type="button"
              onClick={handleFilterToggle}
              className="inline-flex items-center px-4 py-2.5 border border-white/30 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ease-in-out"
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
                      placeholder="e.g., T Nagar, Anna Nagar, Adyar"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    {newLead.area && (
                      <div className="mt-1 text-xs text-green-600 flex items-center">
                        📍 Coordinates auto-populated for {newLead.area}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="sm:col-span-2">
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
                  <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">
                    Vehicle Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Car className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="vehicleNumber"
                      id="vehicleNumber"
                      value={newLead.vehicleNumber}
                      onChange={handleNewLeadChange}
                      placeholder="e.g., TN01AB1234"
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
                  {newLead.leadSource === 'Website' && (
                    <div className="mt-1 text-xs text-green-600">
                      ✓ Website leads are automatically processed
                    </div>
                  )}
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
                  {/* Location Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Location Selection
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((position) => {
                              const lat = position.coords.latitude;
                              const lng = position.coords.longitude;
                              setNewLead(prev => ({
                                ...prev,
                                coordinates: [lng, lat]
                              }));
                            });
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                      >
                        📍 Use Current Location
                      </button>
                    </div>
                    <GPSMapPicker
                      onLocationSelect={(lat, lng) => {
                        setNewLead(prev => ({
                          ...prev,
                          coordinates: [lng, lat]
                        }));
                      }}
                      initialLat={newLead.coordinates[1]}
                      initialLng={newLead.coordinates[0]}
                    />

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
                      <div className="flex items-center justify-between">
                        <span>{lead.assignedWasher?.name || 'Unassigned'}</span>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowAssignModal(true);
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                        >
                          {lead.assignedWasher ? 'Reassign' : 'Assign'}
                        </button>
                      </div>
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
                        onClick={() => {
                          setEditLead(lead);
                          setShowEditModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Lead"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/user/${lead.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
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

      {/* Assign Washer Modal */}
      {showAssignModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Washer to {selectedLead.customerName}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Washer
              </label>
              <select
                value={selectedWasher}
                onChange={(e) => setSelectedWasher(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">Select a washer</option>
                {washers.map((washer) => (
                  <option key={washer.id} value={washer.id}>
                    {washer.name} (ID: {washer.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedLead(null);
                  setSelectedWasher('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignWasher}
                disabled={!selectedWasher}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign One-Time Wash Modal */}
      {showOneTimeModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign One-Time Wash for {selectedLead.customerName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wash Type</label>
                <select
                  value={oneTimeData.washType}
                  onChange={(e) => setOneTimeData({...oneTimeData, washType: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={oneTimeData.amount}
                  onChange={(e) => setOneTimeData({...oneTimeData, amount: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                <input
                  type="date"
                  value={oneTimeData.scheduledDate}
                  onChange={(e) => setOneTimeData({...oneTimeData, scheduledDate: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Washer</label>
                <select
                  value={oneTimeData.washerId}
                  onChange={(e) => setOneTimeData({...oneTimeData, washerId: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="">Select a washer</option>
                  {washers.map((washer) => (
                    <option key={washer.id} value={washer.id}>
                      {washer.name} (ID: {washer.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowOneTimeModal(false);
                  setSelectedLead(null);
                  setOneTimeData({
                    washType: 'Basic',
                    amount: '',
                    scheduledDate: '',
                    washerId: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOneTimeWash}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Assign Wash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Subscription Modal */}
      {showSubscriptionModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create Monthly Package for {selectedLead.customerName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Type</label>
                <select
                  value={subscriptionData.packageType}
                  onChange={(e) => {
                    const newPackageType = e.target.value;
                    const washCounts = { 'Basic': 3, 'Premium': 4, 'Deluxe': 5 };
                    const newDates = Array(washCounts[newPackageType]).fill('');
                    setSubscriptionData({packageType: newPackageType, scheduledDates: newDates});
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="Basic">Basic (3 washes - ₹300)</option>
                  <option value="Premium">Premium (4 washes - ₹400)</option>
                  <option value="Deluxe">Deluxe (5 washes - ₹500)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Wash Dates
                </label>
                <div className="space-y-2">
                  {subscriptionData.scheduledDates.map((date, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm w-16">Wash {index + 1}:</span>
                      <input 
                        type="date" 
                        value={date}
                        onChange={(e) => {
                          const newDates = [...subscriptionData.scheduledDates];
                          newDates[index] = e.target.value;
                          setSubscriptionData({...subscriptionData, scheduledDates: newDates});
                        }}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSelectedLead(null);
                  setSubscriptionData({
                    packageType: 'Basic',
                    scheduledDates: ['', '', '']
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubscription}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditModal && editLead && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Lead - {editLead.customerName}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateLead(editLead.id, {
                name: editLead.customerName,
                phone: editLead.phone,
                area: editLead.area,
                carModel: editLead.carModel,
                leadType: editLead.leadType,
                leadSource: editLead.leadSource,
                notes: editLead.notes,
                status: editLead.status
              });
              setShowEditModal(false);
              setEditLead(null);
            }}>
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={editLead.customerName}
                    onChange={(e) => setEditLead({...editLead, customerName: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editLead.phone}
                    onChange={(e) => setEditLead({...editLead, phone: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    value={editLead.area}
                    onChange={(e) => setEditLead({...editLead, area: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Car Model
                  </label>
                  <input
                    type="text"
                    value={editLead.carModel}
                    onChange={(e) => setEditLead({...editLead, carModel: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Type
                  </label>
                  <select
                    value={editLead.leadType}
                    onChange={(e) => setEditLead({...editLead, leadType: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="One-time">One-time</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={editLead.leadSource}
                    onChange={(e) => setEditLead({...editLead, leadSource: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    {leadSourceOptions.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editLead.status}
                    onChange={(e) => setEditLead({...editLead, status: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editLead.notes || ''}
                    onChange={(e) => setEditLead({...editLead, notes: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditLead(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
