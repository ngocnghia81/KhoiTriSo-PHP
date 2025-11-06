/**
 * Discussions Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getDiscussions(lessonId: number, params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`lessons/${lessonId}/discussions${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function createDiscussion(lessonId: number, data: { content: string; videoTimestamp?: number; parentId?: number }) {
  const response = await httpClient.post(`lessons/${lessonId}/discussions`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function updateDiscussion(id: number, data: { content: string }) {
  const response = await httpClient.put(`discussions/${id}`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function deleteDiscussion(id: number) {
  const response = await httpClient.delete(`discussions/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
