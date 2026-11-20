# Implementation Guide & System Architecture

This document explains how **The Beard Shop Beauty Salon** web application, booking engine, and management platform are engineered across the frontend, backend, database, and third-party integrations.

---

## 1. High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                      React 19 SPA (Vite 8 + Tailwind v4)             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐  │
│  │ Public Website (16) │  │ Booking Engine (2)  │  │ Admin (18)   │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────┬───────┘  │
│             └────────────────────────┼────────────────────┘          │
│                      Redux Toolkit + RTK Query                       │
│         (salonApi: public cache  |  adminApi: Bearer + RBAC)         │
└──────────────────────────────────────┼───────────────────────────────┘
                                       │ HTTPS / JSON + HTTP-only Cookie
┌──────────────────────────────────────▼───────────────────────────────┐
│                   Express 4 Server (server.ts :3000)                 │
│  Helmet • CORS • Cookie Parser • Rate Limiter (400/15m) • Zod        │
│  ┌────────────────┐  ┌─────────────────────────┐  ┌───────────────┐  │
│  │ /api/auth/*    │  │ /api/* (Public/Booking) │  │ /api/admin/*  │  │
│  │ Firebase + JWT │  │ bookingEngine.ts (NPT)  │  │ RBAC + Audit  │  │
│  └───────┬────────┘  └────────────┬────────────┘  └───────┬───────┘  │
│          └────────────────────────┼───────────────────────┘          │
│                           Drizzle ORM (`pg`)                         │
└───────────────────────────────────┼──────────────────────────────────┘
                                    ▼
                     PostgreSQL (Cloud SQL — 20 Tables)
```

---

## 2. Frontend Implementation

### 2.1 Routing & Code Splitting (`src/App.tsx`)
- All non-home public pages and all 18 admin pages are lazy-loaded using `React.lazy` and wrapped in a `<Suspense>` boundary to keep initial load times fast.
- Public routes render inside `PublicLayout`; protected admin routes sit behind `AdminGuard` inside `AdminLayout`.
- `ScrollToTop` handles smooth scrolling on route changes and hash anchors (`#section`) while respecting `window.matchMedia('(prefers-reduced-motion: reduce)')`.

### 2.2 Smooth Scrolling & Page Transitions
- **CSS Layer (`src/index.css`)**: Configures `scroll-behavior: smooth`, `scroll-padding-top: 5rem`, Royal Maroon CSS custom properties (`--color-maroon-primary`, `--color-burgundy-deep`, etc.), and disables smooth scroll under `@media (prefers-reduced-motion: reduce)`.
- **Motion Layer (`src/components/ui/MotionPrimitives.tsx`)**:
  - `PageTransition`: Subtle fade + vertical ease (`[0.22, 1, 0.36, 1]`) driven by `<AnimatePresence mode="wait">` inside `PublicLayout` and `AdminLayout` wrapping `useOutlet()`.
  - `smoothScrollToTop()`: Programmatic reduced-motion-aware helper used by the floating back-to-top button and multi-step booking progression.
  - `MotionConfig reducedMotion="user"` wraps the root router in `src/App.tsx`.

### 2.3 State Management (`src/store/` & `src/api/`)
- **Redux Slices**:
  - `authSlice.ts`: Stores `user`, `accessToken`, and session hydration state; synced with Firebase Auth and `/api/auth/session` + `/api/auth/refresh`.
  - `bookingSlice.ts`: Preserves selected services, stylist preference, date, time slot, and customer draft across booking wizard navigation.
  - `uiSlice.ts`: Controls global UI state such as mobile navigation drawer and active notification banners.
- **RTK Query APIs**:
  - `salonApi.ts`: Public catalog bootstrap (`getBootstrap`), live availability (`getAvailability` with `excludeBookingId`), booking creation/lookup/reschedule/cancel, payment initiation/verification, contact submission, and auth session endpoints.
  - `adminApi.ts`: Complete tag-invalidating CRUD hooks for all 18 admin modules (`Dashboard`, `Bookings`, `Services`, `Categories`, `Gallery`, `Team`, `Schedules`, `Customers`, `Social`, `Blog`, `Offers`, `Reviews`, `Payments`, `Notifications`, `Reports`, `Settings`, `Users`, `Profile`) with automatic Bearer token injection and `401` token-refresh retry logic.

### 2.4 Design System & Reusable UI Components
- **Public Primitives (`src/components/ui/Primitives.tsx`)**: `Button` (`primary` Royal Maroon, `secondary` Deep Burgundy, `outline`, `ghost`, `gold`), `Input`, `Textarea`, `Select`, `Card`, `Modal`, `SectionHeader`, `PageIntro`, `Skeleton`, `SafeImage` (automatic fallback handling).
- **Admin Primitives (`src/components/admin/AdminPrimitives.tsx`)**:
  - `AdminPageHeader`, `AdminToolbar` (unified search + filters + record count), `AdminPagination` (client-side pagination with configurable page size).
  - `ConfirmModal` for destructive actions (delete/cancel).
  - `AdminImageField` supporting curated salon preset selection, direct URL entry, and base64 image upload to `/api/admin/upload`.
  - `StatusText` for semantic booking/payment/publish badges and `useAdminToast()` for non-blocking action feedback.

---

## 3. Backend Implementation

### 3.1 Unified Express + Vite Server (`server.ts`)
- Runs on port `3000` (`0.0.0.0`).
- In development (`NODE_ENV !== 'production'`), mounts Vite's middleware directly onto Express so both `/api/*` and SPA routes share a single origin with zero CORS friction.
- In production (`NODE_ENV === 'production'`), serves static assets from `dist/` with SPA history fallback.
- Applies `helmet`, `cors({ origin: true, credentials: true })`, `cookie-parser`, `4mb` JSON body limit (for base64 image uploads), and `express-rate-limit` (`400` requests / 15 minutes on `/api`).

### 3.2 Authentication & RBAC (`server/src/middleware/auth.ts`)
1. **Dual-Token Verification**: `requireAuth` accepts either an app-issued short-lived Access JWT (signed with `JWT_SECRET`) or a live Firebase ID Token (verified via `firebase-admin`).
2. **Pre-Invited Staff Binding**: When an admin pre-invites a staff member via `POST /api/admin/users`, a row is created with a placeholder UID (`invited-...`) and the target role (`MANAGER`, `RECEPTIONIST`, etc.). On first Firebase sign-in with that email, `getOrCreateUser` automatically binds the real Firebase `uid` to the existing user record while preserving the pre-assigned role.
3. **Suspension Enforcement**: Both JWT and Firebase auth paths verify `user.isActive === true` and return `403` for deactivated accounts.
4. **Role Guard (`requireRole(...)`)**: Enforces fine-grained route authorization across `SUPER_ADMIN`, `ADMIN`, `MANAGER`, and `RECEPTIONIST`.
5. **Audit Trail (`writeAuditLog`)**: Persists `actorUid`, `actorEmail`, `actorRole`, `action`, `entityType`, `entityId`, and JSON details to `audit_logs` on every admin mutation.

### 3.3 Transactional Booking Engine (`server/src/services/bookingEngine.ts`)
- **Nepal Time Utilities**:
  - `getKathmanduDateIso()` / `getKathmanduDateIsoOffset(days)` via `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' })`.
  - `getKathmanduCurrentMinutes()` for same-day slot cutoffs (`+15 min` lead buffer).
  - `getKathmanduYear()` for generating `TBS-YYYY-XXXX` booking references.
- **Availability Computation (`computeAvailability`)**:
  1. Rejects past dates (`date < todayKathmandu`) with `{ isPastDate: true, slots: [] }`.
  2. Checks `holidays` table for full-day salon closures (`isHoliday: true`).
  3. Loads active stylists, their `staff_schedules` for the target day of week, applicable `staff_breaks` (recurring `breakDate IS NULL` or date-specific), and existing active bookings (`PENDING`, `APPROVED`) excluding optional `excludeBookingId` (used during rescheduling).
  4. Iterates 30-minute slot intervals across operating hours, verifying contiguous availability for `totalDurationMinutes` and returning `{ time, endTime, available, availableStaffIds }[]`.
- **Concurrency & Double-Booking Prevention**:
  - `createBookingTransaction` and `rescheduleBookingTransaction` run inside `db.transaction` and acquire `SELECT pg_advisory_xact_lock(hashtext('booking:' || appointmentDate))`.
  - This guarantees serialized conflict checking for concurrent requests on the same calendar date.
  - Overlapping attempts throw `BookingConflictError`, which routes translate to HTTP `409 Conflict`.
  - `checkStylistOverlap(executor, ...)` is also shared with `POST /api/admin/bookings` and `PATCH /api/admin/bookings/:id` so manual admin walk-ins and edits cannot double-book a stylist.

### 3.4 Nepal Payment Architecture (`server/src/services/paymentService.ts`)
- Supports `CASH`, `ESEWA`, `KHALTI`, and `FONEPAY`.
- `initiatePayment` generates a tracked transaction record in `payments` (`INITIATED`) with provider-specific sandbox/production payload metadata.
- `verifyPayment` updates payment status (`VERIFIED` / `FAILED`), synchronizes `bookings.paymentStatus`, and logs a payment notification for the admin desk.

---

## 4. Nepal Localization Utilities (`src/utils/nepal.ts`)
- `formatNpr(amount)`: Formats Nepali Rupees with Indian/Nepali comma grouping (`NPR 1,500`).
- `getKathmanduTodayIso()` / `getKathmanduDateOffsetIso(days)` / `getKathmanduNowTimeLabel()`: Client-side `Asia/Kathmandu` date & live clock helpers.
- `formatBikramSambat(isoDate)`: Displays approximate Bikram Sambat (BS) calendar dates alongside AD dates for Nepal holidays and booking confirmations.
- `buildWhatsAppLink(phone, message)`: Generates pre-filled `wa.me` links for instant Birgunj salon confirmation and customer inquiry replies.

---

## 5. Verification & Quality Gates
- **Strict Type Checking**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Production Bundle**: `npm run build` (`vite build`) succeeds cleanly with route-chunked output and `src/assets` preservation.
- **End-to-End Runtime Audit**: Verified `/api/bootstrap`, `Asia/Kathmandu` availability, past-date rejection, booking creation (`201`), identical-slot overlap rejection (`409 Conflict`), live rescheduling (`200`), cancellation (`200`), and unauthenticated admin protection (`401`).
