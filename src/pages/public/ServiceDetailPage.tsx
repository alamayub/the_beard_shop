import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import { useGetServiceBySlugQuery } from '../../api/salonApi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { setBookingPreselection } from '../../store/slices/uiSlice';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { formatNpr } from '../../utils/nepal';
import { Button, SafeImage, Skeleton } from '../../components/ui/Primitives';
import { LUXURY_EASE } from '../../components/ui/MotionPrimitives';

export function ServiceDetailPage() {
  const { slug = '' } = useParams();
  const lang = useAppSelector((s) => s.ui.language);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: service, isLoading, isError } = useGetServiceBySlugQuery(slug);

  useDocumentMeta(
    service?.name || 'Service Details',
    service?.description || 'Detailed treatment information and NPR pricing at The Beard Shop.'
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <Skeleton className="lg:col-span-7 aspect-[4/3] w-full" />
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-28 text-center">
        <h1 className="font-serif text-4xl text-[#2A0810]">Treatment Not Found</h1>
        <p className="mt-3 text-sm text-[#5C5852]">
          The requested service may have been archived or moved.
        </p>
        <Link to="/services" className="mt-7 inline-block">
          <Button variant="primary" size="lg">
            Back to Services
          </Button>
        </Link>
      </div>
    );
  }

  const handleBook = () => {
    dispatch(setBookingPreselection({ serviceId: service.id, staffId: null }));
    navigate('/booking');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Link
        to="/services"
        className="inline-flex items-center gap-2 text-xs font-medium text-[#5C5852] hover:text-[#2A0810] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All Salon Services
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: LUXURY_EASE }}
        className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-14"
      >
        <div className="lg:col-span-7 space-y-8">
          <div className="aspect-[4/3] overflow-hidden rounded-[4px] border border-[#E6DADC] bg-[#EFE1E4]">
            <SafeImage
              src={service.imageUrl}
              alt={service.name}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-[#E6DADC] pt-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[#8B1A2D]">Consultation Included</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#5C5852]">
                Every visit begins with a personalized hair, skin, or style consultation tailored
                to your natural texture and climate needs.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#8B1A2D]">Sanitation & Care</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#5C5852]">
                Autoclave-sterilized instruments, fresh linens, and botanical-forward formulations
                for every guest in our Birgunj studio.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 rounded-[4px] border border-[#E6DADC] bg-white p-7 sm:p-9">
          <div className="flex items-center gap-2 text-xs text-[#8B1A2D]">
            <span>{service.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{service.isDemoPrice ? 'Editable Demo Pricing' : 'Official Rate'}</span>
          </div>

          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-medium leading-[1.1] text-[#2A0810]">
            {lang === 'ne' && service.nameNe ? service.nameNe : service.name}
          </h1>

          <div className="mt-7 flex items-baseline justify-between border-y border-[#E6DADC] py-5">
            <div>
              <p className="text-[11px] text-[#777777]">Starting Price</p>
              <p className="mt-0.5 font-mono text-2xl font-medium text-[#2A0810] tabular-nums">
                {formatNpr(service.priceNpr, lang)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#777777]">Estimated Duration</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#2A0810] tabular-nums">
                <Clock className="h-4 w-4 text-[#8B1A2D]" /> {service.durationMinutes} minutes
              </p>
            </div>
          </div>

          <p className="mt-6 text-[15px] leading-[1.72] text-[#5C5852]">{service.description}</p>

          <ul className="mt-6 space-y-2.5 text-xs text-[#5C5852]">
            <li className="flex items-center gap-2.5">
              <Check className="h-3.5 w-3.5 text-[#8B1A2D] shrink-0" />
              <span>Personal consultation before service</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="h-3.5 w-3.5 text-[#8B1A2D] shrink-0" />
              <span>Autoclaved & sanitized instruments</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="h-3.5 w-3.5 text-[#8B1A2D] shrink-0" />
              <span>Cash at salon, eSewa, Khalti & Fonepay ready</span>
            </li>
          </ul>

          <div className="mt-8 space-y-3">
            <Button variant="primary" size="lg" className="w-full" onClick={handleBook}>
              Book This Treatment <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-center text-[11px] text-[#777777]">
              Free rescheduling or cancellation up to 3 hours prior (NPT).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
