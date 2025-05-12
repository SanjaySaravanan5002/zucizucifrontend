import React from 'react';
import { Users, Calculator, TrendingUp, Calendar, BarChart3, DollarSign } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import LeadsChart from '../components/dashboard/LeadsChart';
import RecentLeadsList from '../components/dashboard/RecentLeadsList';
import PerformanceChart from '../components/dashboard/PerformanceChart';

const Dashboard = () => {
  const stats = [
    {
      title: 'Active Monthly Customers',
      value: '124',
      change: '+12%',
      increasing: true,
      icon: Users
    },
    {
      title: 'Total Income',
      value: '₹48,500',
      change: '+8%',
      increasing: true,
      icon: DollarSign
    },
    {
      title: 'Total Expenses',
      value: '₹18,200',
      change: '+3%',
      increasing: true,
      icon: Calculator
    },
    {
      title: 'Leads Today',
      value: '18',
      change: '-5%',
      increasing: false,
      icon: TrendingUp
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Weekly leads chart */}
        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Lead Acquisition</h3>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="p-5">
            <LeadsChart />
          </div>
        </div>

        {/* Washer performance */}
        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Washer Performance</h3>
              <p className="text-sm text-gray-500">Washes completed this month</p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="p-5">
            <PerformanceChart />
          </div>
        </div>
      </div>

      {/* Recent leads */}
      <div className="bg-white overflow-hidden rounded-lg shadow">
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Recent Leads</h3>
          <p className="text-sm text-gray-500">Your most recent lead inquiries</p>
        </div>
        <div className="overflow-x-auto">
          <RecentLeadsList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;