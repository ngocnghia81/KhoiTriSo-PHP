/**
 * User Service
 * Updated for Multi-Language System
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role?: number;
  is_active?: boolean;
}

/**
 * Get current user profile
 */
export async function getProfile() {
  const response = await httpClient.get('users/profile');
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Update profile
 * Backend expects { fullName?, phone? }
 */
export async function updateProfile(data: Partial<User> & { fullName?: string; phone?: string }) {
  const response = await httpClient.put('users/profile', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
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
  const response = await httpClient.put('users/change-password', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Upload avatar
 */
export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await httpClient.postForm('user/avatar', formData);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
