'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { forumService } from '@/services/forum';
import { useToast } from '@/components/ToastProvider';
import RichTextEditor from '@/components/RichTextEditor';

const categories = [
  { name: 'Tổng quát', slug: 'general' },
  { name: 'Toán học', slug: 'math' },
  { name: 'Vật lý', slug: 'physics' },
  { name: 'Hóa học', slug: 'chemistry' },
  { name: 'Lập trình', slug: 'programming' },
  { name: 'Tiếng Anh', slug: 'english' },
  { name: 'Khác', slug: 'other' },
];

export default function AskQuestionPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    category: categories[0],
  });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      } else {
        notify('Vui lòng đăng nhập để đặt câu hỏi', 'error');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      notify('Vui lòng đăng nhập', 'error');
      router.push('/login');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      notify('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    try {
      setLoading(true);
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const question = await forumService.createQuestion({
        title: formData.title,
        content: formData.content,
        tags: tags.length > 0 ? tags : undefined,
        category: formData.category,
      });

      notify('Đặt câu hỏi thành công!', 'success');
      router.push(`/forum/${question._id}`);
    } catch (error: any) {
      console.error('Error creating question:', error);
      notify(error.message || 'Lỗi đặt câu hỏi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/forum"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Quay lại diễn đàn
        </Link>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Đặt câu hỏi</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề câu hỏi *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ví dụ: Làm thế nào để giải phương trình bậc 2?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Hãy đặt câu hỏi rõ ràng và cụ thể
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung câu hỏi *
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Mô tả chi tiết câu hỏi của bạn. Bạn có thể sử dụng định dạng văn bản, công thức toán học, v.v."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={formData.category.slug}
                onChange={(e) => {
                  const cat = categories.find((c) => c.slug === e.target.value) || categories[0];
                  setFormData({ ...formData, category: cat });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Ví dụ: toán-lớp-12, đại-số, phương-trình"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Thêm tags để người khác dễ dàng tìm thấy câu hỏi của bạn
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Link
                href="/forum"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang đăng...' : 'Đăng câu hỏi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

