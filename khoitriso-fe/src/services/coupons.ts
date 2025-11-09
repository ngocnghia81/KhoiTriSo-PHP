/**
 * Coupons Service
 * Handles coupon management for admin
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  discount_type: number; // 1: Percentage, 2: Fixed
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount: number;
  valid_from: string;
  valid_to: string;
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
  applicable_item_types?: number[] | null; // 1: Course, 2: Book
  applicable_item_ids?: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedCouponsResponse {
  coupons: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateCouponData {
  code: string;
  name: string;
  description?: string;
  discount_type: 1 | 2; // 1: Percentage, 2: Fixed
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  valid_from: string;
  valid_to: string;
  usage_limit?: number;
  is_active?: boolean;
  applicable_item_types?: number[];
  applicable_item_ids?: number[];
}

/**
 * Get all coupons (Admin only)
 */
export async function getCoupons(params?: {
  search?: string;
  isActive?: boolean;
  discountType?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}): Promise<PaginatedCouponsResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.discountType) query.set('discountType', String(params.discountType));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('perPage', String(params.perPage));
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/coupons${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  const data = extractData(response) as Coupon[] | null;
  const pagination = (response.data as any)?.pagination;
  
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response format');
  }
  
  return {
    coupons: data,
    pagination: pagination || {
      page: params?.page || 1,
      limit: params?.perPage || 20,
      total: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

/**
 * Get coupon by ID (Admin only)
 */
export async function getCoupon(id: number): Promise<Coupon> {
  const response = await httpClient.get(`admin/coupons/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as Coupon;
}

/**
 * Create coupon (Admin only)
 */
export async function createCoupon(data: CreateCouponData): Promise<Coupon> {
  const response = await httpClient.post('admin/coupons', data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as Coupon;
}

/**
 * Update coupon (Admin only)
 */
export async function updateCoupon(id: number, data: Partial<CreateCouponData>): Promise<Coupon> {
  const response = await httpClient.put(`admin/coupons/${id}`, data);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as Coupon;
}

/**
 * Delete coupon (Admin only)
 */
export async function deleteCoupon(id: number): Promise<void> {
  const response = await httpClient.delete(`admin/coupons/${id}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
}

/**
 * Validate coupon code (Public)
 */
export async function validateCoupon(data: {
  couponCode: string;
  totalAmount: number;
}): Promise<{
  valid: boolean;
  discountAmount?: number;
  message?: string;
}> {
  const response = await httpClient.post('coupons/validate', data);
  
  if (!isSuccess(response)) {
    return { valid: false, message: handleApiError(response) };
  }
  
  const result = extractData(response) as any;
  return {
    valid: result.valid || false,
    discountAmount: result.discountAmount || 0,
  };
}
