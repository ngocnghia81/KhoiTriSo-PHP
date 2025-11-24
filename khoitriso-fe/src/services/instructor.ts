/**
 * Instructor Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface InstructorDashboard {
  coursesCount: number;
  booksCount: number;
  totalStudents: number;
  totalRevenue: number;
  revenueToday: number;
  ordersToday: number;
  revenueChart: Array<{
    label: string;
    revenue: number;
  }>;
  topCourses: Array<{
    id: number;
    title: string;
    students: number;
  }>;
  topBooks: Array<{
    id: number;
    title: string;
    purchases: number;
  }>;
}

export async function getInstructorDashboard(): Promise<InstructorDashboard> {
  const response = await httpClient.get('instructor/dashboard');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as InstructorDashboard;
}

export interface InstructorCourse {
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
  totalLessons?: number;
  category?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedInstructorCoursesResponse {
  courses: InstructorCourse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getInstructorCourses(params?: {
  status?: string;
  approvalStatus?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedInstructorCoursesResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.approvalStatus !== undefined) query.set('approvalStatus', String(params.approvalStatus));
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`instructor/courses${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as InstructorCourse[] | null;
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
  isbn?: string;
  coverImage?: string;
  price: number;
  approvalStatus: number;
  isPublished?: boolean;
  purchaseCount?: number;
  category?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedInstructorBooksResponse {
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

export async function getInstructorBooks(params?: {
  status?: string;
  approvalStatus?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedInstructorBooksResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.approvalStatus !== undefined) query.set('approvalStatus', String(params.approvalStatus));
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`instructor/books${qs ? `?${qs}` : ''}`);
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

export interface InstructorStudent {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  course: {
    id: number;
    title: string;
  };
  progressPercentage: number;
  enrolledAt: string;
  completedAt?: string | null;
}

export interface PaginatedInstructorStudentsResponse {
  students: InstructorStudent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getInstructorStudents(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedInstructorStudentsResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`instructor/students${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as InstructorStudent[] | null;
  const pagination = apiResponse?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    students: data,
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

export interface InstructorOrder {
  id: number;
  orderCode: string;
  userId: number;
  userName?: string | null;
  userEmail?: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: number;
  paymentMethod?: string;
  items: Array<{
    id: number;
    itemId: number;
    itemType: number;
    itemName?: string;
    price: number;
    quantity: number;
    instructorRevenue: number;
  }>;
  createdAt: string;
}

export interface PaginatedInstructorOrdersResponse {
  orders: InstructorOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getInstructorOrders(params?: {
  status?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedInstructorOrdersResponse> {
  const query = new URLSearchParams();
  if (params?.status !== undefined) query.set('status', String(params.status));
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`instructor/orders${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as InstructorOrder[] | null;
  const pagination = apiResponse?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    orders: data,
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

// Course Management
export async function createInstructorCourse(data: {
  title: string;
  description: string;
  thumbnail: string;
  categoryId: number;
  level: number;
  isFree: boolean;
  price: number;
  staticPagePath: string;
  language?: string;
  requirements?: string[];
  whatYouWillLearn?: string[];
}): Promise<InstructorCourse> {
  const response = await httpClient.post('instructor/courses', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as InstructorCourse;
}

export async function updateInstructorCourse(id: number, data: {
  title?: string;
  description?: string;
  thumbnail?: string;
  categoryId?: number;
  level?: number;
  isFree?: boolean;
  price?: number;
  language?: string;
  requirements?: string[];
  whatYouWillLearn?: string[];
  isActive?: boolean;
}): Promise<InstructorCourse> {
  const response = await httpClient.put(`instructor/courses/${id}`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as InstructorCourse;
}

export async function deleteInstructorCourse(id: number): Promise<void> {
  const response = await httpClient.delete(`instructor/courses/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
}

export async function getInstructorCourse(id: number): Promise<InstructorCourse> {
  const response = await httpClient.get(`instructor/courses/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as InstructorCourse;
}

// Book Management
export async function createInstructorBook(data: {
  title: string;
  description: string;
  isbn: string;
  coverImage: string;
  price: number;
  categoryId?: number;
  ebookFile?: string;
  staticPagePath: string;
  language?: string;
  publicationYear?: number;
  edition?: string;
}): Promise<InstructorBook> {
  const response = await httpClient.post('instructor/books', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as InstructorBook;
}

export async function updateInstructorBook(id: number, data: {
  title?: string;
  description?: string;
  coverImage?: string;
  price?: number;
  categoryId?: number;
  ebookFile?: string;
  language?: string;
  publicationYear?: number;
  edition?: string;
  isActive?: boolean;
}): Promise<InstructorBook> {
  const response = await httpClient.put(`instructor/books/${id}`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as InstructorBook;
}

export async function deleteInstructorBook(id: number): Promise<void> {
  const response = await httpClient.delete(`instructor/books/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
}

export async function getInstructorBook(id: number): Promise<InstructorBook> {
  const response = await httpClient.get(`instructor/books/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as InstructorBook;
}

// Course Analytics & Statistics
export interface CourseAnalytics {
  courseId: number;
  courseTitle: string;
  enrollmentsCount: number;
  totalRevenue: number;
  completionRate: number;
  averageProgress: number;
  completedCount: number;
}

export async function getInstructorCourseAnalytics(courseId: number): Promise<CourseAnalytics> {
  const response = await httpClient.get(`instructor/courses/${courseId}/analytics`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as CourseAnalytics;
}

export interface CourseRevenue {
  courseId: number;
  courseTitle: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByDay: Array<{
    date: string;
    label: string;
    revenue: number;
  }>;
  startDate: string;
  endDate: string;
}

export async function getInstructorCourseRevenue(courseId: number, params?: {
  startDate?: string;
  endDate?: string;
}): Promise<CourseRevenue> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  const qs = query.toString();
  const response = await httpClient.get(`instructor/courses/${courseId}/revenue${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as CourseRevenue;
}

export interface CourseEnrollment {
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

export interface PaginatedCourseEnrollmentsResponse {
  enrollments: CourseEnrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getInstructorCourseEnrollments(courseId: number, params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedCourseEnrollmentsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`instructor/courses/${courseId}/enrollments${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  
  const apiResponse = response.data as any;
  const data = apiResponse?.data as CourseEnrollment[] | null;
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

