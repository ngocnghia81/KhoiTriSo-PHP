'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  getUser,
  getUserCourses,
  getUserBooks,
  toggleUserStatus,
  UserDetail,
  UserCourse,
  UserBook,
} from '@/services/admin';
import { useToast } from '@/components/ToastProvider';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'books'>('courses');
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [books, setBooks] = useState<UserBook[]>([]);
  const [coursesPage, setCoursesPage] = useState(1);
  const [booksPage, setBooksPage] = useState(1);
  const [coursesPagination, setCoursesPagination] = useState<any>(null);
  const [booksPagination, setBooksPagination] = useState<any>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  const userId = params?.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (!userId) return;
    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (activeTab === 'courses') {
      fetchCourses();
    } else {
      fetchBooks();
    }
  }, [userId, activeTab, coursesPage, booksPage]);

  const fetchUser = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getUser(userId);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      notify('Lỗi tải thông tin người dùng', 'error');
      router.push('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    if (!userId) return;
    setLoadingCourses(true);
    try {
      const response = await getUserCourses(userId, { page: coursesPage, pageSize: 10 });
      setCourses(response.courses);
      setCoursesPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching courses:', error);
      notify('Lỗi tải danh sách khóa học', 'error');
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchBooks = async () => {
    if (!userId) return;
    setLoadingBooks(true);
    try {
      const response = await getUserBooks(userId, { page: booksPage, pageSize: 10 });
      setBooks(response.books);
      setBooksPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching books:', error);
      notify('Lỗi tải danh sách sách', 'error');
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!userId || !user) return;
    try {
      const result = await toggleUserStatus(userId);
      setUser({ ...user, isActive: result.isActive });
      notify(
        result.isActive ? 'Đã mở khóa tài khoản người dùng' : 'Đã khóa tài khoản người dùng',
        'success'
      );
    } catch (error) {
      console.error('Error toggling status:', error);
      notify('Lỗi cập nhật trạng thái', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy người dùng</p>
          <Link href="/dashboard/users" className="text-blue-600 hover:underline mt-4 inline-block">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Quay lại danh sách người dùng
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết người dùng</h1>
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
                user.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {user.isActive ? (
                <>
                  <LockClosedIcon className="h-5 w-5 mr-2" />
                  Khóa tài khoản
                </>
              ) : (
                <>
                  <LockOpenIcon className="h-5 w-5 mr-2" />
                  Mở khóa tài khoản
                </>
              )}
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="rounded-full"
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-4xl font-bold text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
              <p className="text-gray-600 mb-1">@{user.username}</p>
              <p className="text-gray-600 mb-4">{user.email}</p>
              <div className="flex items-center space-x-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.emailVerified
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {user.emailVerified ? 'Đã xác thực email' : 'Chưa xác thực email'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Giảng viên' : 'Học viên'}
                </span>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                {user.lastLogin && (
                  <p>Đăng nhập cuối: {new Date(user.lastLogin).toLocaleDateString('vi-VN')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Khóa học đã đăng ký</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {user.stats.coursesCount}
                </p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sách đã mua</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {user.stats.booksCount}
                </p>
              </div>
              <BookOpenIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {user.stats.totalOrders}
                </p>
              </div>
              <ShoppingCartIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.stats.totalSpent)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'courses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Khóa học đã đăng ký ({user.stats.coursesCount})
              </button>
              <button
                onClick={() => setActiveTab('books')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'books'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sách đã mua ({user.stats.booksCount})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'courses' ? (
              <div>
                {loadingCourses ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Chưa đăng ký khóa học nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                Tiến độ: {course.progressPercentage}%
                              </span>
                              {course.rating && (
                                <span className="flex items-center">
                                  ⭐ {course.rating.toFixed(1)}
                                </span>
                              )}
                              <span>
                                {course.isFree ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')} ₫`}
                              </span>
                              {course.completedAt && (
                                <span className="inline-flex items-center text-green-600">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Đã hoàn thành
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              Đăng ký: {new Date(course.enrolledAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {coursesPagination && coursesPagination.totalPages > 1 && (
                      <div className="flex justify-center space-x-2 mt-6">
                        <button
                          onClick={() => setCoursesPage(p => Math.max(1, p - 1))}
                          disabled={coursesPage === 1}
                          className="px-4 py-2 border rounded-lg disabled:opacity-50"
                        >
                          Trước
                        </button>
                        <span className="px-4 py-2">
                          Trang {coursesPage} / {coursesPagination.totalPages}
                        </span>
                        <button
                          onClick={() => setCoursesPage(p => Math.min(coursesPagination.totalPages, p + 1))}
                          disabled={coursesPage === coursesPagination.totalPages}
                          className="px-4 py-2 border rounded-lg disabled:opacity-50"
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {loadingBooks ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Chưa mua sách nào</div>
                ) : (
                  <div className="space-y-4">
                    {books.map((book) => (
                      <div
                        key={book.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{book.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {book.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{book.totalQuestions} câu hỏi</span>
                              <span>{book.price.toLocaleString('vi-VN')} ₫</span>
                              {book.activationCode && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  Mã: {book.activationCode}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              Mua: {new Date(book.purchasedAt).toLocaleDateString('vi-VN')}
                              {book.expiresAt && (
                                <span className="ml-2">
                                  | Hết hạn: {new Date(book.expiresAt).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {booksPagination && booksPagination.totalPages > 1 && (
                      <div className="flex justify-center space-x-2 mt-6">
                        <button
                          onClick={() => setBooksPage(p => Math.max(1, p - 1))}
                          disabled={booksPage === 1}
                          className="px-4 py-2 border rounded-lg disabled:opacity-50"
                        >
                          Trước
                        </button>
                        <span className="px-4 py-2">
                          Trang {booksPage} / {booksPagination.totalPages}
                        </span>
                        <button
                          onClick={() => setBooksPage(p => Math.min(booksPagination.totalPages, p + 1))}
                          disabled={booksPage === booksPagination.totalPages}
                          className="px-4 py-2 border rounded-lg disabled:opacity-50"
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

