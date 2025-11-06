/**
 * Error Handler
 * Handles API errors and displays user-friendly messages
 */

import type { 
  ApiErrorResponse, 
  ApiValidationErrorResponse,
  HttpResponse 
} from '@/types/api';
import { extractError } from './http-client';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  onError?: (error: ApiErrorResponse) => void;
  fallbackMessage?: string;
}

/**
 * Handle API error and return user-friendly message
 */
export function handleApiError(
  response: HttpResponse<any>,
  options: ErrorHandlerOptions = {}
): string {
  const { fallbackMessage = 'An error occurred' } = options;
  
  const error = extractError(response);
  
  if (!error) {
    return fallbackMessage;
  }
  
  // Call custom error handler if provided
  if (options.onError) {
    options.onError(error);
  }
  
  // Return translated message from backend
  return error.message || fallbackMessage;
}

/**
 * Extract validation errors for form display
 */
export function extractValidationErrors(
  response: HttpResponse<any>
): Record<string, string[]> {
  const error = extractError(response);
  
  if (!error) return {};
  
  // Check if it's a validation error
  if ('errors' in error) {
    const validationError = error as ApiValidationErrorResponse;
    const fieldErrors: Record<string, string[]> = {};
    
    validationError.errors.forEach(err => {
      fieldErrors[err.field] = err.messages;
    });
    
    return fieldErrors;
  }
  
  return {};
}

/**
 * Get first validation error message for a field
 */
export function getFieldError(
  validationErrors: Record<string, string[]>,
  fieldName: string
): string | null {
  const errors = validationErrors[fieldName];
  return errors && errors.length > 0 ? errors[0] : null;
}

/**
 * Check if error is validation error
 */
export function isValidationError(response: HttpResponse<any>): boolean {
  const error = extractError(response);
  return error !== null && 'errors' in error;
}

/**
 * Check if error is unauthorized
 */
export function isUnauthorized(response: HttpResponse<any>): boolean {
  return response.status === 401 || 
         (extractError(response)?.messageCode === 'UNAUTHORIZED');
}

/**
 * Check if error is forbidden
 */
export function isForbidden(response: HttpResponse<any>): boolean {
  return response.status === 403 || 
         (extractError(response)?.messageCode === 'FORBIDDEN');
}

/**
 * Check if error is not found
 */
export function isNotFound(response: HttpResponse<any>): boolean {
  return response.status === 404 || 
         (extractError(response)?.messageCode === 'NOT_FOUND');
}

