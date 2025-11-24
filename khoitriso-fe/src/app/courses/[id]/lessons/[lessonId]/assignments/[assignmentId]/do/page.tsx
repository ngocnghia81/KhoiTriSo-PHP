'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ClockIcon,
  DocumentTextIcon,
  TrophyIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { getAssignment, startAssignment, submitAssignment, getMyAssignmentAttempts, Assignment, Question, AssignmentAttempt } from '@/services/assignments';
import { useToast } from '@/components/ToastProvider';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function DoAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { notify } = useToast();
  
  const courseId = params?.id ? String(params.id) : null;
  const lessonId = params?.lessonId ? String(params.lessonId) : null;
  const assignmentId = params?.assignmentId ? parseInt(String(params.assignmentId)) : null;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attempt, setAttempt] = useState<AssignmentAttempt | null>(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [answers, setAnswers] = useState<Record<number, { optionId?: number; answerText?: string }>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AssignmentAttempt[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!assignmentId) {
      notify('ID bài tập không hợp lệ', 'error');
      router.push('/courses');
      return;
    }
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      // Start attempt first
      const attemptData = await startAssignment(assignmentId);
      setAttempt(attemptData.data || attemptData);
      
      // Then load assignment with questions
      const response = await getAssignment(assignmentId);
      const assignmentData = response.data || response;
      setAssignment(assignmentData);
      
      const timeLimit = assignmentData.timeLimit || assignmentData.time_limit || 0;
      if (timeLimit > 0) {
        setTimeLeft(timeLimit * 60); // Convert minutes to seconds
        setStartTime(Date.now());
      }
    } catch (error: any) {
      console.error('Error loading assignment:', error);
      notify(error?.message || 'Không thể tải bài tập', 'error');
      router.push(`/courses/${courseId}/learn`);
    } finally {
      setLoading(false);
    }
  };

  // Scroll effect for sticky progress bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Timer effect
  useEffect(() => {
    if (isSubmitted || !assignment || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        if (prev <= 300 && !showWarning) { // 5 minutes warning
          setShowWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, assignment, timeLeft, showWarning]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, optionId?: number, answerText?: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionId, answerText }
    }));
  };

  const handleSubmit = async () => {
    if (!assignmentId || !attempt) return;
    
    if (!confirm('Bạn có chắc chắn muốn nộp bài? Bạn sẽ không thể chỉnh sửa sau khi nộp.')) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Convert answers to API format
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        optionId: answer.optionId || undefined,
        answerText: answer.answerText || undefined,
      }));

      const response = await submitAssignment(assignmentId, {
        attemptId: attempt.id,
        answers: answersArray
      });

      setAttempt(response.data || response);
      setIsSubmitted(true);
      setShowResult(true);
      notify('Nộp bài thành công!', 'success');
      // Load attempt history after submission
      loadAttemptHistory();
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      notify(error?.message || 'Không thể nộp bài', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMathContent = (content: string) => {
    if (!content) return null;
    
    // Auto-detect and wrap LaTeX commands
    let processedContent = content;
    const latexPatterns = [
      { regex: /\\frac\{[^}]+\}\{[^}]+\}/g, wrapper: '$' },
      { regex: /\\sqrt(?:\[[^\]]+\])?\{[^}]+\}/g, wrapper: '$' },
      { regex: /\\(?:mathbb|text|textbf|textit|mathrm)\{[^}]+\}/g, wrapper: '$' },
      { regex: /\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta|Iota|Kappa|Lambda|Mu|Nu|Xi|Pi|Rho|Sigma|Tau|Upsilon|Phi|Chi|Psi|Omega)\b/g, wrapper: '$' },
      { regex: /\\(?:cdot|times|div|pm|mp|leq|geq|neq|approx|equiv|infty|sum|prod|int|lim|sin|cos|tan|log|ln|exp)\b/g, wrapper: '$' },
      { regex: /(?:[a-zA-Z0-9]|\\[a-zA-Z]+)(?:[_^]\{[^}]+\}|[_^][a-zA-Z0-9])+/g, wrapper: '$' },
      { regex: /\\underbrace\{[^}]+\}(?:_\{[^}]+\})?/g, wrapper: '$' },
    ];
    
    const hasDelimiters = /\$\$[\s\S]+?\$\$|\$[^$]+?\$/.test(content);
    
    if (!hasDelimiters) {
      for (const { regex, wrapper } of latexPatterns) {
        processedContent = processedContent.replace(regex, (match) => {
          const beforeMatch = processedContent.substring(0, processedContent.indexOf(match));
          const openDelimiters = (beforeMatch.match(/\$/g) || []).length;
          if (openDelimiters % 2 === 1) return match;
          return `${wrapper}${match}${wrapper}`;
        });
      }
    }
    
    const mathPlaceholders: Array<{ id: string; type: 'block' | 'inline'; content: string }> = [];
    let placeholderIndex = 0;
    
    processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, (match, mathContent) => {
      const id = `__MATH_BLOCK_${placeholderIndex++}__`;
      mathPlaceholders.push({ id, type: 'block', content: mathContent.trim() });
      return id;
    });
    
    processedContent = processedContent.replace(/\$([^$]+)\$/g, (match, mathContent) => {
      const id = `__MATH_INLINE_${placeholderIndex++}__`;
      mathPlaceholders.push({ id, type: 'inline', content: mathContent.trim() });
      return id;
    });
    
    const parts: Array<{ type: 'html' | 'math'; content: string; mathType?: 'block' | 'inline' }> = [];
    let lastIndex = 0;
    let partIndex = 0;
    
    for (const placeholder of mathPlaceholders) {
      const index = processedContent.indexOf(placeholder.id);
      if (index > lastIndex) {
        parts.push({ type: 'html', content: processedContent.substring(lastIndex, index) });
      }
      parts.push({ type: 'math', content: placeholder.content, mathType: placeholder.type });
      lastIndex = index + placeholder.id.length;
    }
    
    if (lastIndex < processedContent.length) {
      parts.push({ type: 'html', content: processedContent.substring(lastIndex) });
    }
    
    if (parts.length === 0) {
      parts.push({ type: 'html', content: processedContent });
    }
    
    return (
      <div>
        {parts.map((part, idx) => {
          if (part.type === 'math') {
            return part.mathType === 'block' ? (
              <BlockMath key={`math-${idx}`} math={part.content} />
            ) : (
              <InlineMath key={`math-${idx}`} math={part.content} />
            );
          } else {
            return (
              <span
                key={`html-${idx}`}
                dangerouslySetInnerHTML={{ __html: part.content }}
              />
            );
          }
        })}
      </div>
    );
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getProgressPercentage = () => {
    if (!assignment?.questions || assignment.questions.length === 0) return 0;
    return (getAnsweredCount() / assignment.questions.length) * 100;
  };

  const loadAttemptHistory = async () => {
    if (!assignmentId) return;
    try {
      setLoadingHistory(true);
      const response = await getMyAssignmentAttempts(assignmentId);
      const attempts = response.data?.attempts || response.attempts || [];
      setAttemptHistory(attempts);
    } catch (error: any) {
      console.error('Error loading attempt history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showResult && assignmentId) {
      loadAttemptHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, assignmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy bài tập</p>
          <Link href={`/courses/${courseId}/learn`} className="text-blue-600 hover:underline">
            Quay về khóa học
          </Link>
        </div>
      </div>
    );
  }

  const questions = assignment.questions || [];
  const maxScore = assignment.maxScore || assignment.max_score || 0;
  const timeLimit = assignment.timeLimit || assignment.time_limit || 0;

  if (showResult && attempt) {
    const score = typeof attempt.score === 'number' ? attempt.score : (parseFloat(attempt.score) || 0);
    const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const timeSpentMinutes = Math.floor(timeSpent / 60);
    const timeSpentSeconds = timeSpent % 60;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passingScore = assignment.passingScore || assignment.passing_score || 0;
    const isPassed = passingScore > 0 ? score >= passingScore : percentage >= 50;
    
    // Calculate correct answers count
    const correctCount = questions.filter(q => {
      const userAnswer = answers[q.id];
      if (!userAnswer) return false;
      
      const questionType = q.questionType || q.question_type || 1;
      if (questionType === 1 || questionType === 2) {
        // Multiple choice: check if selected option is correct
        const selectedOption = q.options?.find(opt => opt.id === userAnswer.optionId);
        return selectedOption?.isCorrect || selectedOption?.is_correct || false;
      }
      // Essay questions: always count as answered (not auto-corrected)
      return true;
    }).length;
    const totalQuestions = questions.length;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-blue-600">Trang chủ</Link></li>
              <li>/</li>
              <li><Link href="/courses" className="hover:text-blue-600">Khóa học</Link></li>
              <li>/</li>
              <li><Link href={`/courses/${courseId}/learn`} className="hover:text-blue-600">Học tập</Link></li>
              <li>/</li>
              <li className="text-gray-900">Kết quả bài tập</li>
            </ol>
          </nav>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isPassed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isPassed ? (
                  <CheckCircleIcon className="h-12 w-12 text-green-600" />
                ) : (
                  <ExclamationCircleIcon className="h-12 w-12 text-red-600" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isPassed ? 'Hoàn thành bài tập!' : 'Chưa đạt yêu cầu'}
              </h1>
              <p className="text-gray-600">Bạn đã hoàn thành bài tập &quot;{assignment.title}&quot;</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="text-center">
                <div className={`w-32 h-32 border-8 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isPassed ? 'border-green-500' : 'border-red-500'
                }`}>
                  <div>
                    <div className={`text-3xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">/ {maxScore} điểm</div>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900">Điểm số của bạn</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Số câu đúng:</span>
                  <span className={`font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {correctCount}/{totalQuestions} câu
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tỷ lệ đúng:</span>
                  <span className={`font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {percentage}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Thời gian làm bài:</span>
                  <span className="font-semibold text-blue-600">
                    {timeSpentMinutes}:{timeSpentSeconds.toString().padStart(2, '0')}
                  </span>
                </div>
                {assignment.passingScore && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Điểm đạt:</span>
                    <span className="font-semibold text-gray-900">
                      {assignment.passingScore} điểm
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Số câu đã làm:</span>
                  <span className="font-semibold text-gray-900">
                    {getAnsweredCount()}/{questions.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={`/courses/${courseId}/learn`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Quay về khóa học
              </Link>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showHistory ? 'Ẩn' : 'Xem'} lịch sử làm bài
              </button>
            </div>

            {/* Attempt History */}
            {showHistory && (
              <div className="mt-8 border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Lịch sử làm bài</h2>
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : attemptHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Chưa có lịch sử làm bài</p>
                ) : (
                  <div className="space-y-4">
                    {attemptHistory.map((historyAttempt, index) => {
                      const historyScore = typeof historyAttempt.score === 'number' 
                        ? historyAttempt.score 
                        : (parseFloat(historyAttempt.score) || 0);
                      const historyPercentage = maxScore > 0 
                        ? Math.round((historyScore / maxScore) * 100) 
                        : 0;
                      const historyIsPassed = passingScore > 0 
                        ? historyScore >= passingScore 
                        : historyPercentage >= 50;
                      const attemptNumber = historyAttempt.attemptNumber || historyAttempt.attempt_number || (index + 1);
                      const submittedAt = historyAttempt.submittedAt || historyAttempt.submitted_at;
                      const startedAt = historyAttempt.startedAt || historyAttempt.started_at;
                      
                      return (
                        <div
                          key={historyAttempt.id}
                          className={`border-2 rounded-lg p-6 ${
                            historyAttempt.id === attempt?.id
                              ? 'border-blue-500 bg-blue-50'
                              : historyIsPassed
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Lần làm bài {attemptNumber}
                                {historyAttempt.id === attempt?.id && (
                                  <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                                    Lần này
                                  </span>
                                )}
                              </h3>
                              {submittedAt && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Nộp bài: {new Date(submittedAt).toLocaleString('vi-VN')}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                historyIsPassed ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {historyScore.toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-600">/ {maxScore} điểm</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Tỷ lệ đúng:</span>
                              <span className={`ml-2 font-semibold ${
                                historyIsPassed ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {historyPercentage}%
                              </span>
                            </div>
                            {startedAt && submittedAt && (
                              <div>
                                <span className="text-gray-600">Thời gian:</span>
                                <span className="ml-2 font-semibold text-gray-900">
                                  {Math.floor((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000 / 60)} phút
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Trạng thái:</span>
                              <span className={`ml-2 font-semibold ${
                                historyIsPassed ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {historyIsPassed ? 'Đạt' : 'Chưa đạt'}
                              </span>
                            </div>
                            {historyAttempt.isPassed !== undefined && (
                              <div>
                                <span className="text-gray-600">Đã pass:</span>
                                <span className={`ml-2 font-semibold ${
                                  historyAttempt.isPassed || historyAttempt.is_passed
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}>
                                  {historyAttempt.isPassed || historyAttempt.is_passed ? 'Có' : 'Không'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Progress Bar */}
      {isScrolled && !isSubmitted && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Đã làm: <strong className="text-blue-600">{getAnsweredCount()}</strong>/{questions.length}</span>
                  <span className="text-blue-600 font-semibold">{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
              {timeLimit > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className={`font-semibold ${showWarning ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-blue-200">
              <li><Link href="/" className="hover:text-white">Trang chủ</Link></li>
              <li>/</li>
              <li><Link href="/courses" className="hover:text-white">Khóa học</Link></li>
              <li>/</li>
              <li><Link href={`/courses/${courseId}/learn`} className="hover:text-white">Học tập</Link></li>
              <li>/</li>
              <li className="text-white">Bài tập</li>
            </ol>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-4">{assignment.title}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {timeLimit > 0 && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5" />
                    <span>Thời gian: <strong>{timeLimit} phút</strong></span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5" />
                  <span>Số câu: <strong>{questions.length} câu</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrophyIcon className="h-5 w-5" />
                  <span>Điểm tối đa: <strong>{maxScore} điểm</strong></span>
                </div>
                {assignment.maxAttempts && (
                  <div className="flex items-center space-x-2">
                    <ArrowPathIcon className="h-5 w-5" />
                    <span>Số lần làm: <strong>{assignment.maxAttempts} lần</strong></span>
                  </div>
                )}
              </div>
            </div>
            <Link
              href={`/courses/${courseId}/learn`}
              className="text-white hover:text-blue-200"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isScrolled ? 'pt-20' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hướng dẫn làm bài</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Đọc kỹ đề bài trước khi chọn đáp án</li>
                <li>• Mỗi câu hỏi chỉ có 1 đáp án đúng</li>
                <li>• Bạn có thể quay lại câu trước đó để sửa đáp án</li>
                <li>• Nhấn &quot;Nộp bài&quot; khi hoàn thành tất cả câu hỏi</li>
                <li>• Kết quả sẽ được hiển thị ngay sau khi nộp bài</li>
              </ul>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => {
                const questionContent = question.questionContent || question.question_content || '';
                const questionType = question.questionType || question.question_type || 1;
                const options = question.options || [];
                const isMultipleChoice = questionType === 1 || questionType === 2;
                const userAnswer = answers[question.id];

                return (
                  <div key={question.id} data-question={question.id} className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                      <span className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                        Câu {index + 1}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({question.defaultPoints || question.default_points || 1} điểm)
                      </span>
                    </div>

                    <div className="mb-6">
                      <div className="text-lg text-gray-900 mb-4">
                        {renderMathContent(questionContent)}
                      </div>
                    </div>

                    {isMultipleChoice && options.length > 0 ? (
                      <div className="space-y-3">
                        {options.map((option, optIndex) => {
                          const optionContent = option.optionContent || option.option_content || '';
                          const isSelected = userAnswer?.optionId === option.id;
                          
                          return (
                            <label
                              key={option.id}
                              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(question.id, option.id)}
                                className="mr-4"
                                disabled={isSubmitted}
                              />
                              <span className="flex-1 text-gray-900">
                                <strong>{String.fromCharCode(65 + optIndex)}.</strong>{' '}
                                {renderMathContent(optionContent)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        value={userAnswer?.answerText || ''}
                        onChange={(e) => handleAnswerChange(question.id, undefined, e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                        rows={6}
                        disabled={isSubmitted}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    localStorage.setItem(`assignment_${assignmentId}_progress`, JSON.stringify(answers));
                    notify('Đã lưu tiến độ làm bài!', 'success');
                  }}
                  className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={isSubmitted}
                >
                  <BookmarkIcon className="h-5 w-5 mr-2" />
                  Lưu bài làm
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitted || submitting}
                  className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      Nộp bài
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {timeLimit > 0 && (
              <div className={`bg-white rounded-2xl shadow-sm p-6 ${showWarning ? 'ring-2 ring-red-500' : ''}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thời gian còn lại</h3>
                <div className="text-center">
                  <div className={`w-24 h-24 border-6 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    showWarning ? 'border-red-500 text-red-500' : 'border-blue-500 text-blue-500'
                  }`}>
                    <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
                  </div>
                  {showWarning && (
                    <div className="flex items-center justify-center text-red-500 text-sm">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Sắp hết thời gian!
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiến độ làm bài</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Đã làm: <strong>{getAnsweredCount()}</strong>/{questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Danh sách câu hỏi</h4>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => {
                    const isAnswered = !!answers[question.id];
                    return (
                      <button
                        key={question.id}
                        onClick={() => {
                          const element = document.querySelector(`[data-question="${question.id}"]`);
                          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                          isAnswered
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                    <span className="text-gray-600">Đã trả lời</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                    <span className="text-gray-600">Chưa trả lời</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

