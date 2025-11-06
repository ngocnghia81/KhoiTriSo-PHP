'use client'
import { useEffect, useState } from 'react';
import { getOrders, cancelOrder, Order } from '@/services/orders';
import { EyeIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await getOrders();
    if (res.ok) setItems(((res.data as any)?.orders || (res.data as any)?.data || res.data) as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onCancel = async (id: number) => {
    const res = await cancelOrder(id);
    if (res.ok) setItems(prev => prev.map(o => o.id === id ? { ...o, status: 3 } : o));
  };

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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">#{o.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Intl.NumberFormat('vi-VN').format(o.final_amount)}₫</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${o.status === 2 ? 'bg-green-100 text-green-800' : o.status === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{o.status === 2 ? 'paid' : o.status === 1 ? 'pending' : 'cancelled'}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3"><EyeIcon className="h-5 w-5" /></button>
                    {o.status === 1 && (
                      <button onClick={() => onCancel(o.id)} className="text-red-600 hover:text-red-800"><XCircleIcon className="h-5 w-5" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


