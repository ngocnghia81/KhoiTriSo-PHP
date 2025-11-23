'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { courseService } from '@/services/courseService';
import { getInstructorCourse } from '@/services/instructor';
import { getAssignmentAdmin, updateAssignment } from '@/services/assignments';
import { useToast } from '@/components/ToastProvider';
import RichTextEditor from '@/components/RichTextEditor';

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  const courseId = params?.courseId ? parseInt(params.courseId as string) : null;
  const lessonId = params?.lessonId ? parseInt(params.lessonId as string) : null;
  const assignmentId = params?.assignmentId ? parseInt(params.assignmentId as string) : null;

  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    assignmentType: 1,
    timeLimit: '',
    maxAttempts: 1,
    showAnswersAfter: 2,
    dueDate: '',
    isPublished: false,
    passingScore: '',
    shuffleQuestions: false,
    shuffleOptions: true,
    maxScore: 10,
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const userData = JSON.parse(userStr);
        setIsInstructor(userData.role === 'instructor');
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }, []);

  useEffect(() => {
    if (!courseId || !lessonId || !assignmentId) {
      router.push('/dashboard/courses');
    } else {
      fetchData();
    }
  }, [courseId, lessonId, assignmentId, router, isInstructor]);

  const fetchData = async () => {
    if (!courseId || !lessonId || !assignmentId) return;
    try {
      setLoadingData(true);
      
      // Fetch course
      let courseData;
      if (isInstructor) {
        courseData = await getInstructorCourse(courseId);
      } else {
        courseData = await courseService.getCourseAdmin(courseId);
      }
      setCourse(courseData);
      
      // Fetch lesson
      const lessonData = (courseData as any).lessons?.find((l: any) => l.id === lessonId);
      if (lessonData) {
        setLesson(lessonData);
      }
      
      // Fetch assignment
      const assignmentData = await getAssignmentAdmin(assignmentId);
      setAssignment(assignmentData);
      
      // Populate form
      setAssignmentForm({
        title: assignmentData.title || '',
        description: assignmentData.description || '',
        assignmentType: assignmentData.assignmentType || assignmentData.assignment_type || 1,
        timeLimit: assignmentData.timeLimit || assignmentData.time_limit ? String(assignmentData.timeLimit || assignmentData.time_limit) : '',
        maxAttempts: assignmentData.maxAttempts || assignmentData.max_attempts || 1,
        showAnswersAfter: assignmentData.showAnswersAfter || assignmentData.show_answers_after || 2,
        dueDate: assignmentData.dueDate || assignmentData.due_date ? (assignmentData.dueDate || assignmentData.due_date).split('T')[0] : '',
        isPublished: assignmentData.isPublished !== undefined ? assignmentData.isPublished : (assignmentData.is_published !== undefined ? assignmentData.is_published : false),
        passingScore: assignmentData.passingScore || assignmentData.passing_score ? String(assignmentData.passingScore || assignmentData.passing_score) : '',
        shuffleQuestions: assignmentData.shuffleQuestions !== undefined ? assignmentData.shuffleQuestions : (assignmentData.shuffle_questions !== undefined ? assignmentData.shuffle_questions : false),
        shuffleOptions: assignmentData.shuffleOptions !== undefined ? assignmentData.shuffleOptions : (assignmentData.shuffle_options !== undefined ? assignmentData.shuffle_options : true),
        maxScore: assignmentData.maxScore || assignmentData.max_score || 10,
      });
    } catch (error: any) {
      console.error('Error fetching data:', error);
      notify(error.message || 'Lỗi tải thông tin bài tập', 'error');
      router.push(`/dashboard/courses/${courseId}`);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId) return;

    if (!assignmentForm.title || !assignmentForm.description) {
      notify('Vui lòng điền đầy đủ thông tin bài tập', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateAssignment(assignmentId, {
        title: assignmentForm.title,
        description: assignmentForm.description,
        assignmentType: assignmentForm.assignmentType,
        maxScore: assignmentForm.maxScore,
        timeLimit: assignmentForm.timeLimit ? parseInt(assignmentForm.timeLimit) : undefined,
        maxAttempts: assignmentForm.maxAttempts,
        showAnswersAfter: assignmentForm.showAnswersAfter,
        dueDate: assignmentForm.dueDate || undefined,
        isPublished: assignmentForm.isPublished,
        passingScore: assignmentForm.passingScore ? parseFloat(assignmentForm.passingScore) : undefined,
        shuffleQuestions: assignmentForm.shuffleQuestions,
        shuffleOptions: assignmentForm.shuffleOptions,
      });

      notify('Cập nhật bài tập thành công!', 'success');
      router.push(`/dashboard/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      notify(error.message || 'Lỗi cập nhật bài tập', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/courses/${courseId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Quay lại
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa bài tập</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Assignment Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Thông tin bài tập</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề bài tập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tiêu đề bài tập"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại bài tập
                  </label>
                  <select
                    value={assignmentForm.assignmentType}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentType: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Quiz</option>
                    <option value={2}>Homework</option>
                    <option value={3}>Exam</option>
                    <option value={4}>Practice</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={assignmentForm.description}
                    onChange={(value) => setAssignmentForm({ ...assignmentForm, description: value })}
                    placeholder="Nhập mô tả bài tập..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian làm bài (phút)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={assignmentForm.timeLimit}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, timeLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Không giới hạn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lần làm tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={assignmentForm.maxAttempts}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, maxAttempts: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng điểm tối đa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={assignmentForm.maxScore}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, maxScore: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hiển thị đáp án và điểm
                  </label>
                  <select
                    value={assignmentForm.showAnswersAfter}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, showAnswersAfter: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Ngay sau khi nộp</option>
                    <option value={2}>Sau khi hết hạn</option>
                    <option value={3}>Không hiển thị</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hạn nộp bài
                  </label>
                  <input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điểm đạt
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={assignmentForm.passingScore}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, passingScore: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Điểm tối thiểu để đạt"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={assignmentForm.isPublished}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, isPublished: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                    Công khai bài tập
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="shuffleQuestions"
                    checked={assignmentForm.shuffleQuestions}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, shuffleQuestions: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="shuffleQuestions" className="ml-2 block text-sm text-gray-700">
                    Xáo trộn câu hỏi
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="shuffleOptions"
                    checked={assignmentForm.shuffleOptions}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, shuffleOptions: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="shuffleOptions" className="ml-2 block text-sm text-gray-700">
                    Xáo trộn đáp án
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/courses/${courseId}`)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

