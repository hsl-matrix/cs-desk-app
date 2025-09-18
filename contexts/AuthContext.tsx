'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType, LoginRequest, LoginResponse, User } from '@/lib/types/auth';
import { AuthService } from '@/lib/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Check for stored token
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // Validate token
        const isValid = await AuthService.validateToken(storedToken);

        if (isValid) {
          setUser(JSON.parse(storedUser));
          return true;
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
          return false;
        }
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      setIsLoading(true);
      const response = await AuthService.login(credentials);

      if (response.success && response.user && response.token) {
        // Store user and token
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        // Set remember me cookie if requested
        if (credentials.rememberMe) {
          document.cookie = `rememberMe=${JSON.stringify({
            centerId: credentials.centerId,
            loginId: credentials.loginId
          })}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
        }

        setUser(response.user);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: '로그인 중 오류가 발생했습니다.'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Clear all auth data
    AuthService.logout();
    setUser(null);

    // Navigate to login
    router.push('/login');
  }, [router]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}