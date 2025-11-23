'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MagnifyingGlassIcon, PlusIcon, TagIcon, EyeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { forumService, ForumQuestion } from '@/services/forum';
import { useToast } from '@/components/ToastProvider';
import RichTextEditor from '@/components/RichTextEditor';

export default function ForumPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'views'>('newest');

  useEffect(() => {
    fetchQuestions();
    fetchTags();
  }, [page, searchQuery, selectedTag, sortBy]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await forumService.getQuestions({
        page,
        pageSize: 20,
        q: searchQuery || undefined,
        tag: selectedTag || undefined,
      });
      setQuestions(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      notify(error.message || 'Lỗi tải câu hỏi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const tagsData = await forumService.getTags();
      setTags(tagsData || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Diễn đàn</h1>
            <Link
              href="/forum/ask"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Đặt câu hỏi
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <form onSubmit={handleSearch} className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm câu hỏi..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Sort and Tags */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="votes">Nhiều vote nhất</option>
                  <option value="views">Nhiều lượt xem nhất</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <TagIcon className="h-5 w-5 text-gray-400" />
                {tags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(selectedTag === tag ? '' : tag);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTag === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Chưa có câu hỏi nào</p>
            <Link
              href="/forum/ask"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Đặt câu hỏi đầu tiên
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <Link
                key={question._id}
                href={`/forum/${question._id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex gap-4">
                  {/* Vote and Stats */}
                  <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <div className="text-2xl font-bold text-gray-700">{question.votes || 0}</div>
                    <div className="text-xs text-gray-500">votes</div>
                    <div className="text-sm font-semibold text-green-600">
                      {question.answers?.filter((a) => a.isAccepted).length || 0}
                    </div>
                    <div className="text-xs text-gray-500">answers</div>
                    <div className="text-sm text-gray-600">{question.views || 0}</div>
                    <div className="text-xs text-gray-500">views</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                      {question.title}
                    </h3>
                    <div
                      className="text-gray-600 mb-3 line-clamp-2 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: question.content.substring(0, 200) + (question.content.length > 200 ? '...' : ''),
                      }}
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {question.author?.name || 'Thành viên'}
                          {question.created_at && ` • ${formatDate(question.created_at)}`}
                        </span>
                        {question.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                            {question.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {question.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

