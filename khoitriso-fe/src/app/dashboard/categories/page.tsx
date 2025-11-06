'use client'
import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categories';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type UiCategory = { id: string | number; name: string; slug?: string; description?: string };

export default function CategoriesPage() {
  const [items, setItems] = useState<UiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UiCategory | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    const res = await getCategories();
    if (res.ok) {
      const raw = (res.data as any)?.categories || (res.data as any)?.data || [];
      const mapped = raw.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description }));
      setItems(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '' });
  };

  const onSubmit = async () => {
    if (editing) {
      const res = await updateCategory(Number(editing.id), form);
      if (res.ok) {
        await fetchData();
        setShowForm(false);
        resetForm();
      }
    } else {
      const res = await createCategory(form);
      if (res.ok) {
        await fetchData();
        setShowForm(false);
        resetForm();
      }
    }
  };

  const onDelete = async (id: string | number) => {
    const res = await deleteCategory(Number(id));
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Danh mục</h1>
          <p className="mt-2 text-sm text-gray-700">Quản lý danh mục nội dung</p>
        </div>
        <div>
          <button onClick={() => { setShowForm(true); resetForm(); }} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            <PlusIcon className="h-5 w-5 mr-2" /> Thêm danh mục
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading && <div className="p-6 text-sm text-gray-500">Đang tải...</div>}
        {!loading && items.length === 0 && <div className="p-6 text-sm text-gray-500">Chưa có danh mục</div>}
        {!loading && items.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((c) => (
                <tr key={String(c.id)}>
                  <td className="px-6 py-4 text-sm text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.slug}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.description}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button onClick={() => { setEditing(c); setForm({ name: c.name || '', slug: c.slug || '', description: c.description || '' }); setShowForm(true); }} className="text-yellow-600 hover:text-yellow-800 mr-3">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => onDelete(c.id)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal form (simple inline) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên</label>
                <input className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="px-3 py-2 text-sm rounded-md border border-gray-300">Hủy</button>
              <button onClick={onSubmit} className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


