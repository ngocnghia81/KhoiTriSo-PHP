import { useState, useEffect } from 'react';
import { courseService } from '@/services/courseService';
import type { Course, CourseFilters, PaginatedResponse } from '@/types';

/**
 * Courses Hook
 * Fetch and manage courses
 */
export function useCourses(filters?: CourseFilters) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Course>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await courseService.getAll(filters);
      setCourses(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [JSON.stringify(filters)]);

  return {
    courses,
    pagination,
    loading,
    error,
    refetch: fetchCourses,
  };
}

/**
 * Single Course Hook
 * Fetch course details
 */
export function useCourse(id?: number | string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await courseService.getById(id);
        setCourse(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  return { course, loading, error };
}

/**
 * Featured Courses Hook
 */
export function useFeaturedCourses(limit = 6) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await courseService.getFeatured(limit);
        setCourses(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch featured courses';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [limit]);

  return { courses, loading, error };
}

/**
 * Enrolled Courses Hook
 */
export function useEnrolledCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getEnrolled();
      setCourses(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enrolled courses';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
  };
}
