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
 * The presignedUrl contains the token in query string
 * Worker expects FormData with 'file' field
 * Returns the key and fileUrl from Worker response
 */
export async function uploadFileToPresignedUrl(presignedUrl: string, file: File): Promise<{ key: string; fileUrl: string | null }> {
  try {
    // Extract token from URL to get contentType from JWT payload
    const urlObj = new URL(presignedUrl);
    const token = urlObj.searchParams.get('token');
    
    // Get contentType from JWT payload or file.type
    let contentType = file.type || 'application/octet-stream';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.contentType || payload.ContentType) {
          contentType = payload.contentType || payload.ContentType;
        }
      } catch {
        // Use file.type if JWT decode fails
      }
    }
    
    // Worker expects FormData with 'file' field
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', contentType);
    
    // Send FormData, keep token in query string
    // Don't set Content-Type header - browser will set it with boundary for FormData
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: formData,
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
        tokenPresent: !!token,
      });
      
      throw new Error(`Upload failed (${response.status}): ${errorJson?.message || errorJson?.error || errorText || response.statusText}`);
    }

    // Worker returns key and fileUrl in response: { Key: "...", FileUrl: "...", ... }
    const responseData = await response.json();
    const actualKey = responseData.Key || responseData.key || responseData.fileKey || responseData.FileKey;
    const fileUrl = responseData.FileUrl || responseData.fileUrl;
    
    if (!actualKey) {
      console.error('Worker response:', responseData);
      throw new Error('Worker did not return file key in response. Response: ' + JSON.stringify(responseData));
    }
    
    console.log('Worker returned key:', actualKey, 'fileUrl:', fileUrl);
    // Return both key and fileUrl
    return { key: actualKey, fileUrl: fileUrl || null };
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

    // Step 2: Upload file to presigned URL and get actual key from Worker response
    const uploadResult = await uploadFileToPresignedUrl(presignData.uploadUrl, file);
    const actualKey = uploadResult.key;
    const workerFileUrl = uploadResult.fileUrl;

    // Step 3: Confirm upload using actual key from Worker
    await confirmFileUpload(actualKey);

    // Use FileUrl from Worker response if available, otherwise construct it
    if (workerFileUrl) {
      return workerFileUrl;
    }
    
    // Fallback: construct file access URL
    // Worker routes: /files/public/:key or /files/private/:key
    // Since accessRole is 'GUEST', use public route
    const uploadUrlObj = new URL(presignData.uploadUrl);
    const baseUrl = `${uploadUrlObj.protocol}//${uploadUrlObj.host}`;
    const fileUrl = `${baseUrl}/files/public/${actualKey}`;
    
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
