import { api } from '@/lib/api';
import type { 
  Course,
  Lesson,
  LessonMaterial,
  CourseEnrollment,
  Review,
  Discussion,
  ApiResponse,
  PaginatedResponse,
  CourseFilters
} from '@/types';

/**
 * Course Service
 * Handles all course-related API calls
 */
export const courseService = {
  /**
   * Get all courses with filters
   * GET /api/courses
   */
  getAll: async (filters?: CourseFilters): Promise<PaginatedResponse<Course>> => {
    const response = await api.get<PaginatedResponse<Course>>('/courses', { params: filters });
    return response;
  },

  /**
   * Get course by ID or slug
   * GET /api/courses/{id}
   */
  getById: async (id: number | string): Promise<Course> => {
    const response = await api.get<Course>(`/courses/${id}`);
    return response;
  },

  /**
   * Get featured courses
   * GET /api/courses/featured
   */
  getFeatured: async (limit = 6): Promise<Course[]> => {
    const response = await api.get<ApiResponse<Course[]>>('/courses/featured', { params: { limit } });
    return response.data || [];
  },

  /**
   * Get popular courses
   * GET /api/courses/popular
   */
  getPopular: async (limit = 6): Promise<Course[]> => {
    const response = await api.get<ApiResponse<Course[]>>('/courses/popular', { params: { limit } });
    return response.data || [];
  },

  /**
   * Get course lessons
   * GET /api/courses/{id}/lessons
   */
  getLessons: async (courseId: number): Promise<Lesson[]> => {
    const response = await api.get<ApiResponse<Lesson[]>>(`/courses/${courseId}/lessons`);
    return response.data?.data || [];
  },

  /**
   * Get lesson by ID
   * GET /api/lessons/{id}
   */
  getLessonById: async (lessonId: number): Promise<Lesson> => {
    const response = await api.get<ApiResponse<Lesson>>(`/lessons/${lessonId}`);
    return response.data?.data!;
  },

  /**
   * Get lesson materials
   * GET /api/lessons/{id}/materials
   */
  getLessonMaterials: async (lessonId: number): Promise<LessonMaterial[]> => {
    const response = await api.get<ApiResponse<LessonMaterial[]>>(`/lessons/${lessonId}/materials`);
    return response.data?.data || [];
  },

  /**
   * Enroll in course
   * POST /api/courses/{id}/enroll
   */
  enroll: async (courseId: number): Promise<CourseEnrollment> => {
    const response = await api.post<ApiResponse<CourseEnrollment>>(`/courses/${courseId}/enroll`);
    return response.data?.data!;
  },

  /**
   * Get user's enrolled courses
   * GET /api/courses/enrolled
   */
  getEnrolled: async (): Promise<Course[]> => {
    const response = await api.get<ApiResponse<Course[]>>('/courses/enrolled');
    return response.data?.data || [];
  },

  /**
   * Get course progress
   * GET /api/courses/{id}/progress
   */
  getProgress: async (courseId: number): Promise<CourseEnrollment> => {
    const response = await api.get<ApiResponse<CourseEnrollment>>(`/courses/${courseId}/progress`);
    return response.data?.data!;
  },

  /**
   * Mark lesson as completed
   * POST /api/lessons/{id}/complete
   */
  completeLesson: async (lessonId: number): Promise<void> => {
    await api.post(`/lessons/${lessonId}/complete`);
  },

  /**
   * Get course reviews
   * GET /api/courses/{id}/reviews
   */
  getReviews: async (courseId: number, page = 1): Promise<PaginatedResponse<Review>> => {
    const response = await api.get<PaginatedResponse<Review>>(`/courses/${courseId}/reviews`, { 
      params: { page } 
    });
    return response.data;
  },

  /**
   * Add course review
   * POST /api/courses/{id}/reviews
   */
  addReview: async (courseId: number, data: { rating: number; comment?: string }): Promise<Review> => {
    const response = await api.post<ApiResponse<Review>>(`/courses/${courseId}/reviews`, data);
    return response.data?.data!;
  },

  /**
   * Get lesson discussions
   * GET /api/lessons/{id}/discussions
   */
  getDiscussions: async (lessonId: number): Promise<Discussion[]> => {
    const response = await api.get<ApiResponse<Discussion[]>>(`/lessons/${lessonId}/discussions`);
    return response.data?.data || [];
  },

  /**
   * Add discussion/reply
   * POST /api/lessons/{id}/discussions
   */
  addDiscussion: async (lessonId: number, data: { content: string; parentId?: number }): Promise<Discussion> => {
    const response = await api.post<ApiResponse<Discussion>>(`/lessons/${lessonId}/discussions`, data);
    return response.data?.data!;
  },

  /**
   * Like/unlike discussion
   * POST /api/discussions/{id}/like
   */
  likeDiscussion: async (discussionId: number): Promise<void> => {
    await api.post(`/discussions/${discussionId}/like`);
  },

  /**
   * Search courses
   * GET /api/courses/search
   */
  search: async (query: string): Promise<Course[]> => {
    const response = await api.get<ApiResponse<Course[]>>('/courses/search', { 
      params: { q: query } 
    });
    return response.data?.data || [];
  },

  /**
   * Get instructor courses (for instructor dashboard)
   * GET /api/instructor/courses
   */
  getInstructorCourses: async (): Promise<Course[]> => {
    const response = await api.get<ApiResponse<Course[]>>('/instructor/courses');
    return response.data?.data || [];
  },

  /**
   * Create course (instructor only)
   * POST /api/instructor/courses
   */
  create: async (data: Partial<Course>): Promise<Course> => {
    const response = await api.post<ApiResponse<Course>>('/instructor/courses', data);
    return response.data?.data!;
  },

  /**
   * Update course (instructor only)
   * PUT /api/instructor/courses/{id}
   */
  update: async (id: number, data: Partial<Course>): Promise<Course> => {
    const response = await api.put<ApiResponse<Course>>(`/instructor/courses/${id}`, data);
    return response.data?.data!;
  },

  /**
   * Delete course (instructor only)
   * DELETE /api/instructor/courses/{id}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/instructor/courses/${id}`);
  },
};
