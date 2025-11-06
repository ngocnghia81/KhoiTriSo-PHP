/**
 * Auth Service (Updated for Multi-Language System)
 * Uses new HTTP client with Accept-Language support
 */

import { httpClient, extractData, extractError, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';
import { TOKEN_STORAGE_KEY } from '@/lib/config';
import type { ApiSuccessResponse } from '@/types/api';

// Types
interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 0 | 1 | 2;
}

interface AuthResponse {
  token: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: number;
  };
}

/**
 * Login
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await httpClient.post<AuthResponse>('auth/login', payload);
  
  if (!isSuccess(response)) {
    const errorMessage = handleApiError(response);
    throw new Error(errorMessage);
  }
  
  const data = extractData(response);
  if (!data) {
    throw new Error('Login failed');
  }
  
  // Save token
  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    window.dispatchEvent(new Event('kts-auth-changed'));
  }
  
  return data;
}

/**
 * Register
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await httpClient.post<AuthResponse>('auth/register', payload);
  
  if (!isSuccess(response)) {
    const errorMessage = handleApiError(response);
    throw new Error(errorMessage);
  }
  
  const data = extractData(response);
  if (!data) {
    throw new Error('Registration failed');
  }
  
  // Save token
  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    window.dispatchEvent(new Event('kts-auth-changed'));
  }
  
  return data;
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  // Optimistic: clear token immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new Event('kts-auth-changed'));
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }
  
  // Call backend (fire and forget)
  try {
    await httpClient.post('auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Refresh token
 */
export async function refresh(): Promise<boolean> {
  const response = await httpClient.post<AuthResponse>('auth/refresh');
  
  if (!isSuccess(response)) {
    return false;
  }
  
  const data = extractData(response);
  if (!data || !data.token) {
    return false;
  }
  
  // Save new token
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    window.dispatchEvent(new Event('kts-auth-changed'));
  }
  
  return true;
}

/**
 * Get current user profile
 */
export async function getProfile() {
  const response = await httpClient.get('auth/profile');
  
  if (!isSuccess(response)) {
    const errorMessage = handleApiError(response);
    throw new Error(errorMessage);
  }
  
  return extractData(response);
}

/**
 * Update profile
 */
export async function updateProfile(data: {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 0 | 1 | 2;
  address?: string;
  bio?: string;
}) {
  const response = await httpClient.put('auth/profile', data);
  
  if (!isSuccess(response)) {
    const errorMessage = handleApiError(response);
    throw new Error(errorMessage);
  }
  
  return extractData(response);
}

/**
 * Change password
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  newPassword_confirmation: string;
}) {
  const response = await httpClient.post('auth/change-password', data);
  
  if (!isSuccess(response)) {
    const errorMessage = handleApiError(response);
    throw new Error(errorMessage);
  }
  
  return extractData(response);
}

