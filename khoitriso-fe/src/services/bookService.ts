import { api } from '@/lib/api';
import type { 
  Book,
  BookChapter,
  Question,
  BookActivationCode,
  UserBook,
  Review,
  ApiResponse,
  PaginatedResponse,
  BookFilters
} from '@/types';

/**
 * Book Service
 * Handles all book-related API calls
 */
export const bookService = {
  /**
   * Get all books with filters
   * GET /api/books
   */
  getAll: async (filters?: BookFilters): Promise<PaginatedResponse<Book>> => {
    const response = await api.get<PaginatedResponse<Book>>('/books', { params: filters });
    return response;
  },

  /**
   * Get book by ID or slug
   * GET /api/books/{id}
   */
  getById: async (id: number | string): Promise<Book> => {
    const response = await api.get<Book>(`/books/${id}`);
    return response;
  },

  /**
   * Get featured books
   * GET /api/books/featured
   */
  getFeatured: async (limit = 6): Promise<Book[]> => {
    const response = await api.get<ApiResponse<Book[]>>('/books/featured', { params: { limit } });
    return response.data || [];
  },

  /**
   * Get popular books
   * GET /api/books/popular
   */
  getPopular: async (limit = 6): Promise<Book[]> => {
    const response = await api.get<ApiResponse<Book[]>>('/books/popular', { params: { limit } });
    return response.data || [];
  },

  /**
   * Get book chapters
   * GET /api/books/{id}/chapters
   */
  getChapters: async (bookId: number): Promise<BookChapter[]> => {
    try {
      const response = await api.get<any>(`/books/${bookId}/chapters`);
      // Backend returns { chapters: [...] } not { success: true, data: [...] }
      if (response.chapters && Array.isArray(response.chapters)) {
        return response.chapters;
      }
      // Fallback for ApiResponse format
      if (response.success && response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  },

  /**
   * Get chapter questions
   * GET /api/books/{bookId}/chapters/{chapterId}/questions
   * For admin: GET /api/admin/books/{bookId}/chapters/{chapterId}/questions
   */
  getChapterQuestions: async (bookId: number, chapterId: number, useAdminEndpoint: boolean = false): Promise<Question[]> => {
    try {
      const endpoint = useAdminEndpoint 
        ? `/admin/books/${bookId}/chapters/${chapterId}/questions`
        : `/books/${bookId}/chapters/${chapterId}/questions`;
      
      const response = await api.get<any>(endpoint);
      
      // Admin endpoint returns { success: true, data: { chapter: {...}, questions: [...] } }
      if (useAdminEndpoint && response.success && response.data) {
        if (response.data.questions && Array.isArray(response.data.questions)) {
          return response.data.questions;
        }
      }
      
      // Regular endpoint returns { chapter: {...}, questions: [...] } or { success: true, data: { questions: [...] } }
      if (response.questions && Array.isArray(response.questions)) {
        return response.questions;
      }
      // Fallback for ApiResponse format
      if (response.success && response.data && response.data.questions && Array.isArray(response.data.questions)) {
        return response.data.questions;
      }
      if (response.success && response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching chapter questions:', error);
      // If 403 (forbidden - book not owned), try admin endpoint if not already using it
      if (error.response?.status === 403 && !useAdminEndpoint) {
        console.warn('User does not own book, trying admin endpoint');
        return bookService.getChapterQuestions(bookId, chapterId, true);
      }
      throw error;
    }
  },

  /**
   * Get user's books
   * GET /api/books/my-books
   */
  getMyBooks: async (): Promise<UserBook[]> => {
    const response = await api.get<ApiResponse<UserBook[]>>('/books/my-books');
    return response.data || [];
  },

  /**
   * Validate activation code
   * POST /api/books/activation-codes/validate
   */
  validateCode: async (code: string): Promise<BookActivationCode> => {
    const response = await api.post<ApiResponse<BookActivationCode>>(
      '/books/activation-codes/validate',
      { code }
    );
    return response.data!;
  },

  /**
   * Activate book with code
   * POST /api/books/activation-codes/activate
   */
  activateCode: async (code: string): Promise<UserBook> => {
    const response = await api.post<ApiResponse<UserBook>>(
      '/books/activation-codes/activate',
      { code }
    );
    return response.data!;
  },

  /**
   * Get book reviews
   * GET /api/books/{id}/reviews
   */
  getReviews: async (bookId: number, page = 1): Promise<PaginatedResponse<Review>> => {
    const response = await api.get<PaginatedResponse<Review>>(`/books/${bookId}/reviews`, { 
      params: { page } 
    });
    return response;
  },

  /**
   * Add book review
   * POST /api/books/{id}/reviews
   */
  addReview: async (bookId: number, data: { rating: number; comment?: string }): Promise<Review> => {
    const response = await api.post<ApiResponse<Review>>(`/books/${bookId}/reviews`, data);
    return response.data!;
  },

  /**
   * Search books
   * GET /api/books/search
   */
  search: async (query: string): Promise<Book[]> => {
    const response = await api.get<ApiResponse<Book[]>>('/books/search', { 
      params: { q: query } 
    });
    return response.data || [];
  },

  /**
   * Generate activation codes (Admin only)
   * POST /api/admin/books/{id}/activation-codes/generate
   */
  generateCodes: async (bookId: number, data: {
    quantity: number;
    type: 'single' | 'multiple';
    maxActivations?: number;
    expiresAt?: string;
  }): Promise<BookActivationCode[]> => {
    const response = await api.post<ApiResponse<BookActivationCode[]>>(
      `/admin/books/${bookId}/activation-codes/generate`,
      data
    );
    return response.data || [];
  },

  /**
   * Get book activation codes (Admin only)
   * GET /api/admin/books/{id}/activation-codes
   */
  getActivationCodes: async (bookId: number): Promise<BookActivationCode[]> => {
    const response = await api.get<ApiResponse<BookActivationCode[]>>(
      `/admin/books/${bookId}/activation-codes`
    );
    return response.data || [];
  },

  /**
   * Create book (Admin only)
   * POST /api/admin/books
   */
  createBook: async (data: {
    title: string;
    description: string;
    coverImage: string;
    price: number;
    categoryId?: number;
    language?: string;
    publicationYear?: number;
    edition?: string;
    authorId?: number;
    isbn?: string; // Optional, will be auto-generated if not provided
  }): Promise<Book> => {
    const response = await api.post<ApiResponse<Book>>('/admin/books', data);
    // Backend returns { success: true, data: {...}, message: "..." }
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create book');
  },

  /**
   * Create chapter for book (Admin only)
   * POST /api/admin/books/{bookId}/chapters
   */
  createChapter: async (bookId: number, data: {
    title: string;
    description: string;
    orderIndex?: number;
  }): Promise<BookChapter> => {
    const response = await api.post<ApiResponse<BookChapter>>(
      `/admin/books/${bookId}/chapters`,
      data
    );
    // Backend returns { success: true, data: {...}, message: "..." }
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create chapter');
  },

  /**
   * List books for admin with filters, search, and pagination
   * GET /api/admin/books
   */
  listBooksAdmin: async (params?: {
    search?: string;
    categoryId?: number;
    isActive?: boolean;
    approvalStatus?: number;
    authorId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<Book>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Book>>>('/admin/books', { params });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to list books');
  },

  /**
   * Get book detail for admin
   * GET /api/admin/books/{id}
   */
  getBookAdmin: async (id: number): Promise<Book> => {
    try {
      const response = await api.get<ApiResponse<Book>>(`/admin/books/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to get book');
    } catch (error: any) {
      // Handle 404 or not found errors
      if (error.response?.status === 404 || error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Book not found';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Update book for admin
   * PUT /api/admin/books/{id}
   */
  updateBook: async (id: number, data: {
    title?: string;
    description?: string;
    isbn?: string;
    coverImage?: string;
    price?: number;
    categoryId?: number | null;
    language?: string;
    publicationYear?: number;
    edition?: string;
    authorId?: number;
    isActive?: boolean;
    approvalStatus?: number;
  }): Promise<Book> => {
    const response = await api.put<ApiResponse<Book>>(`/admin/books/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update book');
  },

  /**
   * Delete book for admin
   * DELETE /api/admin/books/{id}
   */
  deleteBook: async (id: number): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<void>>(`/admin/books/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete book');
      }
    } catch (error: any) {
      // Extract error message from API response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message) {
        throw error;
      }
      throw new Error('Failed to delete book');
    }
  },

  /**
   * Create questions for chapter
   * POST /api/admin/books/{bookId}/chapters/{chapterId}/questions
   */
  createChapterQuestions: async (
    bookId: number,
    chapterId: number,
    questions: Array<{
      content: string;
      type: 'multiple_choice' | 'essay';
      options?: Array<{ text: string; isCorrect: boolean }>;
      explanation?: string;
      correctAnswer?: string;
      solutionVideo?: string;
      solutionType?: 'text' | 'video' | 'latex';
    }>
  ): Promise<{ questions: any[]; count: number }> => {
    const response = await api.post<ApiResponse<{ questions: any[]; count: number }>>(
      `/admin/books/${bookId}/chapters/${chapterId}/questions`,
      { questions }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create questions');
  },
};
