import type { Request } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../src/db/index.ts';
import { blogPosts, serviceCategories, services } from '../../../src/db/schema.ts';
import {
  getFallbackBlogBySlug,
  getFallbackServiceBySlug,
} from '../../../src/data/fallbackSalonData.ts';

const SITE_NAME = 'The Beard Shop';
const DEFAULT_HERO_IMAGE = '/src/assets/images/hero_salon_interior_1795150941397.jpg';

interface PageMetaPayload {
  title: string;
  ogTitle: string;
  description: string;
  ogType: 'website' | 'article' | 'product';
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
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
  jsonLd?: Record<string, unknown>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function resolveOrigin(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured) && !configured.includes('MY_APP_URL')) {
    return configured.replace(/\/+$/, '');
  }
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto =
    typeof protoHeader === 'string'
      ? protoHeader.split(',')[0].trim()
      : req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function resolveAbsoluteImage(origin: string, image?: string | null): string {
  if (!image || image.startsWith('data:')) {
    return `${origin}${DEFAULT_HERO_IMAGE}`;
  }
  if (/^https?:\/\//i.test(image)) {
    return image;
  }
  const normalized = image.startsWith('/') ? image : `/${image}`;
  return `${origin}${normalized}`;
}

function truncateDescription(text: string, maxLength = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatNprLabel(amount: number): string {
  return `Rs. ${new Intl.NumberFormat('en-IN').format(amount)}`;
}

async function resolveServiceMeta(slug: string, req: Request): Promise<PageMetaPayload | null> {
  const origin = resolveOrigin(req);
  let svc: {
    name: string;
    slug: string;
    description: string;
    priceNpr: number;
    durationMinutes: number;
    imageUrl: string;
    categoryName?: string;
  } | null = null;

  try {
    const rows = await db
      .select({
        name: services.name,
        slug: services.slug,
        description: services.description,
        priceNpr: services.priceNpr,
        durationMinutes: services.durationMinutes,
        imageUrl: services.imageUrl,
        categoryName: serviceCategories.name,
      })
      .from(services)
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(eq(services.slug, slug), eq(services.isPublished, true)))
      .limit(1);

    if (rows[0]) {
      svc = {
        ...rows[0],
        categoryName: rows[0].categoryName ?? undefined,
      };
    }
  } catch {
    // Fallback below handles offline/unavailable DB gracefully
  }

  if (!svc) {
    const fallback = getFallbackServiceBySlug(slug);
    if (!fallback) return null;
    svc = {
      name: fallback.name,
      slug: fallback.slug,
      description: fallback.description,
      priceNpr: fallback.priceNpr,
      durationMinutes: fallback.durationMinutes,
      imageUrl: fallback.imageUrl,
      categoryName: fallback.categoryName,
    };
  }

  const canonicalUrl = `${origin}/services/${encodeURIComponent(svc.slug)}`;
  const imageUrl = resolveAbsoluteImage(origin, svc.imageUrl);
  const priceText = formatNprLabel(svc.priceNpr);
  const ogTitle = `${svc.name} (${priceText}) — ${SITE_NAME}`;
  const description = truncateDescription(
    `${svc.description} Starting at ${priceText} (${svc.durationMinutes} min) at ${SITE_NAME}, Birgunj, Nepal.`
  );

  return {
    title: `${svc.name} | ${SITE_NAME} — Birgunj, Nepal`,
    ogTitle,
    description,
    ogType: 'product',
    canonicalUrl,
    imageUrl,
    imageAlt: `${svc.name} at ${SITE_NAME}, Birgunj`,
    twitterLabels: [
      { label: 'Starting Price', data: `${priceText} (NPR)` },
      { label: 'Duration', data: `${svc.durationMinutes} minutes` },
    ],
    product: {
      priceAmount: svc.priceNpr,
      priceCurrency: 'NPR',
      category: svc.categoryName || 'Salon Treatment',
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: svc.name,
      description,
      serviceType: svc.categoryName || 'Beauty & Grooming Service',
      url: canonicalUrl,
      image: imageUrl,
      provider: {
        '@type': 'BeautySalon',
        name: 'The Beard Shop Beauty Salon',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Birgunj',
          addressRegion: 'Madhesh Province',
          addressCountry: 'NP',
        },
      },
      offers: {
        '@type': 'Offer',
        price: svc.priceNpr,
        priceCurrency: 'NPR',
        availability: 'https://schema.org/InStock',
        url: canonicalUrl,
      },
    },
  };
}

