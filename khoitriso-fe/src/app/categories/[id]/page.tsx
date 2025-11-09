'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCategory } from '@/services/categories';
import { bookService } from '@/services/bookService';
import { getCourses } from '@/services/courses';
import { 
  AcademicCapIcon, 
  BookOpenIcon,
  ArrowLeftIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  children?: Category[];
  courses?: any[];
  books?: any[];
}

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'books'>('courses');

  useEffect(() => {
    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch category details
      const categoryData = await getCategory(Number(categoryId));
      setCategory(categoryData as Category);

      // Fetch courses in this category
      const coursesData = await getCourses({ category: Number(categoryId), pageSize: 20 });
      // API returns { data: [...], total: ... } or just array
      if (coursesData) {
        if (Array.isArray(coursesData)) {
          setCourses(coursesData);
        } else if ('data' in coursesData && Array.isArray((coursesData as any).data)) {
          setCourses((coursesData as any).data);
        }
      }

      // Fetch books in this category
      const booksData = await bookService.getAll({ categoryId: Number(categoryId), perPage: 20 });
      // bookService.getAll returns PaginatedResponse<Book>
      if (booksData && 'data' in booksData) {
        setBooks(booksData.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Không tìm thấy danh mục</p>
            <Link href="/categories" className="mt-4 text-blue-600 hover:text-blue-800">
              Quay lại danh sách danh mục
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {category.icon || category.name.charAt(0)}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="mt-2 text-gray-600">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Khóa học ({courses.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'books'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Sách điện tử ({books.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'courses' && (
            <div>
              {courses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có khóa học</h3>
                  <p className="mt-1 text-sm text-gray-500">Chưa có khóa học nào trong danh mục này.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="aspect-video bg-gray-200 relative">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <AcademicCapIcon className="h-12 w-12 text-white" />
                          </div>
                        )}
                        {(course.isFree || course.is_free) && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Miễn phí
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {course.title}
                        </h3>
                        {course.instructor && (
                          <p className="mt-1 text-sm text-gray-600">
                            {course.instructor.name}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center">
                            {(course.rating || course.rating === 0) && (
                              <>
                                <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="ml-1 text-sm text-gray-600">
                                  {Number(course.rating).toFixed(1)}
                                </span>
                                {(course.total_reviews || course.totalReviews) && (
                                  <span className="ml-1 text-sm text-gray-500">
                                    ({course.total_reviews || course.totalReviews})
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {formatPrice(course.price || course.price)}
                          </div>
                        </div>
                        {(course.total_students || course.totalStudents) && (
                          <p className="mt-2 text-sm text-gray-500">
                            {course.total_students || course.totalStudents} học viên
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'books' && (
            <div>
              {books.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có sách</h3>
                  <p className="mt-1 text-sm text-gray-500">Chưa có sách nào trong danh mục này.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {books.map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.id}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="aspect-[3/4] bg-gray-200 relative">
                        {book.cover_image ? (
                          <img
                            src={book.cover_image}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600">
                            <BookOpenIcon className="h-12 w-12 text-white" />
                          </div>
                        )}
                        {book.is_free && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Miễn phí
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="mt-1 text-sm text-gray-600">
                            {book.author.name}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center">
                            {book.rating && (
                              <>
                                <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="ml-1 text-sm text-gray-600">
                                  {book.rating.toFixed(1)}
                                </span>
                                {book.total_reviews && (
                                  <span className="ml-1 text-sm text-gray-500">
                                    ({book.total_reviews})
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {formatPrice(book.price)}
                          </div>
                        </div>
                        {book.total_questions && (
                          <p className="mt-2 text-sm text-gray-500">
                            {book.total_questions} câu hỏi
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

