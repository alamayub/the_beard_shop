import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { signOut } from 'firebase/auth';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  ExternalLink,
  FolderTree,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  Share2,
  ShieldCheck,
  Star,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { clearCredentials } from '../store/slices/authSlice';
import { useLogoutSessionMutation } from '../api/salonApi';
import { useGetAdminNotificationsQuery } from '../api/adminApi';
import { AdminToastViewport } from '../components/admin/AdminPrimitives';
import { LUXURY_EASE, PageTransition } from '../components/ui/MotionPrimitives';

const ADMIN_NAV_GROUPS = [
  {
    group: 'Operations',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell, showUnread: true },
      { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    group: 'Studio Catalog',
    items: [
      { to: '/admin/services', label: 'Services', icon: Scissors },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
    ],
  },
  {
    group: 'People & Calendar',
    items: [
      { to: '/admin/team', label: 'Team Members', icon: Users },
      { to: '/admin/schedules', label: 'Staff Schedules', icon: CalendarClock },
      { to: '/admin/customers', label: 'Customers', icon: UserCircle },
    ],
  },
  {
    group: 'Growth & Content',
    items: [
      { to: '/admin/social', label: 'Social Media', icon: Share2 },
      { to: '/admin/blog', label: 'Blog Posts', icon: BookOpen },
      { to: '/admin/offers', label: 'Offers', icon: Gift },
      { to: '/admin/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    group: 'System',
    items: [
      { to: '/admin/settings', label: 'Website Settings', icon: Settings },
      { to: '/admin/users', label: 'Users & Roles', icon: ShieldCheck },
      { to: '/admin/profile', label: 'Profile', icon: UserCircle },
    ],
  },
];

const ALL_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const [logoutSession] = useLogoutSessionMutation();
  const { data: notifData } = useGetAdminNotificationsQuery();

  const unreadCount =
    (notifData?.notifications || []).filter((n) => !n.isRead).length +
    (notifData?.contactMessages || []).filter((m) => m.status === 'NEW').length;

  const activeNav =
    ALL_NAV_ITEMS.find((item) =>
      item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)
    ) || ALL_NAV_ITEMS[0];

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await logoutSession().unwrap();
    } catch {
      // ignore network error during sign-out
    }
    await signOut(auth).catch(() => {});
    dispatch(clearCredentials());
    navigate('/admin/login');
  };

  const renderNavLinks = (onSelect?: () => void) => (
    <div className="space-y-5">
      {ADMIN_NAV_GROUPS.map((section) => (
        <div key={section.group}>
          <p className="px-3 pb-1.5 text-[11px] font-medium tracking-[0.06em] text-[#B89299]">
            {section.group}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onSelect}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-2.5 rounded-[4px] px-3 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#9E1F32] text-[#FAF8F4]'
                        : 'text-[#DECACE] hover:bg-white/[0.08] hover:text-[#FAF8F4]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.showUnread && unreadCount > 0 && (
                        <span
                          className={`font-mono text-[11px] tabular-nums shrink-0 ${
                            isActive ? 'text-[#FAF8F4] font-semibold' : 'text-[#F0B6BF]'
                          }`}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F4F5] text-[#2A1216]">
      {/* Desktop Deep Burgundy Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#4A121F] bg-[#2A0810] text-[#E6D4D7] sticky top-0 h-screen">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <Link
            to="/admin"
            className="font-serif text-xl font-semibold tracking-tight text-[#FAF8F4] whitespace-nowrap"
          >
            The Beard Shop
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">{renderNavLinks()}</nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-[4px] px-3 py-2 text-[13px] font-medium text-[#E6D4D7] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#2A0810]/65 backdrop-blur-[2px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.24, ease: LUXURY_EASE }}
              className="flex h-full w-72 flex-col bg-[#2A0810] text-[#E6D4D7] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                <span className="font-serif text-xl text-[#FAF8F4]">The Beard Shop</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                  className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[#E6D4D7] hover:bg-white/10 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                {renderNavLinks(() => setSidebarOpen(false))}
              </nav>
              <div className="border-t border-white/10 p-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-3 py-2.5 text-sm font-medium text-[#E6D4D7] hover:bg-white/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Admin Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#E6DADC] bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[#E6DADC] text-[#6B1222] hover:bg-[#FAF8F4] lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#6A5A5D] truncate">
              <Link
                to="/admin"
                className="font-medium text-[#6B1222] hover:text-[#9E1F32] whitespace-nowrap"
              >
                Salon Management
              </Link>
              <span className="text-[#C8B2B6]">/</span>
              <span className="truncate text-[#5C4B4E]">{activeNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/admin/notifications"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C4B4E] hover:text-[#6B1222] whitespace-nowrap"
              title="Notifications & Inquiries"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="font-mono text-[11px] font-semibold text-[#9E1F32] tabular-nums">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#5C4B4E] hover:text-[#6B1222] whitespace-nowrap"
            >
              <span>Public Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <Link
              to="/admin/profile"
              className="hidden sm:block border-l border-[#E6DADC] pl-4 text-right hover:opacity-80 transition-opacity"
            >
              <p className="text-xs font-medium text-[#2A0810] leading-tight">
                {user?.fullName || 'Administrator'}
              </p>
              <p className="text-[11px] text-[#7D6C70] leading-tight">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={pathname} routeKey={pathname}>
              {outlet}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      <AdminToastViewport />
    </div>
  );
}
