/**
 * Uploads Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await httpClient.postForm('uploads/image', formData);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await httpClient.postForm('uploads/video', formData);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await httpClient.postForm('uploads/document', formData);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}

export async function uploadEbook(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await httpClient.postForm('uploads/ebook', formData);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response);
}
