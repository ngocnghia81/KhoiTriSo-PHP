'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { courseService } from '@/services/courseService';
import { getInstructorCourse } from '@/services/instructor';
import { createLessonAssignment, createAssignmentQuestions } from '@/services/assignments';
import { useToast } from '@/components/ToastProvider';
import MathEditor from '@/components/MathEditor';
import SampleQuestionsButton from '@/components/SampleQuestionsButton';
import SolutionVideoUpload from '@/components/SolutionVideoUpload';
import WordTemplateDownload from '@/components/WordTemplateDownload';
import WordImport from '@/components/WordImport';
import { sampleQuestions, SampleQuestion } from '@/data/sampleQuestions';
import RichTextEditor from '@/components/RichTextEditor';
import 'katex/dist/katex.min.css';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  const courseId = params?.courseId ? parseInt(params.courseId as string) : null;
  const lessonId = params?.lessonId ? parseInt(params.lessonId as string) : null;

  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    assignmentType: 1, // 1: Quiz, 2: Homework, 3: Exam, 4: Practice
    timeLimit: '',
    maxAttempts: 1,
    showAnswersAfter: 2, // 1: Immediately, 2: After submission, 3: After due date, 4: Never
    dueDate: '',
    isPublished: false,
    passingScore: '',
    shuffleQuestions: false,
    shuffleOptions: true,
    maxScore: 10, // Default max score
  });

  const [pointsMode, setPointsMode] = useState<'manual' | 'auto'>('auto'); // 'manual' = tự nhập, 'auto' = chia đều

  const [questions, setQuestions] = useState<Array<{
    id: string;
    content: string;
    type: 'multiple_choice' | 'essay';
    options?: Array<{ id: string; text: string; isCorrect: boolean }>;
    correctAnswer?: string;
    explanation: string;
    solutionVideo?: string;
    solutionType?: 'text' | 'video' | 'latex';
    defaultPoints?: number; // For BatchInsert
  }>>([]);

  const [showPreview, setShowPreview] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorQuestions, setErrorQuestions] = useState<Set<number>>(new Set());
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [assignmentId, setAssignmentId] = useState<number | null>(null);

  useEffect(() => {
    // Check user role
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
    if (!courseId || !lessonId) {
      router.push('/dashboard/courses');
    } else {
      fetchLesson();
    }
  }, [courseId, lessonId, router, isInstructor]);

  const fetchLesson = async () => {
    if (!courseId || !lessonId) return;
    try {
      setLoadingLesson(true);
      let courseData;
      if (isInstructor) {
        courseData = await getInstructorCourse(courseId);
      } else {
        courseData = await courseService.getCourseAdmin(courseId);
      }
      setCourse(courseData);
      const lessonData = (courseData as any).lessons?.find((l: any) => l.id === lessonId);
      if (lessonData) {
        setLesson(lessonData);
      } else {
        notify('Không tìm thấy bài học', 'error');
        router.push(`/dashboard/courses/${courseId}`);
      }
    } catch (error: any) {
      console.error('Error fetching lesson:', error);
      notify(error.message || 'Lỗi tải thông tin bài học', 'error');
      router.push(`/dashboard/courses/${courseId}`);
    } finally {
      setLoadingLesson(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `q-${Date.now()}-${Math.random()}`,
      content: '',
      type: 'multiple_choice' as const,
      options: [
        { id: `opt-${Date.now()}-1`, text: '', isCorrect: false },
        { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
      ],
      explanation: '',
      solutionType: 'text' as const,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    // Recalculate points if in auto mode
    if (pointsMode === 'auto' && newQuestions.length > 0) {
      const pointsPerQuestion = assignmentForm.maxScore / newQuestions.length;
      const updated = newQuestions.map(q => ({
        ...q,
        defaultPoints: parseFloat(pointsPerQuestion.toFixed(2))
      }));
      setQuestions(updated);
    }
  };

  // Handle points mode change
  const handlePointsModeChange = (mode: 'manual' | 'auto') => {
    setPointsMode(mode);
    if (mode === 'auto') {
      // Chia đều điểm
      if (questions.length > 0) {
        const pointsPerQuestion = assignmentForm.maxScore / questions.length;
        const updated = questions.map(q => ({
          ...q,
          defaultPoints: parseFloat(pointsPerQuestion.toFixed(2))
        }));
        setQuestions(updated);
      }
    } else {
      // Tự nhập - xóa tất cả defaultPoints
      const updated = questions.map(q => ({
        ...q,
        defaultPoints: undefined
      }));
      setQuestions(updated);
    }
  };

  // Recalculate points when questions count changes (auto mode)
  useEffect(() => {
    if (pointsMode === 'auto' && questions.length > 0) {
      const pointsPerQuestion = assignmentForm.maxScore / questions.length;
      const expectedPoints = parseFloat(pointsPerQuestion.toFixed(2));
      // Only update if points don't match
      const needsUpdate = questions.some(q => Math.abs((q.defaultPoints || 0) - expectedPoints) > 0.01);
      if (needsUpdate) {
        const updated = questions.map(q => ({
          ...q,
          defaultPoints: expectedPoints
        }));
        setQuestions(updated);
      }
    }
  }, [questions.length, assignmentForm.maxScore, pointsMode]);

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
    // Clear error for this question when user edits
    if (errorQuestions.has(index)) {
      const newErrors = new Set(errorQuestions);
      newErrors.delete(index);
      setErrorQuestions(newErrors);
    }
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    updated[questionIndex].options!.push({
      id: `opt-${Date.now()}-${Math.random()}`,
      text: '',
      isCorrect: false,
    });
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options = updated[questionIndex].options!.filter(
        (_, i) => i !== optionIndex
      );
    }
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      (updated[questionIndex].options![optionIndex] as any)[field] = value;
      setQuestions(updated);
      // Clear error for this question when user edits options
      if (errorQuestions.has(questionIndex)) {
        const newErrors = new Set(errorQuestions);
        newErrors.delete(questionIndex);
        setErrorQuestions(newErrors);
      }
    }
  };

  const addQuestionFromSample = (sample: SampleQuestion) => {
    const newQuestion = {
      id: `q-${Date.now()}-${Math.random()}`,
      content: sample.content,
      type: sample.type,
      options: sample.options?.map((opt, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: sample.explanation || '',
      solutionType: 'text' as const,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !lessonId) return;

    // Validate assignment form
    if (!assignmentForm.title || !assignmentForm.description) {
      notify('Vui lòng điền đầy đủ thông tin bài tập', 'error');
      return;
    }

    // Validate questions
    if (questions.length === 0) {
      notify('Vui lòng thêm ít nhất 1 câu hỏi', 'error');
      return;
    }

    // Clear previous errors
    setErrorQuestions(new Set());

    // Validate questions and collect errors
    const errorIndices = new Set<number>();
    const errorMessages: string[] = [];
    let firstErrorIndex = -1;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let hasError = false;
      const questionErrors: string[] = [];

      if (!q.content || !q.content.trim()) {
        errorIndices.add(i);
        hasError = true;
        questionErrors.push('Chưa có nội dung');
        if (firstErrorIndex === -1) firstErrorIndex = i;
      }

      if (q.type === 'multiple_choice' && q.options) {
        // Filter out empty options
        const validOptions = q.options.filter(opt => opt.text && opt.text.trim() !== '');
        
        if (validOptions.length < 2) {
          errorIndices.add(i);
          hasError = true;
          questionErrors.push('Phải có ít nhất 2 lựa chọn hợp lệ (không được để trống)');
          if (firstErrorIndex === -1) firstErrorIndex = i;
        }
        
        const hasCorrect = validOptions.some(opt => opt.isCorrect);
        if (!hasCorrect) {
          errorIndices.add(i);
          hasError = true;
          questionErrors.push('Cần ít nhất 1 đáp án đúng');
          if (firstErrorIndex === -1) firstErrorIndex = i;
        }
      }

      if (hasError) {
        errorMessages.push(`Câu hỏi ${i + 1}: ${questionErrors.join(', ')}`);
      }
    }

    // If there are errors, highlight them and scroll to first error
    if (errorIndices.size > 0) {
      setErrorQuestions(errorIndices);
      
      // Scroll to first error question
      if (firstErrorIndex >= 0) {
        setTimeout(() => {
          const errorElement = document.getElementById(`question-${firstErrorIndex}`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a shake animation
            errorElement.classList.add('animate-pulse');
            setTimeout(() => {
              errorElement.classList.remove('animate-pulse');
            }, 2000);
          }
        }, 100);
      }

      notify(errorMessages.join('. ') || 'Vui lòng kiểm tra lại các câu hỏi', 'error');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create assignment
      const assignmentData = {
        title: assignmentForm.title,
        description: assignmentForm.description,
        lessonId: lessonId,
        assignmentType: assignmentForm.assignmentType,
        maxScore: assignmentForm.maxScore || 10,
        timeLimit: assignmentForm.timeLimit ? parseInt(assignmentForm.timeLimit) : undefined,
        maxAttempts: assignmentForm.maxAttempts,
        showAnswersAfter: assignmentForm.showAnswersAfter,
        dueDate: assignmentForm.dueDate || undefined,
        isPublished: assignmentForm.isPublished,
        passingScore: assignmentForm.passingScore ? parseFloat(assignmentForm.passingScore) : undefined,
        shuffleQuestions: assignmentForm.shuffleQuestions,
        shuffleOptions: assignmentForm.shuffleOptions,
      };

      const assignment = await createLessonAssignment(lessonId, assignmentData);
      setAssignmentId(assignment.id);

      // Step 2: Create questions (BatchInsert)
      const questionsData = questions.map(q => {
        // Filter out empty options for multiple choice questions
        let filteredOptions = undefined;
        if (q.type === 'multiple_choice' && q.options) {
          filteredOptions = q.options
            .filter(opt => opt.text && opt.text.trim() !== '') // Filter empty options
            .map(opt => ({
              text: opt.text.trim(),
              isCorrect: opt.isCorrect,
            }));
          
          // Validate minimum options count
          if (filteredOptions.length < 2) {
            throw new Error(`Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn hợp lệ (không được để trống)`);
          }
        }
        
        return {
          content: q.content,
          type: q.type,
          options: filteredOptions,
          explanation: q.solutionType === 'video' ? undefined : (q.explanation || undefined),
          correctAnswer: q.type === 'essay' ? q.correctAnswer : undefined,
          solutionVideo: q.solutionType === 'video' ? q.solutionVideo : undefined,
          solutionType: q.solutionType || 'text',
          defaultPoints: q.defaultPoints, // For BatchInsert
        };
      });

      await createAssignmentQuestions(assignment.id, {
        questions: questionsData,
        isBatchInsert: true, // Word import or batch create
      });

      notify('Tạo bài tập thành công!', 'success');
      router.push(`/dashboard/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      notify(error.message || 'Lỗi tạo bài tập', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingLesson) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/courses/${courseId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Tạo bài tập cho: {lesson.title}
          </h1>
          <p className="text-gray-600 mt-2">Khóa học: {course.title}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
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
                    onChange={(e) => {
                      const newMaxScore = parseFloat(e.target.value) || 10;
                      setAssignmentForm({ ...assignmentForm, maxScore: newMaxScore });
                      // Recalculate points if in auto mode
                      if (pointsMode === 'auto' && questions.length > 0) {
                        const pointsPerQuestion = newMaxScore / questions.length;
                        const updated = questions.map(q => ({
                          ...q,
                          defaultPoints: parseFloat(pointsPerQuestion.toFixed(2))
                        }));
                        setQuestions(updated);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tổng điểm tối đa của bài tập (mặc định: 10 điểm)
                  </p>
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
                    <option value={4}>Không được xem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hạn nộp
                  </label>
                  <input
                    type="datetime-local"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điểm đạt (tối đa 10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={assignmentForm.passingScore}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, passingScore: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5.0"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={assignmentForm.shuffleQuestions}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, shuffleQuestions: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Xáo trộn câu hỏi</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={assignmentForm.shuffleOptions}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, shuffleOptions: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Xáo trộn đáp án</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={assignmentForm.isPublished}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, isPublished: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Xuất bản ngay</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Danh sách câu hỏi ({questions.length})</h2>
                <div className="flex gap-2">
                  <SampleQuestionsButton onInsert={addQuestionFromSample} />
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    + Thêm câu hỏi
                  </button>
                </div>
              </div>

              {/* Points Mode Toggle */}
              {questions.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chế độ điểm
                      </label>
                      <p className="text-xs text-gray-500">
                        {pointsMode === 'auto' 
                          ? `Điểm sẽ được chia đều: ${assignmentForm.maxScore} điểm / ${questions.length} câu = ${(assignmentForm.maxScore / questions.length).toFixed(2)} điểm/câu`
                          : 'Tự nhập điểm cho từng câu hỏi'}
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
              )}

              {/* Word Import Section - Will be available after creating assignment */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">
                  💡 <strong>Lưu ý:</strong> Chức năng import từ file Word sẽ có sau khi tạo bài tập. 
                  Bạn có thể tạo câu hỏi thủ công hoặc tạo bài tập trước, sau đó thêm câu hỏi từ Word.
                </p>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => {
                    const hasError = errorQuestions.has(qIndex);
                    return (
                    <div 
                      key={question.id} 
                      id={`question-${qIndex}`}
                      className={`border-2 rounded-lg p-4 transition-all duration-300 ${
                        hasError 
                          ? 'border-red-500 bg-red-50 shadow-lg shadow-red-200' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className={`font-medium ${hasError ? 'text-red-700' : 'text-gray-900'}`}>
                            Câu hỏi {qIndex + 1}
                            {hasError && (
                              <span className="ml-2 text-sm text-red-600 font-normal">
                                ⚠ Có lỗi cần sửa
                              </span>
                            )}
                          </h3>
                          {hasError && (
                            <div className="mt-1 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                              {(() => {
                                const errors: string[] = [];
                                const q = question;
                                if (!q.content || !q.content.trim()) {
                                  errors.push('Chưa có nội dung');
                                }
                                if (q.type === 'multiple_choice' && q.options) {
                                  const validOptions = q.options.filter(opt => opt.text && opt.text.trim() !== '');
                                  if (validOptions.length < 2) {
                                    errors.push('Phải có ít nhất 2 lựa chọn hợp lệ');
                                  }
                                  const hasCorrect = validOptions.some(opt => opt.isCorrect);
                                  if (!hasCorrect) {
                                    errors.push('Cần ít nhất 1 đáp án đúng');
                                  }
                                }
                                return errors.join(', ');
                              })()}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-sm text-gray-600 hover:text-gray-900"
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

                      <div className="space-y-4">
                        {/* Question Content */}
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

                        {/* Question Type */}
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

                        {/* Multiple Choice Options */}
                        {question.type === 'multiple_choice' && question.options && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Đáp án <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => addOption(qIndex)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                + Thêm đáp án
                              </button>
                            </div>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div key={option.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={option.isCorrect}
                                    onChange={(e) => updateOption(qIndex, optIndex, 'isCorrect', e.target.checked)}
                                    className="rounded"
                                  />
                                  <MathEditor
                                    value={option.text}
                                    onChange={(value) => updateOption(qIndex, optIndex, 'text', value)}
                                    placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`}
                                  />
                                  {question.options!.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(qIndex, optIndex)}
                                      className="text-red-600 hover:text-red-900 text-sm"
                                    >
                                      Xóa
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Đánh dấu đáp án đúng bằng cách tích vào checkbox. Đáp án đúng sẽ được đánh dấu * trong file Word.
                            </p>
                          </div>
                        )}

                        {/* Essay Answer */}
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

                        {/* Explanation */}
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

                        {/* Solution Type */}
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

                        {/* Solution Video */}
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

                        {/* Default Points (for BatchInsert) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Điểm mặc định {pointsMode === 'auto' && `(${(assignmentForm.maxScore / questions.length).toFixed(2)} điểm/câu - tự động chia đều)`}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={question.defaultPoints || ''}
                            onChange={(e) => {
                              if (pointsMode === 'manual') {
                                updateQuestion(qIndex, 'defaultPoints', e.target.value ? parseFloat(e.target.value) : undefined);
                              }
                            }}
                            disabled={pointsMode === 'auto'}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              pointsMode === 'auto' ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder={pointsMode === 'auto' ? 'Tự động chia đều' : 'Nhập điểm cho câu hỏi này'}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {pointsMode === 'auto' 
                              ? `Điểm được chia đều từ tổng ${assignmentForm.maxScore} điểm. Tổng điểm tất cả câu hỏi = ${questions.reduce((sum, q) => sum + (q.defaultPoints || 0), 0).toFixed(2)}.`
                              : 'Nếu tất cả câu hỏi đều có điểm mặc định, tổng điểm phải = ' + assignmentForm.maxScore + '. Nếu không có, hệ thống sẽ tự động tính.'}
                          </p>
                        </div>

                        {/* Preview */}
                        {showPreview && question.content && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Xem trước:</h4>
                            <div className="prose prose-sm max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: question.content }} />
                            </div>
                            {question.type === 'multiple_choice' && question.options && (
                              <ul className="mt-2 space-y-1">
                                {question.options.map((opt, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
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
                {loading ? 'Đang tạo...' : 'Tạo bài tập'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

