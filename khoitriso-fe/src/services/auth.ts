import { http } from '@/lib/http';
import { TOKEN_STORAGE_KEY } from '@/lib/config';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { username?: string; name?: string; email: string; password: string; fullName?: string; phone?: string; dateOfBirth?: string; gender?: 0|1|2 };

export type AuthTokenResponse = { token: string } | { access_token: string } | { data?: { token?: string; access_token?: string } } | any;

function extractToken(res: any): string | null {
  if (!res) return null;
  if (typeof res.token === 'string') return res.token;
  if (typeof res.access_token === 'string') return res.access_token;
  if (res.result && typeof res.result.token === 'string') return res.result.token;
  if (res.data) {
    if (typeof res.data.token === 'string') return res.data.token;
    if (typeof res.data.access_token === 'string') return res.data.access_token;
  }
  return null;
}

export async function login(payload: LoginPayload) {
  const res = await http.post<AuthTokenResponse>('auth/login', payload);
  if (!res.ok) throw res.error ?? new Error('Login failed');
  const token = extractToken(res.data);
  if (token && typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new Event('kts-auth-changed')); } catch {}
  }
  return res.data;
}

export async function register(payload: RegisterPayload) {
  // Many Laravel apps require password_confirmation
  const body: any = { ...payload, password_confirmation: payload.password };
  // Backend expects username, not name
  if (!body.username && body.name) body.username = body.name;
  const res = await http.post<AuthTokenResponse>('auth/register', body);
  if (!res.ok) throw res.error ?? new Error('Register failed');
  const token = extractToken(res.data);
  if (token && typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new Event('kts-auth-changed')); } catch {}
  }
  return res.data;
}

export async function logout() {
  // Optimistic: clear token and notify UI immediately
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch {}
    try { window.dispatchEvent(new Event('kts-auth-changed')); } catch {}
  }
  try { await http.post('auth/logout'); } catch {}
}

export async function refresh(): Promise<boolean> {
  const res = await http.post<AuthTokenResponse>('auth/refresh');
  if (!res.ok) return false;
  const token = extractToken(res.data);
  if (token && typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new Event('kts-auth-changed')); } catch {}
  }
  return !!token;
}

