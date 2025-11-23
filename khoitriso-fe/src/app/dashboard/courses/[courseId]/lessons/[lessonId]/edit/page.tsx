'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { courseService, Lesson, LessonMaterial } from '@/services/courseService';
import { getInstructorCourse } from '@/services/instructor';
import { useToast } from '@/components/ToastProvider';
import { uploadFile } from '@/services/uploads';
import RichTextEditor from '@/components/RichTextEditor';

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const { notify } = useToast();
  const courseId = params?.courseId ? parseInt(params.courseId as string) : null;
  const lessonId = params?.lessonId ? parseInt(params.lessonId as string) : null;

  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
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
    id: string | number;
    title: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>>([]);

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
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
    if (!courseId || !lessonId) {
      router.push('/dashboard/courses');
    } else {
      fetchData();
    }
  }, [courseId, lessonId, router, isInstructor]);

  const fetchData = async () => {
    if (!courseId || !lessonId) return;
    try {
      setLoadingData(true);
      
      // Fetch course
      let courseData;
      if (isInstructor) {
        courseData = await getInstructorCourse(courseId);
      } else {
        courseData = await courseService.getCourseAdmin(courseId);
      }
      setCourse(courseData as any);

      // Fetch lesson
      const lessonData = await courseService.getLessonAdmin(lessonId);
      setLesson(lessonData);
      
      // Populate form data
      setFormData({
        title: lessonData.title || '',
        description: lessonData.description || '',
        videoUrl: lessonData.videoUrl || lessonData.video_url || '',
        videoDuration: lessonData.videoDuration || lessonData.video_duration ? String(lessonData.videoDuration || lessonData.video_duration) : '',
        contentText: lessonData.contentText || lessonData.content_text || '',
        lessonOrder: lessonData.lessonOrder || lessonData.lesson_order ? String(lessonData.lessonOrder || lessonData.lesson_order) : '',
        isFree: lessonData.isFree !== undefined ? lessonData.isFree : (lessonData.is_free !== undefined ? lessonData.is_free : false),
        isPublished: lessonData.isPublished !== undefined ? lessonData.isPublished : (lessonData.is_published !== undefined ? lessonData.is_published : false),
      });

      // Load existing materials
      if (lessonData.materials && Array.isArray(lessonData.materials)) {
        setMaterials(lessonData.materials.map((mat: LessonMaterial) => ({
          id: mat.id,
          title: mat.title || '',
          fileUrl: mat.filePath || '',
          fileName: mat.fileName || '',
          fileType: mat.fileType || '',
          fileSize: mat.fileSize || 0,
        })));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      notify(error.message || 'Lỗi tải thông tin', 'error');
      router.push(`/dashboard/courses/${courseId}`);
    } finally {
      setLoadingData(false);
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
        const duration = Math.round(video.duration);
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
      
      let duration = 0;
      try {
        duration = await getVideoDuration(file);
      } catch (error) {
        console.warn('Could not get video duration:', error);
      }
      
      const result = await uploadFile(file, 'courses/videos');
      
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

  const handleMaterialFileChange = async (e: React.ChangeEvent<HTMLInputElement>, materialId: string | number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMaterial(String(materialId));
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

  const removeMaterial = async (id: string | number) => {
    // If it's an existing material (has numeric ID), delete it from backend
    if (typeof id === 'number') {
      try {
        await courseService.deleteLessonMaterial(id);
        notify('Xóa tài liệu thành công', 'success');
      } catch (error: any) {
        console.error('Error deleting material:', error);
        notify(error.message || 'Lỗi xóa tài liệu', 'error');
        return;
      }
    }
    
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !lessonId) return;

    if (!formData.title || !formData.description || !formData.videoUrl) {
      notify('Vui lòng điền đầy đủ thông tin bài học', 'error');
      return;
    }

    setLoading(true);
    try {
      // Update lesson
      await courseService.updateLesson(lessonId, {
        title: formData.title,
        description: formData.description,
        videoUrl: formData.videoUrl,
        videoDuration: formData.videoDuration ? parseInt(formData.videoDuration) : undefined,
        contentText: formData.contentText,
        lessonOrder: formData.lessonOrder ? parseInt(formData.lessonOrder) : undefined,
        isFree: formData.isFree,
        isPublished: formData.isPublished,
      });

      // Upload new materials (only those with string IDs are new)
      for (const material of materials) {
        if (typeof material.id === 'string' && material.title && material.fileUrl) {
          await courseService.uploadLessonMaterial(lessonId, {
            title: material.title,
            fileUrl: material.fileUrl,
            fileName: material.fileName,
            fileType: material.fileType,
            fileSize: material.fileSize,
          });
        }
      }

      notify('Cập nhật bài học thành công!', 'success');
      router.push(`/dashboard/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      notify(error.message || 'Lỗi cập nhật bài học', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!course || !lesson) {
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
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa bài học: {lesson.title}</h1>
          <p className="text-gray-600 mt-2">Khóa học: {course.title}</p>
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
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Nhập mô tả bài học..."
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
                          disabled={uploadingMaterial === String(material.id)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        {material.fileUrl && (
                          <p className="text-sm text-gray-500 mt-1">
                            File: {material.fileName} ({Math.round(material.fileSize / 1024)} KB)
                            {typeof material.id === 'number' && (
                              <span className="ml-2 text-blue-600">(Đã có sẵn)</span>
                            )}
                          </p>
                        )}
                        {uploadingMaterial === String(material.id) && (
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
              {loading ? 'Đang cập nhật...' : 'Cập nhật bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

