'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ClockIcon, 
  UserGroupIcon, 
  StarIcon,
  PlayCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  HeartIcon,
  ShoppingCartIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { courseService } from '@/services/courseService';
import { getCourses } from '@/services/courses';
import { httpClient } from '@/lib/http-client';
import type { Course } from '@/types';
import { requireAuth, handleApiResponse } from '@/utils/authCheck';

interface CourseDisplay extends Course {
  isPopular?: boolean;
  isNew?: boolean;
}

// Categories will be loaded from API
const staticCategories = [
  { id: 'all', name: 'Tất cả' },
  { id: 'free', name: 'Miễn phí' },
  { id: 'paid', name: 'Trả phí' },
];

const levels = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];
const sortOptions = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-low', label: 'Giá thấp đến cao' },
  { value: 'price-high', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(staticCategories);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Fetch courses and categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses
        const coursesResponse = await httpClient.get('courses');
        console.log('Courses API response:', coursesResponse);
        
        if (coursesResponse.ok && coursesResponse.data) {
          const responseData = coursesResponse.data as any;
          const courses = responseData.data || responseData || [];
          setCourses(Array.isArray(courses) ? courses : []);
        }
        
        // Fetch categories
        try {
          const categoriesResponse = await httpClient.get('categories');
          if (categoriesResponse.ok) {
            const responseData = categoriesResponse.data as any;
            const cats = Array.isArray(responseData) 
              ? responseData 
              : (responseData?.data || []);
            setCategories([
              ...staticCategories,
              ...cats.map((cat: any) => ({ id: String(cat.id), name: cat.name }))
            ]);
          }
        } catch (catError) {
          console.error('Error fetching categories:', catError);
          // Keep static categories if API fails
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAndSortedCourses = useMemo(() => {
    const filtered = courses.filter(course => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'free') {
          if (course.price > 0 || !course.is_free) return false;
        } else if (selectedCategory === 'paid') {
          if (course.price === 0 || course.is_free) return false;
        } else {
          // Match category by ID
          const courseCategoryId = course.category?.id ? String(course.category.id) : null;
          if (courseCategoryId !== selectedCategory) {
            return false;
          }
        }
      }
      
      // Level filter - map level names to course level
      if (selectedLevel !== 'Tất cả') {
        const levelMap: { [key: string]: number } = {
          'Lớp 10': 1,
          'Lớp 11': 2,
          'Lớp 12': 3,
          'Đại học': 4,
        };
        const expectedLevel = levelMap[selectedLevel];
        if (expectedLevel && course.level !== expectedLevel) {
          return false;
        }
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchTitle = course.title?.toLowerCase().includes(searchLower);
        const matchDesc = course.description?.toLowerCase().includes(searchLower);
        const matchInstructor = course.instructor?.name?.toLowerCase().includes(searchLower);
        if (!matchTitle && !matchDesc && !matchInstructor) {
          return false;
        }
      }
      
      // Price range filter
      const coursePrice = course.price || 0;
      const isFree = course.is_free || coursePrice === 0;
      
      // Special handling for "Miễn phí" (priceRange = [0, 0])
      if (priceRange[0] === 0 && priceRange[1] === 0) {
        // Only show free courses
        if (!isFree) return false;
      } else if (priceRange[1] === 2000000) {
        // "Tất cả" - show all courses (no filter)
        // Do nothing, show all
      } else {
        // Other price ranges: show courses within range (including free if range starts at 0)
        if (priceRange[0] === 0) {
          // Range starts at 0, include free courses
          if (coursePrice > priceRange[1]) return false;
        } else {
          // Range doesn't start at 0, exclude free courses
          if (isFree || coursePrice < priceRange[0] || coursePrice > priceRange[1]) {
            return false;
          }
        }
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
        default:
          return (b.total_students || 0) - (a.total_students || 0);
      }
    });

    return filtered;
  }, [courses, selectedCategory, selectedLevel, sortBy, searchTerm, priceRange]);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const toggleFavorite = (courseId: number) => {
    setFavorites(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const addToCart = async (courseId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    // Check authentication
    if (!requireAuth('Vui lòng đăng nhập để thêm vào giỏ hàng.')) {
      return;
    }

    try {
      const response = await httpClient.post('cart', {
        item_id: courseId,
        item_type: 1, // 1 = course
        quantity: 1
      });

      if (response.ok) {
        alert('Đã thêm vào giỏ hàng!');
        // Dispatch event to update cart count
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('kts-cart-changed'));
        }
      } else {
        const data = response.error;
        alert(data.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/" className="text-gray-700 hover:text-blue-600">
                  Trang chủ
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500">Khóa học</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Khóa học trực tuyến
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Khám phá hàng trăm khóa học chất lượng cao từ các giảng viên hàng đầu. 
              Học mọi lúc, mọi nơi với phương pháp hiện đại và hiệu quả.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm khóa học, giảng viên..."
                  className="w-full px-6 py-4 pr-14 text-gray-900 bg-white rounded-xl focus:ring-4 focus:ring-white/20 focus:outline-none text-lg"
                />
                <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600">
                  <MagnifyingGlassIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Bộ lọc
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Categories */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Danh mục
                  </h3>
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full text-left flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-blue-100 text-blue-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span>{category.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Level Filter */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cấp độ
                  </h3>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Khoảng giá
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="price"
                        value="free"
                        checked={priceRange[1] === 0}
                        onChange={() => setPriceRange([0, 0])}
                        className="text-blue-600"
                      />
                      <label className="text-gray-600">Miễn phí</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="price"
                        value="under-500k"
                        checked={priceRange[1] === 500000}
                        onChange={() => setPriceRange([0, 500000])}
                        className="text-blue-600"
                      />
                      <label className="text-gray-600">Dưới 500.000đ</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="price"
                        value="500k-1m"
                        checked={priceRange[0] === 500000 && priceRange[1] === 1000000}
                        onChange={() => setPriceRange([500000, 1000000])}
                        className="text-blue-600"
                      />
                      <label className="text-gray-600">500.000đ - 1.000.000đ</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="price"
                        value="all"
                        checked={priceRange[1] === 2000000}
                        onChange={() => setPriceRange([0, 2000000])}
                        className="text-blue-600"
                      />
                      <label className="text-gray-600">Tất cả</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Khóa học ({filteredAndSortedCourses.length})
                </h2>
                <p className="text-gray-600 mt-1">
                  Tìm thấy {filteredAndSortedCourses.length} khóa học phù hợp
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-16">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-gray-600">Đang tải khóa học...</p>
                </div>
              ) : (
                filteredAndSortedCourses.map((course) => (
                  <div key={course.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    {/* Course Image */}
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={course.thumbnail || '/images/course/course-1/1.png'}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        quality={100}
                        unoptimized={true}
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {course.is_free && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                            Miễn phí
                          </span>
                        )}
                        {course.rating >= 4.5 && (
                          <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                            Nổi bật
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={() => toggleFavorite(course.id)}
                          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          {favorites.includes(course.id) ? (
                            <HeartIconSolid className="h-4 w-4 text-red-500" />
                          ) : (
                            <HeartIcon className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Link
                          href={`/courses/${course.id}`}
                          className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <PlayCircleIcon className="h-8 w-8 text-blue-600" />
                        </Link>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600 font-semibold">
                          {course.category?.name || 'Chung'}
                        </span>
                        <span className="text-sm text-gray-500">{course.level || 'Tất cả'}</span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        <Link href={`/courses/${course.id}`} className="hover:text-blue-600 transition-colors">
                          {course.title}
                        </Link>
                      </h3>

                      <div 
                        className="text-gray-600 text-sm mb-4 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: course.description 
                            ? course.description.replace(/<[^>]*>/g, '').substring(0, 150) + (course.description.replace(/<[^>]*>/g, '').length > 150 ? '...' : '')
                            : '' 
                        }}
                      />

                      <div className="flex items-center mb-4">
                        <Link
                          href={`/teachers/${course.instructor_id}`}
                          className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          {course.instructor?.name || 'Giảng viên'}
                        </Link>
                      </div>

                      {/* Course Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>{course.estimated_duration || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <BookOpenIcon className="h-4 w-4 mr-1" />
                            <span>{course.total_lessons || 0} bài</span>
                          </div>
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            <span>{(course.total_students || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center mb-4">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIconSolid
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.floor(course.rating || 0)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          {course.rating || 0} (0 đánh giá)
                        </span>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center justify-between">
                        <div>
                          {course.is_free || course.price === 0 ? (
                            <span className="text-lg font-bold text-green-600">
                              Miễn phí
                            </span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-blue-600">
                                {formatPrice(course.price)}
                              </span>
                            </div>
                          )}
                        </div>

                        {!course.is_free && course.price > 0 && (
                          <button
                            onClick={(e) => addToCart(course.id, e)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ShoppingCartIcon className="h-4 w-4 mr-1" />
                            Thêm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Empty State */}
            {filteredAndSortedCourses.length === 0 && (
              <div className="text-center py-16">
                <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy khóa học
                </h3>
                <p className="text-gray-600 mb-6">
                  Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedLevel('Tất cả');
                    setSearchTerm('');
                    setPriceRange([0, 2000000]);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {/* Load More */}
            {filteredAndSortedCourses.length > 0 && (
              <div className="text-center mt-12">
                <button className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                  Xem thêm khóa học
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bạn là giảng viên?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tham gia cùng chúng tôi để chia sẻ kiến thức và kiếm thu nhập từ việc giảng dạy
          </p>
          <Link
            href="/become-instructor"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Trở thành giảng viên
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}