'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthService, { User, AuthResponse } from '../auth-service';

interface UseAuthReturn {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse | null>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  syncPremiumStatus: () => Promise<boolean>;
  updatePremiumStatus: (isPremium: boolean) => Promise<boolean>;
  hasPremiumAccess: () => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const authService = AuthService.getInstance();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const loggedIn = await authService.isLoggedIn();
        
        if (loggedIn && storedUser) {
          setUser(storedUser);
          setIsLoggedIn(true);
        } else {
          // Clear invalid data
          authService.logout();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authService]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse | null> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response) {
        setUser(response.user);
        setIsLoggedIn(true);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  // Signup function
  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await authService.signup(email, password, name);
      return success;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  // Logout function
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsLoggedIn(false);
  }, [authService]);

  // Sync premium status
  const syncPremiumStatus = useCallback(async (): Promise<boolean> => {
    try {
      const isPremium = await authService.syncPremiumStatus();
      if (user) {
        setUser({ ...user, isPremium });
      }
      return isPremium;
    } catch (error) {
      console.error('Premium sync error:', error);
      return false;
    }
  }, [authService, user]);

  // Update premium status
  const updatePremiumStatus = useCallback(async (isPremium: boolean): Promise<boolean> => {
    try {
      const success = await authService.updatePremiumStatus(isPremium);
      if (success && user) {
        setUser({ ...user, isPremium });
      }
      return success;
    } catch (error) {
      console.error('Premium update error:', error);
      return false;
    }
  }, [authService, user]);

  // Check premium access
  const hasPremiumAccess = useCallback(async (): Promise<boolean> => {
    return await authService.hasPremiumAccess();
  }, [authService]);

  return {
    user,
    isLoggedIn,
    isLoading,
    login,
    signup,
    logout,
    syncPremiumStatus,
    updatePremiumStatus,
    hasPremiumAccess,
  };
} 