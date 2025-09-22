import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [washers, setWashers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    washerName: '',
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [netRevenue, setNetRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [filters, setFilters] = useState({
    name: '',
    reason: '',
    startDate: '',
    endDate: ''
  });
  
  // Check if user is admin (can only manage expenses, not view revenue)
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    fetchExpenses();
    if (isSuperAdmin) {
      fetchRevenue(); // Only superadmin can see revenue data
    }
    fetchWashers();
  }, [isSuperAdmin, filters]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.reason) params.append('reason', filters.reason);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await axios.get(`https://zuci-sbackend-12.onrender.com/api/expenses?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setExpenses(response.data.expenses || []);
      const total = response.data.expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0;
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      // Use the same API as Revenue tab - fetch all-time revenue without date filters
      const response = await axios.get('https://zuci-sbackend-12.onrender.com/api/reports/revenue_and_income', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Revenue API Response:', response.data);
      
      // Use the same totalRevenue and netRevenue fields as Revenue tab
      const revenue = response.data.totalRevenue || 0;
      const netRev = response.data.netRevenue || 0;
      const expenses = response.data.totalExpenses || 0;
      
      setTotalRevenue(revenue);
      setNetRevenue(netRev);
      setTotalExpenses(expenses);
      
      console.log('Total Revenue set to:', revenue);
      console.log('Net Revenue set to:', netRev);
      console.log('Total Expenses set to:', expenses);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      if (error.response?.status === 401) {
        console.error('Authentication failed - please login again');
      } else if (error.response?.status === 403) {
        console.error('Access denied - insufficient permissions');
      }
      setTotalRevenue(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchWashers = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await axios.get('https://zuci-sbackend-12.onrender.com/api/expenses/washers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setWashers(response.data.washers || []);
    } catch (error) {
      console.error('Error fetching washers:', error);
    }
  };

  const addExpense = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      await axios.post('https://zuci-sbackend-12.onrender.com/api/expenses', {
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNewExpense({ washerName: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
      setShowAddForm(false);
      fetchExpenses();
      // Revenue doesn't change when expenses are added, only expenses change
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      await axios.delete(`https://zuci-sbackend-12.onrender.com/api/expenses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchExpenses();
      // Revenue doesn't change when expenses are deleted, only expenses change
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const netProfit = netRevenue; // netRevenue already includes expenses calculation
  const profitPercentage = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
  const isProfit = netProfit >= 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses Management</h1>
          <p className="text-gray-600">
            {isAdmin ? 'Manage business expenses' : 'Track business expenses and profit/loss analysis'}
          </p>
        </div>
        <button
          onClick={() => {
            if (isSuperAdmin) {
              fetchRevenue();
            }
            fetchExpenses();
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary Cards - Only show for SuperAdmin */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-600">Gross Revenue</h3>
            </div>
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-lg font-bold text-blue-900">Loading...</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
            )}
            <p className="text-xs text-blue-600 mt-1">
              {totalRevenue > 0 ? 'From completed & paid washes' : 'No revenue yet - complete and mark washes as paid'}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-600">Total Expenses</h3>
            </div>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className={`p-4 rounded-lg ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center space-x-2">
              {isProfit ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <h3 className={`text-sm font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                Net {isProfit ? 'Profit' : 'Loss'}
              </h3>
            </div>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-900' : 'text-red-900'}`}>
              {formatCurrency(Math.abs(netProfit))}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center space-x-2">
              {isProfit ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <h3 className={`text-sm font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {isProfit ? 'Profit' : 'Loss'} %
              </h3>
            </div>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-900' : 'text-red-900'}`}>
              {Math.abs(profitPercentage).toFixed(1)}%
            </p>
          </div>
        </div>
      )}
      
      {/* Admin Summary - Only show total expenses */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-600">Total Expenses</h3>
            </div>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-red-600 mt-1">Expenses managed by admin</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-600">Expense Records</h3>
            </div>
            <p className="text-2xl font-bold text-blue-900">{expenses.length}</p>
            <p className="text-xs text-blue-600 mt-1">Total expense entries</p>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Filter Expenses</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Washer Name</label>
            <select
              value={filters.name}
              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Washers</option>
              {washers.map((washer) => (
                <option key={washer._id} value={washer.name}>
                  {washer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input
              type="text"
              placeholder="Filter by reason"
              value={filters.reason}
              onChange={(e) => setFilters(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({ name: '', reason: '', startDate: '', endDate: '' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Add Expense Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium">Expense Records</h3>
            {isAdmin && (
              <p className="text-sm text-gray-500 mt-1">
                Add and manage business expenses. Changes will be reflected in superadmin revenue calculations.
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={newExpense.washerName}
                onChange={(e) => setNewExpense(prev => ({ ...prev, washerName: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Washer Name</option>
                {washers.map((washer) => (
                  <option key={washer._id} value={washer.name}>
                    {washer.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Reason (e.g., Buy washing toolkit)"
                value={newExpense.reason}
                onChange={(e) => setNewExpense(prev => ({ ...prev, reason: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={addExpense}
                disabled={!newExpense.washerName || !newExpense.amount || !newExpense.reason}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Add Expense
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Washer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{expense.washerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{expense.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => deleteExpense(expense._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {expenses.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No expenses recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;

