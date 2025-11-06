'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  PrinterIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: number;
  item_id: number;
  item_type: number;
  item_name: string;
  price: number;
  quantity: number;
  activation_code?: string;
}

interface Order {
  id: number;
  order_code: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  status: number;
  payment_method: string;
  payment_gateway: string;
  transaction_id?: string;
  billing_address?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  order_notes?: string;
  created_at: string;
  paid_at?: string;
  items: OrderItem[];
}

const statusConfig: Record<number, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof ClockIcon;
  description: string;
}> = {
  1: { 
    label: 'Chờ thanh toán', 
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    icon: ClockIcon,
    description: 'Đơn hàng đang chờ thanh toán'
  },
  2: { 
    label: 'Đã thanh toán', 
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: CheckCircleIcon,
    description: 'Thanh toán thành công'
  },
  3: { 
    label: 'Đang xử lý', 
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    icon: TruckIcon,
    description: 'Đơn hàng đang được xử lý'
  },
  4: { 
    label: 'Đã hủy', 
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: XCircleIcon,
    description: 'Đơn hàng đã bị hủy'
  },
  5: { 
    label: 'Hoàn thành', 
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: CheckCircleIcon,
    description: 'Đơn hàng đã hoàn thành'
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/orders/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          router.push('/orders');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, router]);

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

  const handlePayNow = async () => {
    if (!confirm('Xác nhận thanh toán đơn hàng này?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/orders/${params.id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Payment response:', response.status, data);

      if (response.ok && data.success) {
        alert('Thanh toán thành công!');
        window.location.reload();
      } else {
        const errorMsg = data.message || 'Thanh toán thất bại, vui lòng thử lại';
        alert(errorMsg);
        console.error('Payment failed:', data);
      }
    } catch (error) {
      console.error('Error paying order:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/orders/${params.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        alert('Đã hủy đơn hàng thành công');
        window.location.reload();
      } else {
        alert('Không thể hủy đơn hàng');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const status = statusConfig[order.status] || statusConfig[1];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại danh sách đơn hàng
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Chi tiết đơn hàng
              </h1>
              <p className="text-gray-600">
                Mã đơn hàng: <span className="font-semibold text-gray-900">{order.order_code}</span>
              </p>
            </div>
            
            <button
              onClick={handlePrint}
              className="hidden md:flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              In đơn hàng
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full ${status.bgColor}`}>
                  <StatusIcon className={`h-8 w-8 ${status.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {status.label}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {status.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ngày đặt hàng</p>
                      <p className="font-semibold text-gray-900">{formatDate(order.created_at)}</p>
                    </div>
                    {order.paid_at && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Ngày thanh toán</p>
                        <p className="font-semibold text-gray-900">{formatDate(order.paid_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {order.status === 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200 flex space-x-3">
                  <button
                    onClick={handlePayNow}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thanh toán ngay
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="px-6 py-3 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Hủy đơn
                  </button>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Sản phẩm đã đặt
              </h3>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {item.item_name}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {item.item_type === 1 ? 'Khóa học' : 'Sách'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Số lượng: <span className="font-semibold">{item.quantity}</span>
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            {order.order_notes && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Ghi chú đơn hàng
                </h3>
                <p className="text-gray-700">{order.order_notes}</p>
              </div>
            )}

            {/* Activation Codes - Show if order is paid and has books */}
            {order.status === 2 && order.items.some(item => item.item_type === 2) && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-sm p-6 border-2 border-green-200">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Mã kích hoạt sách
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Sử dụng các mã sau để kích hoạt sách điện tử của bạn. Mỗi mã chỉ có thể sử dụng 1 lần duy nhất.
                </p>
                
                <div className="space-y-3">
                  {order.items
                    .filter(item => item.item_type === 2)
                    .map((item) => (
                      <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          📖 {item.item_name}
                        </p>
                        {item.activation_code ? (
                          <>
                            <div className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                              <code className="text-lg font-mono font-bold text-blue-600">
                                {item.activation_code}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.activation_code || '');
                                  alert('Đã copy mã kích hoạt!');
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Copy
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              💡 Vào <Link href="/books/activation" className="text-blue-600 hover:underline">trang kích hoạt</Link> để sử dụng mã này
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-yellow-600 bg-yellow-50 rounded px-3 py-2">
                            Mã kích hoạt đang được tạo, vui lòng load lại trang sau vài giây...
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Tóm tắt thanh toán
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Tạm tính</span>
                  <span className="font-semibold">{formatPrice(order.total_amount)}</span>
                </div>
                
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span className="font-semibold">-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Thuế VAT</span>
                    <span className="font-semibold">{formatPrice(order.tax_amount)}</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(order.final_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Phương thức thanh toán</h4>
                <p className="text-gray-700 mb-1">{order.payment_method}</p>
                {order.transaction_id && (
                  <p className="text-sm text-gray-500">
                    Mã giao dịch: {order.transaction_id}
                  </p>
                )}
              </div>

              {order.billing_address && (
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Thông tin thanh toán</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    {order.billing_address.name && <p>{order.billing_address.name}</p>}
                    {order.billing_address.phone && <p>{order.billing_address.phone}</p>}
                    {order.billing_address.email && <p>{order.billing_address.email}</p>}
                    {order.billing_address.address && <p>{order.billing_address.address}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
