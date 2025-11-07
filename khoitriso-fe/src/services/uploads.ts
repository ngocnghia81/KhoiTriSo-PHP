/**
 * Uploads Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface PresignResponse {
  uploadUrl: string;
  key: string;
  uploadId: string;
  accessRole: string;
  expiresIn: number;
}

/**
 * Get presigned upload URL
 * Uses PascalCase to match C# DTO format
 */
export async function getPresignUrl(data: {
  fileName: string;
  contentType?: string;
  accessRole?: string;
  folder?: string;
}): Promise<PresignResponse> {
  // Convert to PascalCase to match C# DTO format
  const requestData = {
    FileName: data.fileName,
    ContentType: data.contentType || 'application/octet-stream',
    AccessRole: data.accessRole || 'GUEST',
    Folder: data.folder || 'uploads',
  };
  
  const response = await httpClient.post('upload/presign', requestData);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
  return extractData(response) as PresignResponse;
}

/**
 * Upload file using presigned URL
 * The presignedUrl already contains the token in query string
 * Worker expects FormData with 'file' field
 */
export async function uploadFileToPresignedUrl(presignedUrl: string, file: File): Promise<void> {
  try {
    // Worker expects FormData, not raw file body
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', file.type || 'application/octet-stream');
    formData.append('filename', file.name);
    
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Not JSON, use as text
      }
      
      console.error('Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        errorJson,
        url: presignedUrl,
      });
      
      throw new Error(`Upload failed (${response.status}): ${errorJson?.message || errorJson?.error || errorText || response.statusText}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Upload failed: ${String(error)}`);
  }
}

/**
 * Confirm file upload
 */
export async function confirmFileUpload(fileKey: string): Promise<void> {
  const response = await httpClient.post(`upload/confirm/${fileKey}`);
  if (!isSuccess(response)) throw new Error(handleApiError(response));
}

/**
 * Upload file with presign flow (get URL -> upload -> confirm)
 * Returns the full file URL
 */
export async function uploadFile(file: File, folder: string = 'courses'): Promise<string> {
  try {
    // Step 1: Get presigned URL
    const presignData = await getPresignUrl({
      fileName: file.name,
      contentType: file.type,
      accessRole: 'GUEST',
      folder: folder,
    });

    // Step 2: Upload file to presigned URL
    await uploadFileToPresignedUrl(presignData.uploadUrl, file);

    // Step 3: Confirm upload
    await confirmFileUpload(presignData.key);

    // Construct file access URL from uploadUrl
    // uploadUrl format: {baseUrl}/upload/{key}?token=...
    // file URL format: {baseUrl}/files/{key}
    const uploadUrlObj = new URL(presignData.uploadUrl);
    const baseUrl = `${uploadUrlObj.protocol}//${uploadUrlObj.host}`;
    const fileUrl = `${baseUrl}/files/${presignData.key}`;
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

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
