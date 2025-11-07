'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { requireAuth, handleApiResponse } from '@/utils/authCheck';

interface Order {
  id: number;
  order_code: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: number;
  payment_method: string;
  created_at: string;
  paid_at?: string;
}

const statusConfig: Record<number, { label: string; color: string; icon: any }> = {
  1: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  2: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  3: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: TruckIcon },
  4: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  5: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      // Check authentication before fetching
      if (!requireAuth('Vui lòng đăng nhập để xem đơn hàng.')) {
        return;
      }

      const token = localStorage.getItem('token');

      try {
        const response = await fetch('http://localhost:8000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        // Handle 401 and other errors
        if (!handleApiResponse(response)) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Đơn hàng của tôi
          </h1>
          <p className="text-gray-600">
            Quản lý và theo dõi đơn hàng của bạn
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn chưa có đơn hàng nào. Hãy khám phá các khóa học và sách của chúng tôi!
            </p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig[1];
              const StatusIcon = status.icon;

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Mã đơn hàng</p>
                        <p className="text-lg font-bold text-gray-900">{order.order_code}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status.color}`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Ngày đặt</p>
                        <p className="text-gray-900 font-medium">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                        <p className="text-gray-900 font-medium">{order.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tổng tiền</p>
                        <p className="text-xl font-bold text-blue-600">{formatPrice(order.final_amount)}</p>
                      </div>
                    </div>

                    {order.discount_amount > 0 && (
                      <div className="flex items-center text-sm text-green-600 mb-4">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Đã tiết kiệm {formatPrice(order.discount_amount)}
                      </div>
                    )}

                    <div className="flex items-center text-blue-600 font-semibold">
                      Xem chi tiết
                      <svg className="h-5 w-5 ml-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
