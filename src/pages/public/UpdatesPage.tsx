import { useState } from 'react';
import { ExternalLink, Instagram, Play } from 'lucide-react';
import { useGetSettingsQuery, useGetSocialPostsQuery } from '../../api/salonApi';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { Button, PageIntro, SafeImage, Skeleton } from '../../components/ui/Primitives';
import { StaggerContainer, StaggerItem } from '../../components/ui/MotionPrimitives';

export function UpdatesPage() {
  useDocumentMeta(
    'Social Media & Atelier Updates',
    'Follow the latest hairstyles, beard transformations, reels, and announcements from The Beard Shop on Instagram and Facebook.'
  );

  const [filter, setFilter] = useState<'ALL' | 'INSTAGRAM' | 'FACEBOOK' | 'REEL'>('ALL');
  const { data: posts = [], isLoading } = useGetSocialPostsQuery();
  const { data: settings } = useGetSettingsQuery();

  const filtered = posts.filter((p) => {
    if (filter === 'ALL') return true;
    if (filter === 'REEL') return p.mediaType === 'REEL';
    return p.platform === filter;
  });

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Social Dispatches · @the_beard_shop1"
        title="Instagram, Reels & Studio News"
        subtitle="Admin-curated social media highlights, studio reels, and seasonal dispatches from Birgunj."
        rightSlot={
          <div className="flex flex-wrap gap-3">
            <a
              href={settings?.instagramUrl || 'https://www.instagram.com/the_beard_shop1/'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="md">
                <Instagram className="h-4 w-4" /> @the_beard_shop1
              </Button>
            </a>
            <a
              href={settings?.facebookUrl || 'https://www.facebook.com/'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="md">
                Facebook <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Platform Filter */}
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-5 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 border-b border-[#E6DADC]">
          {(['ALL', 'INSTAGRAM', 'FACEBOOK', 'REEL'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`min-h-[40px] rounded-[4px] px-4 py-2 text-xs font-medium cursor-pointer transition-all duration-150 whitespace-nowrap shrink-0 ${
                filter === tab
                  ? 'bg-[#6B1222] text-[#FAF8F4]'
                  : 'bg-white border border-[#E6DADC] text-[#5C5852] hover:border-[#6B1222] hover:text-[#2A0810]'
              }`}
            >
              {tab === 'ALL'
                ? 'All Updates'
                : tab === 'REEL'
                  ? 'Reels & Video'
                  : tab === 'INSTAGRAM'
                    ? 'Instagram'
                    : 'Facebook'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="aspect-square w-full" />
            ))}
          </div>
        ) : (
          <StaggerContainer className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <StaggerItem key={post.id} className="h-full">
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col overflow-hidden rounded-[4px] border border-[#E6DADC] bg-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#EFE1E4]">
                    <SafeImage
                      src={post.imageUrl}
                      alt={post.caption}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
                    />
                    {post.mediaType === 'REEL' && (
                      <div className="absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#2A0810]/82 text-[#F0B6BF] backdrop-blur-sm">
                        <Play className="h-4 w-4 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.06em] text-[#8B1A2D]">
                        {post.platform} · {post.mediaType}
                      </p>
                      <p className="mt-2.5 text-sm leading-[1.7] text-[#222222]">{post.caption}</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-[#E6DADC] pt-3.5 text-xs text-[#777777]">
                      <span className="tabular-nums">
                        {new Date(post.publishedAt).toLocaleDateString('en-NP', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-[#2A0810] group-hover:text-[#8B1A2D] transition-colors">
                        View Post <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </a>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
