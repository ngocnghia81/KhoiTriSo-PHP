import { api } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  instructorId?: number;
  categoryId?: number;
  level?: string;
  isFree: boolean;
  price: number;
  language?: string;
  requirements?: string[];
  whatYouWillLearn?: string[];
  totalLessons?: number;
  totalStudents?: number;
  rating?: number;
  totalReviews?: number;
  isPublished?: boolean;
  isActive?: boolean;
  approvalStatus?: number;
  instructor?: {
    id: number;
    name: string;
    email: string;
  };
  category?: {
    id: number;
    name: string;
  };
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  courseId?: number;
  course_id?: number;
  title: string;
  description: string;
  videoUrl?: string;
  video_url?: string;
  videoDuration?: number;
  video_duration?: number;
  contentText?: string;
  content_text?: string;
  lessonOrder?: number;
  lesson_order?: number;
  isFree?: boolean;
  is_free?: boolean;
  isPublished?: boolean;
  is_published?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  materials?: LessonMaterial[];
  course?: {
    id: number;
    title: string;
  };
}

export interface LessonMaterial {
  id: number;
  lessonId: number;
  title: string;
  fileName: string;
  filePath: string;
  fileType?: string;
  fileSize?: number;
  downloadCount?: number;
}

export interface LessonDiscussion {
  id: number;
  lessonId?: number;
  userId?: number;
  parentId?: number;
  content: string;
  videoTimestamp?: number;
  video_timestamp?: number; // Support both formats
  isInstructor?: boolean;
  is_instructor?: boolean; // Support both formats
  likeCount?: number;
  like_count?: number; // Support both formats
  createdAt?: string;
  created_at?: string; // Support both formats
  user?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  replies?: LessonDiscussion[];
}

/**
 * Course Service
 * Handles all course-related API calls
 */
