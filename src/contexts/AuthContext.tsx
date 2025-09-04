import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { loginUser, getCurrentUser, User as AuthUser } from '../services/authService';

type User = AuthUser;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | undefined>;
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
          // Get current user from API
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User | undefined> => {
    setIsLoading(true);
    
    try {
      // Call the login API
      const response = await loginUser(email, password);
      
      // Set user and token
      setUser(response.user);
      localStorage.setItem('auth_token', response.token);
      
      // Return the user object so the login component can use it for navigation
      return response.user;
    } catch (error) {
      // Clear any existing auth data
      localStorage.removeItem('auth_token');
      setUser(null);
      throw error; // Re-throw to be caught by the login component
    } finally {
      setIsLoading(false);
    }
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
