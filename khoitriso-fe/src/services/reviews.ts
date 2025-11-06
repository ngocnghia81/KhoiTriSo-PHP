/**
 * Reviews Service
 * Updated for Multi-Language System
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface Review {
  id: number;
  item_type: number;
  item_id: number;
  rating: number;
  comment?: string;
  user?: any;
  created_at?: string;
}

/**
 * Get reviews for item
 */
export async function getReviews(params: {
  itemType: number;
  itemId: number;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  query.set('itemType', String(params.itemType));
  query.set('itemId', String(params.itemId));
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  
  const response = await httpClient.get(`reviews?${query.toString()}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Create review
 */
export async function createReview(data: {
  itemType: number;
  itemId: number;
  rating: number;
  comment?: string;
}) {
  const response = await httpClient.post('reviews', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Update review
 */
export async function updateReview(id: number, data: { rating?: number; comment?: string }) {
  const response = await httpClient.put(`reviews/${id}`, data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Delete review
 */
export async function deleteReview(id: number) {
  const response = await httpClient.delete(`reviews/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
