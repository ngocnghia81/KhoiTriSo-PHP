'use client';

import { useState, useRef } from 'react';
import { DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { httpClient } from '@/lib/http-client';

interface WordImportProps {
  bookId: number;
  chapterId: number;
  onImportSuccess: (questions: any[]) => void;
  onError?: (error: string) => void;
}

export default function WordImport({
  bookId,
  chapterId,
  onImportSuccess,
  onError,
}: WordImportProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.ms-word',
      ];
      const validExtensions = ['.docx', '.doc'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      ) {
        if (onError) {
          onError('Vui lòng chọn file Word (.docx hoặc .doc)');
        }
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        if (onError) {
          onError('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        }
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      if (onError) {
        onError('Vui lòng chọn file Word');
      }
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('book_id', String(bookId));
      formData.append('chapter_id', String(chapterId));

      const response = await httpClient.post(
        `admin/books/${bookId}/chapters/${chapterId}/questions/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        }
      );

      if (response.ok && response.data) {
        const data = response.data as any;
        if (data.success && data.data && data.data.questions) {
          onImportSuccess(data.data.questions);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          throw new Error(data.message || 'Không thể import câu hỏi từ file');
        }
      } else {
        throw new Error('Không thể import file Word');
      }
    } catch (error: any) {
      console.error('Error importing Word file:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi import file Word. Vui lòng kiểm tra định dạng file và thử lại.';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Import từ file Word</h3>
        <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-3">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            onChange={handleFileSelect}
            className="hidden"
            id="word-file-input"
            disabled={uploading}
          />
          <label
            htmlFor="word-file-input"
            className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
              uploading
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                : 'border-blue-300 bg-white hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600">
              {selectedFile ? selectedFile.name : 'Chọn file Word (.docx)'}
            </span>
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
            <span className="text-sm text-gray-700 truncate flex-1 mr-2">
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-800"
              disabled={uploading}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center">
              Đang xử lý file... {uploadProgress}%
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {uploading ? 'Đang import...' : 'Import câu hỏi'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Hỗ trợ file .docx, .doc. Tối đa 10MB. Hỗ trợ MathType và công thức toán học.
        </p>
      </div>
    </div>
  );
}

