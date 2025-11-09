import { Metadata } from 'next';
import { getSystemSettings } from '@/services/system';

// Generate metadata for SEO - Template example
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  const siteName = settings.find((s: any) => s.key === 'site_name')?.value || 'Khởi Trí Số';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return {
    title: `Template SEO - ${siteName}`,
    description: 'Template mẫu cho trang tĩnh với đầy đủ tính năng SEO: metadata, Open Graph, Twitter Cards, Structured Data, và nhiều hơn nữa.',
    keywords: ['SEO', 'template', 'metadata', 'Open Graph', 'Twitter Cards', 'Structured Data', 'Schema.org'],
    authors: [{ name: 'Khởi Trí Số Team' }],
    openGraph: {
      title: `Template SEO - ${siteName}`,
      description: 'Template mẫu cho trang tĩnh với đầy đủ tính năng SEO',
      url: `${siteUrl}/pages/seo-template`,
      siteName: siteName,
      type: 'website',
      locale: 'vi_VN',
      images: [
        {
          url: `${siteUrl}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'Khởi Trí Số - Template SEO',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Template SEO - ${siteName}`,
      description: 'Template mẫu cho trang tĩnh với đầy đủ tính năng SEO',
      images: [`${siteUrl}/images/twitter-card.jpg`],
    },
    alternates: {
      canonical: `${siteUrl}/pages/seo-template`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
    },
  };
}

// Generate structured data (JSON-LD) - Template example
function generateStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Template SEO - Khởi Trí Số',
    description: 'Template mẫu cho trang tĩnh với đầy đủ tính năng SEO',
    url: `${siteUrl}/pages/seo-template`,
    inLanguage: 'vi-VN',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Khởi Trí Số',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    datePublished: '2025-11-09T00:00:00Z',
    dateModified: '2025-11-09T00:00:00Z',
    publisher: {
      '@type': 'Organization',
      name: 'Khởi Trí Số',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/logo.png`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+84-1900-xxxx',
        contactType: 'customer service',
        areaServed: 'VN',
        availableLanguage: ['Vietnamese'],
      },
    },
    mainEntity: {
      '@type': 'Article',
      headline: 'Template SEO - Khởi Trí Số',
      author: {
        '@type': 'Organization',
        name: 'Khởi Trí Số',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Khởi Trí Số',
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/images/logo.png`,
        },
      },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Trang chủ',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Template SEO',
          item: `${siteUrl}/pages/seo-template`,
        },
      ],
    },
  };
}

