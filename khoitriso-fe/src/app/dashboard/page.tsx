'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboard } from '@/services/analytics';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    (async () => {
      try {
        const res: any = await getDashboard();
        if ((res as any).ok && (res as any).data) {
          setStats((res as any).data);
        }
      } catch {}
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-semibold">Đang tải bảng điều khiển...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Bảng điều khiển Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">Người dùng hoạt động</div>
          <div className="text-2xl font-semibold">{stats?.activeUsers ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">Tổng khóa học</div>
          <div className="text-2xl font-semibold">{stats?.totalCourses ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">Tổng sách</div>
          <div className="text-2xl font-semibold">{stats?.totalBooks ?? '-'}</div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">Doanh thu (ngày)</div>
          <div className="text-2xl font-semibold">{stats?.revenueToday ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-500">Đơn hàng hôm nay</div>
          <div className="text-2xl font-semibold">{stats?.ordersToday ?? '-'}</div>
        </div>
      </div>
    </div>
  );
}
