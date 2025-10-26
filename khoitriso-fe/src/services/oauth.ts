/**
 * OAuth Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getProviders() {
  const response = await httpClient.get('oauth/providers');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function linkProvider(data: { oauthProvider: string; oauthToken: string }) {
  const response = await httpClient.post('oauth/link', data);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function unlinkProvider(provider: string) {
  const response = await httpClient.post('oauth/unlink', { oauthProvider: provider });
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getSessions() {
  const response = await httpClient.get('oauth/sessions');
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function terminateSession(sessionId: number) {
  const response = await httpClient.delete(`oauth/sessions/${sessionId}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
