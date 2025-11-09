'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { createCourse } from '@/services/courses';
import { getCategories, Category } from '@/services/categories';
import { uploadFile } from '@/services/uploads';
import { useToast } from '@/components/ToastProvider';
import RichTextEditor from '@/components/RichTextEditor';

export default function CreateCoursePage() {
  const router = useRouter();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    categoryId: '',
    level: '1',
    isFree: false,
    price: '0',
    staticPagePath: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const cats = await getCategories();
        // Filter only parent categories (no parent_id) for dropdown
        const parentCategories = cats.filter((cat: Category) => !cat.parent_id);
        setCategories(parentCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        notify('Lỗi tải danh mục', 'error');
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [notify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate staticPagePath from title if not provided
      const staticPagePath = formData.staticPagePath || 
        `/courses/${formData.title.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')}`;

      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        thumbnail: formData.thumbnail.trim(),
        categoryId: parseInt(formData.categoryId),
        level: parseInt(formData.level),
        isFree: formData.isFree,
        price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
        staticPagePath: staticPagePath,
      };

      await createCourse(courseData);
      notify('Tạo khóa học thành công', 'success');
      router.push('/dashboard/courses');
    } catch (error: any) {
      console.error('Error creating course:', error);
      notify(error.message || 'Lỗi tạo khóa học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notify('Vui lòng chọn file hình ảnh', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB', 'error');
      return;
    }

    setThumbnailFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, 'courses');
      setFormData(prev => ({
        ...prev,
        thumbnail: fileUrl,
      }));
      notify('Upload hình ảnh thành công', 'success');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      notify(error.message || 'Lỗi upload hình ảnh', 'error');
      setThumbnailFile(null);
      setThumbnailPreview('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Quay lại
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Tạo khóa học mới</h1>
          <p className="mt-2 text-sm text-gray-700">
            Điền thông tin để tạo khóa học mới trong hệ thống
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Tiêu đề khóa học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Ví dụ: Toán học lớp 12 - Nâng cao"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Mô tả chi tiết về khóa học... (Sử dụng thanh công cụ để định dạng văn bản)"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                  Cấp độ <span className="text-red-500">*</span>
                </label>
                <select
                  id="level"
                  name="level"
                  required
                  value={formData.level}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="1">Cơ bản</option>
                  <option value="2">Trung bình</option>
                  <option value="3">Nâng cao</option>
                </select>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh đại diện</h2>
            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
                Chọn hình ảnh <span className="text-red-500">*</span>
              </label>
              
              {/* Preview */}
              <div className="mt-1 mb-4">
                {(thumbnailPreview || formData.thumbnail) ? (
                  <div className="relative inline-block">
                    <img
                      src={thumbnailPreview || formData.thumbnail}
                      alt="Thumbnail preview"
                      className="h-48 w-48 rounded-md object-cover border border-gray-300"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
                        <div className="text-white text-sm">Đang upload...</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 w-48 rounded-md bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* File input */}
              <div>
                <input
                  type="file"
                  id="thumbnail"
                  name="thumbnail"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Chọn file hình ảnh (JPG, PNG, GIF) tối đa 5MB
                </p>
              </div>

              {/* Manual URL input (optional) */}
              <div className="mt-4">
                <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Hoặc nhập URL hình ảnh
                </label>
                <input
                  type="url"
                  id="thumbnailUrl"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Giá cả</h2>
            <div className="space-y-4">
              {/* Is Free */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFree"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isFree" className="ml-2 block text-sm text-gray-900">
                  Khóa học miễn phí
                </label>
              </div>

              {/* Price */}
              {!formData.isFree && (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Giá (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required={!formData.isFree}
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="299000"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Advanced */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tùy chọn nâng cao</h2>
            <div>
              <label htmlFor="staticPagePath" className="block text-sm font-medium text-gray-700">
                Đường dẫn trang tĩnh
              </label>
              <input
                type="text"
                id="staticPagePath"
                name="staticPagePath"
                value={formData.staticPagePath}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="/courses/toan-hoc-lop-12"
              />
              <p className="mt-2 text-sm text-gray-500">
                Để trống sẽ tự động tạo từ tiêu đề
              </p>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang tạo...' : 'Tạo khóa học'}
          </button>
        </div>
      </form>
    </div>
  );
}

