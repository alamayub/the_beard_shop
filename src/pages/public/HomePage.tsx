import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Instagram,
  MapPin,
  Phone,
  Play,
  Star,
} from 'lucide-react';
import { useGetBootstrapQuery } from '../../api/salonApi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { setBookingPreselection, setLanguage } from '../../store/slices/uiSlice';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { COPY, formatNpr } from '../../utils/nepal';
import {
  Button,
  SafeImage,
  SectionHeader,
  Skeleton,
} from '../../components/ui/Primitives';
import {
  EditorialReveal,
  LUXURY_EASE,
  StaggerContainer,
  StaggerItem,
} from '../../components/ui/MotionPrimitives';
import { BeforeAfterSlider } from '../../components/public/BeforeAfterSlider';
import { SalonLocationMap } from '../../components/maps/SalonLocationMap';

const HERO_IMAGE = '/src/assets/images/hero_salon_interior_1795150941397.jpg';
const SPA_IMAGE = '/src/assets/images/service_spa_facial_1795150942040.jpg';
const MANI_IMAGE = '/src/assets/images/editorial_mani_pedi_spa_1795153777948.jpg';

const STANDARDS = [
  {
    index: '01',
    title: 'Hospital-Grade Sterilization',
    body: 'Every razor, comb, and stainless instrument undergoes UV and autoclave sanitization between every single guest.',
  },
  {
    index: '02',
    title: 'Tailored For Nepal’s Climate',
    body: 'Humidity-balanced keratin formulas, calming botanical oils, and breathable long-wear glam finishes suited for Birgunj.',
  },
  {
    index: '03',
    title: 'Zero Waiting, Real Availability',
    body: 'Live stylist schedules, transparent NPR pricing, and instant booking references with WhatsApp concierge updates.',
  },
  {
    index: '04',
    title: 'Inclusive Unisex Craft',
    body: 'Dedicated master barbers, makeup artists, colorists, and estheticians united under one serene roof.',
  },
];

