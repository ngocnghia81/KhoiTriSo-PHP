'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { httpClient } from '@/lib/http-client';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import {
  BookOpenIcon,
  ArrowLeftIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

interface Chapter {
  id: number;
  title: string;
  description: string;
  order_index: number;
  question_count: number;
}

interface Book {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  author?: {
    name: string;
  };
  category?: {
    name: string;
  };
  chapters: Chapter[];
}

export default function BookReadPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  useEffect(() => {
    fetchBookData();
  }, [bookId]);

  const fetchBookData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await httpClient.get(`books/${bookId}`);
      
      if (response.ok && response.data) {
        const data = response.data as any;
        
        // Check if user owns the book
        if (!data.is_owned) {
          setError('Bạn cần mua sách để đọc. Vui lòng quay lại trang chi tiết sách để mua.');
          return;
        }
        
        setBook({
          id: data.id,
          title: data.title,
          description: data.description || '',
          cover_image: data.cover_image || '/images/books/default.jpg',
          author: data.author,
          category: data.category,
          chapters: (data.chapters || []).map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            description: ch.description || '',
            order_index: ch.order_index || 0,
            question_count: ch.question_count || 0,
          })),
        });
      } else {
        const errorData = response.error as any;
        setError(errorData?.message || 'Không thể tải thông tin sách');
      }
    } catch (err: any) {
      console.error('Error fetching book:', err);
      setError('Có lỗi xảy ra khi tải thông tin sách');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải sách...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <BookOpenIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href={`/books/${bookId}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Xem chi tiết sách
            </Link>
            <Link
              href="/my-learning?tab=books"
              className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Quay lại
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/my-learning?tab=books"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
                {book.author && (
                  <p className="text-sm text-gray-600">Tác giả: {book.author.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {book.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {book.category.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Book Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden mb-4">
                <Image
                  src={book.cover_image}
                  alt={book.title}
                  width={300}
                  height={400}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{book.title}</h2>
              {book.author && (
                <p className="text-sm text-gray-600 mb-4">Tác giả: {book.author.name}</p>
              )}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Số chương:</span>
                  <span className="font-semibold">{book.chapters.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Tổng câu hỏi:</span>
                  <span className="font-semibold">
                    {book.chapters.reduce((sum, ch) => sum + ch.question_count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Chapters */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <ListBulletIcon className="h-6 w-6 mr-2" />
                  Danh sách chương
                </h2>
              </div>

              {book.chapters.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpenIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>Chưa có chương nào trong sách này</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {book.chapters.map((chapter, index) => (
                    <Link
                      key={chapter.id}
                      href={`/books/${bookId}/chapters/${chapter.id}`}
                      className="block border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {chapter.title}
                            </h3>
                          </div>
                          {chapter.description && (
                            <div className="text-gray-700 mb-3 ml-13 prose prose-sm max-w-none">
                              {renderMathContent(chapter.description)}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 ml-13">
                            <span className="flex items-center">
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              {chapter.question_count} câu hỏi
                            </span>
                            <span className="flex items-center">
                              <PlayCircleIcon className="h-4 w-4 mr-1" />
                              Video giải bài
                            </span>
                            <span className="flex items-center">
                              <AcademicCapIcon className="h-4 w-4 mr-1" />
                              Lời giải chi tiết
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center">
                          <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

