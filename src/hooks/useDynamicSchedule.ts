import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';

export const useDynamicSchedule = () => {
  const [loading, setLoading] = useState(false);

  const assignCustomerToDate = useCallback(async (leadId: string, targetDate: Date, washType?: string) => {
    setLoading(true);
    try {
      const response = await apiService.post('/schedule/assign-to-date', {
        leadId,
        targetDate: targetDate.toISOString(),
        washType
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to assign customer');
      }
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
      const response = await apiService.post('/schedule/bulk-assign', {
        assignments: assignments.map(a => ({
          leadId: a.leadId,
          targetDate: a.targetDate.toISOString(),
          washType: a.washType
        }))
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to bulk assign customers');
      }
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

