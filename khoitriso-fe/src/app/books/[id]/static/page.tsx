import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpenIcon,
  ShoppingCartIcon,
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { httpClient } from '@/lib/http-client';

interface Book {
  id: number;
  title: string;
  description: string;
  static_page_path?: string;
  author_id: number;
  author?: {
    name: string;
    email?: string;
  };
  category_id: number;
  category?: {
    name: string;
  };
  cover_image?: string;
  price: number;
  isbn?: string;
  language?: string;
  publication_year?: number;
  edition?: string;
  total_questions?: number;
  chapters?: Array<{
    id: number;
    title: string;
    order_index: number;
    question_count?: number;
  }>;
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
export async function generateStaticParams() {
  try {
    // Fetch all active books to generate static pages
    const response = await httpClient.get('books');
    
    if (response.ok && 'data' in response) {
      const responseData = response.data as any;
      const books = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      const params = books
        .filter((book: any) => book.is_active && book.static_page_path)
        .map((book: any) => ({
          id: String(book.id),
        }));
      
      console.log(`Generating ${params.length} static book pages...`);
      return params;
    }
    
    return [];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const bookResponse = await httpClient.get(`books/${params.id}`);
    
    if (!bookResponse.ok || !('data' in bookResponse)) {
      return {
        title: 'Sách không tìm thấy',
      };
    }
    
    // Extract book data from API response
    const responseData = bookResponse.data as any;
    const book = (responseData?.data || responseData) as Book;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Try to get static page content
    let staticPage: StaticPage | null = null;
    if (book.static_page_path) {
      try {
        const staticResponse = await httpClient.get(`static-pages/by-path?path=${encodeURIComponent(book.static_page_path)}`);
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
    
    const title = staticPage?.title || book.title;
    const description = staticPage?.meta_description || book.description?.substring(0, 160) || book.title;
    
    return {
      title: `${title} | Khởi Trí Số`,
      description: description,
      keywords: staticPage?.meta_keywords || `${book.title}, ${book.category?.name || 'Sách'}, ${book.author?.name || ''}`,
      openGraph: {
        title: title,
        description: description,
        images: book.cover_image ? [book.cover_image] : [],
        url: `${siteUrl}/books/${book.id}/static`,
        type: 'book',
      },
      alternates: {
        canonical: `${siteUrl}/books/${book.id}/static`,
      },
    };
  } catch (error) {
    return {
      title: 'Sách không tìm thấy',
    };
  }
}

export default async function BookStaticPage({ params }: { params: { id: string } }) {
  let book: Book | null = null;
  let staticPage: StaticPage | null = null;
  
  // Note: In development mode, this will fetch from backend at runtime.
  // In production build (npm run build), this data is fetched at build time
  // and embedded into static HTML, so backend is not needed at runtime.
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    if (!isProduction) {
      console.log('[DEV MODE] Fetching book data from backend...');
    }
    // Fetch book data
    const bookResponse = await httpClient.get(`books/${params.id}`);
    
    if (!bookResponse.ok || !('data' in bookResponse)) {
      notFound();
    }
    
    // Extract book data from API response
    const responseData = bookResponse.data as any;
    book = (responseData?.data || responseData) as Book;
    
    if (!book || !book.id) {
      notFound();
    }
    
    // Fetch static page content if static_page_path exists
    if (book.static_page_path) {
      try {
        const staticResponse = await httpClient.get(`static-pages/by-path?path=${encodeURIComponent(book.static_page_path)}`);
        if (staticResponse.ok && 'data' in staticResponse) {
          const staticData = staticResponse.data as any;
          if (typeof staticData === 'object' && 'success' in staticData && staticData.success === true && 'data' in staticData) {
            staticPage = staticData.data as StaticPage;
          } else {
            staticPage = staticData as StaticPage;
          }
        }
      } catch (staticError) {
        console.warn('Static page not found, using book data:', staticError);
      }
    }
  } catch (error) {
    console.error('Error fetching book:', error);
    notFound();
  }

  // Use static page content if available, otherwise use book description
  const content = staticPage?.content || (book.description ? `<div class="book-description">${book.description}</div>` : '<p>Nội dung đang được cập nhật...</p>');
  const metaDescription = staticPage?.meta_description || (book.description ? book.description.substring(0, 160) : book.title);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/books"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại danh sách sách
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Book Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {staticPage?.title || book.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                {book.category && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {book.category.name}
                  </span>
                )}
                {book.author && (
                  <span className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {book.author.name}
                  </span>
                )}
                {book.publication_year && (
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {book.publication_year}
                  </span>
                )}
                {book.chapters && book.chapters.length > 0 && (
                  <span className="flex items-center">
                    <BookOpenIcon className="h-4 w-4 mr-1" />
                    {book.chapters.length} chương
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {book.isbn && <div>ISBN: {book.isbn}</div>}
                  {book.language && <div>Ngôn ngữ: {book.language}</div>}
                  {book.edition && <div>Phiên bản: {book.edition}</div>}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {Number(book.price).toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* Static Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div
                className="prose prose-lg max-w-none book-static-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              {book.cover_image && (
                <div className="mb-4">
                  <Image
                    src={book.cover_image}
                    alt={book.title}
                    width={400}
                    height={600}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Number(book.price).toLocaleString('vi-VN')} đ
                  </div>
                  <Link
                    href={`/books/${book.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Xem chi tiết sách
                  </Link>
                </div>

                <div className="pt-4 border-t space-y-3">
                  {book.chapters && book.chapters.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Số chương:</span>
                      <span className="font-semibold">{book.chapters.length}</span>
                    </div>
                  )}
                  {book.total_questions && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Số câu hỏi:</span>
                      <span className="font-semibold">{book.total_questions}</span>
                    </div>
                  )}
                  {book.language && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Ngôn ngữ:</span>
                      <span className="font-semibold">{book.language}</span>
                    </div>
                  )}
                  {book.publication_year && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Năm xuất bản:</span>
                      <span className="font-semibold">{book.publication_year}</span>
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
