/**
 * Cart Service
 * Updated for Multi-Language System
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface CartItem {
  id: number;
  item_type: number;
  item_id: number;
  price: number;
  item?: any;
}

/**
 * Get cart items
 */
export async function getCart() {
  const response = await httpClient.get('cart');
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Add item to cart
 */
export async function addToCart(data: { itemType: number; itemId: number }) {
  const response = await httpClient.post('cart', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Remove item from cart
 */
export async function removeFromCart(id: number) {
  const response = await httpClient.delete(`cart/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Clear cart
 */
export async function clearCart() {
  const response = await httpClient.delete('cart/clear');
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Get cart count
 */
export async function getCartCount() {
  const response = await httpClient.get('cart/count');
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
