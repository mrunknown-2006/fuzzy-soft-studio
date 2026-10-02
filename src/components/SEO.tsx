import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  schema?: Record<string, any> | Array<Record<string, any>>;
  keywords?: string;
}

export default function SEO({
  title,
  description = "Luxury handmade crochet and artificial floral arrangements handcrafted with love. Each piece is made to order for life's quiet and grand moments.",
  image = 'https://www.fuzzysoftstudio.com/og-banner.jpg',
  url,
  type = 'website',
  schema,
  keywords = 'crochet flowers, handmade floral arrangements, artificial flowers, luxury gifts, Fuzzy Soft Studio'
}: SEOProps) {
  const siteTitle = 'Fuzzy Soft Studio';
  const fullTitle = title ? `${title} | ${siteTitle}` : 'Fuzzy Soft Studio — Where Every Petal Tells a Story';
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://www.fuzzysoftstudio.com');
  const fullImageUrl = image.startsWith('http') ? image : `https://www.fuzzysoftstudio.com${image.startsWith('/') ? '' : '/'}${image}`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* JSON-LD Schema (Google Rich Snippets) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
