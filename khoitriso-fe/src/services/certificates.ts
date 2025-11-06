/**
 * Certificates Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function getCertificates(params?: { itemType?: number; page?: number }) {
  const query = new URLSearchParams();
  if (params?.itemType) query.set('itemType', String(params.itemType));
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  const response = await httpClient.get(`certificates${qs ? `?${qs}` : ''}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function getCertificate(id: number) {
  const response = await httpClient.get(`certificates/${id}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function downloadCertificate(id: number) {
  const response = await httpClient.get(`certificates/${id}/download`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function verifyCertificate(number: string) {
  const response = await httpClient.get(`certificates/verify/${number}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
