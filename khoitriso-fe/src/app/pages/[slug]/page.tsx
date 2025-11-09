import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStaticPageBySlug } from '@/services/staticPages';
import { getSystemSettings } from '@/services/system';

interface PageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const page = await getStaticPageBySlug(params.slug);
    const settings = await getSystemSettings();
    
    const siteName = settings.find((s: any) => s.key === 'site_name')?.value || 'Khởi Trí Số';
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return {
      title: `${page.title} | ${siteName}`,
      description: page.meta_description || page.title,
      keywords: page.meta_keywords?.split(',').map(k => k.trim()) || [],
      openGraph: {
        title: page.title,
        description: page.meta_description || page.title,
        url: `${siteUrl}/pages/${page.slug}`,
        siteName: siteName,
        type: 'website',
        locale: 'vi_VN',
      },
      twitter: {
        card: 'summary_large_image',
        title: page.title,
        description: page.meta_description || page.title,
      },
      alternates: {
        canonical: `${siteUrl}/pages/${page.slug}`,
      },
      robots: {
        index: page.is_published,
        follow: page.is_published,
      },
    };
  } catch (error) {
    return {
      title: 'Trang không tìm thấy',
    };
  }
}

// Generate structured data (JSON-LD)
function generateStructuredData(page: any, settings: any[]) {
  const siteName = settings.find((s: any) => s.key === 'site_name')?.value || 'Khởi Trí Số';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.meta_description || page.title,
    url: `${siteUrl}/pages/${page.slug}`,
    inLanguage: 'vi-VN',
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
    },
    datePublished: page.created_at,
    dateModified: page.updated_at,
    publisher: {
      '@type': 'Organization',
      name: siteName,
    },
  };
}

export default async function StaticPageView({ params }: PageProps) {
  let page;
  let settings;
  
  try {
    page = await getStaticPageBySlug(params.slug);
    settings = await getSystemSettings();
  } catch (error) {
    notFound();
  }

  if (!page || !page.is_published || !page.is_active) {
    notFound();
  }

  const structuredData = generateStructuredData(page, settings);

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <article className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
            {page.meta_description && (
              <p className="text-xl text-gray-600">{page.meta_description}</p>
            )}
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <time dateTime={page.created_at}>
                {new Date(page.created_at).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {page.updated_at !== page.created_at && (
                <>
                  <span className="mx-2">•</span>
                  <span>
                    Cập nhật: {new Date(page.updated_at).toLocaleDateString('vi-VN')}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none bg-white rounded-lg shadow-sm p-8"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </article>
    </>
  );
}

