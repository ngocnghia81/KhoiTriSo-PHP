'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { bookService } from '@/services/bookService';
import { useToast } from '@/components/ToastProvider';
import MathQuestionEditor from '@/components/MathQuestionEditor';
import SampleQuestionsButton from '@/components/SampleQuestionsButton';
import SolutionVideoUpload from '@/components/SolutionVideoUpload';
import { sampleQuestions, SampleQuestion } from '@/data/sampleQuestions';
import 'katex/dist/katex.min.css';
// @ts-ignore - react-katex doesn't have type definitions
import { BlockMath } from 'react-katex';

export default function CreateChapterPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  const bookId = params?.bookId ? parseInt(params.bookId as string) : null;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderIndex: '',
  });

  const [questions, setQuestions] = useState<Array<{
    id: string;
    content: string;
    type: 'multiple_choice' | 'essay';
    options?: Array<{ id: string; text: string; isCorrect: boolean }>;
    correctAnswer?: string;
    explanation?: string;
    solution?: string;
    solutionVideo?: string;
    solutionType?: 'text' | 'video' | 'latex';
  }>>([]);

  const [showPreview, setShowPreview] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!bookId) {
      router.push('/dashboard/books');
    }
  }, [bookId, router]);

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      content: '',
      type: 'multiple_choice' as const,
      options: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false },
      ],
      solution: '',
      solutionType: 'text' as const,
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const addQuestionFromSample = (sample: SampleQuestion) => {
    const newQuestion = {
      id: Date.now().toString(),
      content: sample.content,
      type: sample.type,
      options: sample.options?.map((opt: { text: string; isCorrect: boolean }, idx: number) => ({
        id: (idx + 1).toString(),
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: sample.explanation || undefined,
      solution: sample.explanation || '',
      correctAnswer: sample.correctAnswer || '',
      solutionType: 'text' as const,
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
    notify('Đã chèn câu hỏi mẫu', 'success');
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    if (field.includes('.')) {
      const [parent, child, subChild] = field.split('.');
      if (subChild) {
        (updated[index] as any)[parent][child][subChild] = value;
      } else {
        (updated[index] as any)[parent][child] = value;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options!.push({
        id: Date.now().toString(),
        text: '',
        isCorrect: false,
      });
      setQuestions(updated);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options!.splice(optionIndex, 1);
      setQuestions(updated);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (currentQuestionIndex === index) {
      setCurrentQuestionIndex(null);
    } else if (currentQuestionIndex !== null && currentQuestionIndex > index) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const insertMathFormula = (formula: string, field: 'content' | 'explanation' = 'content') => {
    if (currentQuestionIndex === null) {
      notify('Vui lòng chọn một câu hỏi để chèn công thức', 'info');
      return;
    }
    const updated = [...questions];
    const currentContent = updated[currentQuestionIndex][field];
    // Nếu formula đã có $$ thì không thêm nữa
    const mathBlock = formula.startsWith('$$') && formula.endsWith('$$') 
      ? formula 
      : `$$${formula}$$`;
    updated[currentQuestionIndex][field] = currentContent + (currentContent ? ' ' : '') + mathBlock;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId) return;

    if (!formData.title || !formData.description) {
      notify('Vui lòng điền đầy đủ thông tin chương', 'error');
      return;
    }

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
      // Tạo chương trước
      const chapter = await bookService.createChapter(bookId, {
        title: formData.title,
        description: formData.description,
        orderIndex: formData.orderIndex ? parseInt(formData.orderIndex) : undefined,
      });

      // Tạo các câu hỏi cho chương này
      const questionsData = questions.map(q => ({
        content: q.content,
        type: q.type,
        options: q.type === 'multiple_choice' ? q.options : undefined,
        explanation: q.type === 'essay' ? (q.explanation || undefined) : undefined,
        correctAnswer: q.type === 'essay' ? q.correctAnswer : undefined,
        solution: q.solutionType === 'video' ? undefined : (q.solution || undefined),
        solutionVideo: q.solutionType === 'video' ? q.solutionVideo : undefined,
        solutionType: q.solutionType || 'text',
      }));

      await bookService.createChapterQuestions(bookId, chapter.id, questionsData);

      notify('Tạo chương và câu hỏi thành công!', 'success');
      router.push(`/dashboard/books`);
    } catch (error: any) {
      console.error('Error creating chapter:', error);
      notify(error.message || 'Lỗi tạo chương', 'error');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Tạo chương mới</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chapter Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Thông tin chương</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề chương *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <MathQuestionEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Nhập mô tả chương. Sử dụng các nút trên toolbar để thêm công thức toán học..."
                    height={200}
                    label="Mô tả *"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự chương
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Để trống để tự động tăng"
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Câu hỏi ({questions.length})</h2>
                <div className="flex space-x-2">
                  <SampleQuestionsButton onInsert={addQuestionFromSample} />
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Thêm câu hỏi trống
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {questions.map((question, qIndex) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                      <h3 className={`font-medium ${currentQuestionIndex === qIndex ? 'text-blue-600' : 'text-gray-900'}`}>
                        Câu hỏi {qIndex + 1}
                        {currentQuestionIndex === qIndex && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Đang soạn</span>
                        )}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentQuestionIndex(qIndex);
                            notify('Đã chọn câu hỏi để soạn. Bạn có thể sử dụng máy tính để chèn công thức.', 'success');
                          }}
                          className={`text-sm px-3 py-1 rounded ${
                            currentQuestionIndex === qIndex
                              ? 'bg-blue-600 text-white'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {currentQuestionIndex === qIndex ? 'Đang soạn' : 'Chọn để soạn'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Question Type */}
                      <div>
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
                      <div>
                        <MathQuestionEditor
                          value={question.content}
                          onChange={(value) => {
                            updateQuestion(qIndex, 'content', value);
                            setCurrentQuestionIndex(qIndex);
                          }}
                          placeholder="Nhập nội dung câu hỏi. Sử dụng các nút trên toolbar để thêm công thức toán học..."
                          height={200}
                          label="Nội dung câu hỏi *"
                        />
                      </div>

                      {/* Options for Multiple Choice */}
                      {question.type === 'multiple_choice' && question.options && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Các lựa chọn *
                          </label>
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => (
                              <div key={option.id} className="flex items-start space-x-2">
                                <input
                                  type="checkbox"
                                  checked={option.isCorrect}
                                  onChange={(e) => {
                                    const updated = [...questions];
                                    updated[qIndex].options![oIndex].isCorrect = e.target.checked;
                                    setQuestions(updated);
                                  }}
                                  className="mt-2"
                                />
                                <div className="flex-1">
                                  <MathQuestionEditor
                                    value={option.text}
                                    onChange={(value) => {
                                      const updated = [...questions];
                                      updated[qIndex].options![oIndex].text = value;
                                      setQuestions(updated);
                                    }}
                                    placeholder={`Lựa chọn ${oIndex + 1}`}
                                    height={150}
                                  />
                                </div>
                                {question.options!.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(qIndex, oIndex)}
                                    className="px-2 py-1 text-red-600 hover:text-red-800"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addOption(qIndex)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              + Thêm lựa chọn
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Correct Answer for Essay */}
                      {question.type === 'essay' && (
                        <div>
                          <MathQuestionEditor
                            value={question.correctAnswer || ''}
                            onChange={(value) => updateQuestion(qIndex, 'correctAnswer', value)}
                            placeholder="Nhập đáp án mẫu (tùy chọn). Sử dụng các nút trên toolbar để thêm công thức toán học..."
                            height={200}
                            label="Đáp án mẫu (tùy chọn)"
                          />
                        </div>
                      )}

                      {/* Giải thích - chỉ cho tự luận */}
                      {question.type === 'essay' && (
                        <div className="mb-4">
                          <MathQuestionEditor
                            value={question.explanation || ''}
                            onChange={(value) => updateQuestion(qIndex, 'explanation', value)}
                            placeholder="Nhập giải thích cho câu hỏi tự luận (tùy chọn). Sử dụng các nút trên toolbar để thêm công thức toán học."
                            height={200}
                            label="Giải thích (tùy chọn)"
                          />
                        </div>
                      )}

                      {/* Solution Type */}
                      <div>
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

                      {/* Solution */}
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
                          <MathQuestionEditor
                            value={question.solution || ''}
                            onChange={(value) => updateQuestion(qIndex, 'solution', value)}
                            placeholder="Nhập lời giải (tùy chọn). Sử dụng các nút trên toolbar để thêm công thức toán học, phân số, căn..."
                            height={250}
                            label={question.solutionType === 'latex' ? 'Lời giải LaTeX' : 'Lời giải'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard/books')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu chương'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tools */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-4">Công cụ</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {showPreview ? <EyeSlashIcon className="h-5 w-5 mr-2" /> : <EyeIcon className="h-5 w-5 mr-2" />}
                  {showPreview ? 'Ẩn preview' : 'Hiện preview'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <CalculatorIcon className="h-5 w-5 mr-2" />
                  {showCalculator ? 'Ẩn máy tính' : 'Máy tính Casio'}
                </button>
              </div>
            </div>

            {/* Calculator */}
            {showCalculator && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">Máy tính Casio</h3>
                {currentQuestionIndex !== null ? (
                  <div className="mb-2 text-xs text-gray-600">
                    Đang soạn: Câu hỏi {currentQuestionIndex + 1}
                  </div>
                ) : (
                  <div className="mb-2 text-xs text-yellow-600">
                    Vui lòng chọn một câu hỏi để chèn công thức
                  </div>
                )}
                <CasioCalculator onInsert={(formula) => insertMathFormula(formula, 'content')} />
              </div>
            )}

            {/* Math Help */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-4">Hướng dẫn LaTeX</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Phân số:</strong> <code className="bg-gray-100 px-1 rounded">{`\\frac{a}{b}`}</code></p>
                <p><strong>Chỉ số trên:</strong> <code className="bg-gray-100 px-1 rounded">x^2</code></p>
                <p><strong>Chỉ số dưới:</strong> <code className="bg-gray-100 px-1 rounded">x_1</code></p>
                <p><strong>Căn bậc 2:</strong> <code className="bg-gray-100 px-1 rounded">{`\\sqrt{x}`}</code></p>
                <p><strong>Căn bậc n:</strong> <code className="bg-gray-100 px-1 rounded">{`\\sqrt[n]{x}`}</code></p>
                <p><strong>Tích phân:</strong> <code className="bg-gray-100 px-1 rounded">{`\\int_a^b f(x)dx`}</code></p>
                <p><strong>Giới hạn:</strong> <code className="bg-gray-100 px-1 rounded">{`\\lim_{x \\to \\infty}`}</code></p>
                <p className="mt-2 text-xs text-gray-500">
                  Sử dụng <code className="bg-gray-100 px-1 rounded">$$...$$</code> để bao quanh công thức toán học
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Casio Calculator Component
function CasioCalculator({ onInsert }: { onInsert: (formula: string) => void }) {
  const [display, setDisplay] = useState('0');
  const [latexInput, setLatexInput] = useState('');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [showLatexInput, setShowLatexInput] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperation = (op: string) => {
    const inputValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    
    setWaitingForNewValue(true);
    setOperation(op);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '×': return prev * current;
      case '÷': return prev / current;
      case '^': return Math.pow(prev, current);
      default: return current;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const inputValue = parseFloat(display);
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleFunction = (func: string) => {
    const value = parseFloat(display);
    let result: number;
    let latex: string;
    
    switch (func) {
      case 'sin': result = Math.sin(value * Math.PI / 180); latex = `\\sin(${value}°)`; break;
      case 'cos': result = Math.cos(value * Math.PI / 180); latex = `\\cos(${value}°)`; break;
      case 'tan': result = Math.tan(value * Math.PI / 180); latex = `\\tan(${value}°)`; break;
      case 'ln': result = Math.log(value); latex = `\\ln(${value})`; break;
      case 'log': result = Math.log10(value); latex = `\\log(${value})`; break;
      case 'sqrt': result = Math.sqrt(value); latex = `\\sqrt{${value}}`; break;
      case 'square': result = value * value; latex = `${value}^2`; break;
      default: return;
    }
    
    setDisplay(String(result));
    onInsert(latex);
  };

  const buttons = [
    [{ label: 'C', action: handleClear, className: 'bg-red-500 text-white' }],
    [
      { label: 'sin', action: () => handleFunction('sin'), className: 'bg-gray-200' },
      { label: 'cos', action: () => handleFunction('cos'), className: 'bg-gray-200' },
      { label: 'tan', action: () => handleFunction('tan'), className: 'bg-gray-200' },
      { label: '÷', action: () => handleOperation('÷'), className: 'bg-orange-500 text-white' },
    ],
    [
      { label: 'ln', action: () => handleFunction('ln'), className: 'bg-gray-200' },
      { label: 'log', action: () => handleFunction('log'), className: 'bg-gray-200' },
      { label: '√', action: () => handleFunction('sqrt'), className: 'bg-gray-200' },
      { label: '×', action: () => handleOperation('×'), className: 'bg-orange-500 text-white' },
    ],
    [
      { label: 'x²', action: () => handleFunction('square'), className: 'bg-gray-200' },
      { label: '7', action: () => handleNumber('7') },
      { label: '8', action: () => handleNumber('8') },
      { label: '9', action: () => handleNumber('9') },
      { label: '-', action: () => handleOperation('-'), className: 'bg-orange-500 text-white' },
    ],
    [
      { label: '^', action: () => handleOperation('^'), className: 'bg-gray-200' },
      { label: '4', action: () => handleNumber('4') },
      { label: '5', action: () => handleNumber('5') },
      { label: '6', action: () => handleNumber('6') },
      { label: '+', action: () => handleOperation('+'), className: 'bg-orange-500 text-white' },
    ],
    [
      { label: '(', action: () => setDisplay(display + '(') },
      { label: '1', action: () => handleNumber('1') },
      { label: '2', action: () => handleNumber('2') },
      { label: '3', action: () => handleNumber('3') },
      { label: '=', action: handleEquals, className: 'bg-orange-500 text-white row-span-2' },
    ],
    [
      { label: ')', action: () => setDisplay(display + ')') },
      { label: '0', action: () => handleNumber('0'), className: 'col-span-2' },
      { label: '.', action: () => setDisplay(display + '.') },
    ],
  ];

  return (
    <div className="space-y-2">
      <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-right text-xl font-bold">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {buttons.flat().map((btn, i) => (
          <button
            key={i}
            type="button"
            onClick={btn.action}
            className={`p-3 rounded-md border border-gray-300 hover:bg-gray-100 font-semibold ${btn.className || 'bg-white'}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowLatexInput(!showLatexInput)}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
        >
          {showLatexInput ? 'Ẩn' : 'Nhập LaTeX trực tiếp'}
        </button>
        
        {showLatexInput && (
          <div className="space-y-2">
            <textarea
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              placeholder="Nhập công thức LaTeX, ví dụ: \\frac{a}{b}, x^2, \\sqrt{x}"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
              rows={3}
            />
            {latexInput && (
              <div className="p-2 bg-gray-50 rounded border">
                <BlockMath math={latexInput} />
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (latexInput) {
                  onInsert(latexInput);
                  setLatexInput('');
                }
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Chèn công thức
            </button>
          </div>
        )}
        
        <button
          type="button"
          onClick={() => onInsert(display)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Chèn kết quả số
        </button>
      </div>
    </div>
  );
}

