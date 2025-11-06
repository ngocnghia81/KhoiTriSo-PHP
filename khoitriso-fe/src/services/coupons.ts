/**
 * Coupons Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function validateCoupon(data: { couponCode: string; totalAmount: number; items?: any[] }) {
  const response = await httpClient.post('coupons/validate', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getCoupons(params?: { itemType?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.itemType) query.set('itemType', params.itemType);
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await httpClient.get(`coupons${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
