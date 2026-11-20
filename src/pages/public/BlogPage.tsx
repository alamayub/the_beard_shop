import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useGetBlogPostsQuery } from '../../api/salonApi';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { Input, PageIntro, SafeImage, Skeleton } from '../../components/ui/Primitives';
import { StaggerContainer, StaggerItem } from '../../components/ui/MotionPrimitives';

export function BlogPage() {
  useDocumentMeta(
    'Beauty & Grooming Journal',
    'Read editorial hair care, beard maintenance, and seasonal skincare guides from The Beard Shop.'
  );

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { data: posts = [], isLoading } = useGetBlogPostsQuery();

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category)))];
  const filtered = posts.filter((p) => {
    const matchCat = category === 'All' || p.category === category;
    const matchQ =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="The Journal · Editorial"
        title="Grooming, Hair & Skincare Guides"
        subtitle="Practical seasonal advice tailored to Nepal’s climate, celebrations, and everyday personal care."
        rightSlot={
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8379]" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="pl-10"
            />
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-[#E6DADC] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-[4px] px-4 py-2 text-xs font-medium cursor-pointer transition-all duration-200 ${
                  category === cat
                    ? 'bg-[#6B1222] text-[#FAF8F4] shadow-[0_2px_8px_rgba(17,17,17,0.12)]'
                    : 'bg-white border border-[#E6DADC] text-[#5C5852] hover:border-[#9E1F32] hover:text-[#2A0810]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {!isLoading && (
            <p className="text-xs text-[#777777] shrink-0 tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-96 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-14 rounded-[4px] border border-[#E6DADC] bg-white p-12 text-center">
            <p className="font-serif text-2xl text-[#2A0810]">No matching articles</p>
            <p className="mt-2 text-sm text-[#5C5852]">
              Try clearing your search term or selecting another editorial category.
            </p>
          </div>
        ) : (
          <StaggerContainer className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {filtered.map((post) => (
              <StaggerItem key={post.id}>
                <article className="group flex h-full flex-col">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="aspect-[4/3] overflow-hidden rounded-[4px] border border-[#E6DADC] bg-[#EFE1E4]"
                  >
                    <SafeImage
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  </Link>
                  <div className="mt-5 flex items-center gap-2 text-xs text-[#777777]">
                    <span className="font-medium text-[#8B1A2D]">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTimeMinutes} min read</span>
                  </div>
                  <Link to={`/blog/${post.slug}`} className="mt-2.5">
                    <h2 className="font-serif text-[1.6rem] font-medium leading-[1.2] text-[#2A0810] transition-colors group-hover:text-[#8B1A2D]">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="mt-3 flex-1 text-sm leading-[1.7] text-[#5C5852]">
                    {post.excerpt}
                  </p>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.04em] text-[#2A0810] transition-colors group-hover:text-[#8B1A2D]"
                  >
                    Read Article <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
