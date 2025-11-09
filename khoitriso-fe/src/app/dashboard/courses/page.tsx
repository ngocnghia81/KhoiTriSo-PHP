'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { getCourses, AdminCourse } from '@/services/admin';
import { useToast } from '@/components/ToastProvider';

const renderStars = (rating: number = 0) => {
  const safeRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
  const fullStars = Math.floor(safeRating);
  
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <StarIconSolid
          key={i}
          className={`h-4 w-4 ${
            i < fullStars ? 'text-yellow-400' : 'text-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">{safeRating.toFixed(1)}</span>
    </div>
  );
};

const getLevelBadge = (level: number) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  switch (level) {
    case 1:
      return `${baseClasses} bg-green-100 text-green-800`;
    case 2:
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 3:
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

const getLevelText = (level: number) => {
  switch (level) {
    case 1:
      return 'Cơ bản';
    case 2:
      return 'Trung bình';
    case 3:
      return 'Nâng cao';
    default:
      return 'Không xác định';
  }
};

export default function CoursesPage() {
  const { notify } = useToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await getCourses({
        page,
        pageSize,
        search: search || undefined,
        status: status || undefined,
        approvalStatus: approvalStatus ? parseInt(approvalStatus) : undefined,
      });
      setCourses(response.courses);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching courses:', error);
      notify('Lỗi tải danh sách khóa học', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, search, status, approvalStatus]);

  const activeCourses = courses.filter(c => c.isActive).length;
  const publishedCourses = courses.filter(c => c.isPublished).length;
  const approvedCourses = courses.filter(c => c.approvalStatus === 1).length;
  const pendingCourses = courses.filter(c => c.approvalStatus === 0).length;
  const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý khóa học</h1>
          <p className="mt-2 text-sm text-gray-700">
            Danh sách tất cả khóa học trong hệ thống
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/courses/create"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Tạo khóa học mới
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng khóa học</dt>
                  <dd className="text-lg font-medium text-gray-900">{total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Đã xuất bản</dt>
                  <dd className="text-lg font-medium text-gray-900">{publishedCourses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng học sinh</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalStudents.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Đã phê duyệt</dt>
                  <dd className="text-lg font-medium text-gray-900">{approvedCourses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Chờ phê duyệt</dt>
                  <dd className="text-lg font-medium text-gray-900">{pendingCourses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:items-center sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tìm kiếm khóa học..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchCourses(); }}
                />
              </div>

              {/* Status filter */}
              <select 
                className="mt-2 sm:mt-0 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>

              {/* Approval status filter */}
              <select 
                className="mt-2 sm:mt-0 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái phê duyệt</option>
                <option value="0">Chờ phê duyệt</option>
                <option value="1">Đã phê duyệt</option>
                <option value="2">Từ chối</option>
              </select>
            </div>

            <div className="mt-4 sm:mt-0">
              <button
                type="button"
                onClick={fetchCourses}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Courses grid */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500">Không có khóa học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              {/* Course thumbnail */}
              <div className="aspect-video bg-gray-200 relative">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-80"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <AcademicCapIcon className="h-16 w-16 text-white" />
                    </div>
                  </>
                )}
                
                {/* Status badges */}
                <div className="absolute top-2 left-2 flex space-x-2">
                  {course.isFree && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Miễn phí
                    </span>
                  )}
                  {course.approvalStatus === 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Chờ phê duyệt
                    </span>
                  )}
                  {course.approvalStatus === 2 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Đã từ chối
                    </span>
                  )}
                  {course.approvalStatus === 1 && !course.isPublished && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Chưa xuất bản
                    </span>
                  )}
                  {course.approvalStatus === 1 && course.isPublished && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Đã xuất bản
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2">
                  <div className="flex space-x-1">
                    <Link href={`/dashboard/courses/${course.id}`} className="p-2 bg-white bg-opacity-90 rounded-full text-gray-600 hover:text-gray-900">
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link href={`/dashboard/courses/${course.id}/edit`} className="p-2 bg-white bg-opacity-90 rounded-full text-gray-600 hover:text-gray-900">
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button className="p-2 bg-white bg-opacity-90 rounded-full text-gray-600 hover:text-gray-900">
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Course content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600 font-medium">{course.category?.name || 'Chưa phân loại'}</span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {course.description || 'Không có mô tả'}
                </p>

                {/* Instructor */}
                {course.instructor && (
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-white">
                        {course.instructor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{course.instructor.name}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {course.totalStudents?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

                {/* Rating and price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {renderStars(course.rating || 0)}
                  </div>
                  <div className="text-right">
                    {course.isFree ? (
                      <span className="text-lg font-bold text-green-600">Miễn phí</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {course.price?.toLocaleString() || 0}₫
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {course.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/dashboard/courses/${course.id}/edit`} className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                      Chỉnh sửa
                    </Link>
                    <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Trước
            </button>
            <button 
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{(page - 1) * pageSize + 1}</span> đến{' '}
                <span className="font-medium">{Math.min(page * pageSize, total)}</span> trong{' '}
                <span className="font-medium">{total}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button 
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  Trước
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
