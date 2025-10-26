/**
 * Backend API Response Types
 * Matching Laravel Backend Response Format
 */

// ===== SUCCESS RESPONSE (NO messageCode) =====
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

// ===== ERROR RESPONSE (WITH messageCode) =====
export interface ApiErrorResponse {
  success: false;
  messageCode: string;
  message: string;
  errorCode?: string;
}

// ===== VALIDATION ERROR =====
export interface ValidationError {
  field: string;
  messages: string[];
}

export interface ApiValidationErrorResponse {
  success: false;
  messageCode: 'VALIDATION_ERROR';
  message: string;
  errors: ValidationError[];
}

// ===== PAGINATED RESPONSE =====
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiPaginatedResponse<T = any> {
  success: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

// ===== UNION TYPE FOR ALL RESPONSES =====
export type ApiResponse<T = any> = 
  | ApiSuccessResponse<T>
  | ApiPaginatedResponse<T>
  | ApiErrorResponse
  | ApiValidationErrorResponse;

// ===== HTTP CLIENT RESPONSE (Internal) =====
export interface HttpResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: any;
}

// ===== MESSAGE CODES (From Backend) =====
export const MessageCode = {
  // Success
  SUCCESS: 'SUCCESS',
  CREATED_SUCCESS: 'CREATED_SUCCESS',
  UPDATED_SUCCESS: 'UPDATED_SUCCESS',
  DELETED_SUCCESS: 'DELETED_SUCCESS',
  
  // Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  
  // User
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INACTIVE: 'USER_INACTIVE',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  
  // Course
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  ALREADY_ENROLLED: 'ALREADY_ENROLLED',
  COURSE_FULL: 'COURSE_FULL',
  
  // Book
  BOOK_NOT_FOUND: 'BOOK_NOT_FOUND',
  INVALID_ACTIVATION_CODE: 'INVALID_ACTIVATION_CODE',
  ACTIVATION_CODE_ALREADY_USED: 'ACTIVATION_CODE_ALREADY_USED',
  
  // Order
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_CANNOT_CANCEL: 'ORDER_CANNOT_CANCEL',
  INVALID_STATUS: 'INVALID_STATUS',
  
  // Cart
  CART_ITEM_EXISTS: 'CART_ITEM_EXISTS',
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
  
  // Wishlist
  WISHLIST_ITEM_EXISTS: 'WISHLIST_ITEM_EXISTS',
  WISHLIST_ITEM_NOT_FOUND: 'WISHLIST_ITEM_NOT_FOUND',
  
  // File
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INVALID_COUPON: 'INVALID_COUPON',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  
  // Other
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
} as const;

export type MessageCodeType = typeof MessageCode[keyof typeof MessageCode];

// ===== ERROR HANDLER UTILITIES =====
export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.success === false && 'messageCode' in response;
}

export function isValidationError(response: any): response is ApiValidationErrorResponse {
  return isApiError(response) && response.messageCode === 'VALIDATION_ERROR' && 'errors' in response;
}

export function isPaginatedResponse<T>(response: any): response is ApiPaginatedResponse<T> {
  return response && response.success === true && 'pagination' in response;
}

export function isSuccessResponse<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success === true && !('pagination' in response);
}

