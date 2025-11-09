'use client';

import { useState } from 'react';
import { DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { sampleQuestions, SampleQuestion } from '@/data/sampleQuestions';

interface SampleQuestionsButtonProps {
  onInsert: (sample: SampleQuestion) => void;
}

export default function SampleQuestionsButton({ onInsert }: SampleQuestionsButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'multiple_choice' | 'essay'>('all');

  const filteredQuestions = sampleQuestions.filter(q => 
    filter === 'all' || q.type === filter
  );

  const multipleChoiceCount = sampleQuestions.filter(q => q.type === 'multiple_choice').length;
  const essayCount = sampleQuestions.filter(q => q.type === 'essay').length;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
      >
        <DocumentDuplicateIcon className="h-5 w-5" />
        <span>Chèn câu hỏi mẫu</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Câu hỏi mẫu ({sampleQuestions.length})</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Tất cả ({sampleQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('multiple_choice')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    filter === 'multiple_choice'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Trắc nghiệm ({multipleChoiceCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('essay')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    filter === 'essay'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Tự luận ({essayCount})
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {question.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                          </span>
                          <span className="text-xs text-gray-500">Câu {index + 1}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {question.content.replace(/\$\$.*?\$\$/g, '[Công thức]')}
                        </div>
                        {question.type === 'multiple_choice' && question.options && (
                          <div className="text-xs text-gray-500 mb-2">
                            {question.options.length} lựa chọn
                            {question.options.filter(opt => opt.isCorrect).length > 0 && (
                              <span className="ml-2 text-green-600">
                                ({question.options.filter(opt => opt.isCorrect).length} đáp án đúng)
                              </span>
                            )}
                          </div>
                        )}
                        {question.explanation && (
                          <div className="text-xs text-gray-500 italic line-clamp-1">
                            Giải thích: {question.explanation.replace(/\$\$.*?\$\$/g, '[Công thức]')}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onInsert(question);
                          setShowModal(false);
                        }}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                      >
                        Chèn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Chọn một câu hỏi mẫu để chèn vào danh sách câu hỏi của bạn
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