export function HomePage() {
  useDocumentMeta(
    'Luxury Unisex Salon & Grooming Atelier',
    'Tailored haircuts, precision beard grooming, hair coloring, party glam, and skincare rituals at The Beard Shop in Birgunj, Nepal.'
  );

  const lang = useAppSelector((s) => s.ui.language);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, isLoading } = useGetBootstrapQuery();
  const [copiedOfferCode, setCopiedOfferCode] = useState('');
  const t = COPY[lang];

  const settings = data?.settings;
  const featuredServices = (data?.services || []).filter((s) => s.isFeatured).slice(0, 6);
  const packageServices = (data?.services || []).filter((s) =>
    [
      'dimensional-balayage-gloss-tone',
      'silk-infused-keratin-restoration',
      'groom-wedding-prep-package',
    ].includes(s.slug)
  );
  // Order packages so Silk-Infused Keratin sits in the centerpiece column on desktop
  const orderedPackages = [...packageServices].sort((a, b) => {
    const rank = (slug: string) =>
      slug === 'dimensional-balayage-gloss-tone'
        ? 0
        : slug === 'silk-infused-keratin-restoration'
          ? 1
          : 2;
    return rank(a.slug) - rank(b.slug);
  });

  const beforeAfterItems = (data?.gallery || []).filter(
    (g) => g.category === 'BEFORE_AFTER' && g.beforeImageUrl
  );
  const team = (data?.team || []).slice(0, 4);
  const reviews = (data?.reviews || []).slice(0, 3);
  const socialPosts = (data?.socialPosts || []).slice(0, 4);
  const offers = (data?.offers || []).slice(0, 2);

  const handleBookService = (serviceId: number) => {
    dispatch(setBookingPreselection({ serviceId, staffId: null }));
    navigate('/booking');
  };

  const handleBookStaff = (staffId: number) => {
    dispatch(setBookingPreselection({ staffId }));
    navigate('/booking');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedOfferCode(code);
    setTimeout(() => setCopiedOfferCode(''), 2000);
  };

  return (
    <div className="bg-[#FAF8F4]">
      {/* 1. Flagship Editorial Luxury Hero */}
      <section className="relative flex min-h-[76vh] lg:min-h-[84vh] items-center overflow-hidden bg-[#2A0810] text-[#FAF8F4]">
        <motion.div
          initial={{ scale: 1.06, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.35, ease: LUXURY_EASE }}
          className="absolute inset-0"
        >
          <SafeImage
            src={HERO_IMAGE}
            alt="The Beard Shop luxury salon interior in Birgunj"
            priority
            className="h-full w-full object-cover object-center"
          />
          {/* Layered architectural lighting scrim for AAA contrast without hiding the salon */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A0810]/92 via-[#2A0810]/68 to-[#2A0810]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A0810]/60 via-transparent to-[#2A0810]/20" />
        </motion.div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-36">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUXURY_EASE }}
              className="flex flex-wrap items-center gap-3.5 text-[12px] font-medium tracking-[0.08em] text-[#F0B6BF]"
            >
              <span aria-hidden="true" className="h-px w-8 bg-[#9E1F32]/80" />
              <span>{t.hero.eyebrow}</span>
              <span aria-hidden="true" className="text-white/30">
                ·
              </span>
              <button
                type="button"
                onClick={() => dispatch(setLanguage(lang === 'en' ? 'ne' : 'en'))}
                className="text-[#FAF8F4]/85 hover:text-[#F0B6BF] transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                {lang === 'en' ? 'नेपाली' : 'English'}
              </button>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: LUXURY_EASE }}
              className="mt-6 font-serif text-[3.1rem] sm:text-[4.25rem] lg:text-[5.25rem] font-normal leading-[1.02] tracking-[-0.02em] text-[#FAF8F4]"
            >
              {lang === 'en' ? (
                <>
                  Your Style.
                  <br />
                  <span className="italic text-[#EFE1E4]">Your Identity.</span>
                </>
              ) : (
                t.hero.title
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.16, ease: LUXURY_EASE }}
              className="mt-7 max-w-[50ch] text-[15.5px] sm:text-[17px] leading-[1.72] tracking-[0.01em] text-[#DFD8CD]"
            >
              {t.hero.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: LUXURY_EASE }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link to="/booking">
                <Button variant="gold" size="lg">
                  {t.hero.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/services">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-[#FAF8F4]/35 text-[#FAF8F4] hover:border-[#9E1F32] hover:bg-[#FAF8F4]/10 hover:text-[#FAF8F4]"
                >
                  {t.hero.secondaryCta}
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Quiet Editorial Scroll Anchor on Desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.55 }}
            className="hidden lg:flex items-center gap-3 absolute bottom-10 right-8 text-[11px] tracking-[0.14em] text-[#D6CFC4]/75"
          >
            <span>Scroll to explore</span>
            <span aria-hidden="true" className="h-px w-10 bg-[#9E1F32]/60" />
          </motion.div>
        </div>
      </section>

      {/* Architectural Atelier Fact Strip Below Hero */}
      <div className="border-b border-[#E6DADC] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E6DADC] px-4 sm:px-6 lg:px-8">
          <div className="py-6 pr-4 sm:px-6 first:pl-0">
            <p className="text-[11px] tracking-[0.06em] text-[#777777]">Atelier Location</p>
            <p className="mt-1.5 text-sm font-medium text-[#2A0810]">Birgunj, Parsa, Nepal</p>
          </div>
          <div className="py-6 pl-4 sm:px-6">
            <p className="text-[11px] tracking-[0.06em] text-[#777777]">Daily Hours (NPT)</p>
            <p className="mt-1.5 font-mono text-[13.5px] font-medium text-[#2A0810] tabular-nums">
              10:00 – 20:00
            </p>
          </div>
          <div className="py-6 pr-4 sm:px-6">
            <p className="text-[11px] tracking-[0.06em] text-[#777777]">Accepted Payments</p>
            <p className="mt-1.5 text-sm font-medium text-[#2A0810]">
              Cash · eSewa · Khalti · Fonepay
            </p>
          </div>
          <div className="py-6 pl-4 sm:px-6 last:pr-0">
            <p className="text-[11px] tracking-[0.06em] text-[#777777]">Existing Reservation</p>
            <Link
              to="/my-bookings"
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-[#8B1A2D] hover:text-[#2A0810] transition-colors"
            >
              Manage My Booking <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Featured Services — Curated Editorial Plates */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <EditorialReveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              kicker="01 · Curated Menu"
              title={t.sections.featuredServices}
              subtitle="Precision barbering, dimensional hair color, party glam, and skincare rituals crafted in Birgunj."
            />
            <Link
              to="/services"
              className="group inline-flex items-center gap-2 text-sm font-medium text-[#2A0810] hover:text-[#8B1A2D] transition-colors whitespace-nowrap pb-1 border-b border-[#6B1222]/20 hover:border-[#9E1F32]"
            >
              <span>Explore All 12 Categories</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </EditorialReveal>

        {isLoading ? (
          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <StaggerContainer className="mt-14 grid grid-cols-1 gap-x-9 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <StaggerItem key={service.id} className="h-full">
                <article className="group flex h-full flex-col justify-between border-b border-[#E6DADC] pb-7">
                  <div>
                    <Link
                      to={`/services/${service.slug}`}
                      className="block aspect-[4/3] overflow-hidden rounded-[4px] bg-[#EFE1E4]"
                    >
                      <SafeImage
                        src={service.imageUrl}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
                      />
                    </Link>

                    <div className="mt-5 flex items-center gap-2 text-xs text-[#777777]">
                      <span className="tabular-nums">{service.durationMinutes} min</span>
                      <span aria-hidden="true">·</span>
                      <span>Standard Rate</span>
                    </div>

                    <Link to={`/services/${service.slug}`} className="block">
                      <h3 className="mt-2 font-serif text-[1.6rem] font-medium leading-[1.18] text-[#2A0810] group-hover:text-[#8B1A2D] transition-colors">
                        {lang === 'ne' && service.nameNe ? service.nameNe : service.name}
                      </h3>
                    </Link>

                    <p className="mt-2.5 line-clamp-2 text-sm leading-[1.68] text-[#5C5852]">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-2">
                    <div>
                      <span className="text-[11px] text-[#777777] block">Starting from</span>
                      <span className="font-mono text-[15.5px] font-medium text-[#2A0810] tabular-nums">
                        {formatNpr(service.priceNpr, lang)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBookService(service.id)}
                    >
                      Book Now
                    </Button>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* 3. About Introduction & Philosophy Split */}
      <section className="border-y border-[#E6DADC] bg-[#EFE9DE]/65">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-stretch">
            <EditorialReveal className="lg:col-span-6">
              <div className="grid h-full grid-cols-12 gap-4">
                <div className="col-span-8 min-h-[340px] sm:min-h-[420px] overflow-hidden rounded-[4px] border border-[#DCCBD0] bg-[#EFE1E4]">
                  <SafeImage
                    src={SPA_IMAGE}
                    alt="Botanical skincare and grooming apothecary at The Beard Shop"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="col-span-4 flex flex-col gap-4">
                  <div className="flex-1 overflow-hidden rounded-[4px] border border-[#DCCBD0] bg-[#EFE1E4]">
                    <SafeImage
                      src={MANI_IMAGE}
                      alt="Minimalist travertine spa ritual station"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="rounded-[4px] border border-[#DCCBD0] bg-[#FAF8F4] p-4 sm:p-5">
                    <p className="font-serif text-2xl sm:text-3xl font-medium text-[#2A0810] tabular-nums">
                      12
                    </p>
                    <p className="mt-1 text-xs leading-snug text-[#5C5852]">
                      Curated unisex grooming & beauty disciplines
                    </p>
                  </div>
                </div>
              </div>
            </EditorialReveal>

            <EditorialReveal delay={0.08} className="flex flex-col justify-center lg:col-span-6 lg:pl-8">
              <SectionHeader
                kicker="02 · Our Philosophy"
                title={t.sections.aboutTitle}
                subtitle="Inspired by modern international grooming ateliers and rooted in Madhesh Province hospitality, we created an unhurried space where precision barbering meets elevated beauty artistry."
              />
              <p className="mt-6 text-[15px] sm:text-base leading-[1.75] text-[#5C5852]">
                Whether you arrive for a crisp 40-minute executive beard contour, a restorative
                keratin ritual, or a complete celebration styling session, every appointment begins
                with a thoughtful consultation and unhurried execution.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link to="/about">
                  <Button variant="primary" size="lg">
                    Read Our Story
                  </Button>
                </Link>
                <Link to="/gallery">
                  <Button variant="outline" size="lg">
                    Tour The Atelier
                  </Button>
                </Link>
              </div>
            </EditorialReveal>
          </div>

          {/* 4. Why Choose Us — Editorial Craft Ledger */}
          <div className="mt-20 border-t border-[#D7CFC1] pt-14">
            <StaggerContainer className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {STANDARDS.map((item) => (
                <StaggerItem key={item.index}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#8B1A2D] tabular-nums">
                        {item.index}
                      </span>
                      <span aria-hidden="true" className="h-px flex-1 bg-[#D7CFC1]" />
                    </div>
                    <h3 className="font-serif text-[1.4rem] font-medium text-[#2A0810]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-[1.7] text-[#5C5852]">{item.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* 5. Popular Packages — Asymmetric Editorial Trio */}
      {orderedPackages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
          <EditorialReveal>
            <SectionHeader
              kicker="03 · Signature Suites"
              title={t.sections.packages}
              subtitle="Multi-step rituals crafted for weddings, receptions, and complete seasonal grooming refreshes."
              align="center"
            />
          </EditorialReveal>

          <StaggerContainer className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-stretch">
            {orderedPackages.map((pkg) => {
              const isSignatureCenter = pkg.slug === 'silk-infused-keratin-restoration';
              return (
                <StaggerItem key={pkg.id} className="h-full">
                  <div
                    className={`flex h-full flex-col justify-between rounded-[4px] border p-8 sm:p-9 transition-transform duration-200 hover:-translate-y-1 ${
                      isSignatureCenter
                        ? 'border-[#4A121F] bg-[#380B16] text-[#FAF8F4] shadow-[0_16px_40px_rgba(42,8,16,0.18)]'
                        : 'border-[#E6DADC] bg-white text-[#2A0810]'
                    }`}
                  >
                    <div>
                      <div
                        className={`flex items-center justify-between text-xs ${
                          isSignatureCenter ? 'text-[#B8B0A4]' : 'text-[#777777]'
                        }`}
                      >
                        <span className="tabular-nums">{pkg.durationMinutes} min session</span>
                        <span className="text-[#F0B6BF]">
                          {isSignatureCenter ? 'Signature Restoration' : 'Curated Suite'}
                        </span>
                      </div>
                      <h3
                        className={`mt-4 font-serif text-[1.8rem] font-medium leading-[1.15] ${
                          isSignatureCenter ? 'text-[#FAF8F4]' : 'text-[#2A0810]'
                        }`}
                      >
                        {pkg.name}
                      </h3>
                      <p
                        className={`mt-4 text-sm leading-[1.72] ${
                          isSignatureCenter ? 'text-[#CEC7BC]' : 'text-[#5C5852]'
                        }`}
                      >
                        {pkg.description}
                      </p>
                    </div>
                    <div
                      className={`mt-9 flex items-center justify-between border-t pt-6 ${
                        isSignatureCenter ? 'border-white/15' : 'border-[#E6DADC]'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[11px] ${
                            isSignatureCenter ? 'text-[#A8A095]' : 'text-[#777777]'
                          }`}
                        >
                          Starting from
                        </p>
                        <p
                          className={`mt-0.5 font-mono text-xl font-medium tabular-nums ${
                            isSignatureCenter ? 'text-[#FAF8F4]' : 'text-[#2A0810]'
                          }`}
                        >
                          {formatNpr(pkg.priceNpr, lang)}
                        </p>
                      </div>
                      <Button
                        variant={isSignatureCenter ? 'gold' : 'primary'}
                        size="sm"
                        onClick={() => handleBookService(pkg.id)}
                      >
                        Reserve Suite
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      )}

      {/* 6. Before & After Transformations */}
      {beforeAfterItems.length > 0 && (
        <section className="border-t border-[#E6DADC] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
            <EditorialReveal>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeader
                  kicker="04 · Editorial Proof"
                  title={t.sections.transformations}
                  subtitle="Drag the slider to inspect refined, natural-looking craft across grooming and color artistry."
                />
                <Link
                  to="/gallery"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-[#2A0810] hover:text-[#8B1A2D] transition-colors whitespace-nowrap pb-1 border-b border-[#6B1222]/20 hover:border-[#9E1F32]"
                >
                  <span>Explore Full Lookbook</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </EditorialReveal>
            <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2">
              {beforeAfterItems.slice(0, 2).map((item) => (
                <EditorialReveal key={item.id}>
                  <BeforeAfterSlider
                    title={item.title}
                    description={item.description}
                    beforeSrc={item.beforeImageUrl}
                    afterSrc={item.imageUrl}
                  />
                </EditorialReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Meet Our Experts */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <EditorialReveal>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              kicker="05 · Our Artisans"
              title={t.sections.experts}
              subtitle="Experienced barbers, colorists, makeup artists, and skincare specialists dedicated to unhurried craft."
            />
            <Link
              to="/team"
              className="group inline-flex items-center gap-2 text-sm font-medium text-[#2A0810] hover:text-[#8B1A2D] transition-colors whitespace-nowrap pb-1 border-b border-[#6B1222]/20 hover:border-[#9E1F32]"
            >
              <span>Full Team Directory</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </EditorialReveal>

        <StaggerContainer className="mt-14 grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <StaggerItem key={member.id} className="h-full">
              <div className="group flex h-full flex-col justify-between">
                <div>
                  <div className="aspect-[3/4] overflow-hidden rounded-[4px] bg-[#EFE1E4]">
                    <SafeImage
                      src={member.avatarUrl}
                      alt={member.fullName}
                      className="h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-5 text-xs text-[#8B1A2D]">
                    {member.roleTitle} ·{' '}
                    <span className="tabular-nums">{member.experienceYears} yrs</span>
                  </p>
                  <h3 className="mt-1.5 font-serif text-[1.45rem] font-medium text-[#2A0810]">
                    {member.fullName}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#777777]">
                    {(member.specializations || []).join(' · ')}
                  </p>
                </div>
                <div className="mt-5 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleBookStaff(member.id)}
                  >
                    Book With Specialist
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* 8. Special Nepal Festival Offers — Obsidian Luxury Showcase */}
      {offers.length > 0 && (
        <section className="bg-[#2A0810] text-[#FAF8F4]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
            <EditorialReveal>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeader
                  kicker="06 · Nepal Festive Calendar"
                  title={t.sections.specialOffers}
                  subtitle="Curated privileges for Dashain, Tihar, Teej, Chhath, and Nepali New Year celebrations."
                  dark
                />
                <Link
                  to="/offers"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-[#F0B6BF] hover:text-[#FAF8F4] transition-colors whitespace-nowrap pb-1 border-b border-[#9E1F32]/40"
                >
                  <span>All Seasonal Offers</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </EditorialReveal>

            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
              {offers.map((offer) => (
                <EditorialReveal key={offer.id}>
                  <div className="group grid h-full grid-cols-1 sm:grid-cols-12 overflow-hidden rounded-[4px] border border-white/12 bg-[#181715]">
                    <div className="sm:col-span-5 overflow-hidden bg-[#22201D]">
                      <SafeImage
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="h-full min-h-[220px] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="flex flex-col justify-between p-7 sm:col-span-7">
                      <div>
                        <p className="text-xs font-medium tracking-[0.06em] text-[#F0B6BF]">
                          {offer.festivalTag.replace(/_/g, ' ')} · {offer.discountText}
                        </p>
                        <h3 className="mt-2.5 font-serif text-[1.65rem] leading-[1.15] text-[#FAF8F4]">
                          {lang === 'ne' && offer.titleNe ? offer.titleNe : offer.title}
                        </h3>
                        <p className="mt-3 text-sm leading-[1.7] text-[#C4BCB0]">
                          {offer.description}
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                        {offer.promoCode ? (
                          <button
                            type="button"
                            onClick={() => handleCopyCode(offer.promoCode)}
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-[#E6DADC] hover:text-[#F0B6BF] transition-colors cursor-pointer"
                          >
                            {copiedOfferCode === offer.promoCode ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-[#F0B6BF]" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-[#F0B6BF]" /> {offer.promoCode}
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="font-mono text-xs text-[#A8A095]">In-Salon Privilege</span>
                        )}
                        <Link to="/booking">
                          <Button variant="gold" size="sm">
                            Claim Offer
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </EditorialReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Client Reflections — Magazine Editorial Quotes */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <EditorialReveal>
          <SectionHeader
            kicker="07 · Client Reflections"
            title={t.sections.testimonials}
            subtitle="Reflections from guests who visit our Birgunj atelier for precision grooming, color, and skincare."
            align="center"
          />
        </EditorialReveal>

        <StaggerContainer className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {reviews.map((review) => (
            <StaggerItem key={review.id} className="h-full">
              <blockquote className="flex h-full flex-col justify-between rounded-[4px] border border-[#E6DADC] bg-white p-8">
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-1 text-[#9E1F32]"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: review.rating }).map((_, idx) => (
                        <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <span
                      aria-hidden="true"
                      className="font-serif text-4xl leading-none text-[#E6DADC] select-none"
                    >
                      “
                    </span>
                  </div>
                  <p className="mt-5 font-serif text-[1.35rem] leading-[1.48] text-[#2A0810]">
                    {review.comment}
                  </p>
                </div>
                <footer className="mt-8 border-t border-[#E6DADC] pt-4">
                  <p className="text-sm font-medium text-[#2A0810]">{review.customerName}</p>
                  <p className="mt-0.5 text-xs text-[#777777]">{review.serviceName}</p>
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* 10. Instagram & Social Dispatches */}
      <section className="border-t border-[#E6DADC] bg-[#EFE9DE]/55">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
          <EditorialReveal>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                kicker="@the_beard_shop1"
                title={t.sections.socialFeed}
                subtitle="Recent looks, reels, and studio dispatches curated directly from our admin studio."
              />
              <div className="flex items-center gap-6">
                <Link
                  to="/updates"
                  className="text-sm font-medium text-[#2A0810] hover:text-[#8B1A2D] transition-colors whitespace-nowrap"
                >
                  All Updates
                </Link>
                <a
                  href={settings?.instagramUrl || 'https://www.instagram.com/the_beard_shop1/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8B1A2D] hover:text-[#2A0810] transition-colors whitespace-nowrap"
                >
                  <Instagram className="h-4 w-4" /> Follow Instagram
                </a>
              </div>
            </div>
          </EditorialReveal>

          <StaggerContainer className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {socialPosts.map((post) => (
              <StaggerItem key={post.id} className="h-full">
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col overflow-hidden rounded-[4px] border border-[#E6DADC] bg-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#EFE1E4]">
                    <SafeImage
                      src={post.imageUrl}
                      alt={post.caption}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    />
                    {post.mediaType === 'REEL' && (
                      <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#2A0810]/80 text-[#F0B6BF] backdrop-blur-sm">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5">
                    <p className="text-[11px] font-medium tracking-[0.06em] text-[#8B1A2D]">
                      {post.platform} · {post.mediaType}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-[1.65] text-[#5C5852]">
                      {post.caption}
                    </p>
                  </div>
                </a>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* 11. Location & Opening Hours */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-stretch">
          <EditorialReveal className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <SectionHeader
              kicker="Birgunj, Nepal"
              title={t.sections.visitUs}
              subtitle="Located in Birgunj, Parsa, Madhesh Province. Walk-ins are welcomed when chairs allow; online appointments are prioritized."
            />

            <div className="space-y-4 border-t border-[#E6DADC] pt-6 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8B1A2D]" />
                <span className="leading-relaxed text-[#222222]">
                  {settings?.address || 'Birgunj, Parsa, Madhesh Province, Nepal'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#8B1A2D]" />
                <span className="tabular-nums text-[#222222]">{settings?.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#8B1A2D]" />
                <div className="w-full space-y-1.5">
                  {(settings?.openingHours || []).slice(0, 7).map((row) => (
                    <div key={row.day} className="flex justify-between text-xs text-[#5C5852]">
                      <span>{row.day}</span>
                      <span className="font-mono tabular-nums text-[#222222]">
                        {row.closed ? 'Closed' : `${row.open} – ${row.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/booking">
                <Button variant="primary" size="lg">
                  Book Appointment
                </Button>
              </Link>
              <a
                href={
                  settings?.googleMapsUrl ||
                  'https://www.google.com/maps/place/The+Beard+Shop+Beauty+Salon/@27.014045,84.8482375,14z/'
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  Directions <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          </EditorialReveal>

          <EditorialReveal delay={0.1} className="lg:col-span-7">
            <div className="h-full overflow-hidden rounded-[4px] border border-[#E6DADC] bg-white p-2">
              <SalonLocationMap
                businessName={settings?.businessName || 'The Beard Shop Beauty Salon'}
                address={settings?.address || 'Birgunj, Parsa, Madhesh Province, Nepal'}
                latitude={settings?.latitude || 27.014045}
                longitude={settings?.longitude || 84.8482375}
                googleMapsUrl={
                  settings?.googleMapsUrl ||
                  'https://www.google.com/maps/place/The+Beard+Shop+Beauty+Salon/@27.014045,84.8482375,14z/'
                }
                heightClass="h-[420px] lg:h-full lg:min-h-[460px]"
              />
            </div>
          </EditorialReveal>
        </div>
      </section>
    </div>
  );
}
