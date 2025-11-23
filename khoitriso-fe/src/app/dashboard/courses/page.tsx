'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { courseService, Course } from '@/services/courseService';
import { 
  getInstructorCourses, 
  createInstructorCourse, 
  updateInstructorCourse, 
  deleteInstructorCourse,
  getInstructorCourseAnalytics,
  getInstructorCourseRevenue,
  getInstructorCourseEnrollments
} from '@/services/instructor';
import { getCourses } from '@/services/admin';
import { useToast } from '@/components/ToastProvider';
import { uploadFile } from '@/services/uploads';
import { getCategories, Category } from '@/services/categories';
import RichTextEditor from '@/components/RichTextEditor';

export default function CoursesPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [approvalFilter, setApprovalFilter] = useState<number | ''>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  
  // Modals
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showViewCourseModal, setShowViewCourseModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Forms
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    categoryId: '',
    instructorId: '',
    level: 'beginner',
    isFree: false,
    price: '',
    language: 'vi',
    requirements: [] as string[],
    whatYouWillLearn: [] as string[],
  });
  
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'list' | 'statistics' | 'revenue' | 'users'>('list');
  
  // Statistics data
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  
  // Revenue data
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [revenueViewMode, setRevenueViewMode] = useState<'course' | 'total'>('course');
  const [revenueDateRange, setRevenueDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  
  // Enrollments data
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentsPage, setEnrollmentsPage] = useState(1);
  const [enrollmentsTotal, setEnrollmentsTotal] = useState(0);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);

  // Check user role
  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsInstructor(userData.role === 'instructor');
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch courses with filters and pagination
  useEffect(() => {
    if (user) { // Only fetch when user is loaded
      fetchCourses();
    }
  }, [search, categoryFilter, statusFilter, approvalFilter, currentPage, perPage, isInstructor, user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        pageSize: perPage,
      };
      
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (approvalFilter) params.approvalStatus = approvalFilter;
      
      let response;
      if (isInstructor) {
        // Use instructor service
        const instructorResponse = await getInstructorCourses(params);
        response = {
          data: instructorResponse.courses,
          pagination: instructorResponse.pagination,
        };
      } else {
        // Use admin service
        const adminResponse = await getCourses(params);
        response = {
          data: adminResponse.courses,
          pagination: adminResponse.pagination,
        };
      }
      console.log('Fetched courses:', (response.data || []).length, 'pagination:', response.pagination);
      setCourses((response.data || []) as Course[]);
      setTotal(response.pagination?.total || 0);
      setLastPage(response.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      notify(error.message || 'Lỗi tải danh sách khóa học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Vui lòng chọn file ảnh', 'error');
      return;
    }

    try {
      setUploadingThumbnail(true);
      const result = await uploadFile(file, 'courses/thumbnails');
      
      setCourseForm({ ...courseForm, thumbnail: result });
      setThumbnailPreview(result);
      notify('Upload ảnh thành công', 'success');
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      notify(error.message || 'Lỗi upload ảnh', 'error');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!courseForm.title || !courseForm.description || !courseForm.thumbnail || !courseForm.categoryId) {
        notify('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
      }

      // Convert level string to number: beginner=1, intermediate=2, advanced=3
      const levelMap: { [key: string]: number } = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3,
      };
      const levelNumber = levelMap[courseForm.level] || 1;

      const courseData = {
        title: courseForm.title,
        description: courseForm.description,
        thumbnail: courseForm.thumbnail,
        categoryId: parseInt(courseForm.categoryId),
        level: levelNumber,
        isFree: courseForm.isFree,
        price: courseForm.price ? parseFloat(courseForm.price) : 0,
        staticPagePath: courseForm.title.toLowerCase().replace(/\s+/g, '-'),
        language: courseForm.language || 'vi',
        requirements: courseForm.requirements || [],
        whatYouWillLearn: courseForm.whatYouWillLearn || [],
      };

      if (isInstructor) {
        // Use instructor API (expects level as number)
        await createInstructorCourse(courseData);
      } else {
        // Use admin API (expects level as string)
        const levelStringMap: { [key: number]: string } = {
          1: 'beginner',
          2: 'intermediate',
          3: 'advanced',
        };
        await courseService.createCourse({
          ...courseData,
          level: levelStringMap[courseData.level] || 'beginner',
          instructorId: courseForm.instructorId ? parseInt(courseForm.instructorId) : undefined,
        });
      }
      
      notify('Tạo khóa học thành công!', 'success');
      setShowCreateCourseModal(false);
      resetCourseForm();
    fetchCourses();
    } catch (error: any) {
      console.error('Error creating course:', error);
      notify(error.message || 'Lỗi tạo khóa học', 'error');
    }
  };

  const handleEditClick = (course: Course) => {
    setSelectedCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail || '',
      categoryId: course.categoryId?.toString() || '',
      instructorId: course.instructorId?.toString() || '',
      level: course.level || 'beginner',
      isFree: course.isFree || false,
      price: course.price?.toString() || '0',
      language: course.language || 'vi',
      requirements: course.requirements || [],
      whatYouWillLearn: course.whatYouWillLearn || [],
    });
    setThumbnailPreview(course.thumbnail || '');
    setShowEditCourseModal(true);
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      // Convert level string to number: beginner=1, intermediate=2, advanced=3
      const levelMap: { [key: string]: number } = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3,
      };
      const levelNumber = courseForm.level ? (levelMap[courseForm.level] || 1) : undefined;

      const courseData = {
        title: courseForm.title,
        description: courseForm.description,
        thumbnail: courseForm.thumbnail || undefined,
        categoryId: courseForm.categoryId ? parseInt(courseForm.categoryId) : undefined,
        level: levelNumber,
        isFree: courseForm.isFree,
        price: courseForm.price ? parseFloat(courseForm.price) : 0,
        language: courseForm.language || 'vi',
        requirements: courseForm.requirements || [],
        whatYouWillLearn: courseForm.whatYouWillLearn || [],
      };

      if (isInstructor) {
        // Use instructor API (expects level as number)
        await updateInstructorCourse(selectedCourse.id, courseData);
      } else {
        // Use admin API (expects level as string)
        const levelStringMap: { [key: number]: string } = {
          1: 'beginner',
          2: 'intermediate',
          3: 'advanced',
        };
        const adminCourseData: any = {
          ...courseData,
          instructorId: courseForm.instructorId ? parseInt(courseForm.instructorId) : undefined,
        };
        if (courseData.level !== undefined) {
          adminCourseData.level = levelStringMap[courseData.level] || 'beginner';
        }
        await courseService.updateCourse(selectedCourse.id, adminCourseData);
      }
      
      notify('Cập nhật khóa học thành công!', 'success');
      setShowEditCourseModal(false);
      resetCourseForm();
      fetchCourses();
    } catch (error: any) {
      console.error('Error updating course:', error);
      notify(error.message || 'Lỗi cập nhật khóa học', 'error');
    }
  };

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      if (isInstructor) {
        // Use instructor API
        await deleteInstructorCourse(selectedCourse.id);
      } else {
        // Use admin API
        await courseService.deleteCourse(selectedCourse.id);
      }
      
      notify('Xóa khóa học thành công!', 'success');
      setShowDeleteConfirm(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      notify(error.message || 'Lỗi xóa khóa học', 'error');
    }
  };

  const handleViewCourse = async (id: number) => {
    router.push(`/dashboard/courses/${id}`);
  };

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      description: '',
      thumbnail: '',
      categoryId: '',
      instructorId: '',
      level: 'beginner',
      isFree: false,
      price: '',
      language: 'vi',
      requirements: [],
      whatYouWillLearn: [],
    });
    setThumbnailPreview('');
    setSelectedCourse(null);
  };

  const openCreateLessonModal = (courseId: number) => {
    router.push(`/dashboard/courses/${courseId}/lessons/create`);
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    if (!selectedCourseForDetails) return;
    setLoadingStatistics(true);
    try {
      let data;
      if (isInstructor) {
        // Use instructor API
        data = await getInstructorCourseAnalytics(selectedCourseForDetails.id);
      } else {
        // Use admin API
        data = await courseService.getCourseAnalytics(selectedCourseForDetails.id);
      }
      setStatistics(data);
    } catch (error: any) {
      notify(error.message || 'Lỗi tải thống kê', 'error');
    } finally {
      setLoadingStatistics(false);
    }
  };

  // Fetch revenue
  const fetchRevenue = async () => {
    setLoadingRevenue(true);
    try {
      if (revenueViewMode === 'total') {
        // Fetch total revenue (all courses + books)
        const data = await courseService.getTotalRevenue({
          startDate: revenueDateRange.startDate,
          endDate: revenueDateRange.endDate,
        });
        setRevenueData(data);
      } else {
        // Fetch course-specific revenue
        if (!selectedCourseForDetails) return;
        let data;
        if (isInstructor) {
          // Use instructor API
          data = await getInstructorCourseRevenue(selectedCourseForDetails.id, {
            startDate: revenueDateRange.startDate,
            endDate: revenueDateRange.endDate,
          });
        } else {
          // Use admin API
          data = await courseService.getCourseRevenue(selectedCourseForDetails.id, {
            startDate: revenueDateRange.startDate,
            endDate: revenueDateRange.endDate,
          });
        }
        setRevenueData(data);
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi tải doanh thu', 'error');
    } finally {
      setLoadingRevenue(false);
    }
  };

  // Fetch enrollments
  const fetchEnrollments = async () => {
    if (!selectedCourseForDetails) return;
    setLoadingEnrollments(true);
    try {
      let data;
      if (isInstructor) {
        // Use instructor API
        const instructorData = await getInstructorCourseEnrollments(selectedCourseForDetails.id, {
          page: enrollmentsPage,
          pageSize: 20,
        });
        data = {
          data: instructorData.enrollments,
          pagination: instructorData.pagination,
        };
      } else {
        // Use admin API
        data = await courseService.getCourseEnrollments(selectedCourseForDetails.id, {
          page: enrollmentsPage,
          pageSize: 20,
        });
      }
      setEnrollments(data.data || []);
      setEnrollmentsTotal(data.pagination?.total || 0);
    } catch (error: any) {
      notify(error.message || 'Lỗi tải danh sách người dùng', 'error');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'statistics' && selectedCourseForDetails) {
      fetchStatistics();
    } else if (activeTab === 'revenue') {
      if (revenueViewMode === 'total' || selectedCourseForDetails) {
        fetchRevenue();
      }
    } else if (activeTab === 'users' && selectedCourseForDetails) {
      fetchEnrollments();
    }
  }, [activeTab, selectedCourseForDetails, revenueViewMode]);

  // Load revenue when date range or view mode changes
  useEffect(() => {
    if (activeTab === 'revenue') {
      if (revenueViewMode === 'total' || selectedCourseForDetails) {
        fetchRevenue();
      }
    }
  }, [revenueDateRange, revenueViewMode]);

  // Load enrollments when page changes
  useEffect(() => {
    if (activeTab === 'users' && selectedCourseForDetails) {
      fetchEnrollments();
    }
  }, [enrollmentsPage]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý khóa học</h1>
          <p className="mt-2 text-sm text-gray-700">
            Quản lý khóa học, thống kê và báo cáo
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowCreateCourseModal(true)}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Thêm khóa học mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => {
                setActiveTab('list');
                setSelectedCourseForDetails(null);
              }}
              className={`
                ${activeTab === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              `}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Danh sách khóa học
            </button>
            <button
              onClick={() => {
                setActiveTab('statistics');
                if (courses.length > 0 && !selectedCourseForDetails) {
                  setSelectedCourseForDetails(courses[0]);
                }
              }}
              className={`
                ${activeTab === 'statistics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              `}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Thống kê
            </button>
            <button
              onClick={() => {
                setActiveTab('revenue');
                if (courses.length > 0 && !selectedCourseForDetails) {
                  setSelectedCourseForDetails(courses[0]);
                }
              }}
              className={`
                ${activeTab === 'revenue' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              `}
            >
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              Doanh thu
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                if (courses.length > 0 && !selectedCourseForDetails) {
                  setSelectedCourseForDetails(courses[0]);
                }
              }}
              className={`
                ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              `}
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Người dùng đã đăng ký
            </button>
          </nav>
              </div>
              </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khóa học..."
                  value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value ? parseInt(e.target.value) : '');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
              <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>

          {/* Approval Filter */}
              <select 
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value ? parseInt(e.target.value) : '');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả phê duyệt</option>
            <option value="0">Chờ duyệt</option>
            <option value="1">Đã duyệt</option>
            <option value="2">Từ chối</option>
              </select>
          </div>
        </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
      {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải...</p>
              </div>
      ) : courses.length === 0 ? (
          <div className="p-12 text-center">
          <p className="text-gray-500">Không có khóa học nào</p>
              </div>
      ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                    Khóa học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    Giảng viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Bài học
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Phê duyệt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="h-12 w-12 rounded object-cover mr-3 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{course.title}</div>
                          <div 
                            className="text-sm text-gray-500 line-clamp-2 mt-1"
                            dangerouslySetInnerHTML={{ 
                              __html: course.description 
                                ? course.description.replace(/<[^>]*>/g, '').substring(0, 100) + (course.description.length > 100 ? '...' : '')
                                : '' 
                            }}
                          />
                        </div>
          </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="truncate" title={course.instructor?.name || 'Chưa có'}>
                        {course.instructor?.name || 'Chưa có'}
        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="truncate" title={course.category?.name || 'Chưa có'}>
                        {course.category?.name || 'Chưa có'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {course.isFree ? (
                        <span className="text-green-600 font-medium">Miễn phí</span>
                      ) : (
                        <span className="truncate block">{course.price?.toLocaleString('vi-VN')} đ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {course.totalLessons || 0} bài
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                          course.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {course.isActive ? 'Hoạt động' : 'Đã vô hiệu hóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const approvalStatus = (course as any).approvalStatus ?? (course as any).approval_status ?? 0;
                        if (approvalStatus === 0) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></span>
                              Chờ duyệt
                            </span>
                          );
                        } else if (approvalStatus === 1) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                              Đã duyệt
                            </span>
                          );
                        } else if (approvalStatus === 2) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                              Từ chối
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Không xác định
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewCourse(course.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openCreateLessonModal(course.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Thêm bài học"
                        >
                          <VideoCameraIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(course)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Sửa"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(course)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                    </td>
                  </tr>
          ))}
              </tbody>
            </table>
        </div>
      )}

      {/* Pagination */}
        {!loading && courses.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button 
                onClick={() => setCurrentPage(Math.min(lastPage, currentPage + 1))}
                disabled={currentPage === lastPage}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
              </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(currentPage * perPage, total)}</span> trong tổng số{' '}
                  <span className="font-medium">{total}</span> khóa học
              </p>
              </div>
            <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                  {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                    let pageNum: number;
                    if (lastPage <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= lastPage - 2) {
                      pageNum = lastPage - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                  return (
                    <button
                      key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                    onClick={() => setCurrentPage(Math.min(lastPage, currentPage + 1))}
                    disabled={currentPage === lastPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
          </div>
        )}
        </div>

      {/* Create Course Modal */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Tạo khóa học mới</h3>
              </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                <RichTextEditor
                  value={courseForm.description}
                  onChange={(value) => setCourseForm({ ...courseForm, description: value })}
                  placeholder="Mô tả chi tiết về khóa học... (Sử dụng thanh công cụ để định dạng văn bản)"
                />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  disabled={uploadingThumbnail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {thumbnailPreview && (
                  <img src={thumbnailPreview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded" />
                )}
          </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={courseForm.categoryId}
                    onChange={(e) => setCourseForm({ ...courseForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="beginner">Cơ bản</option>
                    <option value="intermediate">Trung bình</option>
                    <option value="advanced">Nâng cao</option>
                  </select>
              </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                    disabled={courseForm.isFree}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
            </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    checked={courseForm.isFree}
                    onChange={(e) => setCourseForm({ ...courseForm, isFree: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Miễn phí</label>
          </div>
        </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCourseModal(false);
                    resetCourseForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Tạo khóa học
                </button>
      </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal - Similar structure to create modal */}
      {showEditCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Sửa khóa học</h3>
                </div>
            <form onSubmit={handleEditCourse} className="p-6 space-y-4">
              {/* Same form fields as create modal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                <RichTextEditor
                  value={courseForm.description}
                  onChange={(value) => setCourseForm({ ...courseForm, description: value })}
                  placeholder="Mô tả chi tiết về khóa học... (Sử dụng thanh công cụ để định dạng văn bản)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  disabled={uploadingThumbnail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {thumbnailPreview && (
                  <img src={thumbnailPreview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select 
                    value={courseForm.categoryId}
                    onChange={(e) => setCourseForm({ ...courseForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
              </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
              <select 
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="beginner">Cơ bản</option>
                    <option value="intermediate">Trung bình</option>
                    <option value="advanced">Nâng cao</option>
              </select>
                </div>
            </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                    disabled={courseForm.isFree}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    checked={courseForm.isFree}
                    onChange={(e) => setCourseForm({ ...courseForm, isFree: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Miễn phí</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                  onClick={() => {
                    setShowEditCourseModal(false);
                    resetCourseForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Cập nhật
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa khóa học "{selectedCourse.title}"? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedCourse(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa
              </button>
        </div>
        </div>
                    </div>
      )}
                  </>
                )}
                
      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="bg-white rounded-lg shadow p-6">
          {!selectedCourseForDetails ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Vui lòng chọn khóa học từ danh sách</p>
                </div>
          ) : loadingStatistics ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Đang tải thống kê...</p>
                  </div>
          ) : statistics ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Thống kê: {statistics.courseTitle}</h2>
                <select
                  value={selectedCourseForDetails.id}
                  onChange={(e) => {
                    const course = courses.find(c => c.id === parseInt(e.target.value));
                    if (course) setSelectedCourseForDetails(course);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng đăng ký</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.totalEnrollments ?? 0}</p>
              </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Học viên đang học</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.activeStudents ?? 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.completionRate ?? 0}%</p>
                    </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tiến độ trung bình</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.averageProgress ?? 0}%</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Đánh giá</p>
                  <p className="text-2xl font-bold text-orange-600">{(statistics.rating ?? 0).toFixed(1)} ⭐</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-red-600">{(statistics.totalRevenue ?? 0).toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có dữ liệu thống kê</p>
            </div>
          )}
                  </div>
                )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-lg shadow p-6">
          {loadingRevenue ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Đang tải doanh thu...</p>
            </div>
          ) : revenueData ? (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {revenueViewMode === 'total' ? 'Doanh thu tổng hợp' : `Doanh thu: ${revenueData.courseTitle}`}
                </h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={revenueViewMode}
                    onChange={(e) => {
                      setRevenueViewMode(e.target.value as 'course' | 'total');
                      if (e.target.value === 'course' && courses.length > 0 && !selectedCourseForDetails) {
                        setSelectedCourseForDetails(courses[0]);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="total">Tổng</option>
                    <option value="course">Theo khóa học</option>
                  </select>
                  {revenueViewMode === 'course' && (
                    <select
                      value={selectedCourseForDetails?.id || ''}
                      onChange={(e) => {
                        const course = courses.find(c => c.id === parseInt(e.target.value));
                        if (course) setSelectedCourseForDetails(course);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  )}
                    </div>
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={revenueDateRange.startDate}
                    onChange={(e) => setRevenueDateRange({ ...revenueDateRange, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={revenueDateRange.endDate}
                    onChange={(e) => setRevenueDateRange({ ...revenueDateRange, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  </div>
                  </div>
              {revenueViewMode === 'total' && revenueData.revenueBreakdown && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Doanh thu khóa học</p>
                    <p className="text-2xl font-bold text-blue-600">{(revenueData.revenueBreakdown?.courses ?? 0).toLocaleString('vi-VN')} ₫</p>
                </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Doanh thu sách</p>
                    <p className="text-2xl font-bold text-green-600">{(revenueData.revenueBreakdown?.books ?? 0).toLocaleString('vi-VN')} ₫</p>
              </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-purple-600">{(revenueData.revenueBreakdown?.total ?? 0).toLocaleString('vi-VN')} ₫</p>
                  </div>
                  </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-blue-600">{(revenueData.totalRevenue ?? 0).toLocaleString('vi-VN')} ₫</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-green-600">{revenueData.totalOrders ?? 0}</p>
              </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Giá trị đơn trung bình</p>
                  <p className="text-2xl font-bold text-purple-600">{(revenueData.averageOrderValue ?? 0).toLocaleString('vi-VN')} ₫</p>
            </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có dữ liệu doanh thu</p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow p-6">
          {!selectedCourseForDetails ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Vui lòng chọn khóa học từ danh sách</p>
            </div>
          ) : loadingEnrollments ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Đang tải danh sách người dùng...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Người dùng đã đăng ký: {selectedCourseForDetails.title}</h2>
                <select
                  value={selectedCourseForDetails.id}
                  onChange={(e) => {
                    const course = courses.find(c => c.id === parseInt(e.target.value));
                    if (course) setSelectedCourseForDetails(course);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
          </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiến độ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng ký</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoàn thành</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {enrollment.user?.avatar && (
                              <img className="h-10 w-10 rounded-full mr-3" src={enrollment.user.avatar} alt="" />
                            )}
            <div>
                              <div className="text-sm font-medium text-gray-900">{enrollment.user?.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{enrollment.user?.email || 'N/A'}</div>
            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{enrollment.progressPercentage}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${enrollment.progressPercentage}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString('vi-VN') : 'Chưa hoàn thành'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {enrollmentsTotal > 20 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-700">Hiển thị {enrollments.length} / {enrollmentsTotal} người dùng</p>
                  <div className="flex space-x-2">
                <button 
                      onClick={() => setEnrollmentsPage(Math.max(1, enrollmentsPage - 1))}
                      disabled={enrollmentsPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Trước
                </button>
                    <button
                      onClick={() => setEnrollmentsPage(enrollmentsPage + 1)}
                      disabled={enrollments.length < 20}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Sau
                </button>
            </div>
          </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
