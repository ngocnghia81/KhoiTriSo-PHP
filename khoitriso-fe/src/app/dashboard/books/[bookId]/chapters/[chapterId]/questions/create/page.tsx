'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { bookService } from '@/services/bookService';
import { getInstructorBook } from '@/services/instructor';
import { useToast } from '@/components/ToastProvider';
import MathEditor from '@/components/MathEditor';
import SampleQuestionsButton from '@/components/SampleQuestionsButton';
import SolutionVideoUpload from '@/components/SolutionVideoUpload';
import WordTemplateDownload from '@/components/WordTemplateDownload';
import WordImport from '@/components/WordImport';
import { sampleQuestions, SampleQuestion } from '@/data/sampleQuestions';
import 'katex/dist/katex.min.css';
// @ts-ignore - react-katex doesn't have type definitions
import { BlockMath } from 'react-katex';

export default function CreateQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  const bookId = params?.bookId ? parseInt(params.bookId as string) : null;
  const chapterId = params?.chapterId ? parseInt(params.chapterId as string) : null;

  const [chapter, setChapter] = useState<any>(null);
  const [questions, setQuestions] = useState<Array<{
    id: string;
    content: string;
    type: 'multiple_choice' | 'essay';
    options?: Array<{ id: string; text: string; isCorrect: boolean }>;
    correctAnswer?: string;
    explanation: string;
    solutionVideo?: string;
    solutionType?: 'text' | 'video' | 'latex';
  }>>([]);

  const [showPreview, setShowPreview] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingChapter, setLoadingChapter] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);

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
    if (!bookId || !chapterId) {
      router.push('/dashboard/books');
    } else {
      fetchChapter();
    }
  }, [bookId, chapterId, router, isInstructor]);

  const fetchChapter = async () => {
    if (!bookId || !chapterId) return;
    try {
      setLoadingChapter(true);
      let book;
      if (isInstructor) {
        // Use instructor API
        book = await getInstructorBook(bookId);
      } else {
        // Use admin API
        book = await bookService.getBookAdmin(bookId);
      }
      const chapterData = book.chapters?.find((ch: any) => ch.id === chapterId);
      if (chapterData) {
        setChapter(chapterData);
      } else {
        notify('Không tìm thấy chương', 'error');
        router.push(`/dashboard/books/${bookId}`);
      }
    } catch (error: any) {
      console.error('Error fetching chapter:', error);
      notify(error.message || 'Lỗi tải thông tin chương', 'error');
      router.push(`/dashboard/books/${bookId}`);
    } finally {
      setLoadingChapter(false);
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

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    if (field === 'options') {
      updated[index].options = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options = updated[questionIndex].options!.filter((_, i) => i !== optionIndex);
    }
    setQuestions(updated);
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

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addQuestionFromSample = (sample: SampleQuestion) => {
    const newQuestion: any = {
      id: `q-${Date.now()}-${Math.random()}`,
      content: sample.content,
      type: sample.type,
      explanation: sample.explanation || '',
      solutionType: 'text' as const,
    };

    if (sample.type === 'multiple_choice' && sample.options) {
      newQuestion.options = sample.options.map((opt, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text: opt.text,
        isCorrect: opt.isCorrect || false,
      }));
    } else if (sample.type === 'essay' && sample.correctAnswer) {
      newQuestion.correctAnswer = sample.correctAnswer;
    }

    setQuestions([...questions, newQuestion]);
  };

  const insertMathFormula = (formula: string) => {
    if (currentQuestionIndex === null) {
      notify('Vui lòng chọn một câu hỏi để chèn công thức', 'info');
      return;
    }

    const updated = [...questions];
    const field = 'content'; // Always insert into question content for now
    const currentContent = updated[currentQuestionIndex][field] || '';
    const mathBlock = formula.includes('$$') || formula.includes('$')
      ? formula 
      : `$$${formula}$$`;
    updated[currentQuestionIndex][field] = currentContent + (currentContent ? ' ' : '') + mathBlock;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId || !chapterId) return;

    if (questions.length === 0) {
      notify('Vui lòng thêm ít nhất một câu hỏi', 'error');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        notify(`Câu hỏi ${i + 1} chưa có nội dung`, 'error');
        return;
      }
      if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
        notify(`Câu hỏi ${i + 1} (trắc nghiệm) cần ít nhất 2 lựa chọn`, 'error');
        return;
      }
      if (q.type === 'multiple_choice' && q.options) {
        const hasCorrect = q.options.some(opt => opt.isCorrect);
        if (!hasCorrect) {
          notify(`Câu hỏi ${i + 1} (trắc nghiệm) cần ít nhất 1 đáp án đúng`, 'error');
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Tạo các câu hỏi cho chương này
      const questionsData = questions.map(q => ({
        content: q.content,
        type: q.type,
        options: q.type === 'multiple_choice' ? q.options : undefined,
        explanation: q.solutionType === 'video' ? undefined : (q.explanation || undefined),
        correctAnswer: q.type === 'essay' ? q.correctAnswer : undefined,
        solutionVideo: q.solutionType === 'video' ? q.solutionVideo : undefined,
        solutionType: q.solutionType || 'text',
      }));

      await bookService.createChapterQuestions(bookId, chapterId, questionsData);

      notify('Tạo câu hỏi thành công!', 'success');
      router.push(`/dashboard/books/${bookId}`);
    } catch (error: any) {
      console.error('Error creating questions:', error);
      notify(error.message || 'Lỗi tạo câu hỏi', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingChapter) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/books/${bookId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Thêm câu hỏi cho chương: {chapter.title}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
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

              {/* Word Import Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Import từ file Word</h3>
                  {bookId && chapterId && (
                    <WordTemplateDownload
                      bookId={bookId}
                      chapterId={chapterId}
                      chapterTitle={chapter?.title}
                    />
                  )}
                </div>
                {bookId && chapterId && (
                  <WordImport
                    bookId={bookId}
                    chapterId={chapterId}
                    onImportSuccess={(importedQuestions) => {
                      // Convert imported questions to our format
                      const formattedQuestions = importedQuestions.map((q: any) => ({
                        id: `q-${Date.now()}-${Math.random()}`,
                        content: q.content || q.question_content || '',
                        type: q.type === 1 || q.type === 'multiple_choice' ? 'multiple_choice' : 'essay',
                        options: q.options?.map((opt: any, idx: number) => ({
                          id: `opt-${Date.now()}-${idx}`,
                          text: opt.text || opt.option_content || opt.content || '',
                          isCorrect: opt.is_correct || opt.isCorrect || false,
                        })) || [],
                        explanation: q.explanation || q.explanation_content || '',
                        correctAnswer: q.correct_answer || q.correctAnswer,
                        solutionVideo: q.solution_video || q.solutionVideo,
                        solutionType: q.solution_type === 1 ? 'video' : (q.solution_type === 3 ? 'latex' : 'text') || 'text',
                      }));
                      setQuestions([...questions, ...formattedQuestions]);
                      notify(`Đã import ${formattedQuestions.length} câu hỏi từ file Word!`, 'success');
                    }}
                    onError={(error) => {
                      notify(error, 'error');
                    }}
                  />
                )}
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-medium text-gray-900">Câu hỏi {qIndex + 1}</h3>
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

                      {/* Question Type */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loại câu hỏi
                        </label>
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="multiple_choice">Trắc nghiệm</option>
                          <option value="essay">Tự luận</option>
                        </select>
                      </div>

                      {/* Question Content */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nội dung câu hỏi *
                        </label>
                        <MathEditor
                          value={question.content}
                          onChange={(value) => {
                            updateQuestion(qIndex, 'content', value);
                            setCurrentQuestionIndex(qIndex);
                          }}
                          placeholder="Nhập nội dung câu hỏi. Sử dụng công cụ bên dưới để chèn công thức toán học."
                          rows={4}
                          showPreview={showPreview}
                        />
                      </div>

                      {/* Options for Multiple Choice */}
                      {question.type === 'multiple_choice' && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Các lựa chọn *
                          </label>
                          {question.options?.map((option, optIndex) => (
                            <div key={option.id} className="flex items-start gap-2 mb-2">
                              <input
                                type="checkbox"
                                checked={option.isCorrect}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  if (updated[qIndex].options) {
                                    updated[qIndex].options![optIndex].isCorrect = e.target.checked;
                                    setQuestions(updated);
                                  }
                                }}
                                className="mt-2"
                              />
                              <MathEditor
                                value={option.text}
                                onChange={(value) => {
                                  const updated = [...questions];
                                  if (updated[qIndex].options) {
                                    updated[qIndex].options![optIndex].text = value;
                                    setQuestions(updated);
                                  }
                                }}
                                placeholder={`Lựa chọn ${optIndex + 1}`}
                                rows={2}
                                showPreview={showPreview}
                              />
                              {question.options && question.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(qIndex, optIndex)}
                                  className="text-red-600 hover:text-red-900 mt-1"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-sm text-blue-600 hover:text-blue-900 mt-2"
                          >
                            + Thêm lựa chọn
                          </button>
                        </div>
                      )}

                      {/* Correct Answer for Essay */}
                      {question.type === 'essay' && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Đáp án mẫu (tùy chọn)
                          </label>
                          <MathEditor
                            value={question.correctAnswer || ''}
                            onChange={(value) => updateQuestion(qIndex, 'correctAnswer', value)}
                            placeholder="Nhập đáp án mẫu (tùy chọn)"
                            rows={3}
                            showPreview={showPreview}
                          />
                        </div>
                      )}

                      {/* Solution Type */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loại lời giải
                        </label>
                        <select
                          value={question.solutionType || 'text'}
                          onChange={(e) => updateQuestion(qIndex, 'solutionType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="text">Văn bản</option>
                          <option value="video">Video</option>
                          <option value="latex">LaTeX</option>
                        </select>
                      </div>

                      {/* Explanation/Solution */}
                      {question.solutionType === 'video' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Video giải thích
                          </label>
                          <SolutionVideoUpload
                            questionIndex={qIndex}
                            currentVideo={question.solutionVideo}
                            onUpload={(url) => {
                              updateQuestion(qIndex, 'solutionVideo', url);
                            }}
                            notify={notify}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {question.solutionType === 'latex' ? 'Lời giải LaTeX' : 'Giải thích'}
                          </label>
                          <MathEditor
                            value={question.explanation}
                            onChange={(value) => updateQuestion(qIndex, 'explanation', value)}
                            placeholder={
                              question.solutionType === 'latex'
                                ? 'Nhập lời giải bằng LaTeX (tùy chọn)'
                                : 'Giải thích đáp án (tùy chọn). Sử dụng công cụ bên dưới để chèn công thức toán học.'
                            }
                            rows={3}
                            showPreview={showPreview}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculator */}
            {showCalculator && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Máy tính Casio</h3>
                  <button
                    type="button"
                    onClick={() => setShowCalculator(false)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Đóng
                  </button>
                </div>
                {/* Calculator component would go here */}
                <p className="text-gray-500 text-sm">Tính năng máy tính sẽ được thêm sau</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/books/${bookId}`)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || questions.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang tạo...' : 'Tạo câu hỏi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

