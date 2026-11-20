import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useGetGalleryQuery } from '../../api/salonApi';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { PageIntro, SafeImage, Skeleton } from '../../components/ui/Primitives';
import { LUXURY_EASE, StaggerContainer, StaggerItem } from '../../components/ui/MotionPrimitives';
import { BeforeAfterSlider } from '../../components/public/BeforeAfterSlider';

const GALLERY_FILTERS = [
  { key: 'ALL', label: 'All Works' },
  { key: 'MENS_HAIRSTYLE', label: "Men's Hairstyles" },
  { key: 'WOMENS_HAIRSTYLE', label: "Women's Hairstyles" },
  { key: 'HAIR_COLORING', label: 'Hair Coloring' },
  { key: 'MAKEUP', label: 'Party Makeup' },
  { key: 'INTERIOR', label: 'Salon Interior' },
  { key: 'BEFORE_AFTER', label: 'Before & After' },
];

export function GalleryPage() {
  useDocumentMeta(
    'Editorial Gallery',
    'Explore men’s hairstyles, women’s hair styling, balayage color, party glam makeup, and our Birgunj salon interior.'
  );

  const [category, setCategory] = useState('ALL');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { data: items = [], isLoading } = useGetGalleryQuery(category);

  const beforeAfterItems = items.filter((g) => g.category === 'BEFORE_AFTER' && g.beforeImageUrl);
  const standardItems = items.filter((g) => g.category !== 'BEFORE_AFTER' || !g.beforeImageUrl);

  const lightboxItem =
    lightboxIndex !== null && standardItems[lightboxIndex] ? standardItems[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % standardItems.length
        );
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + standardItems.length) % standardItems.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, standardItems.length]);

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Portfolio · Birgunj"
        title="The Atelier Lookbook"
        subtitle="A curated showcase of grooming precision, dimensional hair color, party glam, and our tranquil studio atmosphere."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Mobile Horizontal Rail + Desktop Wrapped Filter Bar */}
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-5 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 border-b border-[#E6DADC]">
          {GALLERY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setCategory(f.key);
                setLightboxIndex(null);
              }}
              className={`min-h-[40px] rounded-[4px] px-4 py-2 text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                category === f.key
                  ? 'bg-[#6B1222] text-[#FAF8F4]'
                  : 'bg-white text-[#5C5852] border border-[#E6DADC] hover:border-[#6B1222] hover:text-[#2A0810]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Before & After Highlight */}
        {beforeAfterItems.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3 text-xs font-medium tracking-[0.08em] text-[#8B1A2D]">
              <span aria-hidden="true" className="h-px w-6 bg-[#9E1F32]" />
              <span>Interactive Comparison</span>
            </div>
            <h2 className="mt-2 font-serif text-3xl font-medium text-[#2A0810] mb-8">
              Before & After Transformations
            </h2>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              {beforeAfterItems.map((item) => (
                <BeforeAfterSlider
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  beforeSrc={item.beforeImageUrl}
                  afterSrc={item.imageUrl}
                />
              ))}
            </div>
          </div>
        )}

        {/* Editorial Grid */}
        {isLoading ? (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : standardItems.length > 0 ? (
          <StaggerContainer className="mt-14 columns-1 gap-7 space-y-7 sm:columns-2 lg:columns-3">
            {standardItems.map((item, idx) => (
              <StaggerItem key={item.id} className="break-inside-avoid">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="group block w-full overflow-hidden rounded-[4px] border border-[#E6DADC] bg-white text-left cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A66B]"
                >
                  <div className="overflow-hidden bg-[#EFE1E4]">
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-medium tracking-[0.06em] text-[#8B1A2D]">
                      {item.category.replace(/_/g, ' ')}
                    </p>
                    <h3 className="mt-1.5 font-serif text-[1.4rem] font-medium leading-snug text-[#2A0810] group-hover:text-[#8B1A2D] transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1.5 text-xs leading-relaxed text-[#5C5852]">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : null}
      </div>

      {/* Animated Editorial Lightbox Modal */}
      <AnimatePresence>
        {lightboxItem && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0B0A]/92 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={lightboxItem.title}
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.24, ease: LUXURY_EASE }}
              className="relative max-w-4xl w-full overflow-hidden rounded-[4px] border border-white/10 bg-[#141311] text-[#FAF8F4] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close lightbox"
                className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-[#FAF8F4] hover:bg-black transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {standardItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + standardItems.length) % standardItems.length
                      )
                    }
                    aria-label="Previous look"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-[#FAF8F4] hover:bg-black hover:text-[#F0B6BF] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % standardItems.length)}
                    aria-label="Next look"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-[#FAF8F4] hover:bg-black hover:text-[#F0B6BF] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="bg-black">
                <SafeImage
                  src={lightboxItem.imageUrl}
                  alt={lightboxItem.title}
                  priority
                  className="max-h-[72vh] w-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between p-6 sm:p-7">
                <div>
                  <p className="text-xs tracking-[0.08em] text-[#F0B6BF]">
                    {lightboxItem.category.replace(/_/g, ' ')}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl sm:text-3xl font-medium">
                    {lightboxItem.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#B8B0A4]">{lightboxItem.description}</p>
                </div>
                <span className="font-mono text-xs text-[#8C8479] tabular-nums shrink-0">
                  {lightboxIndex + 1} / {standardItems.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
