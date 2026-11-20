import { useEffect } from 'react';

const SITE_NAME = 'The Beard Shop';
const DEFAULT_DESCRIPTION =
  'Experience tailored hair styling, precision beard grooming, party glam, and botanical skincare at The Beard Shop in Birgunj, Nepal. Book online in NPR.';
const DEFAULT_IMAGE = '/src/assets/images/hero_salon_interior_1795150941397.jpg';

export interface DocumentMetaOptions {
  ogTitle?: string;
  ogType?: 'website' | 'article' | 'product';
  image?: string;
  imageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterLabels?: Array<{ label: string; data: string }>;
  article?: {
    publishedTime?: string;
    author?: string;
    section?: string;
  };
  product?: {
    priceAmount?: number;
    priceCurrency?: string;
    category?: string;
  };
  jsonLd?: Record<string, unknown> | null;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function resolveAbsoluteImageUrl(image?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (!image || image.startsWith('data:')) {
    return `${origin}${DEFAULT_IMAGE}`;
  }
  if (/^https?:\/\//i.test(image)) {
    return image;
  }
  const normalized = image.startsWith('/') ? image : `/${image}`;
  return `${origin}${normalized}`;
}

export function useDocumentMeta(
  title: string,
  description?: string,
  options?: DocumentMetaOptions
) {
  const ogTitle = options?.ogTitle || `${title} — ${SITE_NAME}`;
  const ogType = options?.ogType || 'website';
  const image = options?.image;
  const imageAlt = options?.imageAlt || `${title} — ${SITE_NAME}`;
  const twitterCard = options?.twitterCard || 'summary_large_image';
  const twitterLabelsKey = JSON.stringify(options?.twitterLabels || []);
  const articleKey = JSON.stringify(options?.article || null);
  const productKey = JSON.stringify(options?.product || null);
  const jsonLdKey = JSON.stringify(options?.jsonLd || null);

  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME} — Birgunj, Nepal`;
    const metaDesc = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim();
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    const absoluteImage = resolveAbsoluteImageUrl(image);

    document.title = fullTitle;
    upsertMeta('name', 'description', metaDesc);
    upsertCanonical(canonicalUrl);

    // OpenGraph tags
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:title', ogTitle);
    upsertMeta('property', 'og:description', metaDesc);
    upsertMeta('property', 'og:image', absoluteImage);
    upsertMeta('property', 'og:image:alt', imageAlt);

    // Twitter / X Card tags
    upsertMeta('name', 'twitter:card', twitterCard);
    upsertMeta('name', 'twitter:title', ogTitle);
    upsertMeta('name', 'twitter:description', metaDesc);
    upsertMeta('name', 'twitter:image', absoluteImage);
    upsertMeta('name', 'twitter:image:alt', imageAlt);

    // Optional article OpenGraph tags
    const parsedArticle = JSON.parse(articleKey) as DocumentMetaOptions['article'] | null;
    if (parsedArticle?.publishedTime) {
      upsertMeta('property', 'article:published_time', parsedArticle.publishedTime);
    } else {
      removeMeta('property', 'article:published_time');
    }
    if (parsedArticle?.author) {
      upsertMeta('property', 'article:author', parsedArticle.author);
    } else {
      removeMeta('property', 'article:author');
    }
    if (parsedArticle?.section) {
      upsertMeta('property', 'article:section', parsedArticle.section);
    } else {
      removeMeta('property', 'article:section');
    }

    // Optional product/service OpenGraph tags
    const parsedProduct = JSON.parse(productKey) as DocumentMetaOptions['product'] | null;
    if (parsedProduct?.priceAmount !== undefined) {
      upsertMeta('property', 'product:price:amount', String(parsedProduct.priceAmount));
    } else {
      removeMeta('property', 'product:price:amount');
    }
    if (parsedProduct?.priceCurrency) {
      upsertMeta('property', 'product:price:currency', parsedProduct.priceCurrency);
    } else {
      removeMeta('property', 'product:price:currency');
    }
    if (parsedProduct?.category) {
      upsertMeta('property', 'product:category', parsedProduct.category);
    } else {
      removeMeta('property', 'product:category');
    }

    // Optional Twitter label/data pairs (Slack, Discord, X rich metadata)
    const parsedLabels = JSON.parse(twitterLabelsKey) as Array<{ label: string; data: string }>;
    [1, 2].forEach((idx) => {
      const pair = parsedLabels[idx - 1];
      if (pair) {
        upsertMeta('name', `twitter:label${idx}`, pair.label);
        upsertMeta('name', `twitter:data${idx}`, pair.data);
      } else {
        removeMeta('name', `twitter:label${idx}`);
        removeMeta('name', `twitter:data${idx}`);
      }
    });

    // Optional page-specific Schema.org JSON-LD
    const parsedJsonLd = JSON.parse(jsonLdKey) as Record<string, unknown> | null;
    const existingScript = document.getElementById('page-jsonld');
    if (parsedJsonLd) {
      const script = existingScript || document.createElement('script');
      script.id = 'page-jsonld';
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(parsedJsonLd);
      if (!existingScript) {
        document.head.appendChild(script);
      }
    } else {
      existingScript?.remove();
    }

    return () => {
      removeMeta('property', 'article:published_time');
      removeMeta('property', 'article:author');
      removeMeta('property', 'article:section');
      removeMeta('property', 'product:price:amount');
      removeMeta('property', 'product:price:currency');
      removeMeta('property', 'product:category');
      removeMeta('name', 'twitter:label1');
      removeMeta('name', 'twitter:data1');
      removeMeta('name', 'twitter:label2');
      removeMeta('name', 'twitter:data2');
      document.getElementById('page-jsonld')?.remove();
    };
  }, [
    title,
    description,
    ogTitle,
    ogType,
    image,
    imageAlt,
    twitterCard,
    twitterLabelsKey,
    articleKey,
    productKey,
    jsonLdKey,
  ]);
}
