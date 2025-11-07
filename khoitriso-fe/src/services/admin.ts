/**
 * Admin Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface AdminUser {
  id: number;
  name?: string;
  username?: string;
  email: string;
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
}

export interface PaginatedUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getUsers(params?: { role?: string; isActive?: boolean; search?: string; page?: number }): Promise<PaginatedUsersResponse> {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await httpClient.get(`admin/users${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  // Response format: { success: true, data: [...users...], pagination: {...} }
  const data = extractData(response) as AdminUser[] | null;
  const pagination = (response.data as any)?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    users: data,
    pagination: pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export async function updateUser(userId: number, data: { role?: string; isActive?: boolean; emailVerified?: boolean }) {
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

export interface AdminCourse {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  price: number;
  isFree: boolean;
  isActive: boolean;
  approvalStatus: number;
  rating?: number;
  totalStudents?: number;
  instructor?: {
    id: number;
    name: string;
    email: string;
  };
  category?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCoursesResponse {
  courses: AdminCourse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getCourses(params?: { 
  status?: string; 
  approvalStatus?: number; 
  search?: string; 
  instructorId?: number; 
  categoryId?: number; 
  page?: number;
  pageSize?: number;
}): Promise<PaginatedCoursesResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.approvalStatus !== undefined) query.set('approvalStatus', String(params.approvalStatus));
  if (params?.search) query.set('search', params.search);
  if (params?.instructorId) query.set('instructorId', String(params.instructorId));
  if (params?.categoryId) query.set('categoryId', String(params.categoryId));
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/courses${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  // Response format: { success: true, data: [...courses...], pagination: {...} }
  const data = extractData(response) as AdminCourse[] | null;
  const pagination = (response.data as any)?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    courses: data,
    pagination: pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}
