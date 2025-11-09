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
  isPublished?: boolean;
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
  // Or nested: { success: true, data: { data: [...], pagination: {...} } }
  const apiResponse = response.data as any;
  const nestedData = apiResponse?.data;
  const data = (Array.isArray(nestedData) ? nestedData : (nestedData?.data || apiResponse?.data)) as AdminCourse[] | null;
  const rawPagination = (Array.isArray(nestedData) ? apiResponse?.pagination : (nestedData?.pagination || apiResponse?.pagination));
  
  // Convert pagination format
  const pagination = rawPagination ? {
    page: rawPagination.page || rawPagination.current_page || 1,
    limit: rawPagination.limit || rawPagination.per_page || 20,
    total: rawPagination.total || 0,
    totalPages: rawPagination.totalPages || rawPagination.last_page || 1,
    hasNextPage: rawPagination.hasNextPage !== undefined ? rawPagination.hasNextPage : ((rawPagination.page || rawPagination.current_page || 1) < (rawPagination.totalPages || rawPagination.last_page || 1)),
    hasPreviousPage: rawPagination.hasPreviousPage !== undefined ? rawPagination.hasPreviousPage : ((rawPagination.page || rawPagination.current_page || 1) > 1),
  } : {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    courses: data,
    pagination,
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

export interface RevenueTotals {
  gross: number;
  net: number;
  platform_fee: number;
  instructor_earning: number;
}

export interface PerInstructorRecord {
  id: number | null;
  name: string;
  gross: number;
  net: number;
  platform_fee: number;
  instructor_earning: number;
}

/**
 * Fetch admin revenue report.
 * Returns the raw HTTP response so callers can inspect ok/status/data.
 * Params: from (YYYY-MM-DD), to (YYYY-MM-DD), item_type (1=course,2=book)
 */
export async function getRevenueReport(params?: { from?: string; to?: string; item_type?: number }) {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.item_type) query.set('item_type', String(params.item_type));
  const qs = query.toString();
  const response = await httpClient.get(`admin/reports/revenue${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
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

// Course Management Actions
export async function getPendingCourses(params?: { page?: number; pageSize?: number }): Promise<PaginatedCoursesResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/approvals/courses${qs ? `?${qs}` : ''}`);
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

export async function approveCourse(id: number): Promise<{ id: number; approvalStatus: number; isPublished: boolean; message: string }> {
  const response = await httpClient.put(`admin/courses/${id}/approve`, {});
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; approvalStatus: number; isPublished: boolean; message: string };
}

export async function rejectCourse(id: number, reason?: string): Promise<{ id: number; approvalStatus: number; reviewNotes?: string; message: string }> {
  const response = await httpClient.put(`admin/courses/${id}/reject`, { reason });
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; approvalStatus: number; reviewNotes?: string; message: string };
}

export async function publishCourse(id: number): Promise<{ id: number; isPublished: boolean; message: string }> {
  const response = await httpClient.put(`admin/courses/${id}/publish`, {});
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; isPublished: boolean; message: string };
}

export async function unpublishCourse(id: number): Promise<{ id: number; isPublished: boolean; message: string }> {
  const response = await httpClient.put(`admin/courses/${id}/unpublish`, {});
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; isPublished: boolean; message: string };
}

// Book Management Actions
export interface AdminBook {
  id: number;
  title: string;
  description?: string;
  isbn?: string;
  coverImage?: string;
  price: number;
  approvalStatus: number;
  isPublished?: boolean;
  reviewNotes?: string;
  author?: {
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

export interface PaginatedAdminBooksResponse {
  books: AdminBook[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getBooks(params?: {
  status?: string;
  approvalStatus?: number;
  search?: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedAdminBooksResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.approvalStatus !== undefined) query.set('approvalStatus', String(params.approvalStatus));
  if (params?.search) query.set('search', params.search);
  if (params?.categoryId) query.set('categoryId', String(params.categoryId));
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/books${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  // Handle nested structure: { success: true, data: { data: [...], pagination: {...} } }
  const nestedData = apiResponse?.data;
  const data = (nestedData?.data || apiResponse?.data) as AdminBook[] | null;
  const rawPagination = nestedData?.pagination || apiResponse?.pagination;
  
  // Convert Laravel pagination format to our format
  const pagination = rawPagination ? {
    page: rawPagination.current_page || rawPagination.page || 1,
    limit: rawPagination.per_page || rawPagination.limit || 20,
    total: rawPagination.total || 0,
    totalPages: rawPagination.last_page || rawPagination.totalPages || 1,
    hasNextPage: (rawPagination.current_page || rawPagination.page || 1) < (rawPagination.last_page || rawPagination.totalPages || 1),
    hasPreviousPage: (rawPagination.current_page || rawPagination.page || 1) > 1,
  } : {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    books: data,
    pagination,
  };
}

export async function getPendingBooks(params?: { page?: number; pageSize?: number }): Promise<PaginatedAdminBooksResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`admin/approvals/books${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as AdminBook[] | null;
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

export async function approveBook(id: number): Promise<{ id: number; approvalStatus: number; isPublished: boolean; message: string }> {
  const response = await httpClient.put(`admin/books/${id}/approve`, {});
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; approvalStatus: number; isPublished: boolean; message: string };
}

export async function rejectBook(id: number, reason?: string): Promise<{ id: number; approvalStatus: number; reviewNotes?: string; message: string }> {
  const response = await httpClient.put(`admin/books/${id}/reject`, { reason });
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; approvalStatus: number; reviewNotes?: string; message: string };
}

export async function publishBook(id: number): Promise<{ id: number; isPublished: boolean; message: string }> {
  const response = await httpClient.put(`admin/books/${id}/publish`, {});
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; isPublished: boolean; message: string };
}

export async function unpublishBook(id: number): Promise<{ id: number; isPublished: boolean; message: string }> {
  const response = await httpClient.put(`admin/books/${id}/unpublish`, {});
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as { id: number; isPublished: boolean; message: string };
}

export interface AdminOrder {
  id: number;
  order_code: string;
  user_id: number;
  user_name: string;
  user_email: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: number;
  payment_method: string;
  created_at: string;
  paid_at: string | null;
  items_count: number;
}

export interface PaginatedOrdersResponse {
  orders: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getOrders(params?: {
  search?: string;
  status?: number;
  userId?: number;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}): Promise<PaginatedOrdersResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status !== undefined) query.set('status', String(params.status));
  if (params?.userId) query.set('userId', String(params.userId));
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('perPage', String(params.perPage));
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/orders${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  // Response format: { success: true, data: [...orders...], pagination: {...} }
  const apiResponse = response.data as any;
  const data = apiResponse?.data as AdminOrder[] | null;
  const pagination = apiResponse?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    orders: data,
    pagination: pagination || {
      page: params?.page || 1,
      limit: params?.perPage || 20,
      total: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export interface AdminOrderDetail extends AdminOrder {
  user_phone?: string | null;
  tax_amount: number;
  payment_gateway?: string | null;
  transaction_id?: string | null;
  billing_address?: any;
  order_notes?: string | null;
  items: Array<{
    id: number;
    item_id: number;
    item_type: number;
    item_name: string | null;
    thumbnail?: string | null;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

export async function getOrder(id: number): Promise<AdminOrderDetail> {
  const response = await httpClient.get(`admin/orders/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as AdminOrderDetail;
}