export default async function SEOTemplatePage() {
  const structuredData = generateStructuredData();

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <article className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with SEO-friendly structure */}
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Template SEO - Khởi Trí Số
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Template mẫu cho trang tĩnh với đầy đủ tính năng SEO: metadata, Open Graph, Twitter Cards, Structured Data (JSON-LD), và nhiều hơn nữa.
            </p>
            <div className="mt-6 flex items-center justify-center text-sm text-gray-500 space-x-4">
              <time dateTime="2025-11-09">
                Ngày tạo: 09/11/2025
              </time>
              <span>•</span>
              <span>Cập nhật: 09/11/2025</span>
            </div>
          </header>

          {/* Main content with semantic HTML */}
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            {/* Section 1: SEO Features */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Tính năng SEO đã được triển khai
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    📋 Metadata Tags
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ Title với site name</li>
                    <li>✓ Meta description (150-160 ký tự)</li>
                    <li>✓ Meta keywords</li>
                    <li>✓ Canonical URL</li>
                    <li>✓ Robots meta tags</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    🌐 Open Graph
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ og:title</li>
                    <li>✓ og:description</li>
                    <li>✓ og:url</li>
                    <li>✓ og:type</li>
                    <li>✓ og:image</li>
                    <li>✓ og:locale</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    🐦 Twitter Cards
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ twitter:card</li>
                    <li>✓ twitter:title</li>
                    <li>✓ twitter:description</li>
                    <li>✓ twitter:image</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    📊 Structured Data
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ JSON-LD Schema.org</li>
                    <li>✓ WebPage schema</li>
                    <li>✓ Organization schema</li>
                    <li>✓ BreadcrumbList schema</li>
                    <li>✓ Article schema</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2: Code Examples */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ví dụ code
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    1. Dynamic Metadata Generation
                  </h3>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
{`export async function generateMetadata({ params }): Promise<Metadata> {
  const page = await getStaticPageBySlug(params.slug);
  
  return {
    title: \`\${page.title} | \${siteName}\`,
    description: page.meta_description,
    openGraph: {
      title: page.title,
      description: page.meta_description,
      url: \`\${siteUrl}/pages/\${page.slug}\`,
    },
    // ... more metadata
  };
}`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    2. Structured Data (JSON-LD)
                  </h3>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Title",
  "description": "Page description",
  "url": "https://example.com/page",
  // ... more structured data
}
</script>`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Section 3: Best Practices */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Best Practices cho SEO
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">✓ Title Tags</h3>
                  <p className="text-gray-700">
                    Giữ title dưới 60 ký tự, bao gồm từ khóa chính, và thêm brand name ở cuối.
                  </p>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">✓ Meta Description</h3>
                  <p className="text-gray-700">
                    Viết mô tả hấp dẫn trong 150-160 ký tự, bao gồm call-to-action và từ khóa.
                  </p>
                </div>
                
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">✓ Heading Structure</h3>
                  <p className="text-gray-700">
                    Sử dụng H1 cho tiêu đề chính, H2 cho section, H3 cho subsection. Không skip levels.
                  </p>
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">✓ Semantic HTML</h3>
                  <p className="text-gray-700">
                    Sử dụng các thẻ semantic: &lt;article&gt;, &lt;section&gt;, &lt;header&gt;, &lt;footer&gt;, &lt;nav&gt;.
                  </p>
                </div>
                
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">✓ Image Optimization</h3>
                  <p className="text-gray-700">
                    Sử dụng alt text mô tả, tối ưu kích thước file, và sử dụng format hiện đại (WebP, AVIF).
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: SEO Checklist */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                SEO Checklist
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Unique title cho mỗi trang',
                  'Meta description hấp dẫn',
                  'URL thân thiện với SEO (slug)',
                  'Heading structure đúng (H1, H2, H3)',
                  'Internal linking hợp lý',
                  'External links chất lượng',
                  'Images có alt text',
                  'Page speed tối ưu',
                  'Mobile-friendly (responsive)',
                  'HTTPS enabled',
                  'XML Sitemap',
                  'Robots.txt',
                  'Structured data (Schema.org)',
                  'Open Graph tags',
                  'Twitter Cards',
                  'Canonical URLs',
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Testing Tools */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Công cụ kiểm tra SEO
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="https://search.google.com/test/rich-results"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">Google Rich Results Test</h3>
                  <p className="text-sm text-gray-600 mt-1">Kiểm tra Structured Data</p>
                </a>
                
                <a
                  href="https://developers.facebook.com/tools/debug/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">Facebook Sharing Debugger</h3>
                  <p className="text-sm text-gray-600 mt-1">Kiểm tra Open Graph</p>
                </a>
                
                <a
                  href="https://cards-dev.twitter.com/validator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">Twitter Card Validator</h3>
                  <p className="text-sm text-gray-600 mt-1">Kiểm tra Twitter Cards</p>
                </a>
              </div>
            </section>

            {/* Footer with additional info */}
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-600">
                Template này được tạo để minh họa các tính năng SEO của Next.js 15.
                <br />
                Tất cả các trang tĩnh được tạo từ admin dashboard sẽ tự động có đầy đủ tính năng SEO này.
              </p>
            </footer>
          </div>
        </div>
      </article>
    </>
  );
}

