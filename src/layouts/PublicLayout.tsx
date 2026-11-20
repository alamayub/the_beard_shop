import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import {
  ArrowRight,
  ArrowUp,
  Globe,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  X,
} from 'lucide-react';
import { useGetSettingsQuery } from '../api/salonApi';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { setLanguage } from '../store/slices/uiSlice';
import { buildWhatsAppLink, COPY } from '../utils/nepal';
import { Button } from '../components/ui/Primitives';
import {
  LUXURY_EASE,
  PageTransition,
  smoothScrollToTop,
} from '../components/ui/MotionPrimitives';

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();
  const lang = useAppSelector((s) => s.ui.language);
  const dispatch = useAppDispatch();
  const { data: settings } = useGetSettingsQuery();
  const t = COPY[lang];

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 32, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setShowScrollTop(window.scrollY > 460);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const brandName = settings?.businessName?.replace(' Beauty Salon', '') || 'The Beard Shop';
  const whatsappUrl = buildWhatsAppLink(
    settings?.whatsappNumber || '9779800000000',
    'Namaste! I would like to inquire about booking an appointment at The Beard Shop in Birgunj.'
  );

  const primaryLinks = [
    { to: '/services', label: t.nav.services },
    { to: '/gallery', label: t.nav.gallery },
    { to: '/team', label: t.nav.team },
    { to: '/offers', label: t.nav.offers },
    { to: '/contact', label: t.nav.contact },
  ];

  const isBookingRoute = location.pathname === '/booking';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#2A1216]">
      {/* Strict 3-Zone Luxury Top Bar Contract */}
      <header
        className={`sticky top-0 z-40 h-16 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[#E6DADC] bg-[#FAF8F4]/92 backdrop-blur-md shadow-[0_4px_24px_rgba(42,8,16,0.06)]'
            : 'border-b border-[#E6DADC]/70 bg-[#FAF8F4]/98'
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-serif text-[1.55rem] sm:text-[1.7rem] font-medium tracking-[-0.015em] text-[#6B1222] whitespace-nowrap shrink-0 transition-opacity hover:opacity-80"
          >
            {brandName}
          </Link>

          {/* Zone 2: 5 clean single-line navigation links */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-8 text-[13.5px] font-medium tracking-[0.015em] text-[#5C4B4E]"
          >
            {primaryLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative py-2 transition-colors duration-200 whitespace-nowrap shrink-0 hover:text-[#6B1222] ${
                    isActive ? 'text-[#6B1222]' : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-underline"
                        transition={{ duration: 0.28, ease: LUXURY_EASE }}
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#9E1F32]"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: 1 Primary CTA + Mobile Drawer Trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/booking" className="inline-flex">
              <Button variant="primary" size="sm" className="h-9 sm:h-10 px-3.5 sm:px-5">
                {t.nav.bookNow}
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-11 w-11 items-center justify-center rounded-[4px] text-[#6B1222] hover:bg-[#EFE1E4]/75 transition-colors md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Subtle Crimson Reading Progress Hairline */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX }}
          className="h-[2px] w-full origin-left bg-[#9E1F32]"
        />
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#2A0810]/60 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: LUXURY_EASE }}
              className="ml-auto flex h-full w-[86%] max-w-sm flex-col justify-between bg-[#FAF8F4] p-6 shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              aria-label="Mobile navigation"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#E6DADC] pb-5">
                  <span className="font-serif text-2xl font-medium text-[#6B1222]">
                    {brandName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation menu"
                    className="flex h-11 w-11 items-center justify-center rounded-[4px] text-[#6B1222] hover:bg-[#EFE1E4]/75 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-6 flex flex-col divide-y divide-[#E6DADC]/70">
                  {[
                    { to: '/', label: 'Home' },
                    { to: '/about', label: t.nav.about },
                    ...primaryLinks,
                    { to: '/updates', label: t.nav.updates },
                    { to: '/blog', label: t.nav.blog },
                    { to: '/my-bookings', label: t.nav.myBookings },
                    { to: '/faq', label: 'FAQ' },
                    { to: '/admin', label: t.nav.admin },
                  ].map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between py-3 text-[15px] transition-colors ${
                          isActive
                            ? 'font-semibold text-[#6B1222]'
                            : 'font-normal text-[#4A3B3E] hover:text-[#6B1222]'
                        }`
                      }
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#9E1F32]" />
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="mt-8 space-y-4 border-t border-[#E6DADC] pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#5C4B4E]">Language / भाषा</span>
                  <div className="flex items-center gap-1 rounded-[4px] bg-[#EFE1E4]/85 p-1">
                    <button
                      type="button"
                      onClick={() => dispatch(setLanguage('en'))}
                      className={`min-h-[34px] px-3 text-xs rounded-[3px] transition-colors cursor-pointer ${
                        lang === 'en' ? 'bg-[#6B1222] text-[#FAF8F4] font-medium' : 'text-[#5C4B4E]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(setLanguage('ne'))}
                      className={`min-h-[34px] px-3 text-xs rounded-[3px] transition-colors cursor-pointer ${
                        lang === 'ne' ? 'bg-[#6B1222] text-[#FAF8F4] font-medium' : 'text-[#5C4B4E]'
                      }`}
                    >
                      नेपाली
                    </button>
                  </div>
                </div>

                <Link to="/booking" onClick={() => setMobileOpen(false)} className="block">
                  <Button variant="primary" size="lg" className="w-full">
                    {t.nav.bookNow}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <div className="flex items-center justify-between pt-1 text-xs text-[#5C4B4E]">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#2A0810] hover:text-[#9E1F32]"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-[#9E1F32]" /> WhatsApp
                  </a>
                  <a
                    href={
                      settings?.googleMapsUrl ||
                      'https://www.google.com/maps/place/The+Beard+Shop+Beauty+Salon/@27.014045,84.8482375,14z/'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#2A0810] hover:text-[#9E1F32]"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#9E1F32]" /> Directions
                  </a>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with Smooth Page Transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname} routeKey={location.pathname}>
            {outlet}
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Quiet Editorial Pre-Footer Invitation Strip */}
      {!isBookingRoute && (
        <section className="border-t border-[#E6DADC] bg-[#F5EAEB]/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="max-w-xl">
              <p className="text-xs font-medium tracking-[0.08em] text-[#8B1A2D]">
                Private Chair Reservations · Birgunj
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#2A0810]">
                An unhurried appointment awaits.
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/booking">
                <Button variant="primary" size="lg">
                  {t.nav.bookNow}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg">
                  WhatsApp Concierge
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Deep Burgundy Luxury Editorial Footer */}
      <footer className="border-t border-[#4A121F] bg-[#2A0810] text-[#E6D4D7]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-4">
              <p className="font-serif text-[1.75rem] font-medium tracking-[-0.01em] text-[#FAF8F4]">
                {settings?.businessName || 'The Beard Shop Beauty Salon'}
              </p>
              <p className="text-sm leading-[1.75] text-[#C8AEB2] max-w-sm">
                {lang === 'ne'
                  ? settings?.taglineNe || 'तपाईंको शैली, तपाईंको पहिचान।'
                  : 'An editorial unisex beauty salon and grooming atelier in Birgunj, Parsa, Madhesh Province, Nepal.'}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#E3A0AA]" />
                <button
                  type="button"
                  onClick={() => dispatch(setLanguage('en'))}
                  className={`text-xs px-2.5 py-1.5 rounded-[3px] cursor-pointer transition-colors ${
                    lang === 'en'
                      ? 'bg-[#9E1F32] text-[#FAF8F4] font-semibold'
                      : 'text-[#C8AEB2] hover:text-[#FAF8F4]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(setLanguage('ne'))}
                  className={`text-xs px-2.5 py-1.5 rounded-[3px] cursor-pointer transition-colors ${
                    lang === 'ne'
                      ? 'bg-[#9E1F32] text-[#FAF8F4] font-semibold'
                      : 'text-[#C8AEB2] hover:text-[#FAF8F4]'
                  }`}
                >
                  नेपाली
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 lg:col-start-6">
              <h3 className="font-serif text-lg font-medium text-[#FAF8F4] mb-4">Atelier</h3>
              <ul className="space-y-3 text-sm text-[#D6BFC3]">
                <li>
                  <Link to="/about" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.about}
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.services}
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.gallery}
                  </Link>
                </li>
                <li>
                  <Link to="/team" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.team}
                  </Link>
                </li>
                <li>
                  <Link to="/updates" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.updates}
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.blog}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-serif text-lg font-medium text-[#FAF8F4] mb-4">Client Care</h3>
              <ul className="space-y-3 text-sm text-[#D6BFC3]">
                <li>
                  <Link to="/booking" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.bookNow}
                  </Link>
                </li>
                <li>
                  <Link to="/my-bookings" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.myBookings}
                  </Link>
                </li>
                <li>
                  <Link to="/offers" className="hover:text-[#FAF8F4] transition-colors">
                    {t.nav.offers}
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-[#FAF8F4] transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-[#FAF8F4] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#FAF8F4] transition-colors">
                    Terms & Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3.5 text-sm lg:col-span-3">
              <h3 className="font-serif text-lg font-medium text-[#FAF8F4] mb-4">Birgunj Studio</h3>
              <p className="leading-relaxed text-[#C8AEB2]">
                {settings?.address || 'Birgunj, Parsa, Madhesh Province, Nepal'}
              </p>
              <p className="tabular-nums text-[#FAF8F4]">{settings?.phone}</p>
              <p className="text-[#C8AEB2]">{settings?.email}</p>
              <div className="pt-3 flex flex-wrap items-center gap-5 text-xs">
                <a
                  href={settings?.instagramUrl || 'https://www.instagram.com/the_beard_shop1/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#F0B6BF] hover:text-[#FAF8F4] transition-colors"
                >
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </a>
                <a
                  href={settings?.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F0B6BF] hover:text-[#FAF8F4] transition-colors"
                >
                  Google Maps
                </a>
                <Link to="/admin" className="text-[#B5979C] hover:text-[#FAF8F4] transition-colors">
                  Staff Portal
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-3 border-t border-white/12 pt-8 text-xs text-[#B5979C] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {settings?.businessName || 'The Beard Shop Beauty Salon'}.
              Sample prices, staff profiles, and contact placeholders are editable demo content.
            </p>
            <p className="tabular-nums shrink-0">Asia/Kathmandu (NPT) · NPR</p>
          </div>
        </div>
      </footer>

      {/* Floating Scroll-To-Top + WhatsApp Concierge Actions */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2.5">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2, ease: LUXURY_EASE }}
              onClick={smoothScrollToTop}
              aria-label="Scroll to top"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6B1222]/25 bg-[#FAF8F4]/95 text-[#6B1222] shadow-md backdrop-blur-sm transition-colors hover:bg-[#6B1222] hover:text-[#FAF8F4] cursor-pointer"
            >
              <ArrowUp className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp for appointment booking"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B1222] text-[#FAF8F4] shadow-[0_8px_24px_rgba(107,18,34,0.34)] ring-1 ring-[#F0B6BF]/35 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#88182C]"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
