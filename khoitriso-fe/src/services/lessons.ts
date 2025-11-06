/**
 * Lessons Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getLessons(courseId: number) {
  const response = await httpClient.get(`lessons?courseId=${courseId}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getLesson(id: number) {
  const response = await httpClient.get(`lessons/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function trackProgress(lessonId: number, data: { videoTimestamp?: number; completed?: boolean }) {
  const response = await httpClient.post(`lessons/${lessonId}/progress`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
