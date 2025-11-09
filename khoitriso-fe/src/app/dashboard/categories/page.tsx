'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    try {
      const categories = await getCategories();
      // getCategories() already returns Category[] array
      // Flatten the categories array (including children) for display
      const flattened: any[] = [];
      categories.forEach((c: any) => {
        // Add parent category
        flattened.push(c);
        // Add children if they exist
        if (c.children && Array.isArray(c.children)) {
          c.children.forEach((child: any) => {
            flattened.push(child);
          });
        }
      });
      setItems(flattened);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '' });
  };

  const onSubmit = async () => {
    try {
      if (editing) {
        await updateCategory(Number(editing.id), form);
      } else {
        await createCategory(form);
      }
      await fetchData();
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(error.message || 'Có lỗi xảy ra');
    }
  };

  const onDelete = async (id: string | number) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await deleteCategory(Number(id));
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.message || 'Có lỗi xảy ra');
    }
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((c: any) => {
                  const isParent = c.children && c.children.length > 0;
                  return (
                    <tr key={String(c.id)} className={c.parent_id ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          {c.parent_id && <span className="mr-2 text-gray-400">└─</span>}
                          <Link 
                            href={`/categories/${c.id}`}
                            className={`font-medium hover:underline ${isParent ? 'text-blue-600' : 'text-gray-900'}`}
                          >
                            {c.name}
                          </Link>
                          {isParent && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                              {c.children.length} con
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{c.description || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {c.parent_id ? `ID: ${c.parent_id}` : 'Danh mục gốc'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {c.is_active ? 'Hoạt động' : 'Tắt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button 
                          onClick={() => { 
                            setEditing(c); 
                            setForm({ 
                              name: c.name || '', 
                              slug: c.slug || '', 
                              description: c.description || '' 
                            }); 
                            setShowForm(true); 
                          }} 
                          className="text-yellow-600 hover:text-yellow-800 mr-3"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => onDelete(c.id)} 
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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


