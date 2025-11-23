'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, BookOpenIcon, QuestionMarkCircleIcon, PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { bookService } from '@/services/bookService';
import { getInstructorBook } from '@/services/instructor';
import { useToast } from '@/components/ToastProvider';
import RichTextEditor from '@/components/RichTextEditor';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface BookChapterDetail {
  id: number;
  title: string;
  description: string;
  order_index: number;
  question_count?: number;
  isActive?: boolean;
  is_active?: boolean;
}

interface QuestionDetail {
  id: number;
  question_content: string;
  question_type: number; // 1 = multiple choice, 2 = essay
  explanation_content?: string;
  options?: QuestionOptionDetail[];
  solution?: {
    id: number;
    solution_type: number; // 1 = video, 2 = text, 3 = latex
    content: string;
    video_url?: string;
    latex_content?: string;
  };
}

interface QuestionOptionDetail {
  id: number;
  option_content: string;
  is_correct: boolean;
  order_index: number;
}

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  
  // Handle both sync and async params (Next.js 15)
  const idParam = params?.bookId;
  const bookId = idParam ? (typeof idParam === 'string' ? parseInt(idParam) : parseInt(String(idParam))) : null;

  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<BookChapterDetail[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<BookChapterDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [showEditChapterModal, setShowEditChapterModal] = useState(false);
  const [showCreateChapterModal, setShowCreateChapterModal] = useState(false);
  const [editChapterForm, setEditChapterForm] = useState({
    title: '',
    description: '',
    orderIndex: '',
  });
  const [createChapterForm, setCreateChapterForm] = useState({
    title: '',
    description: '',
    orderIndex: '',
  });

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
    console.log('BookDetailPage - params:', params, 'bookId:', bookId);
    if (!bookId || isNaN(bookId)) {
      console.error('Invalid bookId:', bookId);
      notify('ID sách không hợp lệ', 'error');
      router.push('/dashboard/books');
      return;
    }
    fetchBook();
    fetchChapters();
  }, [bookId, router, params, isInstructor]);

  const fetchBook = async () => {
    if (!bookId) return;
    try {
      setLoading(true);
      console.log('Fetching book with ID:', bookId);
      let bookData;
      if (isInstructor) {
        // Use instructor API
        bookData = await getInstructorBook(bookId);
      } else {
        // Use admin API
        bookData = await bookService.getBookAdmin(bookId);
      }
      console.log('Book data received:', bookData);
      if (!bookData) {
        notify('Không tìm thấy sách', 'error');
        router.push('/dashboard/books');
        return;
      }
      setBook(bookData);
    } catch (error: any) {
      console.error('Error fetching book:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response,
      });
      const errorMessage = error.message || 'Lỗi tải thông tin sách';
      notify(errorMessage, 'error');
      // If 404 or book not found, redirect back
      if (errorMessage.toLowerCase().includes('not found') || 
          errorMessage.includes('404') || 
          error.status === 404 ||
          error.response?.status === 404) {
        setTimeout(() => router.push('/dashboard/books'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    if (!bookId) return;
    try {
      console.log('Fetching chapters for book:', bookId);
      const chaptersData = await bookService.getChapters(bookId);
      console.log('Chapters data received:', chaptersData);
      // Map to match our interface
      setChapters(chaptersData.map((ch: any) => ({
        id: ch.id,
        title: ch.title,
        description: ch.description,
        order_index: ch.order_index || ch.orderIndex || 0,
        question_count: ch.question_count || ch.questionCount,
        isActive: ch.isActive !== undefined ? ch.isActive : (ch.is_active !== undefined ? ch.is_active : true),
        is_active: ch.is_active !== undefined ? ch.is_active : (ch.isActive !== undefined ? ch.isActive : true),
      })));
    } catch (error: any) {
      console.error('Error fetching chapters:', error);
      notify(error.message || 'Lỗi tải danh sách chương', 'error');
    }
  };

  const handleChapterClick = async (chapter: BookChapterDetail) => {
    setSelectedChapter(chapter);
    setLoadingQuestions(true);
    try {
      console.log('Fetching questions for chapter:', chapter.id, 'book:', bookId);
      // Use admin endpoint for admin dashboard
      const questionsData = await bookService.getChapterQuestions(bookId!, chapter.id, true);
      console.log('Questions data received:', questionsData);
      // Map to match our interface
      // Backend returns: { id, content, type, options: [{ id, content, is_correct, ... }], solution: { id, type, content, video_url, latex_content, ... } }
      setQuestions(questionsData.map((q: any) => ({
        id: q.id,
        question_content: q.content || q.question_content || q.questionContent || '',
        question_type: q.type || q.question_type || q.questionType || 1,
        explanation_content: q.explanation || q.explanation_content || q.explanationContent,
        options: q.options?.map((opt: any) => ({
          id: opt.id,
          option_content: opt.content || opt.option_content || opt.optionContent || '',
          is_correct: opt.is_correct !== undefined ? opt.is_correct : (opt.isCorrect !== undefined ? opt.isCorrect : false),
          order_index: opt.order_index || opt.orderIndex || 0,
        })),
        solution: q.solution ? {
          id: q.solution.id,
          solution_type: q.solution.type || q.solution.solution_type || q.solution.solutionType || 2,
          content: q.solution.content || '',
          video_url: q.solution.video_url || q.solution.videoUrl,
          latex_content: q.solution.latex_content || q.solution.latexContent,
        } : undefined,
      })));
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      notify(error.message || 'Lỗi tải câu hỏi', 'error');
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const renderMathContent = (content: string) => {
    if (!content) return null;
    
    const parts: Array<{ type: 'text' | 'block' | 'inline'; content: string }> = [];
    const blockMathRegex = /\$\$([^$]+)\$\$/g;
    const inlineMathRegex = /\$([^$]+)\$/g;
    
    let match;
    const blockMatches: Array<{ start: number; end: number; content: string }> = [];
    const inlineMatches: Array<{ start: number; end: number; content: string }> = [];
    
    while ((match = blockMathRegex.exec(content)) !== null) {
      blockMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }
    
    while ((match = inlineMathRegex.exec(content)) !== null) {
      const isInsideBlock = blockMatches.some(
        bm => match!.index >= bm.start && match!.index < bm.end
      );
      if (!isInsideBlock) {
        inlineMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
        });
      }
    }
    
    const allMatches = [
      ...blockMatches.map(m => ({ ...m, type: 'block' as const })),
      ...inlineMatches.map(m => ({ ...m, type: 'inline' as const })),
    ].sort((a, b) => a.start - b.start);
    
    let lastIndex = 0;
    for (const match of allMatches) {
      if (match.start > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.start),
        });
      }
      parts.push({
        type: match.type,
        content: match.content,
      });
      lastIndex = match.end;
    }
    
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }
    
    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }
    
    return (
      <div className="prose max-w-none">
        {parts.map((part, i) => {
          if (part.type === 'block') {
            try {
              return <BlockMath key={i} math={part.content.trim()} />;
            } catch {
              return <span key={i} className="text-red-500 text-sm">[Lỗi công thức]</span>;
            }
          } else if (part.type === 'inline') {
            try {
              return <InlineMath key={i} math={part.content.trim()} />;
            } catch {
              return <span key={i} className="text-red-500 text-sm">[Lỗi công thức]</span>;
            }
          } else {
            return <span key={i}>{part.content}</span>;
          }
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!book && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/books')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Không tìm thấy sách</p>
            <p className="text-gray-400 text-sm mb-6">Sách với ID {bookId} không tồn tại hoặc đã bị xóa</p>
            <button
              onClick={() => router.push('/dashboard/books')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return null; // Still loading or error
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/books')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <div className="flex items-start space-x-6">
            {book.cover_image && (
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-32 h-48 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              {book.description && (
                <div 
                  className="prose prose-sm max-w-none text-gray-600 mb-4"
                  dangerouslySetInnerHTML={{ __html: book.description }}
                />
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>ISBN: {book.isbn}</span>
                <span>Giá: {book.price?.toLocaleString('vi-VN')} đ</span>
                {book.category && <span>Danh mục: {book.category.name}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chapters List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BookOpenIcon className="h-6 w-6 mr-2" />
                Danh sách chương ({chapters.length})
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {chapters.length === 0 ? (
                  <p className="text-gray-500 text-sm">Chưa có chương nào</p>
                ) : (
                  chapters.map((chapter) => {
                    const isInactive = chapter.isActive === false || chapter.is_active === false;
                    return (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterClick(chapter)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedChapter?.id === chapter.id
                          ? isInactive
                            ? 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : isInactive
                            ? 'border-red-300 bg-red-50/50 hover:border-red-400 hover:bg-red-100'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{chapter.title}</div>
                        {isInactive && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                            Đã vô hiệu hóa
                          </span>
                        )}
                      </div>
                      {chapter.description && (
                        <div 
                          className="text-xs text-gray-500 mt-1 line-clamp-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: chapter.description.replace(/<[^>]*>/g, '').substring(0, 100) + (chapter.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : '')
                          }}
                        />
                      )}
                      {chapter.question_count !== undefined && (
                        <div className="text-xs text-blue-600 mt-1">
                          {chapter.question_count} câu hỏi
                        </div>
                      )}
                    </button>
                    );
                  })
                )}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setCreateChapterForm({
                        title: '',
                        description: '',
                        orderIndex: String(chapters.length + 1),
                      });
                      setShowCreateChapterModal(true);
                    }}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Thêm chương
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter Details */}
          <div className="lg:col-span-2">
            {selectedChapter ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold">{selectedChapter.title}</h2>
                    {(selectedChapter.isActive === false || selectedChapter.is_active === false) && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded">
                        Đã vô hiệu hóa
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditChapterForm({
                          title: selectedChapter.title,
                          description: selectedChapter.description,
                          orderIndex: String(selectedChapter.order_index),
                        });
                        setShowEditChapterModal(true);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium flex items-center gap-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Chỉnh sửa
                    </button>
                    {(selectedChapter.isActive !== false && selectedChapter.is_active !== false) ? (
                      <button
                        onClick={async () => {
                          if (confirm('Bạn có chắc chắn muốn vô hiệu hóa chương này?')) {
                            try {
                              await bookService.deleteChapter(bookId, selectedChapter.id);
                              notify('Vô hiệu hóa chương thành công', 'success');
                              await fetchChapters();
                              setSelectedChapter(null);
                            } catch (error: any) {
                              notify(error.message || 'Lỗi vô hiệu hóa chương', 'error');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Vô hiệu hóa
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (confirm('Bạn có chắc chắn muốn khôi phục chương này?')) {
                            try {
                              await bookService.restoreChapter(bookId, selectedChapter.id);
                              notify('Khôi phục chương thành công', 'success');
                              await fetchChapters();
                              // Refresh selected chapter
                              const updatedChapters = await bookService.getChapters(bookId);
                              const updatedChapter = updatedChapters.find((ch: any) => ch.id === selectedChapter.id);
                              if (updatedChapter) {
                                setSelectedChapter({
                                  id: updatedChapter.id,
                                  title: updatedChapter.title,
                                  description: updatedChapter.description,
                                  order_index: updatedChapter.order_index || updatedChapter.orderIndex || 0,
                                  question_count: updatedChapter.question_count || updatedChapter.questionCount,
                                  isActive: updatedChapter.isActive !== undefined ? updatedChapter.isActive : (updatedChapter.is_active !== undefined ? updatedChapter.is_active : true),
                                  is_active: updatedChapter.is_active !== undefined ? updatedChapter.is_active : (updatedChapter.isActive !== undefined ? updatedChapter.isActive : true),
                                });
                              }
                            } catch (error: any) {
                              notify(error.message || 'Lỗi khôi phục chương', 'error');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        Khôi phục
                      </button>
                    )}
                  </div>
                </div>
                {selectedChapter.description && (
                  <div 
                    className="prose prose-sm max-w-none text-gray-600 mb-6 rich-text-content"
                    dangerouslySetInnerHTML={{ __html: selectedChapter.description }}
                  />
                )}

                {loadingQuestions ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Chưa có câu hỏi nào</p>
                    {(selectedChapter.isActive !== false && selectedChapter.is_active !== false) && (
                      <button
                        onClick={() => router.push(`/dashboard/books/${bookId}/chapters/${selectedChapter.id}/questions/create`)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2 mx-auto"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Thêm câu hỏi đầu tiên
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center">
                      <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                      Câu hỏi ({questions.length})
                    </h3>
                    {questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            Câu {index + 1}: {question.question_type === 1 ? 'Trắc nghiệm' : 'Tự luận'}
                          </h4>
                        </div>

                        <div className="mb-4">{renderMathContent(question.question_content)}</div>

                        {question.question_type === 1 && question.options && (
                          <div className="space-y-2 mb-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Các lựa chọn:</div>
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className={`p-2 rounded border ${
                                  option.is_correct
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start">
                                  <span className="mr-2">
                                    {option.is_correct ? '✓' : '○'}
                                  </span>
                                  <div className="flex-1">{renderMathContent(option.option_content)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Hiển thị "Giải thích" nếu có (chỉ cho tự luận) */}
                        {question.question_type === 2 && question.explanation_content && (
                          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="text-sm font-medium text-blue-900 mb-1">Giải thích:</div>
                            <div className="text-sm text-blue-800">
                              {renderMathContent(question.explanation_content)}
                            </div>
                          </div>
                        )}

                        {/* Hiển thị "Lời giải" nếu có */}
                        {question.solution && (
                          <div className="p-3 bg-purple-50 rounded border border-purple-200">
                            <div className="text-sm font-medium text-purple-900 mb-2">Lời giải:</div>
                            {question.solution.solution_type === 1 && question.solution.video_url && (
                              <div className="mb-2">
                                <video
                                  controls
                                  className="w-full max-w-md rounded"
                                  src={question.solution.video_url}
                                >
                                  Trình duyệt không hỗ trợ video.
                                </video>
                              </div>
                            )}
                            {question.solution.solution_type === 2 && question.solution.content && (
                              <div className="text-sm text-purple-800 mb-2">
                                {renderMathContent(question.solution.content)}
                              </div>
                            )}
                            {question.solution.solution_type === 3 && question.solution.latex_content && (
                              <div className="text-sm text-purple-800">
                                {renderMathContent(question.solution.latex_content)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {(selectedChapter.isActive !== false && selectedChapter.is_active !== false) && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                          onClick={() => router.push(`/dashboard/books/${bookId}/chapters/${selectedChapter.id}/questions/create`)}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <PlusIcon className="h-5 w-5" />
                          Thêm câu hỏi
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chọn một chương để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Chapter Modal */}
      {showCreateChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">Thêm chương mới</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!bookId) return;
                if (!createChapterForm.title || !createChapterForm.description || !createChapterForm.description.trim()) {
                  notify('Vui lòng điền đầy đủ thông tin', 'error');
                  return;
                }
                try {
                  await bookService.createChapter(bookId, {
                    title: createChapterForm.title,
                    description: createChapterForm.description,
                    orderIndex: createChapterForm.orderIndex ? parseInt(createChapterForm.orderIndex) : undefined,
                  });
                  notify('Tạo chương thành công', 'success');
                  setShowCreateChapterModal(false);
                  setCreateChapterForm({
                    title: '',
                    description: '',
                    orderIndex: String(chapters.length + 1),
                  });
                  await fetchChapters();
                } catch (error: any) {
                  notify(error.message || 'Lỗi tạo chương', 'error');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                    <input
                      type="text"
                      required
                      value={createChapterForm.title}
                      onChange={(e) => setCreateChapterForm({ ...createChapterForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                    <RichTextEditor
                      value={createChapterForm.description}
                      onChange={(value) => setCreateChapterForm({ ...createChapterForm, description: value })}
                      placeholder="Nhập mô tả chương..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                    <input
                      type="number"
                      min="1"
                      value={createChapterForm.orderIndex}
                      onChange={(e) => setCreateChapterForm({ ...createChapterForm, orderIndex: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateChapterModal(false);
                      setCreateChapterForm({
                        title: '',
                        description: '',
                        orderIndex: String(chapters.length + 1),
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Tạo chương
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Chapter Modal */}
      {showEditChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">Chỉnh sửa chương</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedChapter) return;
                try {
                  await bookService.updateChapter(bookId, selectedChapter.id, {
                    title: editChapterForm.title,
                    description: editChapterForm.description,
                    orderIndex: editChapterForm.orderIndex ? parseInt(editChapterForm.orderIndex) : undefined,
                  });
                  notify('Cập nhật chương thành công', 'success');
                  setShowEditChapterModal(false);
                  await fetchChapters();
                  // Refresh selected chapter
                  const updatedChapter = chapters.find(c => c.id === selectedChapter.id);
                  if (updatedChapter) {
                    setSelectedChapter(updatedChapter);
                  }
                } catch (error: any) {
                  notify(error.message || 'Lỗi cập nhật chương', 'error');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                    <input
                      type="text"
                      required
                      value={editChapterForm.title}
                      onChange={(e) => setEditChapterForm({ ...editChapterForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                    <RichTextEditor
                      value={editChapterForm.description}
                      onChange={(value) => setEditChapterForm({ ...editChapterForm, description: value })}
                      placeholder="Nhập mô tả chương..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                    <input
                      type="number"
                      min="1"
                      value={editChapterForm.orderIndex}
                      onChange={(e) => setEditChapterForm({ ...editChapterForm, orderIndex: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditChapterModal(false)}
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
      )}
    </div>
  );
}