export const courseService = {
  /**
   * List courses for admin with filters, search, and pagination
   * GET /api/admin/courses
   */
  listCoursesAdmin: async (params?: {
    search?: string;
    categoryId?: number;
    instructorId?: number;
    status?: string;
    approvalStatus?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Course[]; pagination: any }> => {
    const response = await api.get<any>('/admin/courses', { params });
    // API returns: { success: true, data: Course[], pagination: {...} }
    if (response.success && response.data) {
      return {
        data: Array.isArray(response.data) ? response.data : [],
        pagination: response.pagination || {},
      };
    }
    throw new Error(response.message || 'Failed to list courses');
  },

  /**
   * Get course detail for admin
   * GET /api/admin/courses/{id}
   */
  getCourseAdmin: async (id: number): Promise<Course> => {
    try {
      const response = await api.get<ApiResponse<Course>>(`/admin/courses/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to get course');
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Course not found';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Create course (Admin only)
   * POST /api/admin/courses
   */
  createCourse: async (data: {
    title: string;
    description: string;
    thumbnail?: string;
    instructorId?: number;
    categoryId?: number;
    level?: string;
    isFree?: boolean;
    price?: number;
    language?: string;
    requirements?: string[];
    whatYouWillLearn?: string[];
  }): Promise<Course> => {
    const response = await api.post<ApiResponse<Course>>('/admin/courses', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create course');
  },

  /**
   * Update course (Admin only)
   * PUT /api/admin/courses/{id}
   */
  updateCourse: async (id: number, data: Partial<Course>): Promise<Course> => {
    const response = await api.put<ApiResponse<Course>>(`/admin/courses/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update course');
  },

  /**
   * Delete course (Admin only)
   * DELETE /api/admin/courses/{id}
   */
  deleteCourse: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/courses/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete course');
    }
  },

  /**
   * Get lesson detail for admin
   * GET /api/admin/lessons/{id}
   */
  getLessonAdmin: async (id: number): Promise<Lesson> => {
    try {
      const response = await api.get<ApiResponse<any>>(`/admin/lessons/${id}`);
      if (response.success && response.data) {
        const lesson = response.data;
        // Map snake_case to camelCase for consistency
        return {
          ...lesson,
          videoUrl: lesson.video_url || lesson.videoUrl,
          videoDuration: lesson.video_duration || lesson.videoDuration,
          contentText: lesson.content_text || lesson.contentText,
          lessonOrder: lesson.lesson_order || lesson.lessonOrder,
          isFree: lesson.is_free !== undefined ? lesson.is_free : lesson.isFree,
          isPublished: lesson.is_published !== undefined ? lesson.is_published : lesson.isPublished,
          courseId: lesson.course_id || lesson.courseId,
        };
      }
      throw new Error(response.message || 'Failed to get lesson');
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Lesson not found';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Create lesson (Admin only)
   * POST /api/admin/courses/{courseId}/lessons
   */
  createLesson: async (courseId: number, data: {
    title: string;
    description: string;
    videoUrl: string;
    videoDuration?: number;
    contentText?: string;
    lessonOrder?: number;
    isFree?: boolean;
    isPublished?: boolean;
  }): Promise<Lesson> => {
    const response = await api.post<ApiResponse<Lesson>>(`/admin/courses/${courseId}/lessons`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create lesson');
  },

  /**
   * Update lesson (Admin only)
   * PUT /api/admin/lessons/{id}
   */
  updateLesson: async (id: number, data: Partial<Lesson>): Promise<Lesson> => {
    const response = await api.put<ApiResponse<Lesson>>(`/admin/lessons/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update lesson');
  },

  /**
   * Delete lesson (Admin only) - Soft delete
   * DELETE /api/admin/lessons/{id}
   */
  deleteLesson: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/lessons/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete lesson');
    }
  },

  /**
   * Restore lesson (Admin only)
   * POST /api/admin/lessons/{id}/restore
   */
  restoreLesson: async (id: number): Promise<void> => {
    const response = await api.post<ApiResponse<null>>(`/admin/lessons/${id}/restore`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to restore lesson');
    }
  },

  /**
   * Upload material for lesson (Admin only)
   * POST /api/admin/lessons/{lessonId}/materials
   */
  uploadLessonMaterial: async (lessonId: number, data: {
    title: string;
    fileUrl: string;
    fileName: string;
    fileType?: string;
    fileSize?: number;
  }): Promise<LessonMaterial> => {
    const response = await api.post<ApiResponse<LessonMaterial>>(`/admin/lessons/${lessonId}/materials`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to upload material');
  },

  /**
   * Delete material (Admin only)
   * DELETE /api/admin/materials/{id}
   */
  deleteLessonMaterial: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/materials/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete material');
    }
  },

  /**
   * Get lesson discussions/questions (Admin only)
   * GET /api/admin/lessons/{lessonId}/discussions
   */
  getLessonDiscussions: async (lessonId: number, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<LessonDiscussion>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<LessonDiscussion>>>(`/admin/lessons/${lessonId}/discussions`, { params });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get discussions');
  },

  /**
   * Reply to discussion as instructor/admin
   * POST /api/admin/lessons/{lessonId}/discussions/{discussionId}/reply
   */
  replyToDiscussion: async (lessonId: number, discussionId: number, content: string, videoTimestamp?: number): Promise<LessonDiscussion> => {
    const payload: { content: string; videoTimestamp?: number } = { content };
    if (videoTimestamp !== undefined && videoTimestamp !== null) {
      payload.videoTimestamp = videoTimestamp;
    }
    const response = await api.post<ApiResponse<LessonDiscussion>>(`/admin/lessons/${lessonId}/discussions/${discussionId}/reply`, payload);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to reply to discussion');
  },

  /**
   * Get course enrollments (students who enrolled)
   * GET /api/admin/courses/{id}/enrollments
   */
  getCourseEnrollments: async (courseId: number, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>(`/admin/courses/${courseId}/enrollments`, { params });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get enrollments');
  },

  /**
   * Get course revenue statistics
   * GET /api/admin/courses/{courseId}/revenue
   */
  getCourseRevenue: async (courseId: number, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/admin/courses/${courseId}/revenue`, { params });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get revenue');
  },

  /**
   * Get all courses revenue statistics
   * GET /api/admin/courses/revenue
   */
  getAllCoursesRevenue: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/admin/courses/revenue`, { params });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get revenue');
  },

  /**
   * Get course analytics
   * GET /api/analytics/courses/{id}
   */
  getCourseAnalytics: async (courseId: number): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/analytics/courses/${courseId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get analytics');
  },

  /**
   * Get total revenue (all courses + books)
   * GET /api/admin/revenue/total
   */
  getTotalRevenue: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/admin/revenue/total`, { params });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get total revenue');
  },
};
