'use client';

import { useState } from 'react';
import { addAnswer } from '@/services/forum';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AnswerForm({ questionId }: { questionId: number }) {
  useAuthGuard();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      setError(null);
      const res = await addAnswer(String(questionId), { content });
      if (res.ok) window.location.reload();
      else setError('Đăng trả lời thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nhập câu trả lời của bạn..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Hỗ trợ văn bản cơ bản</div>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Đang đăng...' : 'Đăng trả lời'}
        </button>
      </div>
    </div>
  );
}



