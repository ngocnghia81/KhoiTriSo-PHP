import { api, authUtils } from '@/lib/api';
import { AxiosError } from 'axios';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ApiResponse 
} from '@/types';

/**
 * Parse error from API response
 */
const parseApiError = (error: any): { message: string; errors?: Record<string, string[]> } => {
  if (error.response) {
    const { data, status } = error.response;
    
    // Handle 422 Validation Error
    if (status === 422 && data.errors) {
      const errorMessages: Record<string, string[]> = {};
      
      // Backend format: { code: 422, message: "...", errors: [{field, messages}] }
      if (Array.isArray(data.errors)) {
        data.errors.forEach((err: any) => {
          if (err.field && err.messages) {
            errorMessages[err.field] = err.messages;
          }
        });
      }
      
      // Get first error message for general display
      const firstError = data.errors[0];
      const message = firstError?.messages?.[0] || data.message || 'Dữ liệu không hợp lệ';
      
      return { message, errors: errorMessages };
    }
    
    // Handle other errors
    return { 
      message: data.message || `Lỗi ${status}. Vui lòng thử lại.` 
    };
  }
  
  // Network or other errors
  return { 
    message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.' 
  };
};

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
      
      // Backend returns: { success: true, message: "...", data: { user, token } }
      // api.post returns response.data which is the backend response directly
      if (response.data && response.data.user && response.data.token) {
        const { token, user } = response.data;
        authUtils.setToken(token);
        authUtils.setUser(user);
        return { token, user, tokenType: 'Bearer' };
      }
      
      throw new Error(response.message || 'Đăng nhập thất bại');
    } catch (error: any) {
      const parsedError = parseApiError(error);
      const errorWithDetails = new Error(parsedError.message) as any;
      errorWithDetails.validationErrors = parsedError.errors;
      throw errorWithDetails;
    }
  },

  /**
   * Register new user
   * POST /api/auth/register
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response: any = await api.post('/auth/register', userData);
      
      // Backend returns: { success: true, message: "...", data: { user, token } }
      // api.post returns response.data which is the backend response directly
      if (response.data && response.data.user && response.data.token) {
        const { token, user } = response.data;
        authUtils.setToken(token);
        authUtils.setUser(user);
        return { token, user, tokenType: 'Bearer' };
      }
      
      throw new Error(response.message || 'Đăng ký thất bại');
    } catch (error: any) {
      const parsedError = parseApiError(error);
      const errorWithDetails = new Error(parsedError.message) as any;
      errorWithDetails.validationErrors = parsedError.errors;
      throw errorWithDetails;
    }
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
