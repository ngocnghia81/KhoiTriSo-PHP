'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { courseService, Lesson, LessonMaterial } from '@/services/courseService';
import { getInstructorCourse } from '@/services/instructor';
import { useToast } from '@/components/ToastProvider';
import { uploadFile } from '@/services/uploads';
import RichTextEditor from '@/components/RichTextEditor';

export default function CreateLessonPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  const courseId = params?.courseId ? parseInt(params.courseId as string) : null;

  const [course, setCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoDuration: '',
    contentText: '',
    lessonOrder: '',
    isFree: false,
    isPublished: false,
  });

  const [materials, setMaterials] = useState<Array<{
    id: string;
    title: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>>([]);

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    // Check user role
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const userData = JSON.parse(userStr);
        setIsInstructor(userData.role === 'instructor');
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }, []);

  useEffect(() => {
    if (!courseId) {
      router.push('/dashboard/courses');
    } else {
      fetchCourse();
    }
  }, [courseId, router, isInstructor]);

  const fetchCourse = async () => {
    if (!courseId) return;
    try {
      setLoadingCourse(true);
      let courseData;
      if (isInstructor) {
        // Use instructor API
        courseData = await getInstructorCourse(courseId);
      } else {
        // Use admin API
        courseData = await courseService.getCourseAdmin(courseId);
      }
      setCourse(courseData as any);
    } catch (error: any) {
      console.error('Error fetching course:', error);
      notify(error.message || 'Lỗi tải thông tin khóa học', 'error');
      router.push('/dashboard/courses');
    } finally {
      setLoadingCourse(false);
    }
  };

  /**
   * Get video duration from file
   */
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration); // Round to seconds
        resolve(duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Không thể đọc thông tin video'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      notify('Vui lòng chọn file video', 'error');
      return;
    }

    try {
      setUploadingVideo(true);
      
      // Get video duration before uploading
      let duration = 0;
      try {
        duration = await getVideoDuration(file);
        console.log('Video duration:', duration, 'seconds');
      } catch (error) {
        console.warn('Could not get video duration:', error);
        // Continue upload even if duration extraction fails
      }
      
      // Upload video
      const result = await uploadFile(file, 'courses/videos');
      
      // Update form data with video URL and duration
      setFormData({ 
        ...formData, 
        videoUrl: result,
        videoDuration: duration > 0 ? duration.toString() : formData.videoDuration
      });
      
      notify('Upload video thành công' + (duration > 0 ? ` (${duration}s)` : ''), 'success');
    } catch (error: any) {
      console.error('Error uploading video:', error);
      notify(error.message || 'Lỗi upload video', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleMaterialFileChange = async (e: React.ChangeEvent<HTMLInputElement>, materialId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMaterial(materialId);
      const result = await uploadFile(file, 'courses/materials');
      
      setMaterials(materials.map(m => 
        m.id === materialId 
          ? { ...m, fileUrl: result, fileName: file.name, fileType: file.type, fileSize: file.size }
          : m
      ));
      notify('Upload tài liệu thành công', 'success');
    } catch (error: any) {
      console.error('Error uploading material:', error);
      notify(error.message || 'Lỗi upload tài liệu', 'error');
    } finally {
      setUploadingMaterial(null);
    }
  };

  const addMaterial = () => {
    setMaterials([...materials, {
      id: `mat-${Date.now()}-${Math.random()}`,
      title: '',
      fileUrl: '',
      fileName: '',
      fileType: '',
      fileSize: 0,
    }]);
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    if (!formData.title || !formData.description || !formData.videoUrl) {
      notify('Vui lòng điền đầy đủ thông tin bài học', 'error');
      return;
    }

    setLoading(true);
    try {
      // Create lesson
      const lesson = await courseService.createLesson(courseId, {
        title: formData.title,
        description: formData.description,
        videoUrl: formData.videoUrl,
        videoDuration: formData.videoDuration ? parseInt(formData.videoDuration) : undefined,
        contentText: formData.contentText,
        lessonOrder: formData.lessonOrder ? parseInt(formData.lessonOrder) : undefined,
        isFree: formData.isFree,
        isPublished: formData.isPublished,
      });

      // Upload materials
      for (const material of materials) {
        if (material.title && material.fileUrl) {
          await courseService.uploadLessonMaterial(lesson.id, {
            title: material.title,
            fileUrl: material.fileUrl,
            fileName: material.fileName,
            fileType: material.fileType,
            fileSize: material.fileSize,
          });
        }
      }

      notify('Tạo bài học thành công!', 'success');
      router.push(`/dashboard/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      notify(error.message || 'Lỗi tạo bài học', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/courses/${courseId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Tạo bài học mới cho: {course.title}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lesson Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin bài học</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video bài giảng *</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  disabled={uploadingVideo}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.videoUrl && (
                  <div className="mt-2">
                    <video src={formData.videoUrl} controls className="w-full max-w-md rounded" />
                    <p className="text-sm text-gray-500 mt-1">Video URL: {formData.videoUrl}</p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoUrl: '' })}
                    className="mt-2 text-sm text-red-600 hover:text-red-900"
                  >
                    Xóa video
                  </button>
                  </div>
                )}
                {uploadingVideo && <p className="text-sm text-gray-500 mt-1">Đang upload video...</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (giây)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.videoDuration}
                    onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự bài học</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lessonOrder}
                    onChange={(e) => setFormData({ ...formData, lessonOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung bài học</label>
                <RichTextEditor
                  value={formData.contentText}
                  onChange={(value) => setFormData({ ...formData, contentText: value })}
                  placeholder="Nhập nội dung bài học... (Sử dụng thanh công cụ để định dạng văn bản: in đậm, in nghiêng, danh sách, v.v.)"
                  className="border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Bài học miễn phí</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Xuất bản ngay</span>
                </label>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Tài liệu đính kèm</h2>
              <button
                type="button"
                onClick={addMaterial}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center"
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-1" />
                Thêm tài liệu
              </button>
            </div>

            {materials.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có tài liệu nào. Nhấn "Thêm tài liệu" để thêm.</p>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div key={material.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Tài liệu {materials.indexOf(material) + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeMaterial(material.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài liệu *</label>
                        <input
                          type="text"
                          required
                          value={material.title}
                          onChange={(e) => {
                            setMaterials(materials.map(m => 
                              m.id === material.id ? { ...m, title: e.target.value } : m
                            ));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                          onChange={(e) => handleMaterialFileChange(e, material.id)}
                          disabled={uploadingMaterial === material.id}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        {material.fileUrl && (
                          <p className="text-sm text-gray-500 mt-1">
                            File: {material.fileName} ({Math.round(material.fileSize / 1024)} KB)
                          </p>
                        )}
                        {uploadingMaterial === material.id && (
                          <p className="text-sm text-gray-500 mt-1">Đang upload...</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/courses/${courseId}`)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.description || !formData.videoUrl}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo...' : 'Tạo bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

