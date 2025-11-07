'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Instructor {
  id: number;
  name: string;
  email: string;
}

interface Category {
  id: number;
  name: string;
}

interface EnrolledCourse {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  video_url?: string;
  price: number;
  discount_price?: number;
  level: number;
  duration: number;
  rating: number;
  total_students: number;
  instructor: Instructor;
  category: Category;
  enrolled_at: string;
  completed_at?: string;
}

const levelMap: Record<number, string> = {
  1: 'Cơ bản',
  2: 'Trung bình',
  3: 'Nâng cao',
};

export default function MyLearningPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/my-courses');
      
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setCourses(response.data);
        console.log('Courses set:', response.data);
      } else {
        console.log('Response data is not an array:', response.data);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải khóa học:', error);
      console.error('Error response:', error.response);
      
      // Nếu chưa đăng nhập, chuyển về trang đăng nhập
      if (error.response?.status === 401) {
        router.push('/auth/login?redirect=/my-learning');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'completed') return course.completed_at !== null;
    if (filter === 'in-progress') return course.completed_at === null;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-4">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Khóa học của tôi</h1>
          <p className="text-gray-600">Tiếp tục hành trình học tập của bạn</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 px-1 font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tất cả ({courses.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`pb-3 px-1 font-medium transition-colors ${
              filter === 'in-progress'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đang học ({courses.filter(c => !c.completed_at).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`pb-3 px-1 font-medium transition-colors ${
              filter === 'completed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đã hoàn thành ({courses.filter(c => c.completed_at).length})
          </button>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' 
                  ? 'Chưa có khóa học nào'
                  : filter === 'completed'
                  ? 'Chưa hoàn thành khóa học nào'
                  : 'Chưa có khóa học đang học'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                Khám phá và đăng ký các khóa học để bắt đầu học tập ngay
              </p>
              <Link
                href="/courses"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Khám phá khóa học
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-48 bg-gray-200">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">📚</span>
                    </div>
                  )}
                  {course.completed_at && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Hoàn thành
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Category & Level */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      {course.category?.name}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {levelMap[course.level]}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600">
                    <Link href={`/courses/${course.id}/learn`}>
                      {course.title}
                    </Link>
                  </h3>

                  {/* Instructor */}
                  <p className="text-sm text-gray-600 mb-3">
                    Giảng viên: {course.instructor?.name}
                  </p>

                  {/* Enrolled Date */}
                  <p className="text-xs text-gray-500 mb-4">
                    Đăng ký: {formatDate(course.enrolled_at)}
                  </p>

                  {/* CTA Button */}
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Tiếp tục học
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
