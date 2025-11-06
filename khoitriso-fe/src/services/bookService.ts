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
    const response = await api.get<ApiResponse<BookChapter[]>>(`/books/${bookId}/chapters`);
    return response.data || [];
  },

  /**
   * Get chapter questions
   * GET /api/books/{bookId}/chapters/{chapterId}/questions
   */
  getChapterQuestions: async (bookId: number, chapterId: number): Promise<Question[]> => {
    const response = await api.get<ApiResponse<Question[]>>(
      `/books/${bookId}/chapters/${chapterId}/questions`
    );
    return response.data || [];
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
};
