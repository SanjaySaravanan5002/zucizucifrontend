import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuci-backend-my3h.onrender.com/api';
export const useDynamicSchedule = () => {
  const [loading, setLoading] = useState(false);

  const assignCustomerToDate = useCallback(async (leadId: string, targetDate: Date, washType?: string) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/schedule/assign-to-date`, {
        leadId,
        targetDate: targetDate.toISOString(),
        washType
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error assigning customer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkAssignCustomers = useCallback(async (assignments: Array<{leadId: string, targetDate: Date, washType?: string}>) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/schedule/bulk-assign`, {
        assignments: assignments.map(a => ({
          leadId: a.leadId,
          targetDate: a.targetDate.toISOString(),
          washType: a.washType
        }))
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error bulk assigning:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    assignCustomerToDate,
    bulkAssignCustomers,
    loading
  };
};
