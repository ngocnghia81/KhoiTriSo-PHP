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

export async function createInstructor(data: { email: string; fullName: string; phone?: string }) {
  const response = await httpClient.post('admin/create-instructor', data);
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
  const apiResponse = response.data as any;
  const data = apiResponse?.data as AdminCourse[] | null;
  const pagination = apiResponse?.pagination;
  
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

export interface InstructorDetail {
  id: number;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    coursesCount: number;
    booksCount: number;
    totalStudents: number;
    avgCourseRating: number;
    avgBookRating: number;
    overallRating: number;
  };
}

export async function getInstructor(id: number): Promise<InstructorDetail> {
  const response = await httpClient.get(`admin/instructors/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as InstructorDetail;
}

export async function getInstructorCourses(id: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedCoursesResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/instructors/${id}/courses${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as AdminCourse[] | null;
  const pagination = apiResponse?.pagination;
  
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

export interface InstructorBook {
  id: number;
  title: string;
  description?: string;
  coverImage?: string;
  price: number;
  rating?: number;
  totalQuestions: number;
  purchaseCount: number;
  category?: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export interface PaginatedBooksResponse {
  books: InstructorBook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getInstructorBooks(id: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedBooksResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/instructors/${id}/books${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as InstructorBook[] | null;
  const pagination = apiResponse?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    books: data,
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

export interface Enrollment {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  progressPercentage: number;
  enrolledAt: string;
  completedAt?: string | null;
}

export interface PaginatedEnrollmentsResponse {
  enrollments: Enrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getCourseEnrollments(courseId: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedEnrollmentsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/courses/${courseId}/enrollments${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as Enrollment[] | null;
  const pagination = apiResponse?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    enrollments: data,
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

export interface BookPurchase {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  activationCode?: string;
  purchasedAt: string;
  expiresAt?: string | null;
}

export interface PaginatedPurchasesResponse {
  purchases: BookPurchase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getBookPurchases(bookId: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedPurchasesResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/books/${bookId}/purchases${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as BookPurchase[] | null;
  const pagination = apiResponse?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    purchases: data,
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

export async function toggleInstructorStatus(id: number): Promise<{ id: number; isActive: boolean }> {
  const response = await httpClient.put(`admin/instructors/${id}/toggle-status`, {});
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; isActive: boolean };
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string | null;
  createdAt: string;
  stats: {
    coursesCount: number;
    booksCount: number;
    totalSpent: number;
    totalOrders: number;
  };
}

export async function getUser(id: number): Promise<UserDetail> {
  const response = await httpClient.get(`admin/users/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as UserDetail;
}

export interface UserCourse {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  price: number;
  isFree: boolean;
  rating?: number;
  progressPercentage: number;
  enrolledAt: string;
  completedAt?: string | null;
  instructor?: {
    id: number;
    name: string;
    email: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

export interface PaginatedUserCoursesResponse {
  courses: UserCourse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getUserCourses(id: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedUserCoursesResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/users/${id}/courses${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as UserCourse[] | null;
  const pagination = apiResponse?.pagination;
  
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

export interface UserBook {
  id: number;
  title: string;
  description?: string;
  coverImage?: string;
  price: number;
  totalQuestions: number;
  activationCode?: string;
  purchasedAt: string;
  expiresAt?: string | null;
  category?: {
    id: number;
    name: string;
  };
  author?: {
    id: number;
    name: string;
  };
}

export interface PaginatedUserBooksResponse {
  books: UserBook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getUserBooks(id: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedUserBooksResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/users/${id}/books${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as UserBook[] | null;
  const pagination = apiResponse?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    books: data,
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

export async function toggleUserStatus(id: number): Promise<{ id: number; isActive: boolean }> {
  const response = await httpClient.put(`admin/users/${id}/toggle-status`, {});
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; isActive: boolean };
}
