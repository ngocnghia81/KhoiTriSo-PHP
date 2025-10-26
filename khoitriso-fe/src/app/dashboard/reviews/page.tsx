'use client'
import { useEffect, useState } from 'react';
import { getReviews, updateReview, deleteReview, Review } from '@/services/reviews';
import { StarIcon, PencilIcon, TrashIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';

export default function ReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [itemType, setItemType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const res = await getReviews({ itemType: itemType ? Number(itemType) : 1, itemId: 0, pageSize: 50 });
    if (res.ok) {
      const data = (res.data as any)?.reviews || (res.data as any)?.data || [];
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [itemType]);

  const onDelete = async (id: string | number) => {
    const res = await deleteReview(Number(id));
    if (res.ok) setItems(prev => prev.filter(r => r.id !== id));
  };

  const onHelpful = async (id: string | number) => {
    // Mark helpful functionality removed - use updateReview instead
    const res = { ok: false };
    // if (res.ok) setItems(prev => prev.map(r => r.id === id ? { ...r, helpfulCount: (r.helpfulCount ?? 0) + 1 } : r));
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý đánh giá</h1>
          <p className="mt-2 text-sm text-gray-700">Danh sách đánh giá khóa học/sách từ người dùng</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 flex items-center gap-3">
        <input
          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Tìm kiếm nội dung..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchData(); }}
        />
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm" value={itemType} onChange={(e) => setItemType(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="course">Khóa học</option>
          <option value="book">Sách</option>
        </select>
        <button onClick={fetchData} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm">Lọc</button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading && <div className="p-6 text-sm text-gray-500">Đang tải...</div>}
        {!loading && items.length === 0 && <div className="p-6 text-sm text-gray-500">Không có đánh giá</div>}
        {!loading && items.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {items.filter(r => !q || (r.comment || '').toLowerCase().includes(q.toLowerCase())).map((r) => (
              <li key={String(r.id)} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{r.item_type}</span>
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon key={i} className={`h-4 w-4 ${i < (r.rating ?? 0) ? 'fill-yellow-400' : ''}`} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-gray-900">{r.comment}</p>
                    <p className="mt-1 text-xs text-gray-400">{r.created_at || ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onHelpful(r.id)} className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <HandThumbUpIcon className="h-4 w-4 mr-1" /> Hữu ích
                    </button>
                    <button className="text-yellow-600 hover:text-yellow-800">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => onDelete(r.id)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


