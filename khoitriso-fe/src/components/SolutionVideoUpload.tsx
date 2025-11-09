'use client';

import { useState } from 'react';
import { VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { uploadFile } from '@/services/uploads';

interface SolutionVideoUploadProps {
  questionIndex: number;
  currentVideo?: string;
  onUpload: (url: string) => void;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function SolutionVideoUpload({
  questionIndex,
  currentVideo,
  onUpload,
  notify,
}: SolutionVideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(currentVideo || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      notify('Vui lòng chọn file video', 'error');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      notify('File video không được vượt quá 100MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const videoUrl = await uploadFile(file, 'books/solutions');
      setVideoPreview(videoUrl);
      onUpload(videoUrl);
      notify('Upload video thành công', 'success');
    } catch (error: any) {
      console.error('Error uploading video:', error);
      notify(error.message || 'Lỗi upload video', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setVideoPreview(null);
    onUpload('');
    notify('Đã xóa video', 'info');
  };

  return (
    <div className="space-y-2">
      {videoPreview ? (
        <div className="relative">
          <video
            src={videoPreview}
            controls
            className="w-full max-w-md rounded-lg border border-gray-300"
          >
            Trình duyệt không hỗ trợ video.
          </video>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
            title="Xóa video"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <label className="cursor-pointer">
            <span className="text-sm text-blue-600 hover:text-blue-700">
              {uploading ? 'Đang upload...' : 'Chọn video giải thích'}
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">Hỗ trợ: MP4, WebM, MOV (tối đa 100MB)</p>
        </div>
      )}
    </div>
  );
}

