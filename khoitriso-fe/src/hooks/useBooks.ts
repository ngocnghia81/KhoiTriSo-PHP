import { useState, useEffect } from 'react';
import { bookService } from '@/services/bookService';
import type { Book, BookFilters, PaginatedResponse } from '@/types';

/**
 * Books Hook
 * Fetch and manage books
 */
export function useBooks(filters?: BookFilters) {
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Book>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookService.getAll(filters);
      setBooks(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch books';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [JSON.stringify(filters)]);

  return {
    books,
    pagination,
    loading,
    error,
    refetch: fetchBooks,
  };
}

/**
 * Single Book Hook
 * Fetch book details
 */
export function useBook(id?: number | string) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchBook = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await bookService.getById(id);
        setBook(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch book';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  return { book, loading, error };
}

/**
 * Featured Books Hook
 */
export function useFeaturedBooks(limit = 6) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await bookService.getFeatured(limit);
        setBooks(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch featured books';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [limit]);

  return { books, loading, error };
}

/**
 * My Books Hook
 * Get user's activated books
 */
export function useMyBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const userBooks = await bookService.getMyBooks();
      const booksData = userBooks.map(ub => ub.book).filter(Boolean) as Book[];
      setBooks(booksData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch my books';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return {
    books,
    loading,
    error,
    refetch: fetchBooks,
  };
}
