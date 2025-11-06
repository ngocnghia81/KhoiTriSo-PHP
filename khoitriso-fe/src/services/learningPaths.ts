/**
 * Learning Paths Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getLearningPaths(params?: { category?: number; level?: number; page?: number }) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', String(params.category));
  if (params?.level) query.set('level', String(params.level));
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await httpClient.get(`learning-paths${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getLearningPath(id: number) {
  const response = await httpClient.get(`learning-paths/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function enrollLearningPath(id: number) {
  const response = await httpClient.post(`learning-paths/${id}/enroll`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getMyLearningPaths(params?: { page?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await httpClient.get(`learning-paths/my-paths${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
