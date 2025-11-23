/**
 * Static Pages Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface StaticPage {
  id: number;
  slug: string;
  title: string;
  meta_description?: string;
  meta_keywords?: string;
  content: string;
  template: string;
  is_published: boolean;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get static page by slug (public)
 */
export async function getStaticPageBySlug(slug: string): Promise<StaticPage> {
  const response = await httpClient.get(`static-pages/${slug}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as StaticPage;
}

/**
 * Get all static pages (admin)
 */
export async function getStaticPages(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  isPublished?: boolean;
}): Promise<{ data: StaticPage[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.search) query.set('search', params.search);
  if (params?.isPublished !== undefined) query.set('isPublished', String(params.isPublished));
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/static-pages${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as any;
}

/**
 * Get static page by ID (admin)
 */
export async function getStaticPage(id: number): Promise<StaticPage> {
  const response = await httpClient.get(`admin/static-pages/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as StaticPage;
}

/**
 * Create static page (admin)
 */
export async function createStaticPage(data: {
  slug: string;
  title: string;
  metaDescription?: string;
  metaKeywords?: string;
  content: string;
  template?: string;
  isPublished?: boolean;
}): Promise<StaticPage> {
  const response = await httpClient.post('admin/static-pages', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as StaticPage;
}

/**
 * Update static page (admin)
 */
export async function updateStaticPage(id: number, data: Partial<{
  slug: string;
  title: string;
  metaDescription?: string;
  metaKeywords?: string;
  content: string;
  template?: string;
  isPublished?: boolean;
  isActive?: boolean;
}>): Promise<StaticPage> {
  const response = await httpClient.put(`admin/static-pages/${id}`, data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as StaticPage;
}

/**
 * Delete static page (admin)
 */
export async function deleteStaticPage(id: number): Promise<void> {
  const response = await httpClient.delete(`admin/static-pages/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
}

/**
 * Get static page by path (for courses/books)
 */
export async function getStaticPageByPath(path: string): Promise<StaticPage> {
  const response = await httpClient.get(`static-pages/by-path?path=${encodeURIComponent(path)}`);
  
  console.log('Static page API response:', response);
  
  // Backend may return data directly or wrapped in success/data
  if (response.ok && response.data) {
    // Check if it's wrapped in success/data format
    if (typeof response.data === 'object' && 'success' in response.data && response.data.success === true && 'data' in response.data) {
      return (response.data as any).data as StaticPage;
    }
    // Or return data directly
    return response.data as StaticPage;
  }
  
  // If not successful, try to extract error
  const error = handleApiError(response);
  throw new Error(error);
}

