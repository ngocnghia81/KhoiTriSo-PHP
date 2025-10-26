/**
 * Assignments Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getAssignments(params?: { courseId?: number; lessonId?: number; page?: number }) {
  const query = new URLSearchParams();
  if (params?.courseId) query.set('courseId', String(params.courseId));
  if (params?.lessonId) query.set('lessonId', String(params.lessonId));
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await httpClient.get(`assignments${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getAssignment(id: number) {
  const response = await httpClient.get(`assignments/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function startAssignment(id: number) {
  const response = await httpClient.post(`assignments/${id}/start`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function submitAssignment(id: number, data: { attemptId: number; answers: any[] }) {
  const response = await httpClient.post(`assignments/${id}/submit`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
