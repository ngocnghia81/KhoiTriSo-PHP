'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getOrder, type AdminOrderDetail } from '@/services/admin';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

const statusConfig: Record<number, { label: string; color: string; icon: any }> = {
  1: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  2: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  3: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
  4: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  5: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check admin role
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = raw ? JSON.parse(raw) : null;
      if (!user || user.role !== 'admin') {
        router.replace('/');
        return;
      }
    } catch {
      router.replace('/');
      return;
    }

    const fetchOrder = async () => {
      if (!orderId || isNaN(orderId)) {
        setLoading(false);
        return;
      }

      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (error: any) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy đơn hàng</p>
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig[1];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Chi tiết đơn hàng</h1>
            <p className="mt-1 text-sm text-gray-500">Mã đơn: {order.order_code}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${status.color}`}>
          <StatusIcon className="h-5 w-5 mr-2" />
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.item_name || 'Product'}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.item_name || 'N/A'}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.item_type === 1 ? 'Khóa học' : item.item_type === 2 ? 'Sách điện tử' : 'Khác'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Số lượng: {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          {order.order_notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Ghi chú đơn hàng</h2>
              <p className="text-gray-700">{order.order_notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Tên</p>
                <p className="font-medium text-gray-900">{order.user_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{order.user_email}</p>
              </div>
              {order.user_phone && (
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium text-gray-900">{order.user_phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing Address */}
          {order.billing_address && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ thanh toán</h2>
              {typeof order.billing_address === 'string' ? (
                <p className="text-gray-700">{order.billing_address}</p>
              ) : (
                <div className="space-y-2 text-sm text-gray-700">
                  {order.billing_address.street && <p>{order.billing_address.street}</p>}
                  {order.billing_address.city && <p>{order.billing_address.city}</p>}
                  {order.billing_address.province && <p>{order.billing_address.province}</p>}
                  {order.billing_address.postal_code && <p>{order.billing_address.postal_code}</p>}
                </div>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tạm tính</span>
                <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giảm giá</span>
                  <span className="text-red-600">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thuế</span>
                  <span className="text-gray-900">{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Tổng cộng</span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(order.final_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin thanh toán</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Phương thức</p>
                <p className="font-medium text-gray-900">{order.payment_method}</p>
              </div>
              {order.payment_gateway && (
                <div>
                  <p className="text-sm text-gray-500">Cổng thanh toán</p>
                  <p className="font-medium text-gray-900">{order.payment_gateway}</p>
                </div>
              )}
              {order.transaction_id && (
                <div>
                  <p className="text-sm text-gray-500">Mã giao dịch</p>
                  <p className="font-medium text-gray-900 font-mono text-xs">{order.transaction_id}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Ngày đặt</p>
                <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              {order.paid_at && (
                <div>
                  <p className="text-sm text-gray-500">Ngày thanh toán</p>
                  <p className="font-medium text-gray-900">{formatDate(order.paid_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

