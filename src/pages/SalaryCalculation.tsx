import React, { useState, useEffect } from 'react';
import { Calculator, Download, User, Calendar, DollarSign, TrendingUp, Clock, ChevronDown, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { createStyledWorkbook } from '../utils/excelStyles';

interface SalaryData {
  washerId: string;
  washerName: string;
  baseSalary: number;
  bonus: number;
  washCount: number;
  presentDays: number;
  totalWorkingDays: number;
  attendancePercentage: string;
  expenses: number;
  lossOfPay: number;
  totalSalary: number;
  month: number;
  year: number;
}

interface ExpenseDetail {
  reason: string;
  amount: number;
  expenseIds: string[];
}

const ExpenseDropdown: React.FC<{ washerId: string; month: number; year: number; onExpenseDeleted?: () => void }> = ({ washerId, month, year, onExpenseDeleted }) => {
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `https://zuci-sbackend-12.onrender.com/api/expenses/washer/${washerId}?month=${month}&year=${year}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Group expenses by reason and sum amounts, keep expense IDs for deletion
      const groupedExpenses = response.data.reduce((acc, expense) => {
        const reason = expense.reason || 'Other';
        if (!acc[reason]) {
          acc[reason] = { reason, amount: 0, expenseIds: [] };
        }
        acc[reason].amount += expense.amount;
        acc[reason].expenseIds.push(expense._id);
        return acc;
      }, {});
      
      setExpenses(Object.values(groupedExpenses));
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpenseGroup = async (expenseIds: string[]) => {
    try {
      const token = localStorage.getItem('auth_token');
      await Promise.all(
        expenseIds.map(id => 
          axios.delete(
            `https://zuci-sbackend-12.onrender.com/api/expenses/${id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
        )
      );
      toast.success('Expenses deleted successfully');
      fetchExpenses();
      // Refresh salary data when expenses are deleted
      if (onExpenseDeleted) {
        onExpenseDeleted();
      }
    } catch (error) {
      toast.error('Failed to delete expenses');
    }
  };

  useEffect(() => {
    if (showDropdown) {
      fetchExpenses();
    }
  }, [showDropdown, washerId, month, year]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
      >
        <span>View</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Expenses</h4>
            {loading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : expenses.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {expenses.map((expense) => (
                  <div key={expense.reason} className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium">{expense.reason}</div>
                      <div className="text-gray-500">₹{expense.amount}</div>
                    </div>
                    <button
                      onClick={() => deleteExpenseGroup(expense.expenseIds)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No expenses</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SalaryCalculation: React.FC = () => {
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    washerId: ''
  });
  const [washers, setWashers] = useState<any[]>([]);

  useEffect(() => {
    fetchWashers();
    fetchSalaryData();
  }, []);

  useEffect(() => {
    fetchSalaryData();
  }, [filters]);

  const fetchWashers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('https://zuci-sbackend-12.onrender.com/api/washer/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setWashers(response.data);
    } catch (error) {
      console.error('Error fetching washers:', error);
    }
  };

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        month: filters.month.toString(),
        year: filters.year.toString(),
        ...(filters.washerId && { washerId: filters.washerId })
      });

      const response = await axios.get(
        `https://zuci-sbackend-12.onrender.com/api/expenses/salary-calculation?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setSalaryData(response.data.salaryData || []);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast.error('Failed to fetch salary data');
      setSalaryData([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadSalaryReport = () => {
    if (salaryData.length === 0) return;

    const monthName = new Date(0, filters.month - 1).toLocaleString('default', { month: 'long' });
    generateExcelReport(monthName);
  };

  const generateExcelReport = (monthName: string) => {
    const title = `Salary Report - ${monthName} ${filters.year}`;
    const headers = ['Washer Name', 'Base Salary', 'Washes', 'Present Days', 'Total Days', 'Attendance %', 'Loss of Pay', 'Expenses', 'Total Salary'];
    
    const data = salaryData.map(washer => [
      washer.washerName,
      washer.baseSalary,
      washer.washCount,
      washer.presentDays,
      washer.totalWorkingDays,
      parseFloat(washer.attendancePercentage) / 100,
      washer.lossOfPay,
      washer.expenses,
      washer.totalSalary
    ]);
    
    const analyticsData = [
      { label: 'Total Washers', value: salaryData.length },
      { label: 'Total Washes Completed', value: salaryData.reduce((sum, w) => sum + w.washCount, 0) },
      { label: 'Total Loss of Pay', value: salaryData.reduce((sum, w) => sum + w.lossOfPay, 0) },
      { label: 'Total Expenses', value: salaryData.reduce((sum, w) => sum + w.expenses, 0) },
      { label: 'Total Salary Expense', value: salaryData.reduce((sum, w) => sum + w.totalSalary, 0) },
      { label: 'Average Salary per Washer', value: salaryData.length > 0 ? Math.round(salaryData.reduce((sum, w) => sum + w.totalSalary, 0) / salaryData.length) : 0 },
      { label: 'Highest Salary', value: Math.max(...salaryData.map(w => w.totalSalary)) },
      { label: 'Lowest Salary', value: Math.min(...salaryData.map(w => w.totalSalary)) }
    ];
    
    const { wb, ws } = createStyledWorkbook(title, headers, data, analyticsData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Report');
    XLSX.writeFile(wb, `Salary-Report-${monthName}-${filters.year}.xlsx`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const totalSalaryExpense = salaryData.reduce((sum, washer) => sum + washer.totalSalary, 0);
  const totalWashesCompleted = salaryData.reduce((sum, washer) => sum + washer.washCount, 0);
  const totalExpenses = salaryData.reduce((sum, washer) => sum + washer.expenses, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Calculator className="h-6 w-6" />
            <span>Salary Calculation</span>
          </h1>
          <p className="text-gray-600">Calculate and manage washer salaries based on performance</p>
        </div>
        <button
          onClick={downloadSalaryReport}
          disabled={salaryData.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Filter Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Washer</label>
            <select
              value={filters.washerId}
              onChange={(e) => setFilters(prev => ({ ...prev, washerId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Washers</option>
              {washers.map((washer) => (
                <option key={washer._id} value={washer._id}>
                  {washer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), washerId: '' })}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-600">Total Washers</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">{salaryData.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-medium text-green-600">Total Salary Expense</h3>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totalSalaryExpense)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h3 className="text-sm font-medium text-purple-600">Total Washes</h3>
          </div>
          <p className="text-2xl font-bold text-purple-900">{totalWashesCompleted}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <h3 className="text-sm font-medium text-orange-600">Total Expenses</h3>
          </div>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(salaryData.reduce((sum, w) => sum + w.expenses, 0))}</p>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Salary Breakdown - {new Date(0, filters.month - 1).toLocaleString('default', { month: 'long' })} {filters.year}
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : salaryData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Washer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Washes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Salary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryData.map((washer) => (
                  <tr key={washer.washerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{washer.washerName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(washer.baseSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {washer.washCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {washer.presentDays}/{washer.totalWorkingDays} days
                      </div>
                      <div className="text-sm text-gray-500">
                        {washer.attendancePercentage}%
                      </div>
                      {washer.lossOfPay > 0 && (
                        <div className="text-xs text-red-600">
                          Loss: {formatCurrency(washer.lossOfPay)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(washer.expenses)}
                      </div>
                      <ExpenseDropdown 
                        washerId={washer.washerId} 
                        month={filters.month} 
                        year={filters.year} 
                        onExpenseDeleted={fetchSalaryData}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-900">
                        {formatCurrency(washer.totalSalary)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Data</h3>
            <p className="text-gray-500">No salary data found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryCalculation;
