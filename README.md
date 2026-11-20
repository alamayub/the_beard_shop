# The Beard Shop Beauty Salon — Website & Management System

A full-stack luxury unisex beauty salon website, real-time appointment booking engine, and 18-module salon management platform built for **The Beard Shop Beauty Salon** in **Birgunj, Parsa, Madhesh Province, Nepal**.

---

## Documentation Index

| Document | Description |
| --- | --- |
| [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) | Product, functional, localization, security, and design requirements |
| [`docs/IMPLEMENTATION.md`](./docs/IMPLEMENTATION.md) | Architecture, state management, booking engine, theme system, and module breakdown |
| [`docs/API.md`](./docs/API.md) | Full REST API specification (Public, Booking, Auth, and Admin endpoints + RBAC matrix) |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | PostgreSQL + Drizzle ORM schema reference (20 tables), relations, and locking strategy |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Environment setup, PostgreSQL/Firebase/Maps/Payment integrations, and production checklist |

---

## Key Capabilities

### Public Website (`/`)
- **Royal Maroon Editorial Design System**: Warm Ivory (`#FAF8F4`) paired with Royal Maroon (`#6B1222`), Deep Velvet Burgundy (`#2A0810`), Crimson (`#88182C`), and Soft Blush (`#EFE1E4`) accents with serif display typography (`Cormorant Garamond` / `Playfair Display`) and modern sans-serif body text.
- **Smooth Scrolling & Page Transitions**: Global smooth scroll with sticky-header offset, hash anchor support, `prefers-reduced-motion` compliance, floating back-to-top button, and Framer Motion (`AnimatePresence`) page transitions.
- **Complete Public Pages**: Homepage, About Us, Services & Service Detail, Transformation Gallery (with Before/After slider), Team, Social Media Updates, Beauty Journal / Blog, Festival Offers, Contact & Interactive Google Map, FAQ, Privacy Policy, and Terms.
- **Nepal-First Localization**: Pricing in NPR (`रू` / `NPR`), `Asia/Kathmandu (NPT)` live timekeeping, Bikram Sambat (BS) date display, Nepal festival offers & holidays, WhatsApp direct booking, and eSewa / Khalti / Fonepay payment-ready flows.

### Production Booking Engine (`/booking` & `/my-bookings`)
- **4-Step Interactive Wizard**: Service selection (with category filters & multi-service bundling) → Stylist preference → 14-day Nepal Time calendar & live open time slots → Customer details & payment preference.
- **Strict `Asia/Kathmandu` Timezone**: Past dates and elapsed slots for today (including a 15-minute booking lead-time buffer) are automatically rejected on both frontend and backend.
- **Zero Double-Booking Guarantee**: PostgreSQL transactions protected by per-date `pg_advisory_xact_lock` prevent concurrent overlaps across stylists, shifts, daily/date breaks, and salon holidays (returning `409 Conflict`).
- **Customer Self-Service (`/my-bookings`)**: Lookup by booking reference or phone number, live rescheduling against real-time availability (excluding the current appointment), and guided cancellation.

### 18-Module Admin Dashboard (`/admin`)
- **Overview & Appointments**: Real-time KPIs, Recharts trends & status analytics, booking approval/completion/cancellation, and manual walk-in creation with conflict detection.
- **Catalog & Media**: Service Categories, Services (NPR & duration), and Gallery (including before/after pairs).
- **People & Schedules**: Stylist Team profiles, Weekly Staff Shifts + Daily/Specific Breaks + Nepal Festival Holidays, and Customer CRM with visit/spend history.
- **Content & Promotions**: Instagram/Facebook Social Feed manager, Blog Editor, Festival Offers & Promo Codes, and Review moderation.
- **Operations & Governance**: Nepal Payment Ledger (Cash/eSewa/Khalti/Fonepay), Alerts & Contact Inquiries inbox, CSV Revenue/Booking Reports, Editable Website Settings & 7-day Opening Hours, Role-Based Staff Access (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `RECEPTIONIST`) with Audit Logs, and Admin Profile.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v7, Redux Toolkit & RTK Query, Motion (Framer Motion), React Hook Form, Zod, Recharts, Lucide React, `@vis.gl/react-google-maps` |
| **Backend** | Node.js, Express 4, TypeScript (`tsx`), Helmet, CORS, Cookie Parser, Express Rate Limit, Zod |
| **Database** | PostgreSQL (Cloud SQL), Drizzle ORM, `pg` connection pool |
| **Authentication** | Firebase Authentication (Client + Firebase Admin SDK) + HTTP-only Refresh Token JWT Rotation |

---

## Project Structure

```text
├── server.ts                       # Express + Vite middleware / production static server (port 3000)
├── server/src/
│   ├── db/                         # Drizzle PostgreSQL client & seed bootstrap
│   ├── middleware/auth.ts          # Firebase ID token + JWT verification, RBAC & audit logging
│   ├── routes/
│   │   ├── authRoutes.ts           # /api/auth/* session, refresh, logout, profile
│   │   ├── publicRoutes.ts         # /api/* bootstrap, catalog, availability, booking, payments
│   │   └── adminRoutes.ts          # /api/admin/* 18-module protected CRUD, reports, upload
│   └── services/
│       ├── bookingEngine.ts        # Asia/Kathmandu slots, overlap checks & transactional locking
│       └── paymentService.ts       # Cash / eSewa / Khalti / Fonepay payment orchestration
├── src/
│   ├── api/                        # RTK Query APIs (salonApi.ts, adminApi.ts)
│   ├── components/
│   │   ├── admin/                  # Admin primitives, modals, pagination, toast notifications
│   │   ├── maps/                   # Interactive Google Maps Birgunj location widget
│   │   └── ui/                     # Primitives & MotionPrimitives (PageTransition, reveals)
│   ├── db/schema.ts                # Drizzle PostgreSQL schema (20 tables & relations)
│   ├── hooks/                      # Typed Redux hooks, document meta helper
│   ├── layouts/                    # PublicLayout & AdminLayout with AnimatePresence transitions
│   ├── pages/
│   │   ├── public/                 # 16 public pages (Home, Services, Booking, MyBookings, etc.)
│   │   └── admin/                  # 18 admin modules + AdminLoginPage
│   ├── routes/AdminGuard.tsx       # Protected route guard for admin roles
│   ├── store/                      # Redux Toolkit store & auth/booking/ui slices
│   ├── types/salon.ts              # Shared TypeScript domain interfaces
│   └── utils/nepal.ts              # NPR formatting, Asia/Kathmandu dates, Bikram Sambat, WhatsApp
└── docs/                           # Requirements, Implementation, API, Database & Deployment docs
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and populate required credentials (see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)):
```bash
cp .env.example .env
```

### 3. Run Development Server (Port 3000)
```bash
npm run dev
```

### 4. Type-Check & Production Build
```bash
npm run lint     # Strict TypeScript check (tsc --noEmit)
npm run build    # Production Vite bundle -> dist/
npm start        # Run production Express server serving dist/ + /api/*
```

---

## Editable Demo Data Notice

All default business contact details, NPR prices, staff profiles, and customer testimonials are seeded as **clearly marked editable demo data**. Salon administrators can update every business field, opening hour, service price, team profile, and promotion directly from `/admin/settings` and the corresponding dashboard modules without modifying code.
