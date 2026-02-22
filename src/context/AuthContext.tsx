import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authService from '../services/authService';
import type { User, RegisterData, LoginData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.user);
        } catch (error) {
          // Token invalid, clear it
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (data: LoginData): Promise<AuthResponse> => {
    const response = await authService.login(data);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    return response;
  };

  const handleRegister = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await authService.register(data);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    return response;
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
