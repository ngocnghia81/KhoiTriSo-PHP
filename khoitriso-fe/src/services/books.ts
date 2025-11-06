/**
 * Books Service
 * Updated for Multi-Language System
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface Book {
  id: number;
  title: string;
  description?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  pages?: number;
  price?: number;
  cover_image?: string;
  pdf_url?: string;
  category_id?: number;
  is_published?: boolean;
}

/**
 * Get all books
 */
export async function getBooks(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: number;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.q) query.set('q', params.q);
  if (params?.category) query.set('category', String(params.category));
  
  const qs = query.toString();
  const response = await httpClient.get(`books${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Get book by ID
 */
export async function getBook(id: number) {
  const response = await httpClient.get(`books/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Activate book with code
 */
export async function activateBook(data: { code: string }) {
  const response = await httpClient.post('books/activate', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Get my books
 */
export async function getMyBooks(params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  
  const qs = query.toString();
  const response = await httpClient.get(`books/my-books${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Download book
 */
export async function downloadBook(id: number) {
  const response = await httpClient.get(`books/${id}/download`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

export async function getBookChapters(bookId: number) {
  const response = await httpClient.get(`books/${bookId}/chapters`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
