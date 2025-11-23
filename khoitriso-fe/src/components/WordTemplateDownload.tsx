'use client';

import { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { httpClient } from '@/lib/http-client';

interface WordTemplateDownloadProps {
  bookId: number;
  chapterId: number;
  chapterTitle?: string;
  onDownloadComplete?: () => void;
}

export default function WordTemplateDownload({
  bookId,
  chapterId,
  chapterTitle,
  onDownloadComplete,
}: WordTemplateDownloadProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Call API to generate Word template
      const response = await httpClient.get(
        `admin/books/${bookId}/chapters/${chapterId}/questions/template`,
        {
          responseType: 'blob', // Important for file download
        }
      );

      if (response.ok && response.data) {
        // Ensure we have a proper Blob
        let blob: Blob;
        
        if (response.data instanceof Blob) {
          blob = response.data;
        } else {
          // If data is not a Blob, create one
          blob = new Blob([response.data as any], { type: 'application/rtf' });
        }
        
        // Verify blob is valid
        if (!(blob instanceof Blob)) {
          console.error('Invalid blob data:', blob);
          throw new Error('Dữ liệu file không hợp lệ');
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Mau_Cau_Hoi_Chuong_${chapterId}.rtf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        if (onDownloadComplete) {
          onDownloadComplete();
        }
      } else {
        throw new Error('Không thể tải file mẫu');
      }
    } catch (error: any) {
      console.error('Error downloading template:', error);
      alert(error.message || 'Lỗi khi tải file mẫu. Vui lòng thử lại.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
    >
      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
      {downloading ? 'Đang tải...' : 'Tải file mẫu RTF'}
    </button>
  );
}

