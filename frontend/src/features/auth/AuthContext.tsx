'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../../lib/api-client';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, unknown> | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasPermission: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as User);

        try {
          // Verify token validity with backend
          const freshUser = await apiClient.get<User>('/auth/me');
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (error) {
          // Token is expired or invalid
          console.error('Lỗi xác thực token:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    void initializeAuth();
  }, [logout]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ accessToken: string; user: User }>('/auth/login', {
        email,
        password,
      });

      const { accessToken, user: loggedUser } = response;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));

      setToken(accessToken);
      setUser(loggedUser);
      setIsLoading(false);

      return loggedUser;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const hasPermission = (action: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    
    const permissions = user.permissions;
    if (!permissions) return false;
    
    if (permissions.all === true) return true;
    
    const [resource, op] = action.split(':');
    if (!resource || !op) return false;

    const resourcePerms = permissions[resource];
    return Array.isArray(resourcePerms) && resourcePerms.includes(op);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
