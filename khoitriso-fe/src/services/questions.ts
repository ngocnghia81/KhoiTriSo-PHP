/**
 * Questions Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getQuestions(params: { contextType: number; contextId: number; page?: number }) {
  const query = new URLSearchParams();
  query.set('contextType', String(params.contextType));
  query.set('contextId', String(params.contextId));
  if (params.page) query.set('page', String(params.page));
  const response = await httpClient.get(`questions?${query.toString()}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getQuestion(id: number) {
  const response = await httpClient.get(`questions/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function createQuestion(data: any) {
  const response = await httpClient.post('questions', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
