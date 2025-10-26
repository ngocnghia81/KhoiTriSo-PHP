'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpenIcon,
  StarIcon,
  ShoppingCartIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  TagIcon,
  UserIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid 
} from '@heroicons/react/24/solid';
import { getBooks } from '@/services/books';
import { addToCart as apiAddToCart } from '@/services/cart';
import { getCategories } from '@/services/categories';

interface Book {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    id: string;
  };
  category: {
    name: string;
    slug: string;
  };
  coverImage: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  totalQuestions: number;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  publishedAt: string;
  tags: string[];
  slug: string;
  isNew?: boolean;
  isBestseller?: boolean;
}

type UiCategory = { id: string; name: string; count?: number };

const grades = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12'];
const sortOptions = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-low', label: 'Giá thấp đến cao' },
  { value: 'price-high', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'bestseller', label: 'Bán chạy nhất' },
];

// Removed hardcoded books; data is loaded from API only

export default function BooksPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [categories, setCategories] = useState<UiCategory[]>([{ id: 'all', name: 'Tất cả' }]);
  const [bookList, setBookList] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getBooks({ pageSize: 50 });
      if (res.ok) {
        const raw = (res.data as any)?.books || (res.data as any)?.data || [];
        const mapped: Book[] = raw.map((b: any) => ({
          id: String(b.id ?? b.slug ?? b.title ?? Math.random()),
          title: b.title ?? b.name ?? 'Sách',
          description: b.description ?? '',
          author: { name: b.author?.name ?? 'Tác giả', id: String(b.author?.id ?? 'author') },
          category: { name: b.category?.name ?? 'Danh mục', slug: b.category?.slug ?? 'all' },
          coverImage: b.coverImage ?? '/images/product/cart-1.png',
          price: Number(b.price ?? 0),
          originalPrice: undefined,
          discountPercent: undefined,
          totalQuestions: b.totalQuestions ?? 0,
          rating: Number(b.rating ?? 5),
          reviewsCount: b.reviewsCount ?? 0,
          isActive: true,
          publishedAt: b.publishedAt ?? '2024-01-01',
          tags: b.tags ?? [],
          slug: b.slug ?? String(b.id ?? 'book'),
          isNew: !!b.isNew,
          isBestseller: !!b.isBestseller,
        }));
        setBookList(mapped);
      } else {
        setBookList([]);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await getCategories();
      if (res.ok) {
        const raw = (res.data as any)?.categories || (res.data as any)?.data || [];
        const mapped: UiCategory[] = [{ id: 'all', name: 'Tất cả' }, ...raw.map((c: any) => ({ id: String(c.slug ?? c.id), name: c.name ?? 'Danh mục', count: c.bookCount }))];
        setCategories(mapped);
      }
    })();
  }, []);

  const filteredAndSortedBooks = useMemo(() => {
    const filtered = bookList.filter(book => {
      // Category filter
      if (selectedCategory !== 'all' && book.category.slug !== selectedCategory) {
        return false;
      }
      
      // Grade filter (extracted from tags)
      if (selectedGrade !== 'Tất cả') {
        const gradeNumber = selectedGrade.replace('Lớp ', '');
        const hasGrade = book.tags.some(tag => tag.includes(gradeNumber));
        if (!hasGrade) return false;
      }
      
      // Search filter
      if (searchTerm && !book.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !book.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !book.author.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
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
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'bestseller':
          return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
        case 'popular':
        default:
          return b.reviewsCount - a.reviewsCount;
      }
    });

    return filtered;
  }, [selectedCategory, selectedGrade, sortBy, searchTerm, priceRange, bookList]);

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

  const addToCart = async (bookId: string) => {
    await apiAddToCart({ itemType: 2, itemId: Number(bookId) || 0 });
    alert('Đã thêm sách vào giỏ hàng');
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
            {loading && (
              <div className="text-center text-gray-600 py-8">Đang tải dữ liệu...</div>
            )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedBooks.map((book) => (
                <div key={book.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  {/* Book Cover */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Link href={`/books/${book.slug}`}>
                      <Image
                        src={book.coverImage}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        quality={100}
                        unoptimized={true}
                      />
                    </Link>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {book.isNew && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                          Mới
                        </span>
                      )}
                      {book.isBestseller && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                          Bán chạy
                        </span>
                      )}
                      {book.discountPercent && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                          -{book.discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => toggleFavorite(book.id)}
                        className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        {favorites.includes(book.id) ? (
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
                        {book.category.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {book.totalQuestions} câu hỏi
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      <Link href={`/books/${book.slug}`} className="hover:text-blue-600 transition-colors">
                        {book.title}
                      </Link>
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {book.description}
                    </p>

                    <div className="flex items-center mb-4">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <Link
                        href={`/authors/${book.author.id}`}
                        className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {book.author.name}
                      </Link>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      {renderStars(book.rating)}
                      <span className="text-sm text-gray-600 ml-2">
                        {book.rating} ({book.reviewsCount} đánh giá)
                      </span>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(book.price)}
                          </span>
                          {book.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(book.originalPrice)}
                            </span>
                          )}
                        </div>
                        {book.originalPrice && (
                          <div className="text-xs text-green-600 font-semibold">
                            Tiết kiệm {formatPrice(book.originalPrice - book.price)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(book.id)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ShoppingCartIcon className="h-4 w-4 mr-1" />
                        Mua
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {book.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
