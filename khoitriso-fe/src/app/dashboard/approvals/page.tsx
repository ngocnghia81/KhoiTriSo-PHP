'use client';

import { useEffect, useState } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  getCourses, 
  approveCourse, 
  rejectCourse, 
  publishCourse,
  unpublishCourse,
  AdminCourse 
} from '@/services/admin';

interface RejectModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onReject: (reason: string) => void;
}

function RejectModal({ isOpen, title, onClose, onReject }: RejectModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReject(reason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Từ chối: {title}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Nhập lý do từ chối (tùy chọn)..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xác nhận từ chối
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getApprovalStatusText = (status: number) => {
  switch (status) {
    case 0: return 'Chờ duyệt';
    case 1: return 'Đã duyệt';
    case 2: return 'Từ chối';
    default: return 'Không xác định';
  }
};

const getApprovalStatusColor = (status: number) => {
  switch (status) {
    case 0: return 'bg-yellow-100 text-yellow-800';
    case 1: return 'bg-green-100 text-green-800';
    case 2: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ApprovalsPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; courseId: number; title: string }>({
    isOpen: false,
    courseId: 0,
    title: ''
  });
  const [filter, setFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    loadCourses();
  }, [filter]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { approvalStatus: filter as number };
      const response = await getCourses(params);
      setCourses(response.courses);
    } catch (error) {
      console.error('Failed to load courses:', error);
      alert('Không thể tải danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId: number) => {
    if (!confirm('Bạn có chắc muốn phê duyệt khóa học này?')) return;
    try {
      await approveCourse(courseId);
      alert('Đã phê duyệt khóa học thành công!');
      loadCourses();
    } catch (error) {
      alert('Không thể phê duyệt khóa học.');
    }
  };

  const handleRejectCourse = async (reason: string) => {
    try {
      await rejectCourse(rejectModal.courseId, reason);
      alert('Đã từ chối khóa học!');
      setRejectModal({ isOpen: false, courseId: 0, title: '' });
      loadCourses();
    } catch (error) {
      alert('Không thể từ chối khóa học.');
    }
  };

  const handlePublishCourse = async (courseId: number) => {
    if (!confirm('Bạn có chắc muốn xuất bản khóa học này?')) return;
    try {
      await publishCourse(courseId);
      alert('Đã xuất bản khóa học thành công!');
      loadCourses();
    } catch (error) {
      alert('Không thể xuất bản. Khóa học phải được phê duyệt trước!');
    }
  };

  const handleUnpublishCourse = async (courseId: number) => {
    if (!confirm('Bạn có chắc muốn gỡ xuất bản khóa học này?')) return;
    try {
      await unpublishCourse(courseId);
      alert('Đã gỡ xuất bản khóa học!');
      loadCourses();
    } catch (error) {
      alert('Không thể gỡ xuất bản khóa học.');
    }
  };

  const pendingCount = courses.filter(c => c.approvalStatus === 0).length;
  const approvedCount = courses.filter(c => c.approvalStatus === 1).length;
  const rejectedCount = courses.filter(c => c.approvalStatus === 2).length;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Phê duyệt nội dung</h1>
          <p className="mt-2 text-sm text-gray-700">
            Xem xét và phê duyệt khóa học, xuất bản nội dung
          </p>
        </div>
        <button
          onClick={loadCourses}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`${
              filter === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Tất cả ({courses.length})
          </button>
          <button
            onClick={() => setFilter(0)}
            className={`${
              filter === 0 ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Chờ duyệt ({pendingCount})
          </button>
          <button
            onClick={() => setFilter(1)}
            className={`${
              filter === 1 ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Đã duyệt ({approvedCount})
          </button>
          <button
            onClick={() => setFilter(2)}
            className={`${
              filter === 2 ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Từ chối ({rejectedCount})
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 overflow-hidden shadow-sm rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <dl>
                <dt className="text-sm font-medium text-yellow-700">Chờ phê duyệt</dt>
                <dd className="text-2xl font-bold text-yellow-900">{pendingCount}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 overflow-hidden shadow-sm rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <dl>
                <dt className="text-sm font-medium text-green-700">Đã phê duyệt</dt>
                <dd className="text-2xl font-bold text-green-900">{approvedCount}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 overflow-hidden shadow-sm rounded-lg p-4 border border-red-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <XCircleIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <dl>
                <dt className="text-sm font-medium text-red-700">Từ chối</dt>
                <dd className="text-2xl font-bold text-red-900">{rejectedCount}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden shadow-sm rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <dl>
                <dt className="text-sm font-medium text-blue-700">Tổng khóa học</dt>
                <dd className="text-2xl font-bold text-blue-900">{courses.length}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 bg-white shadow-sm rounded-lg border border-gray-200">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có khóa học</h3>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {courses.map((course) => (
              <div key={course.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <AcademicCapIcon className="h-10 w-10 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-1">{course.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          {course.instructor && (
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1" />
                              <span>{course.instructor.name}</span>
                            </div>
                          )}
                          {course.category && (
                            <div className="flex items-center">
                              <TagIcon className="h-4 w-4 mr-1" />
                              <span>{course.category.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalStatusColor(course.approvalStatus)}`}>
                            {getApprovalStatusText(course.approvalStatus)}
                          </span>
                          {course.isPublished && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Đã xuất bản
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        {course.approvalStatus === 0 && (
                          <div className="flex space-x-2">
                            <button onClick={() => handleApproveCourse(course.id)} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />Phê duyệt
                            </button>
                            <button onClick={() => setRejectModal({ isOpen: true, courseId: course.id, title: course.title })} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                              <XCircleIcon className="h-4 w-4 mr-1" />Từ chối
                            </button>
                          </div>
                        )}
                        {course.approvalStatus === 1 && (
                          <div className="flex space-x-2">
                            {!course.isPublished ? (
                              <button onClick={() => handlePublishCourse(course.id)} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                <BookOpenIcon className="h-4 w-4 mr-1" />Xuất bản
                              </button>
                            ) : (
                              <button onClick={() => handleUnpublishCourse(course.id)} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
                                <XCircleIcon className="h-4 w-4 mr-1" />Gỡ xuất bản
                              </button>
                            )}
                          </div>
                        )}
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                          <EyeIcon className="h-4 w-4 mr-1" />Xem chi tiết
                        </button>
                      </div>
                    </div>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-500" />
                        <span>{course.isFree ? 'Miễn phí' : `₫${course.price.toLocaleString()}`}</span>
                      </div>
                      {course.totalStudents !== undefined && (
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1 text-blue-500" />
                          <span>{course.totalStudents} học viên</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-xs">{formatDate(course.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <RejectModal isOpen={rejectModal.isOpen} title={rejectModal.title} onClose={() => setRejectModal({ isOpen: false, courseId: 0, title: '' })} onReject={handleRejectCourse} />
    </div>
  );
}
