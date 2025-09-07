import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const MonthlyCustomerDebug: React.FC = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPIs = async () => {
    setLoading(true);
    try {
      const results = {
        upcomingWashes: null,
        scheduledWashes: null,
        allLeads: null,
        connectivity: null
      };

      // Test connectivity
      try {
        const connectTest = await apiService.testConnection();
        results.connectivity = connectTest;
      } catch (error) {
        results.connectivity = { success: false, error: 'Connection failed' };
      }

      // Test upcoming washes
      try {
        const token = localStorage.getItem('auth_token');
        const upcomingResponse = await fetch('https://zuci-sbackend.onrender.com/api/leads/upcoming-washes?date=today', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const upcomingData = await upcomingResponse.json();
        results.upcomingWashes = {
          success: upcomingResponse.ok,
          data: upcomingData,
          monthlyCount: Array.isArray(upcomingData) ? upcomingData.filter(c => c.leadType === 'Monthly').length : 0
        };
      } catch (error) {
        results.upcomingWashes = { success: false, error: error.message };
      }

      // Test scheduled washes
      try {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const scheduledRes = await apiService.get(`/schedule/scheduled-washes?startDate=${today.toISOString()}&endDate=${nextWeek.toISOString()}`);
        results.scheduledWashes = {
          ...scheduledRes,
          monthlyCount: scheduledRes.success && Array.isArray(scheduledRes.data) ? 
            scheduledRes.data.filter(w => w.leadType === 'Monthly').length : 0
        };
      } catch (error) {
        results.scheduledWashes = { success: false, error: error.message };
      }

      // Test all leads
      try {
        const leadsRes = await apiService.get('/leads');
        results.allLeads = {
          ...leadsRes,
          monthlyCount: leadsRes.success && Array.isArray(leadsRes.data) ? 
            leadsRes.data.filter(l => l.leadType === 'Monthly').length : 0
        };
      } catch (error) {
        results.allLeads = { success: false, error: error.message };
      }

      setDebugData(results);
    } catch (error) {
      console.error('Debug test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPIs();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 m-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Monthly Customer Debug Panel</h3>
        <button
          onClick={testAPIs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Refresh Tests'}
        </button>
      </div>

      {debugData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 border rounded">
              <h4 className="font-medium text-sm">API Connectivity</h4>
              <div className={`text-xs ${debugData.connectivity?.success ? 'text-green-600' : 'text-red-600'}`}>
                {debugData.connectivity?.success ? '✓ Connected' : '✗ Failed'}
              </div>
            </div>

            <div className="p-3 border rounded">
              <h4 className="font-medium text-sm">Upcoming Washes</h4>
              <div className={`text-xs ${debugData.upcomingWashes?.success ? 'text-green-600' : 'text-red-600'}`}>
                {debugData.upcomingWashes?.success ? 
                  `✓ ${debugData.upcomingWashes.monthlyCount} Monthly` : 
                  '✗ Failed'}
              </div>
            </div>

            <div className="p-3 border rounded">
              <h4 className="font-medium text-sm">Scheduled Washes</h4>
              <div className={`text-xs ${debugData.scheduledWashes?.success ? 'text-green-600' : 'text-red-600'}`}>
                {debugData.scheduledWashes?.success ? 
                  `✓ ${debugData.scheduledWashes.monthlyCount} Monthly` : 
                  '✗ Failed'}
              </div>
            </div>

            <div className="p-3 border rounded">
              <h4 className="font-medium text-sm">All Leads</h4>
              <div className={`text-xs ${debugData.allLeads?.success ? 'text-green-600' : 'text-red-600'}`}>
                {debugData.allLeads?.success ? 
                  `✓ ${debugData.allLeads.monthlyCount} Monthly` : 
                  '✗ Failed'}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">Detailed Results:</h4>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {/* {JSON.stringify(debugData, null, 2)} */}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCustomerDebug;
