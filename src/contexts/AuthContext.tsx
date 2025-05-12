import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'washer';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // This would be a real API call in production
          // For demo, we'll mock a successful auth with sample data
          setUser({
            id: '1',
            name: 'Admin User',
            email: 'admin@zucicrm.com',
            role: 'admin'
          });
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // This would be a real API call in production
    // For demo, we'll mock a successful login
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email,
      role: 'admin' as const
    };
    
    setUser(mockUser);
    localStorage.setItem('auth_token', 'mock_jwt_token');
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};