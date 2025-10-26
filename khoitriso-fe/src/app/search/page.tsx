'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  PlayIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

import { search } from '@/services/search';
import { getSafeImage } from '@/lib/image';

function SearchContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const categories = ['all', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh'];
  const levels = ['all', 'Cơ bản', 'Trung bình', 'Nâng cao'];

  useEffect(() => {
    (async () => {
      if (!searchQuery) { setResults([]); return; }
      const res = await search({ q: searchQuery, pageSize: 50 });
      if (res.ok) {
        const arr = ((res.data as any)?.data) || (Array.isArray(res.data) ? (res.data as any[]) : []);
        // Normalize shape
        setResults(arr.map((item: any) => ({
          id: String(item.id ?? item.slug ?? Math.random()),
          type: item.type ?? (item.price !== undefined ? 'book' : 'course'),
          title: item.title ?? item.name ?? 'Kết quả',
          instructor: item.instructor?.name,
          author: item.author?.name,
          rating: Number(item.rating ?? 5),
          reviewCount: item.reviewsCount ?? 0,
          students: item.studentsCount ?? 0,
          duration: item.duration ?? '',
          price: Number(item.price ?? 0),
          originalPrice: item.originalPrice,
          thumbnail: getSafeImage(item.thumbnail ?? item.coverImage),
          description: item.description ?? '',
          level: item.level ?? '',
          category: item.category?.name ?? '',
          pages: item.pages,
        })));
      } else {
        setResults([]);
      }
    })();
  }, [searchQuery]);

  const allResults = results;
  const filteredResults = allResults.filter(item => {
    if (activeTab === 'courses' && item.type !== 'course') return false;
    if (activeTab === 'books' && item.type !== 'book') return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedLevel !== 'all' && 'level' in item && item.level !== selectedLevel) return false;
    if (item.price < priceRange[0] || item.price > priceRange[1]) return false;
    return true;
  });

  const formatCurrency = (amount: number) => {
    return `₫${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tìm kiếm khóa học, sách, giảng viên..."
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Bộ lọc
            </button>
          </div>

          {/* Search Stats */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Tìm thấy <span className="font-medium">{filteredResults.length}</span> kết quả cho &quot;{searchQuery}&quot;
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="relevance">Liên quan nhất</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="price_low">Giá thấp đến cao</option>
                <option value="price_high">Giá cao đến thấp</option>
                <option value="newest">Mới nhất</option>
                <option value="popular">Phổ biến nhất</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Bộ lọc</h3>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Danh mục</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={selectedCategory === category}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {category === 'all' ? 'Tất cả' : category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Cấp độ</h4>
                <div className="space-y-2">
                  {levels.map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="level"
                        value={level}
                        checked={selectedLevel === level}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
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

              {/* Rating Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Đánh giá</h4>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <button key={rating} className="flex items-center w-full text-left">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-700">
                        {rating} sao trở lên
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'all', name: 'Tất cả', count: allResults.length },
                  { id: 'courses', name: 'Khóa học', count: allResults.filter(i => i.type === 'course').length },
                  { id: 'books', name: 'Sách', count: allResults.filter(i => i.type === 'book').length }
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
            <div className="space-y-6">
              {filteredResults.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.type === 'course' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {item.type === 'course' ? 'Khóa học' : 'Sách'}
                              </span>
                              <span className="text-sm text-gray-500">{item.category}</span>
                              {'level' in item && (
                                <span className="text-sm text-gray-500">• {item.level}</span>
                              )}
                            </div>

                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              <Link href={`/${item.type}s/${item.id}`} className="hover:text-blue-600">
                                {item.title}
                              </Link>
                            </h3>

                            <p className="text-sm text-gray-600 mb-3">
                              {'instructor' in item ? `Giảng viên: ${item.instructor}` : `Tác giả: ${item.author}`}
                            </p>

                            <p className="text-gray-700 mb-4 line-clamp-2">
                              {item.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                              <div className="flex items-center">
                                <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                <span className="font-medium text-gray-900">{item.rating}</span>
                                <span className="ml-1">({formatNumber(item.reviewCount)} đánh giá)</span>
                              </div>
                              
                              {item.type === 'course' && 'students' in item && (
                                <div className="flex items-center">
                                  <UserGroupIcon className="h-4 w-4 mr-1" />
                                  <span>{formatNumber(item.students)} học viên</span>
                                </div>
                              )}

                              {item.type === 'course' && 'duration' in item && (
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  <span>{item.duration}</span>
                                </div>
                              )}

                              {item.type === 'book' && 'pages' in item && (
                                <div className="flex items-center">
                                  <BookOpenIcon className="h-4 w-4 mr-1" />
                                  <span>{item.pages} trang</span>
                                </div>
                              )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {['tag1', 'tag2', 'tag3'].map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Price and Actions */}
                          <div className="ml-6 text-right">
                            <div className="mb-4">
                              <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(item.price)}
                              </div>
                              {'originalPrice' in item && item.originalPrice > item.price && (
                                <div className="text-sm text-gray-500 line-through">
                                  {formatCurrency(item.originalPrice)}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                {item.type === 'course' ? 'Đăng ký ngay' : 'Mua ngay'}
                              </button>
                              <div className="flex space-x-2">
                                <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                  <HeartIcon className="h-4 w-4 mx-auto" />
                                </button>
                                <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                  <ShareIcon className="h-4 w-4 mx-auto" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                  Trước
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">1</span> đến{' '}
                    <span className="font-medium">{filteredResults.length}</span> trong{' '}
                    <span className="font-medium">{filteredResults.length}</span> kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Trước
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
