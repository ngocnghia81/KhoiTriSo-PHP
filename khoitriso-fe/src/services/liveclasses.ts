/**
 * Live Classes Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getLiveClasses(params?: { courseId?: number; status?: number; upcoming?: boolean; page?: number }) {
  const query = new URLSearchParams();
  if (params?.courseId) query.set('courseId', String(params.courseId));
  if (params?.status) query.set('status', String(params.status));
  if (params?.upcoming) query.set('upcoming', 'true');
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await httpClient.get(`live-classes${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getLiveClass(id: number) {
  const response = await httpClient.get(`live-classes/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function joinLiveClass(id: number) {
  const response = await httpClient.post(`live-classes/${id}/join`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function leaveLiveClass(id: number, data?: { attendanceDuration?: number }) {
  const response = await httpClient.post(`live-classes/${id}/leave`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function createLiveClass(data: any) {
  const response = await httpClient.post('live-classes', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function updateLiveClass(id: number, data: any) {
  const response = await httpClient.put(`live-classes/${id}`, data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
