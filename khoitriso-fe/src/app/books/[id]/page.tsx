import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BookDetailClient from './BookDetailClient';

interface Book {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    id: string;
    avatar: string;
    bio: string;
  };
  category: {
    name: string;
    slug: string;
  };
  isbn: string;
  coverImage: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  totalQuestions: number;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  publishedAt: string;
  features: string[];
  chapters: BookChapter[];
  reviews: BookReview[];
  relatedBooks: RelatedBook[];
  tags: string[];
  isOwned?: boolean;
  activationInfo: {
    accessDuration: string;
    videoContent: boolean;
    textSolutions: boolean;
    imageSolutions: boolean;
  };
}

interface BookChapter {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  orderIndex: number;
}

interface BookReview {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

interface RelatedBook {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  price: number;
  originalPrice?: number;
  rating: number;
  slug: string;
}

// Fetch book from API using ID
async function getBook(id: string): Promise<Book | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';
    
    // Get token from cookies or headers if available
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    // Try to get token from cookies (for server-side)
    if (typeof window === 'undefined') {
      // Server-side: token might be in cookies, but we can't access it here
      // The API will handle unauthenticated requests
    }
    
    const response = await fetch(`${apiUrl}/books/${id}`, {
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const book = await response.json();
    
    // Transform API response to match our Book interface
    return {
      id: String(book.id),
      title: book.title,
      description: book.description || '',
      author: {
        name: book.author?.name || 'Tác giả',
        id: String(book.author_id || ''),
        avatar: '/images/authors/default.png',
        bio: book.author?.bio || ''
      },
      category: {
        name: book.category?.name || 'Khác',
        slug: String(book.category_id || '')
      },
      isbn: book.isbn || '',
      coverImage: book.cover_image || '/images/books/default.jpg',
      price: Number(book.price) || 0,
      totalQuestions: book.total_questions || 0,
      rating: book.rating || 0,
      reviewsCount: book.total_reviews || 0,
      isActive: book.is_active,
      publishedAt: book.created_at,
      features: [
        'Video giải bài tập chi tiết cho mỗi câu hỏi',
        'Lời giải bằng text và hình ảnh',
        'Truy cập trong 2 năm sau khi kích hoạt',
        'Tra cứu nhanh theo mã ID câu hỏi',
        'Cập nhật nội dung liên tục',
        'Hỗ trợ học tập 24/7'
      ],
      chapters: book.chapters?.map((ch: any) => ({
        id: String(ch.id),
        title: ch.title,
        description: ch.description || '',
        questionCount: ch.question_count || 0,
        orderIndex: ch.order_index || 0,
      })) || [],
      reviews: [],
      relatedBooks: [],
      tags: [],
      isOwned: book.is_owned || false,
      activationInfo: {
        accessDuration: '2 năm',
        videoContent: true,
        textSolutions: true,
        imageSolutions: true
      }
    };
  } catch (error) {
    console.error('Failed to fetch book:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(id);
  
  if (!book) {
    return {
      title: 'Sách không tồn tại - Khởi Trí Số',
    };
  }

  return {
    title: `${book.title} - Khởi Trí Số`,
    description: book.description.substring(0, 160) + '...',
    keywords: book.tags.join(', '),
    authors: [{ name: book.author.name }],
    openGraph: {
      title: book.title,
      description: book.description.substring(0, 160) + '...',
      images: [book.coverImage],
      type: 'website',
    },
  };
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) {
    notFound();
  }

  return <BookDetailClient book={book} />;
}
