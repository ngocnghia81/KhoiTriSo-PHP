/**
 * Forum Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getForumQuestions(params?: { page?: number; pageSize?: number; q?: string; tag?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.q) query.set('q', params.q);
  if (params?.tag) query.set('tag', params.tag);
  const qs = query.toString();
  const response = await httpClient.get(`forum${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getForumQuestion(id: string) {
  const response = await httpClient.get(`forum/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function createForumQuestion(data: { title: string; content: string; tags?: string[]; category?: any }) {
  const response = await httpClient.post('forum', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function addAnswer(questionId: string, data: { content: string }) {
  const response = await httpClient.post(`forum/${questionId}/answers`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function voteQuestion(id: string, direction: 'up' | 'down') {
  const response = await httpClient.post(`forum/${id}/vote`, { direction });
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function voteAnswer(answerId: string, direction: 'up' | 'down') {
  const response = await httpClient.post(`forum/answers/${answerId}/vote`, { direction });
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function acceptAnswer(answerId: string) {
  const response = await httpClient.post(`forum/answers/${answerId}/accept`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getForumTags() {
  const response = await httpClient.get('forum/tags');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