async function resolveBlogMeta(slug: string, req: Request): Promise<PageMetaPayload | null> {
  const origin = resolveOrigin(req);
  let post: {
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    coverImageUrl: string;
    authorName: string;
    readTimeMinutes: number;
    publishedAt: string;
  } | null = null;

  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
      .limit(1);

    if (rows[0]) {
      post = {
        title: rows[0].title,
        slug: rows[0].slug,
        excerpt: rows[0].excerpt,
        category: rows[0].category,
        coverImageUrl: rows[0].coverImageUrl,
        authorName: rows[0].authorName,
        readTimeMinutes: rows[0].readTimeMinutes,
        publishedAt:
          rows[0].publishedAt instanceof Date
            ? rows[0].publishedAt.toISOString()
            : String(rows[0].publishedAt),
      };
    }
  } catch {
    // Fallback below handles offline/unavailable DB gracefully
  }

  if (!post) {
    const fallback = getFallbackBlogBySlug(slug);
    if (!fallback) return null;
    post = {
      title: fallback.title,
      slug: fallback.slug,
      excerpt: fallback.excerpt,
      category: fallback.category,
      coverImageUrl: fallback.coverImageUrl,
      authorName: fallback.authorName,
      readTimeMinutes: fallback.readTimeMinutes,
      publishedAt: fallback.publishedAt,
    };
  }

  const canonicalUrl = `${origin}/blog/${encodeURIComponent(post.slug)}`;
  const imageUrl = resolveAbsoluteImage(origin, post.coverImageUrl);
  const ogTitle = `${post.title} — ${SITE_NAME} Journal`;
  const description = truncateDescription(
    post.excerpt || `Read "${post.title}" by ${post.authorName} on The Beard Shop Beauty Journal.`
  );

  return {
    title: `${post.title} | ${SITE_NAME} — Birgunj, Nepal`,
    ogTitle,
    description,
    ogType: 'article',
    canonicalUrl,
    imageUrl,
    imageAlt: post.title,
    twitterLabels: [
      { label: 'Written by', data: post.authorName },
      { label: 'Reading time', data: `${post.readTimeMinutes} min read` },
    ],
    article: {
      publishedTime: post.publishedAt,
      author: post.authorName,
      section: post.category,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      image: imageUrl,
      datePublished: post.publishedAt,
      articleSection: post.category,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      author: {
        '@type': 'Person',
        name: post.authorName,
      },
      publisher: {
        '@type': 'BeautySalon',
        name: 'The Beard Shop Beauty Salon',
      },
    },
  };
}

function buildMetaTagsHtml(meta: PageMetaPayload): string {
  const tags: string[] = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.imageUrl)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.imageUrl)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />`,
  ];

  if (meta.article?.publishedTime) {
    tags.push(
      `<meta property="article:published_time" content="${escapeHtml(meta.article.publishedTime)}" />`
    );
  }
  if (meta.article?.author) {
    tags.push(`<meta property="article:author" content="${escapeHtml(meta.article.author)}" />`);
  }
  if (meta.article?.section) {
    tags.push(`<meta property="article:section" content="${escapeHtml(meta.article.section)}" />`);
  }

  if (meta.product?.priceAmount !== undefined) {
    tags.push(
      `<meta property="product:price:amount" content="${escapeHtml(String(meta.product.priceAmount))}" />`
    );
  }
  if (meta.product?.priceCurrency) {
    tags.push(
      `<meta property="product:price:currency" content="${escapeHtml(meta.product.priceCurrency)}" />`
    );
  }
  if (meta.product?.category) {
    tags.push(
      `<meta property="product:category" content="${escapeHtml(meta.product.category)}" />`
    );
  }

  meta.twitterLabels?.forEach((pair, idx) => {
    const num = idx + 1;
    tags.push(`<meta name="twitter:label${num}" content="${escapeHtml(pair.label)}" />`);
    tags.push(`<meta name="twitter:data${num}" content="${escapeHtml(pair.data)}" />`);
  });

  if (meta.jsonLd) {
    tags.push(
      `<script id="page-jsonld" type="application/ld+json">${serializeJsonLd(meta.jsonLd)}</script>`
    );
  }

  return tags.join('\n    ');
}

function injectMetaIntoHtml(templateHtml: string, meta: PageMetaPayload): string {
  // Strip default static SEO/OG/Twitter tags before injecting detail-specific tags
  const cleaned = templateHtml
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?\/>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]+"[\s\S]*?\/>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]+"[\s\S]*?\/>\s*/gi, '');

  const injectedBlock = buildMetaTagsHtml(meta);
  return cleaned.replace(
    /(<meta\s+name="viewport"[^>]*\/>)/i,
    `$1\n    ${injectedBlock}`
  );
}

export async function renderDetailMetaHtml(
  templateHtml: string,
  req: Request
): Promise<string | null> {
  const serviceMatch = req.path.match(/^\/services\/([^/]+)\/?$/);
  if (serviceMatch) {
    const slug = decodeURIComponent(serviceMatch[1]);
    const meta = await resolveServiceMeta(slug, req);
    return meta ? injectMetaIntoHtml(templateHtml, meta) : null;
  }

  const blogMatch = req.path.match(/^\/blog\/([^/]+)\/?$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    const meta = await resolveBlogMeta(slug, req);
    return meta ? injectMetaIntoHtml(templateHtml, meta) : null;
  }

  return null;
}
