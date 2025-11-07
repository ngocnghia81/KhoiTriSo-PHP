'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

interface Course {
  id: number;
  title: string;
  instructor?: string;
  thumbnail?: string;
  rating?: number;
  students?: number;
  duration?: string;
  price: number;
  original_price?: number;
  description?: string;
  level?: string;
}

interface Book {
  id: number;
  title: string;
  author?: string;
  cover_image?: string;
  rating?: number;
  price: number;
  original_price?: number;
  description?: string;
  pages?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  const levels = ['all', 'Cơ bản', 'Trung bình', 'Nâng cao'];

  // Fetch data from API
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';
        const url = `${apiUrl}/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab === 'all' ? 'all' : activeTab}`;
        console.log('Fetching search results:', url);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Search data:', data);
          setCourses(data.results.courses || []);
          setBooks(data.results.books || []);
        } else {
          console.error('Response not ok:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery, activeTab]);

  // Client-side filtering and sorting
  const allResults = [
    ...courses.map(c => ({ ...c, type: 'course' as const })),
    ...books.map(b => ({ ...b, type: 'book' as const }))
  ];

  const filteredResults = allResults.filter(item => {
    if (activeTab === 'courses' && item.type !== 'course') return false;
    if (activeTab === 'books' && item.type !== 'book') return false;
    if (selectedLevel !== 'all' && 'level' in item && item.level !== selectedLevel) return false;
    if (item.price < priceRange[0] || item.price > priceRange[1]) return false;
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tìm kiếm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600">
                Tìm thấy <span className="font-medium">{sortedResults.length}</span> kết quả {searchQuery && `cho "${searchQuery}"`}
              </p>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Bộ lọc
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Liên quan nhất</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="price_low">Giá thấp → cao</option>
                <option value="price_high">Giá cao → thấp</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Bộ lọc</h3>

                {/* Level Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Cấp độ</h4>
                  <div className="space-y-2">
                    {levels.map((level) => (
                      <label key={level} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="level"
                          value={level}
                          checked={selectedLevel === level}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          className="h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {level === 'all' ? 'Tất cả' : level}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Khoảng giá</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Từ"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Đến"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000])}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="space-y-2">
                      {[
                        [0, 100000, 'Dưới 100k'],
                        [100000, 300000, '100k - 300k'],
                        [300000, 500000, '300k - 500k'],
                        [500000, 1000000, 'Trên 500k']
                      ].map(([min, max, label]) => (
                        <button
                          key={label}
                          onClick={() => setPriceRange([min as number, max as number])}
                          className="block w-full text-left text-sm text-blue-600 hover:text-blue-800"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'all', name: 'Tất cả', count: allResults.length },
                  { id: 'courses', name: 'Khóa học', count: courses.length },
                  { id: 'books', name: 'Sách', count: books.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Results */}
            {sortedResults.length === 0 ? (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy kết quả</h3>
                <p className="text-gray-600">Thử tìm kiếm với từ khóa khác</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedResults.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-48 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          {item.type === 'course' ? (
                            <AcademicCapIcon className="h-12 w-12 text-white" />
                          ) : (
                            <BookOpenIcon className="h-12 w-12 text-white" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="ml-6 flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${
                                item.type === 'course' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {item.type === 'course' ? 'Khóa học' : 'Sách'}
                              </span>

                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                <Link href={`/${item.type === 'course' ? 'courses' : 'books'}/${item.id}`} className="hover:text-blue-600">
                                  {item.title}
                                </Link>
                              </h3>

                              <p className="text-sm text-gray-600 mb-3">
                                {item.type === 'course' && 'instructor' in item ? `Giảng viên: ${item.instructor || 'Chưa cập nhật'}` : 
                                 item.type === 'book' && 'author' in item ? `Tác giả: ${item.author || 'Chưa cập nhật'}` : ''}
                              </p>

                              {item.description && (
                                <p className="text-gray-700 mb-4 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              {/* Stats */}
                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                {item.rating && (
                                  <div className="flex items-center">
                                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                    <span className="font-medium text-gray-900">{item.rating}</span>
                                  </div>
                                )}
                                
                                {item.type === 'course' && 'students' in item && item.students && (
                                  <div className="flex items-center">
                                    <UserGroupIcon className="h-4 w-4 mr-1" />
                                    <span>{item.students.toLocaleString()} học viên</span>
                                  </div>
                                )}

                                {item.type === 'course' && 'duration' in item && item.duration && (
                                  <div className="flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    <span>{item.duration}</span>
                                  </div>
                                )}

                                {item.type === 'book' && 'pages' in item && item.pages && (
                                  <div className="flex items-center">
                                    <BookOpenIcon className="h-4 w-4 mr-1" />
                                    <span>{item.pages} trang</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Price and Actions */}
                            <div className="ml-6 text-right">
                              <div className="mb-4">
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(item.price)}
                                </div>
                                {item.original_price && item.original_price > item.price && (
                                  <div className="text-sm text-gray-500 line-through">
                                    {formatCurrency(item.original_price)}
                                  </div>
                                )}
                              </div>

                              <Link
                                href={`/${item.type === 'course' ? 'courses' : 'books'}/${item.id}`}
                                className="inline-block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                              >
                                {item.type === 'course' ? 'Xem chi tiết' : 'Mua ngay'}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
