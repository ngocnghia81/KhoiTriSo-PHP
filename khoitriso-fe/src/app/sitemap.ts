import { MetadataRoute } from 'next';
import { httpClient, extractData, isSuccess } from '@/lib/http-client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    // Get all published static pages
    const staticPagesResponse = await httpClient.get('admin/static-pages?isPublished=true&pageSize=1000');
    if (isSuccess(staticPagesResponse)) {
      const data = extractData(staticPagesResponse) as any;
      const pages = data?.data || [];
      
      pages.forEach((page: any) => {
        if (page.is_published && page.is_active) {
          routes.push({
            url: `${baseUrl}/pages/${page.slug}`,
            lastModified: new Date(page.updated_at),
            changeFrequency: 'monthly',
            priority: 0.7,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error fetching static pages for sitemap:', error);
  }

  try {
    // Get all published courses
    const coursesResponse = await httpClient.get('courses?limit=1000');
    if (isSuccess(coursesResponse)) {
      const data = extractData(coursesResponse) as any;
      const courses = data?.data || Array.isArray(data) ? data : [];
      
      (Array.isArray(courses) ? courses : []).forEach((course: any) => {
        if (course.is_published && course.is_active) {
          routes.push({
            url: `${baseUrl}/courses/${course.id}`,
            lastModified: new Date(course.updated_at || course.created_at),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error fetching courses for sitemap:', error);
  }

  try {
    // Get all published books
    const booksResponse = await httpClient.get('books?pageSize=1000');
    if (isSuccess(booksResponse)) {
      const data = extractData(booksResponse) as any;
      const books = data?.data || [];
      
      books.forEach((book: any) => {
        if (book.is_active) {
          routes.push({
            url: `${baseUrl}/books/${book.id}`,
            lastModified: new Date(book.updated_at || book.created_at),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error fetching books for sitemap:', error);
  }

  return routes;
}

