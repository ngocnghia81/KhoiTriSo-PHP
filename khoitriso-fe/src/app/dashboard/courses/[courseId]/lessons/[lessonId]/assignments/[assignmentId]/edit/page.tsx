'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { courseService } from '@/services/courseService';
import { getInstructorCourse } from '@/services/instructor';
import { getAssignmentAdmin, updateAssignment, createAssignmentQuestions } from '@/services/assignments';
import { useToast } from '@/components/ToastProvider';
import RichTextEditor from '@/components/RichTextEditor';
import MathEditor from '@/components/MathEditor';
import SampleQuestionsButton from '@/components/SampleQuestionsButton';
import { sampleQuestions, SampleQuestion } from '@/data/sampleQuestions';

type QuestionForm = {
  id: string;
  content: string;
  type: 'multiple_choice' | 'essay';
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation: string;
  solutionVideo?: string;
  solutionType?: 'text' | 'video' | 'latex';
  defaultPoints?: number;
};

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

  const [pointsMode, setPointsMode] = useState<'manual' | 'auto'>('auto');
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [errorQuestions, setErrorQuestions] = useState<Set<number>>(new Set());
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
      const timeLimitValue = assignmentData.timeLimit ?? assignmentData.time_limit;
      const dueDateValue = assignmentData.dueDate ?? assignmentData.due_date;
      const passingScoreValue = assignmentData.passingScore ?? assignmentData.passing_score;

      setAssignmentForm({
        title: assignmentData.title || '',
        description: assignmentData.description || '',
        assignmentType: assignmentData.assignmentType || assignmentData.assignment_type || 1,
        timeLimit: timeLimitValue !== undefined && timeLimitValue !== null ? String(timeLimitValue) : '',
        maxAttempts: assignmentData.maxAttempts || assignmentData.max_attempts || 1,
        showAnswersAfter: assignmentData.showAnswersAfter || assignmentData.show_answers_after || 2,
        dueDate: dueDateValue ? dueDateValue.split('T')[0] : '',
        isPublished: assignmentData.isPublished !== undefined ? assignmentData.isPublished : (assignmentData.is_published !== undefined ? assignmentData.is_published : false),
        passingScore: passingScoreValue !== undefined && passingScoreValue !== null ? String(passingScoreValue) : '',
        shuffleQuestions: assignmentData.shuffleQuestions !== undefined ? assignmentData.shuffleQuestions : (assignmentData.shuffle_questions !== undefined ? assignmentData.shuffle_questions : false),
        shuffleOptions: assignmentData.shuffleOptions !== undefined ? assignmentData.shuffleOptions : (assignmentData.shuffle_options !== undefined ? assignmentData.shuffle_options : true),
        maxScore: assignmentData.maxScore || assignmentData.max_score || 10,
      });

      const sortedBackendQuestions = [...(assignmentData.questions || [])].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
      );

      const mappedQuestions: QuestionForm[] = sortedBackendQuestions
        .map((q: any) => ({
          id: `existing-${q.id}`,
          content: q.question_content || q.questionContent || '',
          type: q.question_type === 2 ? 'essay' : 'multiple_choice',
          options: (q.options || []).map((opt: any, idx: number) => ({
            id: `existing-opt-${opt.id ?? idx}`,
            text: opt.option_content || opt.optionContent || '',
            isCorrect: opt.is_correct ?? opt.isCorrect ?? false,
          })),
          explanation: q.explanation_content || '',
          solutionType: 'text',
          defaultPoints: typeof q.default_points === 'number' ? q.default_points : undefined,
        }));

      setQuestions(mappedQuestions);

      if (mappedQuestions.length > 0) {
        const first = mappedQuestions[0].defaultPoints ?? 0;
        const allEqual = mappedQuestions.every(q => Math.abs((q.defaultPoints ?? 0) - first) < 0.01);
        setPointsMode(allEqual ? 'auto' : 'manual');
      } else {
        setPointsMode('auto');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      notify(error.message || 'Lỗi tải thông tin bài tập', 'error');
      router.push(`/dashboard/courses/${courseId}`);
    } finally {
      setLoadingData(false);
    }
  };

  const addQuestion = () => {
    const timestamp = Date.now();
    const newQuestion: QuestionForm = {
      id: `q-${timestamp}-${Math.random()}`,
      content: '',
      type: 'multiple_choice',
      options: [
        { id: `opt-${timestamp}-1`, text: '', isCorrect: false },
        { id: `opt-${timestamp}-2`, text: '', isCorrect: false },
      ],
      explanation: '',
      solutionType: 'text',
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handlePointsModeChange = (mode: 'manual' | 'auto') => {
    setPointsMode(mode);
    if (mode === 'auto' && questions.length > 0) {
      const pointsPerQuestion = assignmentForm.maxScore / questions.length;
      setQuestions(questions.map(q => ({
        ...q,
        defaultPoints: Number(pointsPerQuestion.toFixed(6)),
      })));
    }
  };

  useEffect(() => {
    if (pointsMode === 'auto' && questions.length > 0) {
      const pointsPerQuestion = assignmentForm.maxScore / questions.length;
      const expectedPoints = Number(pointsPerQuestion.toFixed(6));
      const needsUpdate = questions.some(q => Math.abs((q.defaultPoints || 0) - expectedPoints) > 0.0001);
      if (needsUpdate) {
        setQuestions(questions.map(q => ({
          ...q,
          defaultPoints: expectedPoints,
        })));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, assignmentForm.maxScore, pointsMode]);

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
    if (errorQuestions.has(index)) {
      const newErrors = new Set(errorQuestions);
      newErrors.delete(index);
      setErrorQuestions(newErrors);
    }
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    const timestamp = Date.now();
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    updated[questionIndex].options!.push({
      id: `opt-${timestamp}-${Math.random()}`,
      text: '',
      isCorrect: false,
    });
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options = updated[questionIndex].options!.filter((_, i) => i !== optionIndex);
    }
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      (updated[questionIndex].options![optionIndex] as any)[field] = value;
      setQuestions(updated);
      if (errorQuestions.has(questionIndex)) {
        const newErrors = new Set(errorQuestions);
        newErrors.delete(questionIndex);
        setErrorQuestions(newErrors);
      }
    }
  };

  const addQuestionFromSample = (sample: SampleQuestion) => {
    const timestamp = Date.now();
    const newQuestion: QuestionForm = {
      id: `sample-${timestamp}`,
      content: sample.content,
      type: sample.type,
      options: sample.options?.map((opt, idx) => ({
        id: `sample-opt-${timestamp}-${idx}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: sample.explanation || '',
      solutionType: 'text',
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId) return;

    if (!assignmentForm.title || !assignmentForm.description) {
      notify('Vui lòng điền đầy đủ thông tin bài tập', 'error');
      return;
    }

    if (questions.length === 0) {
      notify('Vui lòng thêm ít nhất 1 câu hỏi', 'error');
      return;
    }

    // Prepare questions with computed points
    const computedQuestions: QuestionForm[] = questions.map((q) => {
      const autoPoints = pointsMode === 'auto' && questions.length > 0
        ? parseFloat((assignmentForm.maxScore / questions.length).toFixed(2))
        : undefined;
      return {
        ...q,
        defaultPoints: pointsMode === 'auto'
          ? autoPoints
          : q.defaultPoints,
      };
    });

    const totalPoints = computedQuestions.reduce((sum, q) => sum + (q.defaultPoints ?? 0), 0);
    const diff = assignmentForm.maxScore - totalPoints;

    if (pointsMode === 'manual') {
      if (Math.abs(diff) > 0.05) {
        notify(`Tổng điểm các câu hỏi phải bằng ${assignmentForm.maxScore}`, 'error');
        return;
      }
    }

    if (computedQuestions.length > 0 && Math.abs(diff) > 0.0001) {
      const last = computedQuestions[computedQuestions.length - 1];
      last.defaultPoints = Number(((last.defaultPoints ?? 0) + diff).toFixed(6));
    }

    const errorIndices = new Set<number>();
    let firstErrorIndex = -1;

    computedQuestions.forEach((q, index) => {
      const localErrors: string[] = [];
      if (!q.content || !q.content.trim()) {
        localErrors.push('Chưa có nội dung');
      }

      if (q.type === 'multiple_choice') {
        const validOptions = (q.options || []).filter(opt => opt.text && opt.text.trim() !== '');
        if (validOptions.length < 2) {
          localErrors.push('Phải có ít nhất 2 lựa chọn hợp lệ');
        }
        const hasCorrect = validOptions.some(opt => opt.isCorrect);
        if (!hasCorrect) {
          localErrors.push('Cần ít nhất 1 đáp án đúng');
        }
      }

      if (localErrors.length) {
        errorIndices.add(index);
        if (firstErrorIndex === -1) {
          firstErrorIndex = index;
        }
      }
    });

    if (errorIndices.size > 0) {
      setErrorQuestions(errorIndices);
      if (firstErrorIndex >= 0) {
        setTimeout(() => {
          const el = document.getElementById(`question-${firstErrorIndex}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('animate-pulse');
            setTimeout(() => el.classList.remove('animate-pulse'), 2000);
          }
        }, 100);
      }
      notify('Vui lòng kiểm tra lại các câu hỏi bị đánh dấu đỏ', 'error');
      return;
    }

    setErrorQuestions(new Set());

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

      const questionsPayload = computedQuestions.map((q) => {
        let filteredOptions;
        if (q.type === 'multiple_choice') {
          filteredOptions = (q.options || [])
            .filter(opt => opt.text && opt.text.trim() !== '')
            .map(opt => ({
              text: opt.text.trim(),
              isCorrect: opt.isCorrect,
            }));
        }

        return {
          content: q.content,
          type: q.type,
          options: filteredOptions,
          explanation: q.solutionType === 'video' ? undefined : (q.explanation || undefined),
          correctAnswer: q.type === 'essay' ? q.correctAnswer : undefined,
          solutionVideo: q.solutionType === 'video' ? q.solutionVideo : undefined,
          solutionType: q.solutionType || 'text',
          defaultPoints: q.defaultPoints,
        };
      });

      await createAssignmentQuestions(assignmentId, {
        questions: questionsPayload,
        isBatchInsert: true,
        replaceExisting: true,
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

            {/* Question Builder */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Danh sách câu hỏi</h2>
                  <p className="text-sm text-gray-500">Chỉnh sửa hoặc thêm mới các câu hỏi cho bài tập này.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <SampleQuestionsButton onInsert={addQuestionFromSample} />
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                  Chưa có câu hỏi nào. Nhấn <strong>+ Thêm câu hỏi</strong> để bắt đầu.
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chế độ điểm
                        </label>
                        <p className="text-xs text-gray-500">
                          {pointsMode === 'auto'
                            ? `Điểm sẽ tự động chia đều: ${assignmentForm.maxScore} điểm / ${questions.length} câu = ${(assignmentForm.maxScore / questions.length).toFixed(2)} điểm/câu`
                            : 'Tự nhập điểm cho từng câu hỏi. Tổng điểm phải bằng tổng điểm bài tập.'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePointsModeChange('auto')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            pointsMode === 'auto'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Chia đều điểm
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePointsModeChange('manual')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            pointsMode === 'manual'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Tự nhập điểm
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {questions.map((question, qIndex) => {
                      const hasError = errorQuestions.has(qIndex);
                      return (
                        <div
                          key={question.id}
                          id={`question-${qIndex}`}
                          className={`border-2 rounded-lg p-4 transition-all duration-300 ${
                            hasError
                              ? 'border-red-500 bg-red-50 shadow-lg shadow-red-100'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1">
                              <h3 className={`font-semibold ${hasError ? 'text-red-700' : 'text-gray-900'}`}>
                                Câu hỏi {qIndex + 1}
                              </h3>
                              {hasError && (
                                <p className="text-sm text-red-600 mt-1">
                                  ⚠ Vui lòng kiểm tra lại nội dung hoặc đáp án của câu hỏi này.
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-sm text-gray-600 hover:text-gray-900"
                                title={showPreview ? 'Ẩn xem trước' : 'Hiện xem trước'}
                              >
                                {showPreview ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                className="text-sm text-red-600 hover:text-red-900"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nội dung câu hỏi <span className="text-red-500">*</span>
                              </label>
                              <MathEditor
                                value={question.content}
                                onChange={(value) => updateQuestion(qIndex, 'content', value)}
                                placeholder="Nhập nội dung câu hỏi..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Loại câu hỏi
                              </label>
                              <select
                                value={question.type}
                                onChange={(e) => {
                                  const newType = e.target.value as 'multiple_choice' | 'essay';
                                  updateQuestion(qIndex, 'type', newType);
                                  if (newType === 'essay') {
                                    updateQuestion(qIndex, 'options', undefined);
                                  } else if (!question.options || question.options.length === 0) {
                                    updateQuestion(qIndex, 'options', [
                                      { id: `opt-${Date.now()}-1`, text: '', isCorrect: false },
                                      { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
                                    ]);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="multiple_choice">Trắc nghiệm</option>
                                <option value="essay">Tự luận</option>
                              </select>
                            </div>

                            {question.type === 'multiple_choice' && question.options && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Đáp án <span className="text-red-500">*</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addOption(qIndex)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    + Thêm đáp án
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  {question.options.map((option, optIndex) => (
                                    <div key={option.id} className="border rounded-lg p-3 bg-gray-50">
                                      <div className="flex items-start gap-3">
                                        <input
                                          type="checkbox"
                                          className="mt-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                          checked={option.isCorrect}
                                          onChange={(e) => updateOption(qIndex, optIndex, 'isCorrect', e.target.checked)}
                                        />
                                        <div className="flex-1 space-y-2">
                                          <MathEditor
                                            value={option.text}
                                            onChange={(value) => updateOption(qIndex, optIndex, 'text', value)}
                                            placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`}
                                          />
                                          {question.options!.length > 2 && (
                                            <button
                                              type="button"
                                              onClick={() => removeOption(qIndex, optIndex)}
                                              className="text-xs text-red-600 hover:text-red-900"
                                            >
                                              Xóa đáp án
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {question.type === 'essay' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Đáp án mẫu
                                </label>
                                <textarea
                                  value={question.correctAnswer || ''}
                                  onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Nhập đáp án mẫu (tùy chọn)"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Giải thích
                              </label>
                              <MathEditor
                                value={question.explanation}
                                onChange={(value) => updateQuestion(qIndex, 'explanation', value)}
                                placeholder="Nhập giải thích (tùy chọn)..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Loại giải thích
                              </label>
                              <select
                                value={question.solutionType || 'text'}
                                onChange={(e) => updateQuestion(qIndex, 'solutionType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="text">Văn bản</option>
                                <option value="video">Video</option>
                                <option value="latex">LaTeX/Math</option>
                              </select>
                            </div>

                            {question.solutionType === 'video' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  URL Video giải thích
                                </label>
                                <input
                                  type="url"
                                  value={question.solutionVideo || ''}
                                  onChange={(e) => updateQuestion(qIndex, 'solutionVideo', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="https://..."
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Điểm câu hỏi
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={question.defaultPoints ?? ''}
                                onChange={(e) => {
                                  if (pointsMode === 'manual') {
                                    updateQuestion(qIndex, 'defaultPoints', e.target.value ? parseFloat(e.target.value) : undefined);
                                  }
                                }}
                                disabled={pointsMode === 'auto'}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  pointsMode === 'auto' ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                                placeholder={pointsMode === 'auto' ? 'Đang chia đều' : 'Nhập điểm cho câu hỏi này'}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {pointsMode === 'auto'
                                  ? `Điểm chia đều theo tổng ${assignmentForm.maxScore} điểm.`
                                  : `Tổng điểm các câu hỏi phải bằng ${assignmentForm.maxScore}.`}
                              </p>
                            </div>

                            {showPreview && question.content && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Xem trước</h4>
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: question.content }} />
                                {question.type === 'multiple_choice' && question.options && (
                                  <ul className="mt-2 space-y-1">
                                    {question.options.map((opt, idx) => (
                                      <li key={opt.id} className="flex items-center gap-2">
                                        <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                                        <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                                        {opt.isCorrect && (
                                          <span className="text-green-600 font-semibold">✓ Đúng</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      + Thêm câu hỏi
                    </button>
                  </div>
                </>
              )}
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

