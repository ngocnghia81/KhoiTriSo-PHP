/**
 * Categories Service
 * Updated for Multi-Language System
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number;
  icon?: string;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  const response = await httpClient.get('categories');
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  const data = extractData(response);
  // API returns { categories: [...] }
  if (data && typeof data === 'object' && 'categories' in data) {
    return (data as any).categories || [];
  }
  // Fallback: if data is already an array
  return Array.isArray(data) ? data : [];
}

/**
 * Get category by ID
 */
export async function getCategory(id: number) {
  const response = await httpClient.get(`categories/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Create category
 */
export async function createCategory(data: Partial<Category>) {
  const response = await httpClient.post('categories', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Update category
 */
export async function updateCategory(id: number, data: Partial<Category>) {
  const response = await httpClient.put(`categories/${id}`, data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Delete category
 */
export async function deleteCategory(id: number) {
  const response = await httpClient.delete(`categories/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
