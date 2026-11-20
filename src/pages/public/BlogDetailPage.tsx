import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useGetBlogBySlugQuery } from '../../api/salonApi';
import { resolveAbsoluteImageUrl, useDocumentMeta } from '../../hooks/useDocumentMeta';
import { Button, SafeImage, Skeleton } from '../../components/ui/Primitives';
import { LUXURY_EASE } from '../../components/ui/MotionPrimitives';

export function BlogDetailPage() {
  const { slug = '' } = useParams();
  const { data: post, isLoading, isError } = useGetBlogBySlugQuery(slug);

  const articleUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : `/blog/${slug}`;

  useDocumentMeta(
    post?.title || 'Journal Article',
    post?.excerpt ||
      (post ? `Read "${post.title}" by ${post.authorName} on The Beard Shop Beauty Journal.` : undefined),
    post
      ? {
          ogTitle: `${post.title} — The Beard Shop Journal`,
          ogType: 'article',
          image: post.coverImageUrl,
          imageAlt: post.title,
          twitterCard: 'summary_large_image',
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
            description: post.excerpt,
            image: resolveAbsoluteImageUrl(post.coverImageUrl),
            datePublished: post.publishedAt,
            articleSection: post.category,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': articleUrl,
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
        }
      : undefined
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="aspect-[16/10] w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-28 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8B1A2D]">
          The Journal
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl text-[#2A0810]">Article Not Found</h1>
        <p className="mt-3 text-sm text-[#5C5852]">
          The journal entry you are looking for may have been archived or moved.
        </p>
        <Link to="/blog" className="mt-7 inline-block">
          <Button variant="primary">Back to Journal</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F4]">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: LUXURY_EASE }}
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.04em] text-[#5C5852] transition-colors hover:text-[#2A0810]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Journal
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2.5 text-xs text-[#777777]">
            <span aria-hidden="true" className="h-px w-5 bg-[#9E1F32]" />
            <span className="font-medium text-[#8B1A2D]">{post.category}</span>
            <span aria-hidden="true">·</span>
            <span>By {post.authorName}</span>
            <span aria-hidden="true">·</span>
            <span>{post.readTimeMinutes} min read</span>
          </div>

          <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-[3.35rem] font-medium leading-[1.08] tracking-[-0.015em] text-[#2A0810]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-base sm:text-lg leading-[1.7] text-[#5C5852] max-w-[62ch]">
              {post.excerpt}
            </p>
          )}

          <div className="mt-10 aspect-[16/10] overflow-hidden rounded-[4px] border border-[#E6DADC] bg-[#EFE1E4]">
            <SafeImage
              src={post.coverImageUrl}
              alt={post.title}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-12 max-w-[65ch] space-y-6 text-[16px] leading-[1.85] text-[#2D2B28]">
            {post.content.split('\n\n').map((para, idx) => (
              <p key={idx} className={idx === 0 ? 'text-[17px] text-[#2A0810]' : undefined}>
                {para}
              </p>
            ))}
          </div>

          <div className="mt-16 rounded-[4px] border border-[#25221E] bg-[#6B1222] p-8 sm:p-10 text-[#FAF8F4] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#F0B6BF]">
                Personal Consultation
              </p>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-medium text-[#FAF8F4]">
                Ready to experience this in person?
              </h2>
              <p className="text-sm text-[#CEC7BC] mt-1.5 max-w-[46ch]">
                Reserve your chair with our Birgunj specialists in under two minutes.
              </p>
            </div>
            <Link to="/booking" className="shrink-0">
              <Button variant="gold" size="md">
                Book Appointment <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </article>
    </div>
  );
}
