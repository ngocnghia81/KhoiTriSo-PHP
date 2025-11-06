'use client'
import { useEffect, useState } from 'react';
import { getNotifications, markAllAsRead, markAsRead, AppNotification } from '@/services/notifications';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await getNotifications({ pageSize: 50 });
    if (res.ok) {
      const data = (res.data as any)?.notifications || (res.data as any)?.data || [];
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onMarkRead = async (id: string | number) => {
    const res = await markAsRead(Number(id));
    if (res.ok) {
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const onMarkAll = async () => {
    const res = await markAllAsRead();
    if (res.ok) {
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <button onClick={onMarkAll} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          <CheckIcon className="h-4 w-4 mr-2" /> Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {loading && <div className="p-6 text-sm text-gray-500">Đang tải...</div>}
        {!loading && items.length === 0 && <div className="p-6 text-sm text-gray-500">Không có thông báo</div>}
        {items.map(n => (
          <div key={String(n.id)} className="p-4 flex items-start">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center mr-3 ${n.isRead ? 'bg-gray-100' : 'bg-blue-100'}`}>
              <BellIcon className={`h-5 w-5 ${n.isRead ? 'text-gray-400' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{n.title || 'Thông báo'}</p>
                {!n.isRead && (
                  <button onClick={() => onMarkRead(n.id)} className="text-sm text-blue-600 hover:text-blue-800">Đánh dấu đã đọc</button>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-1">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{n.createdAt || ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


