'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCardIcon, 
  BanknotesIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { httpClient } from '@/lib/http-client';
import { useToast } from '@/components/ToastProvider';
import { requireAuth } from '@/utils/authCheck';

interface CartItem {
  id: number;
  item_id: number;
  item_type: number;
  item_name: string;
  price: number;
  quantity: number;
}

interface Coupon {
  code: string;
  discount_type: number;
  discount_value: number;
  max_discount_amount?: number;
}

export default function CheckoutPage() {
  requireAuth();
  const router = useRouter();
  const { notify } = useToast();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'cod'>('vnpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('cart');
      if (response.ok && response.data) {
        setCartItems(response.data.items || []);
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi tải giỏ hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();
    if (appliedCoupon.discount_type === 1) {
      // Percentage
      let discount = subtotal * (appliedCoupon.discount_value / 100);
      if (appliedCoupon.max_discount_amount) {
        discount = Math.min(discount, appliedCoupon.max_discount_amount);
      }
      return discount;
    } else {
      // Fixed amount
      return Math.min(appliedCoupon.discount_value, subtotal);
    }
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - calculateDiscount());
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');
    
    try {
      const response = await httpClient.post('coupons/validate', { code: couponCode });
      if (response.ok && response.data) {
        setAppliedCoupon(response.data);
        notify('Áp dụng mã giảm giá thành công!', 'success');
      } else {
        setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn');
      }
    } catch (error: any) {
      setCouponError(error.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      notify('Giỏ hàng trống', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          itemId: item.item_id,
          itemType: item.item_type,
          quantity: item.quantity,
        })),
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon?.code || null,
      };

      const response = await httpClient.post('orders', orderData);
      
      if (response.ok && response.data) {
        const { order, paymentUrl } = response.data;
        
        if (paymentMethod === 'vnpay' && paymentUrl) {
          // Redirect to VNPay payment page
          window.location.href = paymentUrl;
        } else {
          // For COD or other methods, redirect to order detail
          notify('Đặt hàng thành công!', 'success');
          router.push(`/orders/${order.id}`);
        }
      } else {
        const errorMsg = (response.error as any)?.message || 'Đặt hàng thất bại';
        notify(errorMsg, 'error');
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi đặt hàng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Giỏ hàng trống</p>
          <button
            onClick={() => router.push('/cart')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Đơn hàng của bạn</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.item_name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.item_type === 1 ? 'Khóa học' : 'Sách'} • Số lượng: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon Code */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Mã giảm giá</h2>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError('');
                    }}
                    placeholder="Nhập mã giảm giá"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {validatingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Mã: {appliedCoupon.code}</p>
                    <p className="text-sm text-green-600">
                      Giảm {appliedCoupon.discount_type === 1 
                        ? `${appliedCoupon.discount_value}%` 
                        : formatPrice(appliedCoupon.discount_value)}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Xóa
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-2 text-sm text-red-600">{couponError}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: paymentMethod === 'vnpay' ? '#2563eb' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={paymentMethod === 'vnpay'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'vnpay')}
                    className="mr-3 h-5 w-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CreditCardIcon className="h-6 w-6 text-blue-600 mr-2" />
                      <span className="font-medium">VNPay</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Thanh toán qua thẻ ATM, thẻ tín dụng, hoặc ví điện tử
                    </p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: paymentMethod === 'cod' ? '#2563eb' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                    className="mr-3 h-5 w-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <BanknotesIcon className="h-6 w-6 text-green-600 mr-2" />
                      <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Thanh toán bằng tiền mặt khi nhận hàng
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-semibold">-{formatPrice(calculateDiscount())}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'vnpay' ? (
                      <>
                        <CreditCardIcon className="h-5 w-5 mr-2" />
                        Thanh toán với VNPay
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Đặt hàng
                      </>
                    )}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                <span>Thanh toán an toàn & bảo mật</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
