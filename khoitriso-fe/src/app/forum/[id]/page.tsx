'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { forumService, ForumQuestion, ForumAnswer } from '@/services/forum';
import { useToast } from '@/components/ToastProvider';
import RichTextEditor from '@/components/RichTextEditor';

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  const questionId = params?.id as string;

  const [question, setQuestion] = useState<ForumQuestion | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
      fetchAnswers();
      loadCurrentUser();
    }
  }, [questionId]);

  const loadCurrentUser = () => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const data = await forumService.getQuestion(questionId);
      setQuestion(data);
    } catch (error: any) {
      console.error('Error fetching question:', error);
      notify(error.message || 'Lỗi tải câu hỏi', 'error');
      router.push('/forum');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async () => {
    try {
      const data = await forumService.getAnswers(questionId);
      // Sort: accepted first, then by votes
      const sorted = (data || []).sort((a, b) => {
        if (a.isAccepted && !b.isAccepted) return -1;
        if (!a.isAccepted && b.isAccepted) return 1;
        return (b.votes || 0) - (a.votes || 0);
      });
      setAnswers(sorted);
    } catch (error: any) {
      console.error('Error fetching answers:', error);
    }
  };

  const handleVoteQuestion = async (direction: 'up' | 'down') => {
    if (!currentUser) {
      notify('Vui lòng đăng nhập để vote', 'error');
      return;
    }
    try {
      await forumService.voteQuestion(questionId, direction);
      await fetchQuestion();
    } catch (error: any) {
      notify(error.message || 'Lỗi vote', 'error');
    }
  };

  const handleVoteAnswer = async (answerId: string, direction: 'up' | 'down') => {
    if (!currentUser) {
      notify('Vui lòng đăng nhập để vote', 'error');
      return;
    }
    try {
      await forumService.voteAnswer(questionId, answerId, direction);
      await fetchAnswers();
    } catch (error: any) {
      notify(error.message || 'Lỗi vote', 'error');
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!currentUser || !question) {
      return;
    }
    // Only question author can accept answer
    if (question.user_id !== currentUser.id && question.author?.id !== currentUser.id) {
      notify('Chỉ người đặt câu hỏi mới có thể chấp nhận câu trả lời', 'error');
      return;
    }
    try {
      await forumService.acceptAnswer(questionId, answerId);
      await fetchQuestion();
      await fetchAnswers();
      notify('Đã chấp nhận câu trả lời', 'success');
    } catch (error: any) {
      notify(error.message || 'Lỗi chấp nhận câu trả lời', 'error');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentUser) {
      notify('Vui lòng đăng nhập để trả lời', 'error');
      router.push('/login');
      return;
    }
    if (!answerContent.trim()) {
      notify('Vui lòng nhập câu trả lời', 'error');
      return;
    }
    try {
      setSubmittingAnswer(true);
      await forumService.addAnswer(questionId, { content: answerContent });
      setAnswerContent('');
      await fetchAnswers();
      await fetchQuestion();
      notify('Đăng câu trả lời thành công', 'success');
    } catch (error: any) {
      notify(error.message || 'Lỗi đăng câu trả lời', 'error');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  const canAcceptAnswer = currentUser && (question.user_id === currentUser.id || question.author?.id === currentUser.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/forum"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Quay lại diễn đàn
        </Link>

        {/* Question */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex gap-4 p-6">
            {/* Vote Section */}
            <div className="flex flex-col items-center gap-2 min-w-[60px]">
              <button
                onClick={() => handleVoteQuestion('up')}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                disabled={!currentUser}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div className="text-2xl font-bold text-gray-700">{question.votes || 0}</div>
              <button
                onClick={() => handleVoteQuestion('down')}
                className="text-gray-400 hover:text-red-600 transition-colors"
                disabled={!currentUser}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Question Content */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.title}</h1>
              <div
                className="prose max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
              <div className="flex items-center justify-between flex-wrap gap-2 pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {question.author?.name || 'Thành viên'}
                    {question.created_at && ` • ${formatDate(question.created_at)}`}
                  </span>
                  {question.category && (
                    <span className="px-2 py-1 bg-gray-100 rounded">{question.category.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {question.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {answers.length} {answers.length === 1 ? 'Câu trả lời' : 'Câu trả lời'}
          </h2>
          <div className="space-y-4">
            {answers.map((answer) => (
              <div
                key={answer._id}
                className={`bg-white rounded-lg shadow ${
                  answer.isAccepted ? 'border-2 border-green-500' : ''
                }`}
              >
                <div className="flex gap-4 p-6">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <button
                      onClick={() => handleVoteAnswer(answer._id, 'up')}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      disabled={!currentUser}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <div className="text-xl font-bold text-gray-700">{answer.votes || 0}</div>
                    <button
                      onClick={() => handleVoteAnswer(answer._id, 'down')}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      disabled={!currentUser}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {answer.isAccepted && (
                      <CheckCircleIconSolid className="w-8 h-8 text-green-600 mt-2" />
                    )}
                  </div>

                  {/* Answer Content */}
                  <div className="flex-1">
                    <div
                      className="prose max-w-none mb-4"
                      dangerouslySetInnerHTML={{ __html: answer.content }}
                    />
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        {answer.author?.name || 'Thành viên'}
                        {answer.createdAt && ` • ${formatDate(answer.createdAt)}`}
                      </div>
                      {canAcceptAnswer && !answer.isAccepted && (
                        <button
                          onClick={() => handleAcceptAnswer(answer._id)}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          Chấp nhận câu trả lời
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer Form */}
        {currentUser ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Câu trả lời của bạn</h3>
            <RichTextEditor
              value={answerContent}
              onChange={setAnswerContent}
              placeholder="Nhập câu trả lời của bạn..."
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitAnswer}
                disabled={submittingAnswer || !answerContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingAnswer ? 'Đang đăng...' : 'Đăng câu trả lời'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">Vui lòng đăng nhập để trả lời</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

