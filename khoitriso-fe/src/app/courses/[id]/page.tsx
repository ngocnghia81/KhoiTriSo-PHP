'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  BookOpenIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { requireAuth, handleApiResponse } from '@/utils/authCheck';
import { httpClient } from '@/lib/http-client';
import { getCourse, enrollCourse } from '@/services/courses';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  instructor?: {
    name: string;
    avatar?: string;
  };
  category_id: number;
  category?: {
    name: string;
  };
  thumbnail?: string;
  price: number;
  is_free: boolean;
  estimated_duration?: number;
  total_students: number;
  total_lessons?: number;
  rating: number;
  total_reviews: number;
  is_published: boolean;
  lessons?: Array<{
    id: number | string;
    title: string;
    lesson_order: number;
    video_url?: string;
    is_free?: boolean;
    materials?: Array<{ id: number | string; title: string; file_path: string; file_name: string }>;
  }>;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  // Helper: detect YouTube links and return embeddable URL
  const getYouTubeEmbedUrl = (url?: string | null): string | null => {
    if (!url) return null;
    try {
      // Match common YouTube URL patterns and extract video id
      const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-_-]{11})/);
      if (m && m[1]) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
    } catch (e) {
      // ignore
    }
    return null;
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        // Backend returns course directly (not wrapped in success/data)
        const response = await httpClient.get(`courses/${params.id}`);

        console.log('Course API response:', response);

        if (response.ok) {
          // Backend returns course directly (not wrapped in success/data)
          // response.data is the course object itself
          const courseData = response.data as any;

          // Check if it's actually a course object (has id and title)
          if (courseData && courseData.id && courseData.title) {
            console.log('Course data:', courseData);
            setCourse(courseData);
          } else {
            console.error('Invalid course data:', courseData);
            notFound();
          }
        } else {
          console.error('Failed to fetch course:', response);
          // Check if it's 404
          if (response.status === 404) {
            notFound();
          } else {
            // Other errors, still show not found
            notFound();
          }
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCourse();
    }
  }, [params.id]);

  const handleEnroll = async () => {
    // Check authentication
    if (!requireAuth('Vui lòng đăng nhập để học khóa học này.')) {
      return;
    }

    if (!course) {
      return;
    }

    try {
      const response = await enrollCourse(course.id);

      if (response) {
        // Redirect to learn page
        router.push(`/courses/${course.id}/learn`);
      }
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      alert(error?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const addToCart = async () => {
    // Check authentication
    if (!requireAuth('Vui lòng đăng nhập để thêm vào giỏ hàng.')) {
      return;
    }

    if (!course) {
      return;
    }

    try {
      const response = await httpClient.post('cart', {
        item_id: course.id,
        item_type: 1, // 1 = course
        quantity: 1
      });

      if (response.ok) {
        if (confirm('Đã thêm vào giỏ hàng! Đi đến giỏ hàng?')) {
          router.push('/cart');
        }
      } else {
        const errorData = response.error as any;
        alert(errorData?.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert(error?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!course) {
    notFound();
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Image */}
      <div className="relative h-96 bg-gray-900">
        <Image
          src={course.thumbnail || '/images/course/course-1/1.png'}
          alt={course.title}
          fill
          className="object-cover opacity-60"
          unoptimized={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12">
            <div className="text-white">
              {course.category && (
                <span className="inline-block px-3 py-1 bg-blue-600 text-sm font-semibold rounded-full mb-4">
                  {course.category.name}
                </span>
              )}
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {course.title}
              </h1>
              {course.instructor && (
                <p className="text-xl text-gray-200 mb-4">
                  Giảng viên: {course.instructor.name}
                </p>
              )}
              <div className="flex items-center space-x-6 text-gray-200">
                <div className="flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <span className="font-semibold">
                    {typeof course.rating === 'number' ? course.rating.toFixed(2) : (parseFloat(course.rating) || 0).toFixed(2)}
                  </span>
                  <span className="ml-1">({(course.total_reviews || 0).toLocaleString('vi-VN')} đánh giá)</span>
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-1" />
                  <span>{(course.total_students || 0).toLocaleString('vi-VN')} học viên</span>
                </div>
                {course.estimated_duration && (
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-1" />
                    <span>{course.estimated_duration}h</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Về khóa học này
              </h2>
              {course.description && (
                <div 
                  className="prose prose-lg max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              )}

              {/* Preview: show lesson 0 (lesson_order = 1) if available */}
              {course.lessons && course.lessons.length > 0 && (
                (() => {
                  const lesson0 = course.lessons.find((l) => Number(l.lesson_order) === 0) || course.lessons[0];
                  if (!lesson0) return null;
                  const youtubeEmbed = getYouTubeEmbedUrl(lesson0.video_url ?? undefined);
                  const videoSrc = !youtubeEmbed && lesson0.video_url
                    ? (lesson0.video_url.startsWith('http') || lesson0.video_url.startsWith('/') ? lesson0.video_url : `/storage/${lesson0.video_url}`)
                    : null;

                  return (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">Xem thử: {lesson0.title || 'Bài giới thiệu'}</h3>
                      {youtubeEmbed ? (
                        <div className="w-full rounded-md overflow-hidden">
                          <div className="relative" style={{ paddingTop: '56.25%' }}>
                            <iframe
                              src={youtubeEmbed}
                              title={lesson0.title || 'Video giới thiệu'}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute top-0 left-0 w-full h-full border-0"
                            />
                          </div>
                        </div>
                      ) : videoSrc ? (
                        <div className="w-full bg-black rounded-md overflow-hidden">
                          <video controls className="w-full h-56 bg-black">
                            <source src={videoSrc} />
                            Trình duyệt của bạn không hỗ trợ thẻ video.
                          </video>
                          <div className="mt-2 text-sm text-gray-400 truncate">Nguồn: <a className="underline text-green-500" href={videoSrc} target="_blank" rel="noreferrer">{videoSrc}</a></div>
                        </div>
                      ) : (lesson0.materials && lesson0.materials.length > 0) ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Tài liệu kèm theo:</p>
                          {lesson0.materials.map(m => (
                            <div key={m.id} className="text-sm">
                              <a className="text-green-600 underline" href={m.file_path ? (m.file_path.startsWith('http') ? m.file_path : `/storage/${m.file_path}`) : '#'} target="_blank" rel="noreferrer">{m.title || m.file_name}</a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Không có video thử nghiệm hoặc tài liệu để xem trước cho bài này.</p>
                      )}

                      {/* no action button - only preview video/material shown */}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Course Stats */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Thông tin khóa học
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center">
                  <BookOpenIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Số bài học</p>
                    <p className="text-xl font-bold text-gray-900">{course.total_lessons || 0} bài</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Thời lượng</p>
                    <p className="text-xl font-bold text-gray-900">
                      {course.estimated_duration ? `${course.estimated_duration}h` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Học viên</p>
                    <p className="text-xl font-bold text-gray-900">{(course.total_students || 0).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Đánh giá</p>
                    <p className="text-xl font-bold text-gray-900">
                      {typeof course.rating === 'number' ? course.rating.toFixed(2) : (parseFloat(course.rating) || 0).toFixed(2)} ⭐
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Price & CTA */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
              <div className="mb-6">
                {course.is_free || course.price === 0 ? (
                  <div>
                    <p className="text-4xl font-bold text-green-600 mb-2">
                      Miễn phí
                    </p>
                    <p className="text-gray-600">Học ngay không mất phí</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-4xl font-bold text-blue-600 mb-2">
                      {course.price.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-gray-600">Thanh toán một lần</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {course.is_free || course.price === 0 ? (
                  <button
                    onClick={handleEnroll}
                    className="w-full px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Học ngay miễn phí
                  </button>
                ) : (
                  <button
                    onClick={addToCart}
                    className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <ShoppingCartIcon className="h-6 w-6 mr-2" />
                    Thêm vào giỏ hàng
                  </button>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Khóa học bao gồm:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    Truy cập trọn đời
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    {course.total_lessons || 0} bài học video
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    Tài liệu học tập
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    Chứng chỉ hoàn thành
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
