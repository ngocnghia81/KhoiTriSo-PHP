'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { createLiveClass } from '@/services/liveclasses';
import { courseService, Course } from '@/services/courseService';
import { useToast } from '@/components/ToastProvider';

export default function CreateLiveClassPage() {
  useAuthGuard();
  const router = useRouter();
  const { notify } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const { data } = await courseService.listCoursesAdmin();
      setCourses(data);
    } catch (error: any) {
      notify(error.message || 'Lỗi tải danh sách khóa học', 'error');
    } finally {
      setLoadingCourses(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId) {
      notify('Vui lòng chọn khóa học', 'error');
      return;
    }
    
    setSubmitting(true);
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
      setSubmitting(false);
      if (res.ok) {
        notify('Tạo lớp học thành công!', 'success');
        router.push('/instructor/live-classes');
      } else {
        notify('Tạo lớp học thất bại', 'error');
      }
    } catch (error: any) {
      setSubmitting(false);
      notify(error.message || 'Lỗi tạo lớp học', 'error');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tạo lớp học trực tuyến</h1>
      {loadingCourses ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải danh sách khóa học...</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 bg-white rounded-lg shadow p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
            <input
              className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ví dụ: Ôn tập Chương 1"
              value={form.title}
              onChange={(e)=>setForm({...form, title:e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
            <textarea
              className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mô tả về buổi học..."
              rows={3}
              value={form.description}
              onChange={(e)=>setForm({...form, description:e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học *</label>
            <select
              className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.courseId}
              onChange={(e)=>setForm({...form, courseId:e.target.value})}
              required
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
              className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e)=>setForm({...form, scheduledAt:e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút) *</label>
              <input
                className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                type="number"
                min="1"
                placeholder="60"
                value={form.durationMinutes}
                onChange={(e)=>setForm({...form, durationMinutes:Number(e.target.value)})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số học viên tối đa</label>
              <input
                className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                type="number"
                min="1"
                placeholder="100"
                value={form.maxParticipants}
                onChange={(e)=>setForm({...form, maxParticipants:Number(e.target.value)})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link phòng học *</label>
            <input
              className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              type="url"
              placeholder="https://zoom.us/j/..."
              value={form.meetingUrl}
              onChange={(e)=>setForm({...form, meetingUrl:e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID *</label>
              <input
                className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123-456-789"
                value={form.meetingId}
                onChange={(e)=>setForm({...form, meetingId:e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input
                className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tùy chọn"
                value={form.meetingPassword}
                onChange={(e)=>setForm({...form, meetingPassword:e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo lớp'}
            </button>
            <button
              type="button"
              onClick={()=>router.back()}
              className="px-5 py-2 rounded border hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}



