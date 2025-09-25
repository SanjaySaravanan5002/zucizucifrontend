// Authentication service for handling API calls related to authentication

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://zuci-sbackend-12.onrender.com/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'limited_admin' | 'washer';
}

export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Login user with email and password
 * @param email User email
 * @param password User password
 * @returns Promise with user data and token
 */
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Login failed');
  }
};

/**
 * Get current user data using the stored token
 * @returns Promise with user data
 */
export const getCurrentUser = async (): Promise<User> => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get user data');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to get user data');
  }
};


