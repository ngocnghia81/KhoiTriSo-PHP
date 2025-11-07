/**
 * Check if user is authenticated
 * @returns boolean indicating if user has valid token
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  return !!token;
}

/**
 * Clear authentication data from localStorage
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
}

/**
 * Redirect to login page with optional return URL
 * @param returnUrl - URL to return to after login
 */
export function redirectToLogin(returnUrl?: string): void {
  if (typeof window === 'undefined') return;
  
  const url = returnUrl 
    ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/auth/login';
  
  window.location.href = url;
}

/**
 * Handle 401 Unauthorized response
 * Clear auth data and redirect to login
 */
export function handle401(): void {
  clearAuth();
  
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    redirectToLogin(currentPath);
  }
}

/**
 * Check authentication and prompt user if not logged in
 * @param message - Custom message to show
 * @returns boolean indicating if user is authenticated
 */
export function requireAuth(message?: string): boolean {
  if (!isAuthenticated()) {
    const defaultMessage = 'Vui lòng đăng nhập để tiếp tục. Chuyển đến trang đăng nhập?';
    if (confirm(message || defaultMessage)) {
      redirectToLogin(window.location.pathname);
    }
    return false;
  }
  return true;
}

/**
 * Handle API response and check for 401
 * @param response - Fetch response
 * @returns boolean indicating if response is ok
 */
export function handleApiResponse(response: Response): boolean {
  if (response.status === 401) {
    handle401();
    return false;
  }
  return response.ok;
}
