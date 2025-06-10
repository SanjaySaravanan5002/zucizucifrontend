import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, BarChart3, DollarSign, Target, Loader2, Star, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../components/dashboard/StatsCard';
import LeadsChart from '../components/dashboard/LeadsChart';
import RecentLeadsList from '../components/dashboard/RecentLeadsList';
import PerformanceChart from '../components/dashboard/PerformanceChart';

interface WasherAttendance {
  name: string;
  presentDays: number;
  attendancePercentage: string;
}

interface ServiceRevenue {
  serviceType: string;
  revenue: number;
}

interface LeadSource {
  source: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: string;
}

interface AreaDistribution {
  area: string;
  totalLeads: number;
  activeCustomers: number;
}

interface FeedbackAnalytics {
  totalServices: number;
  feedbackReceived: number;
  feedbackRate: string;
}

interface WashCount {
  todayCount: number;
  tomorrowCount: number;
}

interface DashboardStats {
  monthlyCustomers: {
    value: number;
    change: number;
    increasing: boolean;
  };
  income: {
    value: number;
    change: number;
    increasing: boolean;
  };
  todayLeads: {
    value: number;
    change: number;
    increasing: boolean;
  };
  conversionRate: {
    value: number;
    total: number;
    converted: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState('1m');
  const [washerAttendance, setWasherAttendance] = useState<WasherAttendance[]>([]);
  const [serviceRevenue, setServiceRevenue] = useState<ServiceRevenue[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [areaDistribution, setAreaDistribution] = useState<AreaDistribution[]>([]);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [washCount, setWashCount] = useState<WashCount>({ todayCount: 0, tomorrowCount: 0 });
  const [stats, setStats] = useState<DashboardStats>({
    monthlyCustomers: { value: 0, change: 0, increasing: true },
    income: { value: 0, change: 0, increasing: true },
    todayLeads: { value: 0, change: 0, increasing: true },
    conversionRate: { value: 0, total: 0, converted: 0 }
  });

  const [statCards, setStatCards] = useState([
    {
      title: 'Active Monthly Customers',
      value: '0',
      change: '0%',
      increasing: true,
      icon: Users,
      description: 'Customers with active washes this month'
    },
    {
      title: 'Monthly Revenue',
      value: '₹0',
      change: '0%',
      increasing: true,
      icon: DollarSign,
      description: 'Total revenue from completed washes'
    },
    {
      title: 'Today\'s Leads',
      value: '0',
      change: '0%',
      increasing: true,
      icon: TrendingUp,
      description: 'New lead inquiries today'
    },
    {
      title: 'Conversion Rate',
      value: '0%',
      subtitle: '0 of 0 leads',
      icon: Target,
      description: 'Leads converted to customers this month'
    },
  ]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [washerData, revenueData, sourcesData, areaData, feedbackData, washCountData] = await Promise.all([
          fetch('http://localhost:5000/api/dashboard/washer-attendance').then(res => res.json()),
          fetch('http://localhost:5000/api/dashboard/revenue-by-service').then(res => res.json()),
          fetch('http://localhost:5000/api/dashboard/lead-sources').then(res => res.json()),
          fetch('http://localhost:5000/api/dashboard/area-distribution').then(res => res.json()),
          fetch('http://localhost:5000/api/dashboard/feedback-analytics').then(res => res.json()),
          fetch('http://localhost:5000/api/dashboard/today-tomorrow-wash-count').then(res => res.json())
        ]);

        setWasherAttendance(washerData);
        setServiceRevenue(revenueData);
        setLeadSources(sourcesData);
        setAreaDistribution(areaData);
        setFeedbackAnalytics(feedbackData);
        setWashCount(washCountData);
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRangeText = (range: string) => {
    switch (range) {
      case '1d': return 'Last 24 hours';
      case '3d': return 'Last 3 days';
      case '5d': return 'Last 5 days';
      case '7d': return 'Last 7 days';
      case '2w': return 'Last 2 weeks';
      case '1m': return 'Last month';
      case '3m': return 'Last 3 months';
      default: return 'Last month';
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track your business performance and key metrics in real-time
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedRange}
              onChange={(e) => {
                setSelectedRange(e.target.value);
                // Immediately fetch new stats when range changes
                fetch(`http://localhost:5000/api/dashboard/stats?range=${e.target.value}`)
                  .then(res => res.json())
                  .then(data => {
                    setStats(data);
                    setStatCards([
                      {
                        title: 'Active Customers',
                        value: data.periodCustomers.value.toString(),
                        change: `${data.periodCustomers.change}%`,
                        increasing: data.periodCustomers.increasing,
                        icon: Users,
                        description: `Customers with active washes in ${getRangeText(e.target.value).toLowerCase()}`
                      },
                      {
                        title: 'Revenue',
                        value: `₹${data.income.value.toLocaleString()}`,
                        change: `${data.income.change}%`,
                        increasing: data.income.increasing,
                        icon: DollarSign,
                        description: `Total revenue from completed washes in ${getRangeText(e.target.value).toLowerCase()}`
                      },
                      {
                        title: 'Today\'s Leads',
                        value: data.todayLeads.value.toString(),
                        change: `${data.todayLeads.change}%`,
                        increasing: data.todayLeads.increasing,
                        icon: TrendingUp,
                        description: 'New lead inquiries today'
                      },
                      {
                        title: 'Conversion Rate',
                        value: `${data.conversionRate.value}%`,
                        subtitle: `${data.conversionRate.converted} of ${data.conversionRate.total} leads`,
                        icon: Target,
                        description: `Leads converted to customers in ${getRangeText(e.target.value).toLowerCase()}`
                      },
                    ]);
                  })
                  .catch(error => {
                    console.error('Error fetching dashboard stats:', error);
                    setError('Failed to load dashboard statistics');
                  });
              }}
              className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="1d">Last 24 hours</option>
              <option value="3d">Last 3 days</option>
              <option value="5d">Last 5 days</option>
              <option value="7d">Last 7 days</option>
              <option value="2w">Last 2 weeks</option>
              <option value="1m">Last month</option>
              <option value="3m">Last 3 months</option>
            </select>
          </div>
          {/* <div className="flex items-center space-x-3">
            <select className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
              <option>Last month</option>
            </select>
            <button className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              <Calendar className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Custom Range
            </button>
          </div> */}
        </div>
      </div>

      {/* Wash Count Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 mb-6">
        <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Today's Washes</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{washCount.todayCount}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Tomorrow's Washes</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{washCount.tomorrowCount}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
        {/* Washer Attendance Chart */}
        <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Washer Attendance</h3>
                <p className="text-sm text-gray-500">Monthly attendance statistics</p>
              </div>
            </div>
          </div>
          <div className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={washerAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="presentDays" fill="#8884d8" name="Present Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Service Chart */}
        <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue by Service</h3>
                <p className="text-sm text-gray-500">Monthly revenue breakdown</p>
              </div>
            </div>
          </div>
          <div className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceRevenue}
                  dataKey="revenue"
                  nameKey="serviceType"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {serviceRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Chart */}
        <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
                <p className="text-sm text-gray-500">Conversion rates by source</p>
              </div>
            </div>
          </div>
          <div className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadSources}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalLeads" fill="#8884d8" name="Total Leads" />
                <Bar dataKey="convertedLeads" fill="#82ca9d" name="Converted Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Distribution Chart */}
        <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Area Distribution</h3>
                <p className="text-sm text-gray-500">Leads and customers by area</p>
              </div>
            </div>
          </div>
          <div className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalLeads" fill="#8884d8" name="Total Leads" />
                <Bar dataKey="activeCustomers" fill="#82ca9d" name="Active Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Analytics Card */}
        {feedbackAnalytics && (
          <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Customer Feedback</h3>
                  <p className="text-sm text-gray-500">Monthly feedback statistics</p>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{feedbackAnalytics.totalServices}</div>
                <div className="text-sm text-gray-500">Total Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{feedbackAnalytics.feedbackReceived}</div>
                <div className="text-sm text-gray-500">Feedback Received</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{feedbackAnalytics.feedbackRate}%</div>
                <div className="text-sm text-gray-500">Feedback Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
        {/* Weekly leads chart */}
        <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lead Acquisition</h3>
                <p className="text-sm text-gray-500">Last 7 days performance</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                  <span className="text-sm text-gray-600">Monthly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-gray-600">One-time</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <LeadsChart />
          </div>
        </div>

        {/* Washer performance */}
        <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Washer Performance</h3>
                <p className="text-sm text-gray-500">Top performers this month</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  <BarChart3 className="h-5 w-5 mr-1" />
                  View Details
                </button>
              </div>
            </div>
          </div>
          <div className="p-5">
            <PerformanceChart />
          </div>
        </div>
      </div>

      {/* Recent leads section */}
      <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200 mt-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
              <p className="text-sm text-gray-500">Your most recent lead inquiries</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">
                  {stats.todayLeads.value} new today
                </span>
              </div>
              <button className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View All Leads
                <svg className="ml-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <RecentLeadsList />
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;