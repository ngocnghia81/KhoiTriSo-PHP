/**
 * Notifications Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface AppNotification {
  id: number;
  title?: string;
  message: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

export async function getNotifications(params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const response = await httpClient.get(`notifications${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function markAsRead(id: number) {
  const response = await httpClient.post(`notifications/${id}/read`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function markAllAsRead() {
  const response = await httpClient.post('notifications/read-all');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getUnreadCount() {
  const response = await httpClient.get('notifications/unread-count');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
