/**
 * Search Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function search(params: { q: string; type?: 'all' | 'courses' | 'books' | 'instructors'; pageSize?: number }) {
  const query = new URLSearchParams();
  query.set('q', params.q);
  if (params.type) query.set('type', params.type);
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const response = await httpClient.get(`search?${query.toString()}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getSuggestions(q: string) {
  const response = await httpClient.get(`search/suggestions?q=${encodeURIComponent(q)}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
