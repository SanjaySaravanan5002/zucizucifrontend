// Centralized API service for handling authenticated requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuci-sbackend-6.onrender.com/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        status: response.status
      };
    }
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Dashboard specific methods
  async getDashboardStats(dateParams?: string) {
    return this.get(`/dashboard/stats${dateParams || ''}`);
  }

  async getWasherAttendance(dateParams?: string) {
    return this.get(`/dashboard/washer-attendance${dateParams || ''}`);
  }

  async getRevenueByService() {
    return this.get('/dashboard/revenue-by-service');
  }

  async getLeadSources() {
    return this.get('/dashboard/lead-sources');
  }

  async getAreaDistribution() {
    return this.get('/dashboard/area-distribution');
  }

  async getFeedbackAnalytics() {
    return this.get('/dashboard/feedback-analytics');
  }

  async getWashCount(dateParams?: string) {
    return this.get(`/dashboard/today-tomorrow-wash-count${dateParams || ''}`);
  }

  async getExpensesStats(dateParams?: string) {
    return this.get(`/dashboard/expenses-stats${dateParams || ''}`);
  }

  async getRevenueStats(dateParams?: string) {
    return this.get(`/dashboard/direct-revenue${dateParams || ''}`);
  }

  async getLeadAcquisition() {
    return this.get('/dashboard/lead-acquisition');
  }

  async getWasherPerformance() {
    return this.get('/dashboard/washer-performance');
  }

  async getRecentLeads() {
    return this.get('/dashboard/recent-leads');
  }

  // Reports methods
  async getRevenueReport(params?: string) {
    return this.get(`/reports/revenue${params || ''}`);
  }

  async getCustomerReport(params?: string) {
    return this.get(`/reports/customers${params || ''}`);
  }

  async getWasherReport(params?: string) {
    return this.get(`/reports/washers${params || ''}`);
  }

  async getRevenueAndIncomeReport(params?: string) {
    return this.get(`/reports/revenue_and_income${params || ''}`);
  }

  // Test connectivity
  async testConnection() {
    try {
      return await this.get('/dashboard/test');
    } catch (error) {
      return {
        success: false,
        error: 'Unable to connect to backend service'
      };
    }
  }

  // Monthly customer specific methods
  async getUpcomingWashes(params?: { date?: string; type?: string; source?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return this.get(`/leads/upcoming-washes${queryString ? '?' + queryString : ''}`);
  }

  async getScheduledWashes(startDate: string, endDate: string) {
    return this.get(`/schedule/scheduled-washes?startDate=${startDate}&endDate=${endDate}`);
  }

  async getMonthlySubscription(leadId: number) {
    return this.get(`/leads/${leadId}/monthly-subscription`);
  }

  async createMonthlySubscription(leadId: number, data: { packageType: string; scheduledDates: string[] }) {
    return this.post(`/leads/${leadId}/monthly-subscription`, data);
  }

  async updateWashStatus(leadId: number, washId: string, data: { status: string; amount?: number; feedback?: string; washerId?: string }) {
    return this.put(`/leads/${leadId}/monthly-subscription/wash/${washId}`, data);
  }
}

export const apiService = new ApiService();
export default apiService;
