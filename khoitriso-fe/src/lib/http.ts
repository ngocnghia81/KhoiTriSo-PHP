import { API_BASE_URL, TOKEN_STORAGE_KEY } from './config';
import { refresh } from '@/services/auth';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: unknown;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function httpRequest<T>(
  path: string,
  options: { method?: HttpMethod; body?: any; headers?: Record<string, string>; isForm?: boolean } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, isForm = false } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const token = getAuthToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  // Auto-detect FormData to avoid setting Content-Type and JSON-encoding
  const isBodyForm = typeof FormData !== 'undefined' && body instanceof FormData;

  const mergedHeaders: Record<string, string> = {
    ...((isForm || isBodyForm) ? {} : { 'Content-Type': 'application/json' }),
    'Accept': 'application/json',
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
      // Attempt refresh on 401 once
      if (res.status === 401 && typeof window !== 'undefined') {
        try {
          const refreshed = await refresh();
          if (refreshed) {
            // retry once with new token
            const retryToken = getAuthToken();
            const retryHeaders = { ...(init.headers as Record<string, string>) };
            if (retryToken) retryHeaders['Authorization'] = `Bearer ${retryToken}`;
            const retryRes = await fetch(url, { ...init, headers: retryHeaders });
            const retryCT = retryRes.headers.get('content-type') || '';
            const retryJson = retryCT.includes('application/json');
            const retryPayload = retryJson ? await retryRes.json() : await retryRes.text();
            if (!retryRes.ok) return { ok: false, status: retryRes.status, error: retryPayload };
            return { ok: true, status: retryRes.status, data: retryPayload as T };
          }
        } catch {}
      }
      return { ok: false, status: res.status, error: payload };
    }
    return { ok: true, status: res.status, data: payload as T };
  } catch (error) {
    return { ok: false, status: 0, error };
  }
}

export const http = {
  get: <T>(path: string, headers?: Record<string, string>) => httpRequest<T>(path, { method: 'GET', headers }),
  post: <T>(path: string, body?: any, headers?: Record<string, string>) => httpRequest<T>(path, { method: 'POST', body, headers }),
  put: <T>(path: string, body?: any, headers?: Record<string, string>) => httpRequest<T>(path, { method: 'PUT', body, headers }),
  patch: <T>(path: string, body?: any, headers?: Record<string, string>) => httpRequest<T>(path, { method: 'PATCH', body, headers }),
  delete: <T>(path: string, headers?: Record<string, string>) => httpRequest<T>(path, { method: 'DELETE', headers }),
};

