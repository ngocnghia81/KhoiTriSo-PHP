/**
 * Orders Service
 * Updated for Multi-Language System
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface Order {
  id: number;
  order_number: string;
  status: number;
  subtotal: number;
  discount: number;
  final_amount: number;
  payment_method?: string;
  created_at: string;
  items?: any[];
}

/**
 * Get my orders
 */
export async function getOrders(params?: { page?: number; pageSize?: number; status?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.status) query.set('status', String(params.status));
  
  const qs = query.toString();
  const response = await httpClient.get(`orders${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Get order by ID
 */
export async function getOrder(id: number) {
  const response = await httpClient.get(`orders/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Create order
 */
export async function createOrder(data: {
  paymentMethod: string;
  couponCode?: string;
  shippingAddress?: string;
}) {
  const response = await httpClient.post('orders', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Cancel order
 */
export async function cancelOrder(id: number) {
  const response = await httpClient.post(`orders/${id}/cancel`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}

/**
 * Apply coupon
 */
export async function applyCoupon(data: { couponCode: string; totalAmount: number }) {
  const response = await httpClient.post('orders/apply-coupon', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response);
}
