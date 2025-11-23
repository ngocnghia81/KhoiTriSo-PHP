/**
 * Forum Service
 */

import { api } from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface ForumQuestion {
  _id: string;
  title: string;
  content: string;
  author: {
    id?: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  user_id?: number;
  category?: {
    name: string;
    slug: string;
  };
  tags?: string[];
  views: number;
  votes: number;
  answers?: ForumAnswer[];
  isSolved: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ForumAnswer {
  _id: string;
  content: string;
  author: {
    id?: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  user_id?: number;
  votes: number;
  isAccepted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedForumResponse {
  data: ForumQuestion[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const forumService = {
  /**
   * Get forum questions list
   * GET /api/forum/questions
   */
  getQuestions: async (params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    tag?: string;
  }): Promise<PaginatedForumResponse> => {
    const response = await api.get<ApiResponse<PaginatedForumResponse>>('/forum/questions', { params });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get questions');
  },

  /**
   * Get single question
   * GET /api/forum/questions/{id}
   */
  getQuestion: async (id: string): Promise<ForumQuestion> => {
    const response = await api.get<ApiResponse<ForumQuestion>>(`/forum/questions/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get question');
  },

  /**
   * Create question
   * POST /api/forum/questions
   */
  createQuestion: async (data: {
    title: string;
    content: string;
    tags?: string[];
    category?: { name: string; slug: string };
  }): Promise<ForumQuestion> => {
    const response = await api.post<ApiResponse<ForumQuestion>>('/forum/questions', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create question');
  },

  /**
   * Update question
   * PUT /api/forum/questions/{id}
   */
  updateQuestion: async (id: string, data: {
    title?: string;
    content?: string;
    tags?: string[];
    category?: { name: string; slug: string };
  }): Promise<ForumQuestion> => {
    const response = await api.put<ApiResponse<ForumQuestion>>(`/forum/questions/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update question');
  },

  /**
   * Delete question
   * DELETE /api/forum/questions/{id}
   */
  deleteQuestion: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/forum/questions/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete question');
    }
  },

  /**
   * Vote question
   * POST /api/forum/questions/{id}/vote
   */
  voteQuestion: async (id: string, direction: 'up' | 'down'): Promise<{ votes: number }> => {
    const response = await api.post<ApiResponse<{ votes: number }>>(`/forum/questions/${id}/vote`, { direction });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to vote');
  },

  /**
   * Get answers for question
   * GET /api/forum/questions/{id}/answers
   */
  getAnswers: async (id: string): Promise<ForumAnswer[]> => {
    const response = await api.get<ApiResponse<ForumAnswer[]>>(`/forum/questions/${id}/answers`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get answers');
  },

  /**
   * Add answer
   * POST /api/forum/questions/{id}/answers
   */
  addAnswer: async (questionId: string, data: { content: string }): Promise<ForumAnswer> => {
    const response = await api.post<ApiResponse<ForumAnswer>>(`/forum/questions/${questionId}/answers`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to add answer');
  },

  /**
   * Update answer
   * PUT /api/forum/questions/{id}/answers/{answerId}
   */
  updateAnswer: async (questionId: string, answerId: string, data: { content: string }): Promise<void> => {
    const response = await api.put<ApiResponse<null>>(`/forum/questions/${questionId}/answers/${answerId}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update answer');
    }
  },

  /**
   * Delete answer
   * DELETE /api/forum/questions/{id}/answers/{answerId}
   */
  deleteAnswer: async (questionId: string, answerId: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/forum/questions/${questionId}/answers/${answerId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete answer');
    }
  },

  /**
   * Vote answer
   * POST /api/forum/questions/{id}/answers/{answerId}/vote
   */
  voteAnswer: async (questionId: string, answerId: string, direction: 'up' | 'down'): Promise<void> => {
    const response = await api.post<ApiResponse<null>>(`/forum/questions/${questionId}/answers/${answerId}/vote`, { direction });
    if (!response.success) {
      throw new Error(response.message || 'Failed to vote answer');
    }
  },

  /**
   * Accept answer
   * POST /api/forum/questions/{id}/answers/{answerId}/accept
   */
  acceptAnswer: async (questionId: string, answerId: string): Promise<void> => {
    const response = await api.post<ApiResponse<null>>(`/forum/questions/${questionId}/answers/${answerId}/accept`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to accept answer');
    }
  },

  /**
   * Get popular tags
   * GET /api/forum/tags
   */
  getTags: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/forum/tags');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get tags');
  },
};

// Legacy exports for backward compatibility
export const getForumQuestions = forumService.getQuestions;
export const getForumQuestion = forumService.getQuestion;
export const createForumQuestion = forumService.createQuestion;
export const addAnswer = forumService.addAnswer;
export const voteQuestion = forumService.voteQuestion;
export const voteAnswer = forumService.voteAnswer;
export const acceptAnswer = forumService.acceptAnswer;
export const getForumTags = forumService.getTags;
