import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { authUtils } from '@/lib/api';
import type { User, LoginRequest, RegisterRequest } from '@/types';

/**
 * Authentication Hook
 * Provides authentication state and methods
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(authUtils.getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!authUtils.getToken();

  /**
   * Login user
   */
  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (userData: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh user';
      setError(errorMessage);
      // If token is invalid, clear auth state
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setUser(null);
        authUtils.removeToken();
        authUtils.removeUser();
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (data: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change password
   */
  const changePassword = async (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        newPassword_confirmation: newPasswordConfirmation,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh user on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && !user) {
      refreshUser();
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
  };
}
