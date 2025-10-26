/**
 * Admin Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface AdminUser {
  id: number;
  username?: string;
  email: string;
  role?: number;
  isActive?: boolean;
  emailVerified?: boolean;
}

export async function getUsers(params?: { role?: number; isActive?: boolean; search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', String(params.role));
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await httpClient.get(`admin/users${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function updateUser(userId: number, data: { role?: number; isActive?: boolean; emailVerified?: boolean }) {
  const response = await httpClient.put(`admin/users/${userId}`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function createInstructor(data: { username: string; email: string; password: string; fullName: string; phone?: string }) {
  const response = await httpClient.post('admin/instructors', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function resetPassword(data: { instructorId: number; newPassword: string }) {
  const response = await httpClient.post('admin/reset-password', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
