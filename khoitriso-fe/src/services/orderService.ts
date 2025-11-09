import { api } from '@/lib/api';
import type { 
  Order,
  CartItem,
  Coupon,
  ApiResponse,
  PaginatedResponse
} from '@/types';

/**
 * Order & Cart Service
 * Handles orders, cart, and payments
 */
export const orderService = {
  // ==================== CART ====================

  /**
   * Get cart items
   * GET /api/cart
   */
  getCart: async (): Promise<CartItem[]> => {
    const response = await api.get<ApiResponse<CartItem[]>>('/cart');
    return response.data?.data || [];
  },

  /**
   * Add item to cart
   * POST /api/cart
   */
  addToCart: async (data: {
    itemType: 'course' | 'book';
    itemId: number;
    quantity?: number;
  }): Promise<CartItem> => {
    const response = await api.post<ApiResponse<CartItem>>('/cart', data);
    if (!response.data?.data) throw new Error('Invalid cart response');
    return response.data.data;
  },

  /**
   * Update cart item quantity
   * PUT /api/cart/{id}
   */
  updateCartItem: async (id: number, quantity: number): Promise<CartItem> => {
    const response = await api.put<ApiResponse<CartItem>>(`/cart/${id}`, { quantity });
    if (!response.data?.data) throw new Error('Invalid cart response');
    return response.data.data;
  },

  /**
   * Remove item from cart
   * DELETE /api/cart/{id}
   */
  removeFromCart: async (id: number): Promise<void> => {
    await api.delete(`/cart/${id}`);
  },

  /**
   * Clear all cart items
   * DELETE /api/cart
   */
  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },

  // ==================== ORDERS ====================

  /**
   * Create order from cart
   * POST /api/orders
   */
  createOrder: async (data?: {
    couponCode?: string;
    paymentMethod?: string;
    items?: Array<{ itemId: number; itemType: number; quantity: number }>;
  }): Promise<{ order: Order; paymentUrl: string | null }> => {
    try {
      // api.post returns response.data directly
      const response = await api.post('/orders', data) as { success: boolean; order: Order; paymentUrl: null | string; message?: string };
      
      console.log('Order API response:', response);
      
      // Response is already unwrapped by api.post, so we access directly
      if (response.success === false) {
        throw new Error(response.message || 'Không thể tạo đơn hàng');
      }
      
      // Check if order exists
      if (response.order) {
        return {
          order: response.order,
          paymentUrl: response.paymentUrl || null
        };
      }
      
      console.error('Invalid order response structure:', response);
      throw new Error('Không nhận được thông tin đơn hàng từ server');
    } catch (error: unknown) {
      console.error('Create order error:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 401) {
          throw new Error('Vui lòng đăng nhập để thanh toán');
        }
        if (axiosError.response?.status === 400) {
          throw new Error(axiosError.response?.data?.message || 'Giỏ hàng trống hoặc không hợp lệ');
        }
      }
      
      throw error;
    }
  },

  /**
   * Get user orders
   * GET /api/orders
   */
  getOrders: async (page = 1): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params: { page } });
    return response.data!;
  },

  /**
   * Get order by ID
   * GET /api/orders/{id}
   */
  getOrderById: async (id: number): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    if (!response.data?.data) throw new Error('Invalid order response');
    return response.data.data;
  },

  /**
   * Cancel order
   * POST /api/orders/{id}/cancel
   */
  cancelOrder: async (id: number): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
    if (!response.data?.data) throw new Error('Invalid order response');
    return response.data.data;
  },

  // ==================== COUPONS ====================

  /**
   * Validate coupon code
   * POST /api/coupons/validate
   */
  validateCoupon: async (code: string, totalAmount: number): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    message?: string;
  }> => {
    const response = await api.post<ApiResponse<{
      valid: boolean;
      coupon?: Coupon;
      discountAmount?: number;
      message?: string;
    }>>('/coupons/validate', { code, totalAmount });
    if (!response.data?.data) throw new Error('Invalid coupon response');
    return response.data.data;
  },

  /**
   * Apply coupon to cart
   * POST /api/cart/apply-coupon
   */
  applyCoupon: async (code: string): Promise<{
    success: boolean;
    discountAmount: number;
    finalAmount: number;
  }> => {
    const response = await api.post<ApiResponse<{
      success: boolean;
      discountAmount: number;
      finalAmount: number;
    }>>('/cart/apply-coupon', { code });
    if (!response.data?.data) throw new Error('Invalid coupon response');
    return response.data.data;
  },

  // ==================== PAYMENT ====================

  /**
   * Create VNPay payment
   * POST /api/payments/vnpay/create
   */
  createVNPayPayment: async (orderId: number): Promise<{
    paymentUrl: string;
  }> => {
    const response = await api.post<ApiResponse<{ paymentUrl: string }>>(
      '/payments/vnpay/create',
      { orderId }
    );
    if (!response.data?.data) throw new Error('Invalid payment response');
    return response.data.data;
  },

  /**
   * Verify VNPay payment callback
   * GET /api/payments/vnpay/callback
   */
  verifyVNPayPayment: async (params: Record<string, string>): Promise<{
    success: boolean;
    orderId: number;
    message: string;
  }> => {
    const response = await api.get<ApiResponse<{
      success: boolean;
      orderId: number;
      message: string;
    }>>('/payments/vnpay/callback', { params });
    if (!response.data?.data) throw new Error('Invalid payment response');
    return response.data.data;
  },

  /**
   * Get payment history
   * GET /api/payments
   */
  getPaymentHistory: async (page = 1): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>('/payments', { params: { page } });
    return response.data!;
  },
};
