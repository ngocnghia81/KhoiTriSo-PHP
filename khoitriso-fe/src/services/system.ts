/**
 * System Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getSettings() {
  const response = await httpClient.get('system/settings');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function updateSettings(settings: Array<{ key: string; value: any }>) {
  const response = await httpClient.post('system/settings', { settings });
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getHealth() {
  const response = await httpClient.get('system/health');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getStats() {
  const response = await httpClient.get('system/stats');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
