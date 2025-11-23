'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { httpClient } from '@/lib/http-client';
import {
  BookOpenIcon,
  ArrowLeftIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Chapter {
  id: number;
  title: string;
  description: string;
  order_index: number;
}

interface QuestionOption {
  id: number;
  content: string;
  image?: string;
  is_correct: boolean;
  points: number;
  explanation?: string;
  order_index: number;
}

interface Solution {
  id: number;
  type: number; // 1 = video, 2 = text, 3 = latex, 4 = image
  content: string;
  video_url?: string;
  image_url?: string;
  latex_content?: string;
}

interface Question {
  id: number;
  content: string;
  type: number; // 1 = multiple choice, 2 = essay
  difficulty: number;
  points: number;
  explanation?: string;
  image?: string;
  video_url?: string;
  order_index: number;
  options: QuestionOption[];
  solution: Solution | null;
}

export default function ChapterQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const chapterId = params.chapterId as string;
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showSolutions, setShowSolutions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchChapterQuestions();
  }, [bookId, chapterId]);

  const fetchChapterQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await httpClient.get(`books/${bookId}/chapters/${chapterId}/questions`);
      
      if (response.ok && response.data) {
        const data = response.data as any;
        setChapter(data.chapter);
        setQuestions(data.questions || []);
      } else {
        const errorData = response.error as any;
        setError(errorData?.message || 'Không thể tải câu hỏi. Vui lòng kiểm tra bạn đã mua sách chưa.');
      }
    } catch (err: any) {
      console.error('Error fetching chapter questions:', err);
      setError('Có lỗi xảy ra khi tải câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const renderMathContent = (content: string) => {
    if (!content) return null;
    
    // First, auto-detect and wrap LaTeX commands that are not already wrapped
    let processedContent = content;
    
    // Common LaTeX patterns to auto-wrap
    const latexPatterns = [
      // Fractions: \frac{...}{...}
      { regex: /\\frac\{[^}]+\}\{[^}]+\}/g, wrapper: '$' },
      // Square root: \sqrt{...} or \sqrt[n]{...}
      { regex: /\\sqrt(?:\[[^\]]+\])?\{[^}]+\}/g, wrapper: '$' },
      // Math symbols: \mathbb{...}, \text{...}, etc.
      { regex: /\\(?:mathbb|text|textbf|textit|mathrm)\{[^}]+\}/g, wrapper: '$' },
      // Greek letters: \alpha, \beta, etc.
      { regex: /\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta|Iota|Kappa|Lambda|Mu|Nu|Xi|Pi|Rho|Sigma|Tau|Upsilon|Phi|Chi|Psi|Omega)\b/g, wrapper: '$' },
      // Math operators: \cdot, \times, \div, etc.
      { regex: /\\(?:cdot|times|div|pm|mp|leq|geq|neq|approx|equiv|infty|sum|prod|int|lim|sin|cos|tan|log|ln|exp)\b/g, wrapper: '$' },
      // Subscripts and superscripts with special chars: x_1, x^2, etc.
      { regex: /(?:[a-zA-Z0-9]|\\[a-zA-Z]+)(?:[_^]\{[^}]+\}|[_^][a-zA-Z0-9])+/g, wrapper: '$' },
      // Underbrace: \underbrace{...}_{...}
      { regex: /\\underbrace\{[^}]+\}(?:_\{[^}]+\})?/g, wrapper: '$' },
    ];
    
    // Check if content already has LaTeX delimiters
    const hasDelimiters = /\$\$[\s\S]+?\$\$|\$[^$]+?\$/.test(content);
    
    if (!hasDelimiters) {
      // Auto-wrap LaTeX patterns
      for (const { regex, wrapper } of latexPatterns) {
        processedContent = processedContent.replace(regex, (match) => {
          // Don't wrap if already inside delimiters
          const beforeMatch = processedContent.substring(0, processedContent.indexOf(match));
          const afterMatch = processedContent.substring(processedContent.indexOf(match) + match.length);
          const openDelimiters = (beforeMatch.match(/\$/g) || []).length;
          const isInsideDelimiters = openDelimiters % 2 === 1;
          
          if (isInsideDelimiters) return match;
          return `${wrapper}${match}${wrapper}`;
        });
      }
    }
    
    // Now, replace LaTeX math in the HTML string with placeholders
    const mathPlaceholders: Array<{ id: string; type: 'block' | 'inline'; content: string }> = [];
    let placeholderIndex = 0;
    
    // Find and replace block math: $$...$$
    processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, (match, mathContent) => {
      const id = `__MATH_BLOCK_${placeholderIndex++}__`;
      mathPlaceholders.push({ id, type: 'block', content: mathContent.trim() });
      return id;
    });
    
    // Find and replace inline math: $...$ (but not $$...$$)
    processedContent = processedContent.replace(/\$([^$\n]+)\$/g, (match, mathContent) => {
      // Skip if it's part of a block math (shouldn't happen after first replace, but just in case)
      if (match.includes('__MATH_BLOCK_')) return match;
      const id = `__MATH_INLINE_${placeholderIndex++}__`;
      mathPlaceholders.push({ id, type: 'inline', content: mathContent.trim() });
      return id;
    });
    
    // Render HTML with placeholders
    const renderWithMath = (html: string) => {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let partIndex = 0; // Unique counter for keys
      
      // Find all placeholders
      const placeholderRegex = /__(MATH_(?:BLOCK|INLINE)_\d+)__/g;
      let match;
      const matches: Array<{ start: number; end: number; id: string }> = [];
      
      placeholderRegex.lastIndex = 0;
      while ((match = placeholderRegex.exec(html)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          id: match[1],
        });
      }
      
      if (matches.length === 0) {
        // No math found, just render HTML
        return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
      }
      
      // Split HTML and insert math components
      for (const mathMatch of matches) {
        // Add HTML before math
        if (mathMatch.start > lastIndex) {
          const htmlBefore = html.substring(lastIndex, mathMatch.start);
          if (htmlBefore) {
            parts.push(
              <span key={`part-${partIndex++}`} dangerouslySetInnerHTML={{ __html: htmlBefore }} />
            );
          }
        }
        
        // Find and render math
        const placeholder = mathPlaceholders.find(p => p.id === `__${mathMatch.id}__`);
        if (placeholder) {
          if (placeholder.type === 'block') {
            try {
              parts.push(<BlockMath key={`part-${partIndex++}`} math={placeholder.content} />);
            } catch {
              parts.push(<span key={`part-${partIndex++}`} className="text-red-500 text-sm">[Lỗi công thức]</span>);
            }
          } else {
            try {
              parts.push(<InlineMath key={`part-${partIndex++}`} math={placeholder.content} />);
            } catch {
              parts.push(<span key={`part-${partIndex++}`} className="text-red-500 text-sm">[Lỗi công thức]</span>);
            }
          }
        }
        
        lastIndex = mathMatch.end;
      }
      
      // Add remaining HTML
      if (lastIndex < html.length) {
        const htmlAfter = html.substring(lastIndex);
        if (htmlAfter) {
          parts.push(
            <span key={`part-${partIndex++}`} dangerouslySetInnerHTML={{ __html: htmlAfter }} />
          );
        }
      }
      
      return <div className="prose prose-sm max-w-none">{parts}</div>;
    };
    
    return renderWithMath(processedContent);
  };

  const handleSelectAnswer = (questionId: number, optionId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const toggleSolution = (questionId: number) => {
    setShowSolutions(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Dễ';
      case 2: return 'Trung bình';
      case 3: return 'Khó';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/books/${bookId}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Quay lại trang sách
          </Link>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalQuestions = questions.length;
  const totalPoints = questions.reduce((sum, q) => {
    const points = typeof q.points === 'number' ? q.points : parseFloat(q.points) || 0;
    return sum + points;
  }, 0);
  const averageDifficulty = questions.length > 0 
    ? Math.round(questions.reduce((sum, q) => {
        const difficulty = typeof q.difficulty === 'number' ? q.difficulty : parseInt(q.difficulty) || 0;
        return sum + difficulty;
      }, 0) / questions.length)
    : 0;
  const multipleChoiceCount = questions.filter(q => q.type === 1).length;
  const essayCount = questions.filter(q => q.type === 2).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/books/${bookId}/read`}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{chapter?.title}</h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {totalQuestions} câu hỏi
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {chapter?.description && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Nội dung chương</h2>
            <div className="text-gray-700">
              {renderMathContent(chapter.description)}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng số câu hỏi</p>
              <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng điểm</p>
              <p className="text-2xl font-bold text-gray-900">{totalPoints.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Độ khó</p>
              <p className="text-2xl font-bold text-gray-900">
                <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(averageDifficulty)}`}>
                  {getDifficultyText(averageDifficulty)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Loại câu hỏi</p>
              <p className="text-sm text-gray-900">
                {multipleChoiceCount > 0 && <span className="mr-2">Trắc nghiệm: {multipleChoiceCount}</span>}
                {essayCount > 0 && <span>Tự luận: {essayCount}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyText(question.difficulty)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {(typeof question.points === 'number' ? question.points : parseFloat(question.points) || 0).toFixed(2)} điểm
                      </span>
                      {question.type === 1 && (
                        <span className="text-sm text-gray-500">• Trắc nghiệm</span>
                      )}
                      {question.type === 2 && (
                        <span className="text-sm text-gray-500">• Tự luận</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="mb-6">
                <div className="prose max-w-none mb-4">
                  <div className="text-gray-900 font-medium text-lg">
                    <strong>Câu hỏi {index + 1}:</strong> {renderMathContent(question.content)}
                  </div>
                </div>
                
                {question.image && (
                  <div className="mt-4">
                    <Image
                      src={question.image}
                      alt="Question image"
                      width={600}
                      height={400}
                      className="rounded-lg"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              {/* Options (for multiple choice) */}
              {question.type === 1 && question.options.length > 0 && (
                <div className="space-y-3 mb-6">
                  {question.options.map((option, optIndex) => {
                    const isSelected = selectedAnswers[question.id] === option.id;
                    const isCorrect = option.is_correct;
                    const showAnswer = showSolutions[question.id];
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectAnswer(question.id, option.id)}
                        disabled={showAnswer}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? showAnswer
                              ? isCorrect
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${showAnswer && isCorrect ? 'ring-2 ring-green-500' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? showAnswer && isCorrect
                                ? 'border-green-500 bg-green-500 text-white'
                                : showAnswer && !isCorrect
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-300'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-900">
                              <strong>{String.fromCharCode(65 + optIndex)}.</strong>
                              {' '}
                              {renderMathContent(option.content)}
                              {showAnswer && (
                                <>
                                  {option.is_correct ? (
                                    <span className="ml-2 text-green-600 font-semibold">Đây là đáp án đúng</span>
                                  ) : (
                                    <span className="ml-2 text-gray-500">Không đúng</span>
                                  )}
                                </>
                              )}
                            </div>
                            {option.image && (
                              <div className="mt-2">
                                <Image
                                  src={option.image}
                                  alt="Option image"
                                  width={300}
                                  height={200}
                                  className="rounded"
                                  unoptimized
                                />
                              </div>
                            )}
                            {showAnswer && option.explanation && (
                              <div className="mt-2 text-sm text-gray-600 italic">
                                {renderMathContent(option.explanation)}
                              </div>
                            )}
                          </div>
                          {showAnswer && isCorrect && (
                            <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                          )}
                          {showAnswer && isSelected && !isCorrect && (
                            <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Essay Question Input */}
              {question.type === 2 && (
                <div className="mb-6">
                  <textarea
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={6}
                  />
                </div>
              )}

              {/* Solution */}
              {question.solution && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => toggleSolution(question.id)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
                  >
                    <LightBulbIcon className="h-5 w-5" />
                    <span>{showSolutions[question.id] ? 'Ẩn' : 'Xem'} lời giải</span>
                  </button>

                  {showSolutions[question.id] && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      {question.solution.type === 1 && question.solution.video_url && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <PlayCircleIcon className="h-5 w-5 mr-2" />
                            Video giải bài
                          </h4>
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <iframe
                              src={question.solution.video_url.replace('watch?v=', 'embed/')}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}

                      {question.solution.type === 2 && question.solution.content && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Lời giải
                          </h4>
                          <div className="text-gray-700">
                            {renderMathContent(question.solution.content)}
                          </div>
                        </div>
                      )}

                      {question.solution.type === 3 && question.solution.latex_content && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <AcademicCapIcon className="h-5 w-5 mr-2" />
                            Lời giải (LaTeX)
                          </h4>
                          <div className="bg-white p-4 rounded border">
                            <div className="prose max-w-none">
                              {question.solution.latex_content.includes('\\lim') || 
                               question.solution.latex_content.includes('\\frac') ||
                               question.solution.latex_content.includes('\\sum') ||
                               question.solution.latex_content.includes('\\int') ||
                               question.solution.latex_content.includes('\\begin') ? (
                                <BlockMath math={question.solution.latex_content} />
                              ) : (
                                <InlineMath math={question.solution.latex_content} />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {question.solution.type === 4 && question.solution.image_url && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Hình ảnh giải bài
                          </h4>
                          <Image
                            src={question.solution.image_url}
                            alt="Solution"
                            width={600}
                            height={400}
                            className="rounded-lg"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {question.explanation && showSolutions[question.id] && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Giải thích</h4>
                  <div className="text-gray-700">{renderMathContent(question.explanation)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

