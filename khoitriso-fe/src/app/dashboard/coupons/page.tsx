'use client'
import { useEffect, useState } from 'react';
import { getCoupons, validateCoupon } from '@/services/coupons';
import { CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type Coupon = { id?: string | number; code: string; discount?: number; expiresAt?: string; active?: boolean };

export default function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [validation, setValidation] = useState<null | { valid: boolean; discount?: number }>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await getCoupons();
    if (res.ok) {
      const data = (res.data as any)?.coupons || (res.data as any)?.data || (res.data as any) || [];
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onValidate = async () => {
    if (!code) return;
    const res = await validateCoupon({ couponCode: code, totalAmount: 0 });
    if (res.ok) setValidation(res.data as any);
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mã giảm giá</h1>
          <p className="mt-2 text-sm text-gray-700">Quản lý và kiểm tra mã giảm giá</p>
        </div>
      </div>

      {/* Validate area */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onValidate(); }}
              placeholder="Nhập mã để kiểm tra"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <button onClick={onValidate} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm">Kiểm tra</button>
          {validation && (
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${validation.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {validation.valid ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />} 
              {validation.valid ? `Hợp lệ${validation.discount ? ` (-${validation.discount}%)` : ''}` : 'Không hợp lệ'}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading && <div className="p-6 text-sm text-gray-500">Đang tải...</div>}
        {!loading && items.length === 0 && <div className="p-6 text-sm text-gray-500">Chưa có mã giảm giá</div>}
        {!loading && items.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((c: any, idx) => (
                <tr key={String(c.id ?? idx)}>
                  <td className="px-6 py-4 text-sm text-gray-900">{c.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{c.discount ?? 0}%</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.expiresAt || c.expires_at || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{c.active ? 'Đang hoạt động' : 'Tắt'}</span>
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


