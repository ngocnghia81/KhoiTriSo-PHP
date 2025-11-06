'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpenIcon,
  ShoppingCartIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid 
} from '@heroicons/react/24/solid';
import { bookService } from '@/services/bookService';
import type { Book } from '@/types';

interface BookDisplay extends Book {
  isNew?: boolean;
  isBestseller?: boolean;
}

const grades = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12'];
const sortOptions = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-low', label: 'Giá thấp đến cao' },
  { value: 'price-high', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'bestseller', label: 'Bán chạy nhất' },
];

export default function BooksPage() {
  const [books, setBooks] = useState<BookDisplay[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; count: number }>>([
    { id: 'all', name: 'Tất cả', count: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        console.log('Fetching books...');
        const response = await bookService.getAll();
        console.log('Books response:', response);
        console.log('Books data:', response.data);
        setBooks(response.data || []);
        
        // Build categories from books
        const categoryMap = new Map<string, number>();
        response.data?.forEach((book: Book) => {
          if (book.category?.name) {
            const current = categoryMap.get(book.category.name) || 0;
            categoryMap.set(book.category.name, current + 1);
          }
        });
        
        const cats = [
          { id: 'all', name: 'Tất cả', count: response.data?.length || 0 },
          ...Array.from(categoryMap.entries()).map(([name, count]) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            count
          }))
        ];
        console.log('Categories:', cats);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const filteredAndSortedBooks = useMemo(() => {
    const filtered = books.filter(book => {
      // Category filter
      if (selectedCategory !== 'all') {
        const categoryMatch = book.category?.name?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
        if (!categoryMatch) return false;
      }
      
      // Grade filter - skip for now as we don't have tags in DB
      // Can be implemented later with proper grade field
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = book.title?.toLowerCase().includes(searchLower);
        const descMatch = book.description?.toLowerCase().includes(searchLower);
        const authorMatch = book.author?.name?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch && !authorMatch) return false;
      }
      
      // Price range filter
      if (book.price < priceRange[0] || book.price > priceRange[1]) {
        return false;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
        default:
          return (b.total_reviews || 0) - (a.total_reviews || 0);
      }
    });

    return filtered;
  }, [books, selectedCategory, sortBy, searchTerm, priceRange]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const toggleFavorite = (bookId: string) => {
    setFavorites(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const addToCart = async (bookId: string, e?: React.MouseEvent) => {
    // Prevent navigation to detail page
    e?.stopPropagation();
    e?.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
        window.location.href = '/auth/login';
        return;
      }

      // Add to cart via API
      const response = await fetch('http://localhost:8000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          itemId: bookId,
          itemType: 'book',
          quantity: 1
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Đã thêm vào giỏ hàng!');
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Không thể thêm vào giỏ hàng');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
                  <span className="text-gray-500">Sách điện tử</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <BookOpenIcon className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Sách điện tử tương tác
            </h1>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              Khám phá thư viện sách điện tử phong phú với video giải bài tập chi tiết. 
              Mỗi câu hỏi đều có mã ID riêng để tra cứu nhanh chóng.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm sách, tác giả..."
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
                          <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                            {category.count}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grade Filter */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Lớp học
                  </h3>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
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
                        value="under-200k"
                        checked={priceRange[1] === 200000}
                        onChange={() => setPriceRange([0, 200000])}
                        className="text-blue-600"
                      />
                      <label className="text-gray-600">Dưới 200.000đ</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="price"
                        value="200k-300k"
                        checked={priceRange[0] === 200000 && priceRange[1] === 300000}
                        onChange={() => setPriceRange([200000, 300000])}
                        className="text-blue-600"
                      />
                      <label className="text-gray-600">200.000đ - 300.000đ</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="price"
                        value="300k-400k"
                        checked={priceRange[0] === 300000 && priceRange[1] === 400000}
                        onChange={() => setPriceRange([300000, 400000])}
                        className="text-blue-600"
                      />
                      <label className="text-gray-600">300.000đ - 400.000đ</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="price"
                        value="all"
                        checked={priceRange[1] === 500000}
                        onChange={() => setPriceRange([0, 500000])}
                        className="text-blue-600"
                      />
                      <label className="text-gray-600">Tất cả</label>
                    </div>
                  </div>
                </div>

                {/* Popular Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tags phổ biến
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['THPT Quốc gia', 'Nâng cao', 'Cơ bản', 'Video HD', 'Thí nghiệm'].map((tag, index) => (
                      <button
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
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
                  Sách điện tử ({filteredAndSortedBooks.length})
                </h2>
                <p className="text-gray-600 mt-1">
                  Tìm thấy {filteredAndSortedBooks.length} cuốn sách phù hợp
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

            {/* Books Grid */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Đang tải sách...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedBooks.map((book) => (
                  <div key={book.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    {/* Book Cover */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                      <Link href={`/books/${book.id}`}>
                        {book.cover_image ? (
                          <Image
                            src={book.cover_image}
                            alt={book.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            quality={100}
                            unoptimized={true}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpenIcon className="w-24 h-24 text-blue-400 opacity-50" />
                          </div>
                        )}
                      </Link>
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {book.isNew && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                            Mới
                          </span>
                        )}
                        {book.price === 0 && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                            Miễn phí
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => toggleFavorite(String(book.id))}
                          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          {favorites.includes(String(book.id)) ? (
                            <HeartIconSolid className="h-4 w-4 text-red-500" />
                          ) : (
                            <HeartIcon className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Book Info */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600 font-semibold">
                          {book.category?.name || 'Khác'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {book.total_questions || 0} câu hỏi
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        <Link href={`/books/${book.id}`} className="hover:text-blue-600 transition-colors">
                          {book.title}
                        </Link>
                      </h3>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {book.description}
                      </p>

                      <div className="flex items-center mb-4">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-700">
                          {book.author?.name || 'Tác giả'}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center mb-4">
                        {renderStars(book.rating || 0)}
                        <span className="text-sm text-gray-600 ml-2">
                          {book.rating || 0} ({book.total_reviews || 0} đánh giá)
                        </span>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-blue-600">
                              {book.price === 0 ? 'Miễn phí' : formatPrice(book.price)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => addToCart(String(book.id), e)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ShoppingCartIcon className="h-4 w-4 mr-1" />
                          {book.price === 0 ? 'Xem' : 'Mua'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredAndSortedBooks.length === 0 && (
              <div className="text-center py-16">
                <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy sách
                </h3>
                <p className="text-gray-600 mb-6">
                  Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedGrade('Tất cả');
                    setSearchTerm('');
                    setPriceRange([0, 500000]);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {/* Load More */}
            {filteredAndSortedBooks.length > 0 && (
              <div className="text-center mt-12">
                <button className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                  Xem thêm sách
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bạn đã có sách giấy?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Kích hoạt mã truy cập để xem video giải bài tập chi tiết trong 2 năm
          </p>
          <Link
            href="/books/activation"
            className="inline-flex items-center px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors shadow-lg"
          >
            Kích hoạt sách ngay
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
