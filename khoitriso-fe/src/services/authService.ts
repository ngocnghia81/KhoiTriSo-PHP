import { api, authUtils } from '@/lib/api';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ApiResponse 
} from '@/types';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Login user
   * POST /api/auth/login
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response: any = await api.post('/auth/login', credentials);
      
      // Backend returns: { success: true, data: { user, token, refreshToken } }
      if (response.success && response.data) {
        const { token, refreshToken, user } = response.data;
        if (token && user) {
          authUtils.setToken(token, refreshToken);
          authUtils.setUser(user);
          return { token, user, tokenType: 'Bearer' };
        }
      }
      
      // Fallback: check if response has token/user at root level
      if (response.token && response.user) {
        authUtils.setToken(response.token, response.refreshToken);
        authUtils.setUser(response.user);
        return { token: response.token, user: response.user, tokenType: 'Bearer' };
      }
      
      throw new Error(response.message || 'Đăng nhập thất bại');
    } catch (error: any) {
      // Extract error message from axios error response
      const errorMsg = error?.response?.data?.message 
        || error?.response?.data?.data?.message
        || error?.message 
        || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
      throw new Error(errorMsg);
    }
  },

  /**
   * Register new user
   * POST /api/auth/register
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response: any = await api.post('/auth/register', userData);
    
    // Backend returns: { code: 201, message: "...", result: { user, token } }
    // api.post returns response.data which is the backend response directly
    if (response.result && response.result.user && response.result.token) {
      const { token, user } = response.result;
      authUtils.setToken(token);
      authUtils.setUser(user);
      return { token, user, tokenType: 'Bearer' };
    }
    
    throw new Error(response.message || 'Registration failed');
  },

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      authUtils.removeToken();
      authUtils.removeUser();
    }
  },

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      authUtils.setUser(response.data.data);
      return response.data.data;
    }
    
    throw new Error('Failed to get user profile');
  },

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    
    if (response.data.success && response.data.data) {
      authUtils.setUser(response.data.data);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update profile');
  },

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    newPassword_confirmation: string;
  }): Promise<void> => {
    const response = await api.post<ApiResponse<null>>('/auth/change-password', data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change password');
    }
  },

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<void> => {
    const response = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to send reset email');
    }
  },

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword: async (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> => {
    const response = await api.post<ApiResponse<null>>('/auth/reset-password', data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reset password');
    }
  },

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  verifyEmail: async (token: string): Promise<void> => {
    const response = await api.post<ApiResponse<null>>('/auth/verify-email', { token });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to verify email');
    }
  },

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  resendVerification: async (): Promise<void> => {
    const response = await api.post<ApiResponse<null>>('/auth/resend-verification');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to resend verification email');
    }
  },

  /**
   * OAuth login/register
   * POST /api/auth/oauth/{provider}
   */
  oauthLogin: async (provider: 'google' | 'facebook', token: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(`/auth/oauth/${provider}`, { token });
    
    if (response.data.success && response.data.data) {
      const { token: authToken, user } = response.data.data;
      authUtils.setToken(authToken);
      authUtils.setUser(user);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'OAuth login failed');
  },
};
