import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useGetCategoriesQuery, useGetServicesQuery } from '../../api/salonApi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { setBookingPreselection } from '../../store/slices/uiSlice';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { formatNpr } from '../../utils/nepal';
import {
  Button,
  Input,
  PageIntro,
  SafeImage,
  Skeleton,
} from '../../components/ui/Primitives';
import { StaggerContainer, StaggerItem } from '../../components/ui/MotionPrimitives';

export function ServicesPage() {
  useDocumentMeta(
    'Services & NPR Menu',
    'Browse haircut, beard grooming, hair coloring, keratin, facial skincare, party makeup, and spa manicure-pedicure services in Birgunj, Nepal.'
  );

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const lang = useAppSelector((s) => s.ui.language);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: services = [], isLoading } = useGetServicesQuery({
    category: selectedCategory,
    q: searchQuery,
  });

  const handleBook = (serviceId: number) => {
    dispatch(setBookingPreselection({ serviceId, staffId: null }));
    navigate('/booking');
  };

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Service Menu · NPR"
        title="Tailored Grooming & Beauty Rituals"
        subtitle="Explore our curated unisex menu of precision haircuts, beard rituals, dimensional hair color, skincare, and party makeup in Nepalese Rupees (NPR)."
        rightSlot={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search treatments..."
              aria-label="Search salon services"
              className="pl-10"
            />
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Mobile Horizontal Scroll Rail + Desktop Clean Wrap Filter Bar */}
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-5 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 border-b border-[#E6DADC]">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[40px] rounded-[4px] px-4 py-2 text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#6B1222] text-[#FAF8F4]'
                : 'bg-white text-[#5C5852] border border-[#E6DADC] hover:border-[#6B1222] hover:text-[#2A0810]'
            }`}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`min-h-[40px] rounded-[4px] px-4 py-2 text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat.slug
                  ? 'bg-[#6B1222] text-[#FAF8F4]'
                  : 'bg-white text-[#5C5852] border border-[#E6DADC] hover:border-[#6B1222] hover:text-[#2A0810]'
              }`}
            >
              {lang === 'ne' && cat.nameNe ? cat.nameNe : cat.name}
            </button>
          ))}
        </div>

        {!isLoading && (
          <div className="mt-6 flex items-center justify-between text-xs text-[#777777]">
            <span className="tabular-nums">
              Showing {services.length} {services.length === 1 ? 'treatment' : 'treatments'}
            </span>
            <span>Currency: NPR · Nepal Time (NPT)</span>
          </div>
        )}

        {/* Services Grid */}
        {isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="mt-14 rounded-[4px] border border-[#E6DADC] bg-white p-12 text-center">
            <h3 className="font-serif text-3xl text-[#2A0810]">No matching treatments found</h3>
            <p className="mt-2.5 text-sm text-[#5C5852]">
              Try clearing your search or choosing a different service category.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <StaggerContainer className="mt-10 grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <StaggerItem key={service.id} className="h-full">
                <article className="group flex h-full flex-col justify-between rounded-[4px] border border-[#E6DADC] bg-white overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
                  <div>
                    <Link
                      to={`/services/${service.slug}`}
                      className="block aspect-[4/3] overflow-hidden bg-[#EFE1E4]"
                    >
                      <SafeImage
                        src={service.imageUrl}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
                      />
                    </Link>
                    <div className="p-6 sm:p-7">
                      <div className="flex items-center gap-2 text-xs text-[#777777]">
                        <span className="text-[#8B1A2D]">{service.categoryName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{service.durationMinutes} min</span>
                      </div>
                      <Link to={`/services/${service.slug}`} className="block">
                        <h2 className="mt-2 font-serif text-[1.55rem] font-medium leading-[1.18] text-[#2A0810] group-hover:text-[#8B1A2D] transition-colors">
                          {lang === 'ne' && service.nameNe ? service.nameNe : service.name}
                        </h2>
                      </Link>
                      <p className="mt-2.5 text-sm leading-[1.68] text-[#5C5852] line-clamp-3">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#E6DADC] bg-[#FAF8F4]/70 px-6 py-4 sm:px-7">
                    <div>
                      <p className="text-[11px] text-[#777777]">Starting Rate</p>
                      <p className="font-mono text-base font-medium text-[#2A0810] tabular-nums">
                        {formatNpr(service.priceNpr, lang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/services/${service.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#5C5852] hover:text-[#2A0810] transition-colors"
                      >
                        Details <ArrowRight className="h-3 w-3" />
                      </Link>
                      <Button variant="primary" size="sm" onClick={() => handleBook(service.id)}>
                        Book Now
                      </Button>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
