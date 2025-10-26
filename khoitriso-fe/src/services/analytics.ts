/**
 * Analytics Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getDashboard() {
  const response = await httpClient.get('analytics/dashboard');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getCourseAnalytics(courseId: number) {
  const response = await httpClient.get(`analytics/course/${courseId}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getInstructorAnalytics(instructorId: number) {
  const response = await httpClient.get(`analytics/instructor/${instructorId}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
