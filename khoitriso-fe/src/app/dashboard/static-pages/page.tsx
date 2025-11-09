'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  getStaticPages, 
  createStaticPage, 
  updateStaticPage, 
  deleteStaticPage,
  type StaticPage 
} from '@/services/staticPages';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import RichTextEditor from '@/components/RichTextEditor';

export default function StaticPagesPage() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaticPage | null>(null);
  const [form, setForm] = useState({
    slug: '',
    title: '',
    metaDescription: '',
    metaKeywords: '',
    content: '',
    template: 'default',
    isPublished: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getStaticPages({
        page,
        pageSize: 20,
        search: searchTerm || undefined,
      });
      setPages(result.data || []);
      setTotal(result.total || 0);
    } catch (error: any) {
      console.error('Error fetching static pages:', error);
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      slug: '',
      title: '',
      metaDescription: '',
      metaKeywords: '',
      content: '',
      template: 'default',
      isPublished: false,
    });
  };

  const handleEdit = (page: StaticPage) => {
    setEditing(page);
    setForm({
      slug: page.slug,
      title: page.title,
      metaDescription: page.meta_description || '',
      metaKeywords: page.meta_keywords || '',
      content: page.content,
      template: page.template,
      isPublished: page.is_published,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateStaticPage(editing.id, form);
      } else {
        await createStaticPage(form);
      }
      await fetchData();
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving static page:', error);
      alert(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa trang này?')) return;
    try {
      await deleteStaticPage(id);
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting static page:', error);
      alert(error.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trang tĩnh</h1>
          <p className="mt-2 text-sm text-gray-700">Quản lý các trang tĩnh với SEO tối ưu</p>
        </div>
        <div>
          <button
            onClick={() => {
              setShowForm(true);
              resetForm();
            }}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" /> Thêm trang mới
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tiêu đề hoặc slug..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading && <div className="p-6 text-sm text-gray-500">Đang tải...</div>}
        {!loading && pages.length === 0 && (
          <div className="p-6 text-sm text-gray-500">Chưa có trang tĩnh</div>
        )}
        {!loading && pages.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lượt xem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{page.title}</div>
                      {page.meta_description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {page.meta_description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            page.is_published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {page.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                        {!page.is_active && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Đã tắt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.view_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {page.is_published && (
                          <Link
                            href={`/pages/${page.slug}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem trang"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleEdit(page)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{(page - 1) * 20 + 1}</span> đến{' '}
                <span className="font-medium">{Math.min(page * 20, total)}</span> trong tổng số{' '}
                <span className="font-medium">{total}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 20 >= total}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editing ? 'Sửa trang tĩnh' : 'Thêm trang tĩnh mới'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="ve-chung-toi"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    URL: /{form.slug || 'slug'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template</label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.template}
                    onChange={(e) => setForm({ ...form, template: e.target.value })}
                  >
                    <option value="default">Mặc định</option>
                    <option value="about">Giới thiệu</option>
                    <option value="contact">Liên hệ</option>
                    <option value="faq">FAQ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiêu đề *</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Meta Description (SEO)
                </label>
                <textarea
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="Mô tả ngắn gọn cho SEO (150-160 ký tự)"
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {form.metaDescription.length}/160 ký tự
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Meta Keywords (SEO)
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={form.metaKeywords}
                  onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                  placeholder="từ khóa 1, từ khóa 2, từ khóa 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nội dung *</label>
                <div className="mt-1">
                  <RichTextEditor
                    value={form.content}
                    onChange={(value) => setForm({ ...form, content: value })}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  />
                  <span className="ml-2 text-sm text-gray-700">Xuất bản ngay</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-3 py-2 text-sm rounded-md border border-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

