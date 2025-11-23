import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  BookOpenIcon,
  ShoppingCartIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { httpClient } from '@/lib/http-client';

interface Course {
  id: number;
  title: string;
  description: string;
  static_page_path?: string;
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
}

interface StaticPage {
  id: number | null;
  slug: string;
  title: string;
  meta_description?: string;
  meta_keywords?: string;
  content: string;
  template: string;
  is_published: boolean;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Force static generation - pages will be generated at build time
export const dynamic = 'force-static';
export const dynamicParams = false; // Return 404 for unknown routes

// Generate static params at build time
// Note: This requires backend to be running during build
export async function generateStaticParams() {
  try {
    // Fetch all active courses to generate static pages
    // During build, this will fetch from backend and generate HTML files
    const response = await httpClient.get('courses');
    
    if (response.ok && 'data' in response) {
      const responseData = response.data as any;
      const courses = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      const params = courses
        .filter((course: any) => course.is_active && course.is_published && course.static_page_path)
        .map((course: any) => ({
          id: String(course.id),
        }));
      
      console.log(`Generating ${params.length} static course pages...`);
      return params;
    }
    
    return [];
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return empty array if backend is not available during build
    // Pages will be generated on-demand if dynamicParams is true
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const courseResponse = await httpClient.get(`courses/${params.id}`);
    
    if (!courseResponse.ok || !('data' in courseResponse)) {
      return {
        title: 'Khóa học không tìm thấy',
      };
    }
    
    // Extract course data from API response
    const responseData = courseResponse.data as any;
    const course = (responseData?.data || responseData) as Course;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Try to get static page content
    let staticPage: StaticPage | null = null;
    if (course.static_page_path) {
      try {
        const staticResponse = await httpClient.get(`static-pages/by-path?path=${encodeURIComponent(course.static_page_path)}`);
        if (staticResponse.ok && 'data' in staticResponse) {
          const staticData = staticResponse.data as any;
          if (typeof staticData === 'object' && 'success' in staticData && staticData.success === true && 'data' in staticData) {
            staticPage = staticData.data as StaticPage;
          } else {
            staticPage = staticData as StaticPage;
          }
        }
      } catch (e) {
        // Ignore static page fetch errors
      }
    }
    
    const title = staticPage?.title || course.title;
    const description = staticPage?.meta_description || course.description?.substring(0, 160) || course.title;
    
    return {
      title: `${title} | Khởi Trí Số`,
      description: description,
      keywords: staticPage?.meta_keywords || `${course.title}, ${course.category?.name || 'Khóa học'}`,
      openGraph: {
        title: title,
        description: description,
        images: course.thumbnail ? [course.thumbnail] : [],
        url: `${siteUrl}/courses/${course.id}/static`,
        type: 'website',
      },
      alternates: {
        canonical: `${siteUrl}/courses/${course.id}/static`,
      },
    };
  } catch (error) {
    return {
      title: 'Khóa học không tìm thấy',
    };
  }
}

export default async function CourseStaticPage({ params }: { params: { id: string } }) {
  let course: Course | null = null;
  let staticPage: StaticPage | null = null;
  
  // Note: In development mode, this will fetch from backend at runtime.
  // In production build (npm run build), this data is fetched at build time
  // and embedded into static HTML, so backend is not needed at runtime.
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    if (!isProduction) {
      console.log('[DEV MODE] Fetching course data from backend...');
    }
    // Fetch course data
    const courseResponse = await httpClient.get(`courses/${params.id}`);
    
    if (!courseResponse.ok || !('data' in courseResponse)) {
      notFound();
    }
    
    // Extract course data from API response
    const responseData = courseResponse.data as any;
    course = (responseData?.data || responseData) as Course;
    
    if (!course || !course.id) {
      notFound();
    }
    
    // Fetch static page content if static_page_path exists
    if (course.static_page_path) {
      try {
        const staticResponse = await httpClient.get(`static-pages/by-path?path=${encodeURIComponent(course.static_page_path)}`);
        if (staticResponse.ok && 'data' in staticResponse) {
          const staticData = staticResponse.data as any;
          // Handle both wrapped and direct response formats
          if (typeof staticData === 'object' && 'success' in staticData && staticData.success === true && 'data' in staticData) {
            staticPage = staticData.data as StaticPage;
          } else {
            staticPage = staticData as StaticPage;
          }
        }
      } catch (staticError) {
        console.warn('Static page not found, using course data:', staticError);
        // Continue without static page - will use course description
      }
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    notFound();
  }

  // Use static page content if available, otherwise use course description
  const content = staticPage?.content || (course.description ? `<div class="course-description">${course.description}</div>` : '<p>Nội dung đang được cập nhật...</p>');
  const metaDescription = staticPage?.meta_description || (course.description ? course.description.substring(0, 160) : course.title);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại danh sách khóa học
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {staticPage?.title || course.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                {course.category && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {course.category.name}
                  </span>
                )}
                {course.instructor && (
                  <span className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    {course.instructor.name}
                  </span>
                )}
                <span className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {course.estimated_duration || 0} giờ
                </span>
                <span className="flex items-center">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  {course.total_lessons || 0} bài học
                </span>
              </div>

              {/* Price and Rating */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {course.rating > 0 && (
                    <>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          i < Math.floor(course.rating) ? (
                            <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                          )
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {course.rating.toFixed(1)} ({course.total_reviews} đánh giá)
                      </span>
                    </>
                  )}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {course.is_free ? 'Miễn phí' : `${Number(course.price).toLocaleString('vi-VN')} đ`}
                </div>
              </div>
            </div>

            {/* Static Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div
                className="prose prose-lg max-w-none course-static-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              {course.thumbnail && (
                <div className="mb-4">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    width={400}
                    height={225}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {course.is_free ? 'Miễn phí' : `${Number(course.price).toLocaleString('vi-VN')} đ`}
                  </div>
                  <Link
                    href={`/courses/${course.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Xem chi tiết khóa học
                  </Link>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Học viên:</span>
                    <span className="font-semibold">{course.total_students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Bài học:</span>
                    <span className="font-semibold">{course.total_lessons || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Thời lượng:</span>
                    <span className="font-semibold">{course.estimated_duration || 0} giờ</span>
                  </div>
                  {course.rating > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Đánh giá:</span>
                      <span className="font-semibold">{course.rating.toFixed(1)}/5</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
