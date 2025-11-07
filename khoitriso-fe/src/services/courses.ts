/**
 * Courses Service
 * Updated for Multi-Language System
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface Course {
  id: number;
  title: string;
  description?: string;
  instructor?: string;
  instructor_id?: number;
  category_id?: number;
  price?: number;
  thumbnail?: string;
  level?: number;
  duration?: number;
  rating?: number;
  students_count?: number;
  is_published?: boolean;
}

export interface CourseListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: number;
  level?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get all courses with pagination
 */
export async function getCourses(params?: CourseListParams) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.q) query.set('q', params.q);
  if (params?.category) query.set('category', String(params.category));
  if (params?.level) query.set('level', String(params.level));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  
  const qs = query.toString();
  const response = await httpClient.get(`courses${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Get course by ID
 */
export async function getCourse(id: number) {
  const response = await httpClient.get(`courses/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Create new course
 */
export async function createCourse(data: {
  title: string;
  description: string;
  thumbnail: string;
  categoryId: number;
  level: number;
  isFree: boolean;
  price: number;
  staticPagePath: string;
}) {
  const response = await httpClient.post('courses', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Update course
 */
export async function updateCourse(id: number, data: Partial<Course>) {
  const response = await httpClient.put(`courses/${id}`, data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Delete course
 */
export async function deleteCourse(id: number) {
  const response = await httpClient.delete(`courses/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Enroll in course
 */
export async function enrollCourse(courseId: number) {
  const response = await httpClient.post(`courses/${courseId}/enroll`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Get my enrolled courses
 */
export async function getMyCourses(params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  
  const qs = query.toString();
  const response = await httpClient.get(`courses/my-courses${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
