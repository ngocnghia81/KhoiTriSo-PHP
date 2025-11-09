'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrders, type AdminOrder } from '@/services/admin';
import { getInstructorOrders } from '@/services/instructor';
import { EyeIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function OrdersPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [user, setUser] = useState<any>(null);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    // Check user role
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userData = raw ? JSON.parse(raw) : null;
      if (!userData || (userData.role !== 'admin' && userData.role !== 'instructor')) {
        router.replace('/');
        return;
      }
      setUser(userData);
      setIsInstructor(userData.role === 'instructor');
    } catch {
      router.replace('/');
      return;
    }
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      if (isInstructor) {
        const instructorRes = await getInstructorOrders({ page, pageSize: 20 });
        // Normalize instructor orders to match AdminOrder format
        const normalizedOrders: AdminOrder[] = instructorRes.orders.map((o) => ({
          id: o.id,
          order_code: o.orderCode,
          user_id: o.userId,
          user_name: o.userName || '',
          user_email: o.userEmail || '',
          total_amount: o.totalAmount,
          discount_amount: o.discountAmount,
          final_amount: o.finalAmount,
          status: o.status,
          payment_method: o.paymentMethod || '',
          created_at: o.createdAt,
          paid_at: null,
          items_count: o.items.length,
        }));
        res = {
          orders: normalizedOrders,
          pagination: instructorRes.pagination,
        };
      } else {
        res = await getOrders({ page, perPage: 20 });
      }
      console.log('Fetched orders:', res.orders?.length || 0, 'pagination:', res.pagination);
      setItems(res.orders || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) { // Only fetch when user is loaded
      fetchData(); 
    }
  }, [page, isInstructor, user]);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Đơn hàng</h1>
          <p className="mt-2 text-sm text-gray-700">Danh sách đơn hàng của hệ thống</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading && <div className="p-6 text-sm text-gray-500">Đang tải...</div>}
        {!loading && items.length === 0 && <div className="p-6 text-sm text-gray-500">Không có đơn hàng</div>}
        {!loading && items.length > 0 && (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {o.order_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{o.user_name}</div>
                      <div className="text-gray-500 text-xs">{o.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.final_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        o.status === 2 ? 'bg-green-100 text-green-800' : 
                        o.status === 1 ? 'bg-yellow-100 text-yellow-800' : 
                        o.status === 4 ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {o.status === 2 ? 'Đã thanh toán' : 
                         o.status === 1 ? 'Chờ thanh toán' : 
                         o.status === 4 ? 'Đã hủy' : 
                         'Khác'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(o.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        onClick={() => router.push(`/dashboard/orders/${o.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-700">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


