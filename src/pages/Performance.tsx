import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Star, Award, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { apiService } from '../services/apiService';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface WasherPerformance {
  id: string;
  name: string;
  totalWashes: number;
  completedWashes: number;
  successRate: number;
  rating: number;
  attendancePercentage: number;
  earnings: number;
}

interface WasherPerformanceResponse {
  totalWashers: number;
  activeWashers: number;
  totalWashes: number;
  avgRating: number;
  avgAttendance: number;
  washers: WasherPerformance[];
}

const Performance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [washers, setWashers] = useState<WasherPerformance[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const mockData: WasherPerformance[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      totalWashes: 45,
      completedWashes: 42,
      rating: 4.8,
      earnings: 12600,
      attendanceRate: 95
    },
    {
      id: '2',
      name: 'Suresh Patel',
      totalWashes: 38,
      completedWashes: 36,
      rating: 4.6,
      earnings: 10800,
      attendanceRate: 92
    },
    {
      id: '3',
      name: 'Amit Singh',
      totalWashes: 52,
      completedWashes: 48,
      rating: 4.9,
      earnings: 14400,
      attendanceRate: 98
    },
    {
      id: '4',
      name: 'Vikram Sharma',
      totalWashes: 41,
      completedWashes: 39,
      rating: 4.5,
      earnings: 11700,
      attendanceRate: 89
    }
  ];

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        console.log('Fetching washer performance data...');
        
        // Try to fetch real data from API
        const result = await apiService.getWasherPerformance();
        console.log('API Response:', result);
        
        if (result.success && result.data && result.data.washers && Array.isArray(result.data.washers)) {
          console.log('Using real data:', result.data.washers);
          setWashers(result.data.washers);
        } else {
          console.log('Using mock data - API returned:', result);
          setWashers(mockData);
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
        console.log('Using mock data due to error');
        setWashers(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" variant="wash" />
      </div>
    );
  }

  const chartData = washers.map(washer => ({
    name: (washer.name || 'Unknown').split(' ')[0],
    washes: washer.completedWashes || 0,
    rating: washer.rating || 0,
    attendance: washer.attendancePercentage || 0
  }));

  return (
    <div className="min-h-screen py-8">
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="glass-card animate-slide-up p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Washer Performance</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Track and analyze washer performance metrics ({washers.length} washers found)
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  Data Source: {washers === mockData ? 'Mock Data' : 'Live API Data'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Active Washers</p>
                <p className="text-2xl font-semibold text-gray-900">{washers.length}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {washers === mockData ? 'Mock' : 'Live'} data
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Washes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {washers.reduce((sum, w) => sum + (w.completedWashes || 0), 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Completed this month
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {washers.length > 0 ? (washers.reduce((sum, w) => sum + (w.rating || 0), 0) / washers.length).toFixed(1) : '0.0'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Customer feedback
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Avg Attendance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {washers.length > 0 ? Math.round(washers.reduce((sum, w) => sum + (w.attendancePercentage || 0), 0) / washers.length) : 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  This month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Washer Performance Comparison</h3>
          {washers.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="washes" fill="#8884d8" name="Completed Washes" />
                  <Bar dataKey="attendance" fill="#82ca9d" name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No washer performance data available</p>
                <p className="text-sm">Add washers to see performance metrics</p>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Performance Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Performance</h3>
          </div>
          <div className="overflow-x-auto">
            {washers.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Washer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Washes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Earnings
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {washers.map((washer, index) => (
                    <tr key={washer.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {(washer.name || 'U').split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{washer.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {washer.totalWashes || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {washer.completedWashes || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (washer.successRate || 0) >= 90
                            ? 'bg-green-100 text-green-800'
                            : (washer.successRate || 0) >= 80
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {washer.successRate || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-900">{washer.rating || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (washer.attendancePercentage || 0) >= 95
                            ? 'bg-green-100 text-green-800'
                            : (washer.attendancePercentage || 0) >= 85
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {washer.attendancePercentage || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(washer.earnings || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No washer performance data available</p>
                <p className="text-sm text-gray-400 mt-2">Add washers and assign them to washes to see performance metrics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;