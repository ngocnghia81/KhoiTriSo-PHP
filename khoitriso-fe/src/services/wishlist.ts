/**
 * Wishlist Service
 * Updated for Multi-Language System
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface WishlistItem {
  id: number;
  item_type: number;
  item_id: number;
  item?: any;
}

/**
 * Get wishlist
 */
export async function getWishlist(params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  
  const qs = query.toString();
  const response = await httpClient.get(`wishlist${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Add to wishlist
 */
export async function addToWishlist(data: { itemType: number; itemId: number }) {
  const response = await httpClient.post('wishlist', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Remove from wishlist
 */
export async function removeFromWishlist(id: number) {
  const response = await httpClient.delete(`wishlist/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Check if item in wishlist
 */
export async function checkWishlist(itemType: number, itemId: number) {
  const response = await httpClient.get(`wishlist/check?itemType=${itemType}&itemId=${itemId}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
