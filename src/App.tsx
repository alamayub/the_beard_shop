import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminGuard } from './routes/AdminGuard';
import { HomePage } from './pages/public/HomePage';

// Route-based code splitting
const AboutPage = lazy(() =>
  import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const ServicesPage = lazy(() =>
  import('./pages/public/ServicesPage').then((m) => ({ default: m.ServicesPage }))
);
const ServiceDetailPage = lazy(() =>
  import('./pages/public/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage }))
);
const GalleryPage = lazy(() =>
  import('./pages/public/GalleryPage').then((m) => ({ default: m.GalleryPage }))
);
const TeamPage = lazy(() =>
  import('./pages/public/TeamPage').then((m) => ({ default: m.TeamPage }))
);
const UpdatesPage = lazy(() =>
  import('./pages/public/UpdatesPage').then((m) => ({ default: m.UpdatesPage }))
);
const BookingPage = lazy(() =>
  import('./pages/public/BookingPage').then((m) => ({ default: m.BookingPage }))
);
const MyBookingsPage = lazy(() =>
  import('./pages/public/MyBookingsPage').then((m) => ({ default: m.MyBookingsPage }))
);
const ContactPage = lazy(() =>
  import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const BlogPage = lazy(() =>
  import('./pages/public/BlogPage').then((m) => ({ default: m.BlogPage }))
);
const BlogDetailPage = lazy(() =>
  import('./pages/public/BlogDetailPage').then((m) => ({ default: m.BlogDetailPage }))
);
const OffersPage = lazy(() =>
  import('./pages/public/OffersPage').then((m) => ({ default: m.OffersPage }))
);
const FaqPage = lazy(() =>
  import('./pages/public/StaticPages').then((m) => ({ default: m.FaqPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('./pages/public/StaticPages').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/public/StaticPages').then((m) => ({ default: m.TermsPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/public/StaticPages').then((m) => ({ default: m.NotFoundPage }))
);

// Admin Pages (lazy loaded separately from public bundle)
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminBookingsPage = lazy(() =>
  import('./pages/admin/AdminBookingsPage').then((m) => ({ default: m.AdminBookingsPage }))
);
const AdminServicesPage = lazy(() =>
  import('./pages/admin/AdminCatalogPages').then((m) => ({ default: m.AdminServicesPage }))
);
const AdminCategoriesPage = lazy(() =>
  import('./pages/admin/AdminCatalogPages').then((m) => ({ default: m.AdminCategoriesPage }))
);
const AdminGalleryPage = lazy(() =>
  import('./pages/admin/AdminCatalogPages').then((m) => ({ default: m.AdminGalleryPage }))
);
const AdminTeamPage = lazy(() =>
  import('./pages/admin/AdminPeoplePages').then((m) => ({ default: m.AdminTeamPage }))
);
const AdminSchedulesPage = lazy(() =>
  import('./pages/admin/AdminPeoplePages').then((m) => ({ default: m.AdminSchedulesPage }))
);
const AdminCustomersPage = lazy(() =>
  import('./pages/admin/AdminPeoplePages').then((m) => ({ default: m.AdminCustomersPage }))
);
const AdminSocialPage = lazy(() =>
  import('./pages/admin/AdminContentPages').then((m) => ({ default: m.AdminSocialPage }))
);
const AdminBlogPage = lazy(() =>
  import('./pages/admin/AdminContentPages').then((m) => ({ default: m.AdminBlogPage }))
);
const AdminOffersPage = lazy(() =>
  import('./pages/admin/AdminContentPages').then((m) => ({ default: m.AdminOffersPage }))
);
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/AdminContentPages').then((m) => ({ default: m.AdminReviewsPage }))
);
const AdminPaymentsPage = lazy(() =>
  import('./pages/admin/AdminOperationsPages').then((m) => ({ default: m.AdminPaymentsPage }))
);
const AdminNotificationsPage = lazy(() =>
  import('./pages/admin/AdminOperationsPages').then((m) => ({ default: m.AdminNotificationsPage }))
);
const AdminReportsPage = lazy(() =>
  import('./pages/admin/AdminOperationsPages').then((m) => ({ default: m.AdminReportsPage }))
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminOperationsPages').then((m) => ({ default: m.AdminSettingsPage }))
);
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminOperationsPages').then((m) => ({ default: m.AdminUsersPage }))
);
const AdminProfilePage = lazy(() =>
  import('./pages/admin/AdminOperationsPages').then((m) => ({ default: m.AdminProfilePage }))
);

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, [pathname, hash]);
  return null;
}

function PageFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#6A5A5D]">
      Loading...
    </div>
  );
}

export default function App() {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const handler = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<ServiceDetailPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/updates" element={<UpdatesPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin Auth */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin Dashboard Routes */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="gallery" element={<AdminGalleryPage />} />
                <Route path="team" element={<AdminTeamPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="social" element={<AdminSocialPage />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="offers" element={<AdminOffersPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="schedules" element={<AdminSchedulesPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="profile" element={<AdminProfilePage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  );
}
