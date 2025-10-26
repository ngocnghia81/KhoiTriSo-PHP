/**
 * Enhanced HTTP Client
 * - Supports Accept-Language header
 * - Handles backend response format (success/error with messageCode)
 * - Type-safe responses
 */

import { API_BASE_URL, TOKEN_STORAGE_KEY } from './config';
import { refresh } from '@/services/auth';
import type { 
  ApiResponse, 
  ApiSuccessResponse, 
  ApiErrorResponse, 
  HttpResponse 
} from '@/types/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const LANGUAGE_STORAGE_KEY = 'kts_language';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getLanguage(): string {
  if (typeof window === 'undefined') return 'vi';
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'vi';
  } catch {
    return 'vi';
  }
}

export async function httpRequest<T = any>(
  path: string,
  options: { 
    method?: HttpMethod; 
    body?: any; 
    headers?: Record<string, string>; 
    isForm?: boolean;
    skipAuth?: boolean;
  } = {}
): Promise<HttpResponse<ApiResponse<T>>> {
  const { method = 'GET', body, headers = {}, isForm = false, skipAuth = false } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  // Get token and language
  const token = skipAuth ? null : getAuthToken();
  const language = getLanguage();
  
  // Build headers
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  // Auto-detect FormData
  const isBodyForm = typeof FormData !== 'undefined' && body instanceof FormData;

  const mergedHeaders: Record<string, string> = {
    ...((isForm || isBodyForm) ? {} : { 'Content-Type': 'application/json' }),
    'Accept': 'application/json',
    'Accept-Language': language, // Add language header for backend
    ...(authHeader as Record<string, string>),
    ...(headers || {}),
  };

  const init: RequestInit = {
    method,
    headers: mergedHeaders as HeadersInit,
    credentials: 'omit',
  };

  if (body !== undefined) {
    (init as any).body = (isForm || isBodyForm) ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      // Handle 401 - Try refresh token
      if (res.status === 401 && !skipAuth && typeof window !== 'undefined') {
        try {
          const refreshed = await refresh();
          if (refreshed) {
            // Retry once with new token
            const retryToken = getAuthToken();
            const retryHeaders = { ...(init.headers as Record<string, string>) };
            if (retryToken) retryHeaders['Authorization'] = `Bearer ${retryToken}`;
            
            const retryRes = await fetch(url, { ...init, headers: retryHeaders });
            const retryCT = retryRes.headers.get('content-type') || '';
            const retryJson = retryCT.includes('application/json');
            const retryPayload = retryJson ? await retryRes.json() : await retryRes.text();
            
            if (!retryRes.ok) {
              return { ok: false, status: retryRes.status, error: retryPayload };
            }
            return { ok: true, status: retryRes.status, data: retryPayload };
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      return { ok: false, status: res.status, error: payload };
    }

    return { ok: true, status: res.status, data: payload };
  } catch (error) {
    console.error('HTTP Request Error:', error);
    return { ok: false, status: 0, error };
  }
}

/**
 * Enhanced HTTP client with methods
 */
export const httpClient = {
  get: <T = any>(path: string, headers?: Record<string, string>) => 
    httpRequest<T>(path, { method: 'GET', headers }),
    
  post: <T = any>(path: string, body?: any, headers?: Record<string, string>) => 
    httpRequest<T>(path, { method: 'POST', body, headers }),
    
  put: <T = any>(path: string, body?: any, headers?: Record<string, string>) => 
    httpRequest<T>(path, { method: 'PUT', body, headers }),
    
  patch: <T = any>(path: string, body?: any, headers?: Record<string, string>) => 
    httpRequest<T>(path, { method: 'PATCH', body, headers }),
    
  delete: <T = any>(path: string, headers?: Record<string, string>) => 
    httpRequest<T>(path, { method: 'DELETE', headers }),

  // Form data upload
  postForm: <T = any>(path: string, body: FormData, headers?: Record<string, string>) => 
    httpRequest<T>(path, { method: 'POST', body, headers, isForm: true }),
};

/**
 * Helper to extract data from API response
 */
export function extractData<T>(response: HttpResponse<ApiResponse<T>>): T | null {
  if (!response.ok || !response.data) return null;
  
  const apiResponse = response.data;
  
  // Success response
  if ('success' in apiResponse && apiResponse.success === true && 'data' in apiResponse) {
    return (apiResponse as ApiSuccessResponse<T>).data;
  }
  
  return null;
}

/**
 * Helper to extract error message
 */
export function extractError(response: HttpResponse<any>): ApiErrorResponse | null {
  if (response.ok) return null;
  
  // If response has error data with messageCode
  if (response.error && typeof response.error === 'object') {
    if ('messageCode' in response.error && 'message' in response.error) {
      return response.error as ApiErrorResponse;
    }
  }
  
  // If response status is available, create generic error
  if (response.status >= 400) {
    return {
      success: false,
      messageCode: response.status === 401 ? 'UNAUTHORIZED' :
                   response.status === 403 ? 'FORBIDDEN' :
                   response.status === 404 ? 'NOT_FOUND' :
                   response.status === 500 ? 'INTERNAL_ERROR' :
                   'UNKNOWN_ERROR',
      message: response.error || 'An error occurred',
    };
  }
  
  // Network error
  return {
    success: false,
    messageCode: 'NETWORK_ERROR',
    message: 'Network error',
  };
}

/**
 * Check if response is successful
 */
export function isSuccess<T>(response: HttpResponse<ApiResponse<T>>): boolean {
  return response.ok && 
         response.data !== undefined && 
         typeof response.data === 'object' && 
         'success' in response.data && 
         response.data.success === true;
}

