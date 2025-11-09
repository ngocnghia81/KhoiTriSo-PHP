'use client';

import { useEffect, useState } from 'react';
import { 
  PlusIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
  StopIcon,
  PencilSquareIcon,
  TrashIcon,
  LinkIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getLiveClasses, createLiveClass, updateLiveClass, deleteLiveClass } from '@/services/liveclasses';
import { courseService, Course } from '@/services/courseService';
import { useToast } from '@/components/ToastProvider';
import { getCategories, Category } from '@/services/categories';

interface LiveClass {
  id: number;
  title: string;
  description: string;
  course?: { id: number; title: string };
  courseId?: number;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  currentParticipants?: number;
  meetingUrl: string;
  meetingId: string;
  meetingPassword?: string;
  status: number; // 1=scheduled, 2=live, 3=ended, 4=cancelled
  recordingUrl?: string;
  createdAt: string;
}

const getStatusLabel = (status: number) => {
  switch (status) {
    case 1: return 'Đã lên lịch';
    case 2: return 'Đang diễn ra';
    case 3: return 'Đã kết thúc';
    case 4: return 'Đã hủy';
    default: return 'Không xác định';
  }
};

const getStatusColor = (status: number) => {
  switch (status) {
    case 1: return 'bg-blue-100 text-blue-800';
    case 2: return 'bg-green-100 text-green-800';
    case 3: return 'bg-gray-100 text-gray-800';
    case 4: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function LiveClassesPage() {
  const { notify } = useToast();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<number | ''>('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLiveClass, setSelectedLiveClass] = useState<LiveClass | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    scheduledAt: '',
    durationMinutes: 60,
    maxParticipants: 100,
    meetingUrl: '',
    meetingId: '',
    meetingPassword: '',
    chatEnabled: true,
    recordingEnabled: true,
  });

  useEffect(() => {
    fetchLiveClasses();
    fetchCourses();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (courseFilter) params.courseId = courseFilter;
      if (selectedFilter !== 'all') params.status = selectedFilter;
      
      const res = await getLiveClasses(params);
      if (res.ok && Array.isArray(res.data)) {
        setLiveClasses(res.data as LiveClass[]);
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi tải danh sách lớp học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await courseService.listCoursesAdmin();
      setCourses(data);
    } catch (error: any) {
      notify(error.message || 'Lỗi tải danh sách khóa học', 'error');
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, [courseFilter, selectedFilter]);

  const filteredClasses = liveClasses.filter(liveClass => {
    const matchesSearch = liveClass.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      liveClass.course?.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        courseId: Number(form.courseId),
        scheduledAt: form.scheduledAt,
        durationMinutes: Number(form.durationMinutes) || 60,
        maxParticipants: Number(form.maxParticipants) || 100,
        meetingUrl: form.meetingUrl,
        meetingId: form.meetingId,
        meetingPassword: form.meetingPassword || undefined,
        chatEnabled: form.chatEnabled,
        recordingEnabled: form.recordingEnabled,
      };
      
      const res = await createLiveClass(payload);
      if (res.ok) {
        notify('Tạo lớp học thành công!', 'success');
        setShowCreateModal(false);
        resetForm();
        fetchLiveClasses();
      } else {
        notify('Tạo lớp học thất bại', 'error');
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi tạo lớp học', 'error');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiveClass) return;
    
    try {
      const payload = {
        title: form.title,
        description: form.description,
        courseId: Number(form.courseId),
        scheduledAt: form.scheduledAt,
        durationMinutes: Number(form.durationMinutes) || 60,
        maxParticipants: Number(form.maxParticipants) || 100,
        meetingUrl: form.meetingUrl,
        meetingId: form.meetingId,
        meetingPassword: form.meetingPassword || undefined,
        chatEnabled: form.chatEnabled,
        recordingEnabled: form.recordingEnabled,
      };
      
      const res = await updateLiveClass(selectedLiveClass.id, payload);
      if (res.ok) {
        notify('Cập nhật lớp học thành công!', 'success');
        setShowEditModal(false);
        setSelectedLiveClass(null);
        resetForm();
        fetchLiveClasses();
      } else {
        notify('Cập nhật lớp học thất bại', 'error');
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi cập nhật lớp học', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) return;
    
    try {
      const res = await deleteLiveClass(id);
      if (res.ok) {
        notify('Xóa lớp học thành công!', 'success');
        fetchLiveClasses();
      } else {
        notify('Xóa lớp học thất bại', 'error');
      }
    } catch (error: any) {
      notify(error.message || 'Lỗi xóa lớp học', 'error');
    }
  };

  const handleStartClass = async (id: number) => {
    try {
      const res = await getLiveClasses();
      // Update status to live (2)
      await updateLiveClass(id, { status: 2 });
      notify('Bắt đầu lớp học thành công!', 'success');
      fetchLiveClasses();
    } catch (error: any) {
      notify(error.message || 'Lỗi bắt đầu lớp học', 'error');
    }
  };

  const handleEndClass = async (id: number) => {
    try {
      // Update status to ended (3)
      await updateLiveClass(id, { status: 3 });
      notify('Kết thúc lớp học thành công!', 'success');
      fetchLiveClasses();
    } catch (error: any) {
      notify(error.message || 'Lỗi kết thúc lớp học', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      courseId: '',
      scheduledAt: '',
      durationMinutes: 60,
      maxParticipants: 100,
      meetingUrl: '',
      meetingId: '',
      meetingPassword: '',
      chatEnabled: true,
      recordingEnabled: true,
    });
  };

  const openEditModal = (liveClass: LiveClass) => {
    setSelectedLiveClass(liveClass);
    setForm({
      title: liveClass.title,
      description: liveClass.description || '',
      courseId: String(liveClass.courseId || liveClass.course?.id || ''),
      scheduledAt: liveClass.scheduledAt ? new Date(liveClass.scheduledAt).toISOString().slice(0, 16) : '',
      durationMinutes: liveClass.durationMinutes || 60,
      maxParticipants: liveClass.maxParticipants || 100,
      meetingUrl: liveClass.meetingUrl || '',
      meetingId: liveClass.meetingId || '',
      meetingPassword: liveClass.meetingPassword || '',
      chatEnabled: true,
      recordingEnabled: true,
    });
    setShowEditModal(true);
  };

  const copyMeetingInfo = (liveClass: LiveClass) => {
    const meetingInfo = `
Thông tin lớp học trực tuyến:
📚 Tiêu đề: ${liveClass.title}
📅 Thời gian: ${new Date(liveClass.scheduledAt).toLocaleString('vi-VN')}
🔗 Link tham gia: ${liveClass.meetingUrl}
🆔 Meeting ID: ${liveClass.meetingId}
🔑 Mật khẩu: ${liveClass.meetingPassword || 'Không có'}
    `.trim();
    
    navigator.clipboard.writeText(meetingInfo);
    notify('Đã sao chép thông tin lớp học!', 'success');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lớp học trực tuyến</h1>
          <p className="text-gray-600 mt-1">Quản lý các buổi học trực tuyến</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Tạo lớp học mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm lớp học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="1">Đã lên lịch</option>
              <option value="2">Đang diễn ra</option>
              <option value="3">Đã kết thúc</option>
              <option value="4">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <VideoCameraIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng lớp học</p>
              <p className="text-2xl font-bold text-gray-900">{liveClasses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarDaysIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Đã lên lịch</p>
              <p className="text-2xl font-bold text-gray-900">
                {liveClasses.filter(c => c.status === 1).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlayIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Đang diễn ra</p>
              <p className="text-2xl font-bold text-gray-900">
                {liveClasses.filter(c => c.status === 2).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng học viên</p>
              <p className="text-2xl font-bold text-gray-900">
                {liveClasses.reduce((sum, c) => sum + (c.currentParticipants || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Classes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Danh sách lớp học ({filteredClasses.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-12 text-center">
            <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có lớp học</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách tạo lớp học trực tuyến đầu tiên.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Tạo lớp học mới
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredClasses.map((liveClass) => (
              <div key={liveClass.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {liveClass.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(liveClass.status)}`}>
                        {getStatusLabel(liveClass.status)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {liveClass.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                      {liveClass.course && (
                        <div className="flex items-center">
                          <span className="font-medium">Khóa học:</span>
                          <span className="ml-1">{liveClass.course.title}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        {new Date(liveClass.scheduledAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {new Date(liveClass.scheduledAt).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} ({liveClass.durationMinutes} phút)
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {liveClass.currentParticipants || 0}/{liveClass.maxParticipants} học viên
                      </div>
                    </div>

                    {liveClass.status === 2 && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Lớp học đang diễn ra
                            </p>
                            <p className="text-xs text-green-600">
                              {liveClass.currentParticipants || 0} học viên đang tham gia
                            </p>
                          </div>
                          <a
                            href={liveClass.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                          >
                            <PlayIcon className="h-3 w-3 mr-1" />
                            Tham gia
                          </a>
                        </div>
                      </div>
                    )}

                    {liveClass.status === 3 && liveClass.recordingUrl && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Bản ghi có sẵn
                            </p>
                            <p className="text-xs text-blue-600">
                              Xem lại buổi học đã kết thúc
                            </p>
                          </div>
                          <a
                            href={liveClass.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Xem bản ghi
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {liveClass.status === 1 && (
                      <button
                        onClick={() => handleStartClass(liveClass.id)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                        title="Bắt đầu lớp học"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}

                    {liveClass.status === 2 && (
                      <button
                        onClick={() => handleEndClass(liveClass.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                        title="Kết thúc lớp học"
                      >
                        <StopIcon className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={() => copyMeetingInfo(liveClass)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                      title="Sao chép thông tin lớp học"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => openEditModal(liveClass)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg"
                      title="Chỉnh sửa"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleDelete(liveClass.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                      title="Xóa lớp học"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Tạo lớp học trực tuyến</h3>
                  <button onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }} className="text-gray-400 hover:text-gray-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: Ôn tập Chương 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mô tả về buổi học..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học *</label>
                    <select
                      required
                      value={form.courseId}
                      onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Chọn khóa học</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu *</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.scheduledAt}
                      onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số học viên tối đa</label>
                      <input
                        type="number"
                        min="1"
                        value={form.maxParticipants}
                        onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link phòng học *</label>
                    <input
                      type="url"
                      required
                      value={form.meetingUrl}
                      onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID *</label>
                      <input
                        type="text"
                        required
                        value={form.meetingId}
                        onChange={(e) => setForm({ ...form, meetingId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123-456-789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                      <input
                        type="text"
                        value={form.meetingPassword}
                        onChange={(e) => setForm({ ...form, meetingPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tùy chọn"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Tạo lớp học
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLiveClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowEditModal(false);
              setSelectedLiveClass(null);
              resetForm();
            }}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Chỉnh sửa lớp học</h3>
                  <button onClick={() => {
                    setShowEditModal(false);
                    setSelectedLiveClass(null);
                    resetForm();
                  }} className="text-gray-400 hover:text-gray-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học *</label>
                    <select
                      required
                      value={form.courseId}
                      onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Chọn khóa học</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu *</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.scheduledAt}
                      onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số học viên tối đa</label>
                      <input
                        type="number"
                        min="1"
                        value={form.maxParticipants}
                        onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link phòng học *</label>
                    <input
                      type="url"
                      required
                      value={form.meetingUrl}
                      onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID *</label>
                      <input
                        type="text"
                        required
                        value={form.meetingId}
                        onChange={(e) => setForm({ ...form, meetingId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                      <input
                        type="text"
                        value={form.meetingPassword}
                        onChange={(e) => setForm({ ...form, meetingPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedLiveClass(null);
                        resetForm();
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
          </div>
        </div>
      )}
    </div>
  );
}

