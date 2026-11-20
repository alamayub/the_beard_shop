# Product & Technical Requirements Specification

## 1. Business Overview

- **Brand**: The Beard Shop Beauty Salon
- **Category**: Luxury Unisex Hair, Beard Grooming, Skin, Party Makeup & Beauty Salon
- **Target Location**: Birgunj, Parsa, Madhesh Province, Nepal (`27.014045, 84.8482375`)
- **Primary Channels**: Public Website, Real-Time Online Booking Engine, Customer Booking Portal, WhatsApp Integration, Instagram/Facebook Feed Showcase, and Role-Based Admin Management Dashboard.
- **Content Management Policy**: All salon contact numbers, addresses, staff profiles, service rates, and customer reviews are centrally stored in PostgreSQL and editable from the Admin Dashboard.

---

## 2. Functional Requirements

### 2.1 Public Website (`16 Routes`)

| Route | Requirement |
| --- | --- |
| `/` | Editorial hero (`"Your Style. Your Identity."`), Book Appointment & Explore Services CTAs, Featured Services, About intro, Why Choose Us, Popular Packages, Before/After Transformation Gallery, Meet Our Experts, Testimonials, Instagram/Social Feed, Festival Offers, Birgunj Location & Opening Hours, Floating WhatsApp & Scroll-to-Top buttons, Footer |
| `/about` | Brand story, mission & vision, philosophy, hygiene & sterilization standards, salon photography |
| `/services` | Category tabs/filtering, search, NPR starting prices, duration in minutes, Book Now deep-link into `/booking` |
| `/services/:slug` | Detailed treatment description, duration, NPR pricing, related services, direct booking CTA |
| `/gallery` | Filterable gallery (`MENS_HAIRSTYLE`, `WOMENS_HAIRSTYLE`, `HAIR_COLORING`, `MAKEUP`, `INTERIOR`, `BEFORE_AFTER`) with interactive Before/After comparison and lightbox modal |
| `/team` | Stylist showcase with specializations, experience years, availability indicator, and direct "Book with Stylist" action |
| `/updates` | Curated Instagram & Facebook posts and reels with external profile links |
| `/booking` | 4-step online appointment booking wizard (see Section 2.2) |
| `/my-bookings` | Self-service booking lookup (by booking ref or phone), live rescheduling modal, and cancellation confirmation |
| `/contact` | Birgunj address, opening hours, phone, WhatsApp CTA, interactive Google Map, and inquiry submission form |
| `/blog` & `/blog/:slug` | Salon care tips, grooming guides, skincare & hair prep articles with category filters and reading time |
| `/offers` | Nepal festival & seasonal promotions (Dashain, Tihar, Teej, Chhath, Nepali New Year) with promo codes and validity dates |
| `/faq`, `/privacy-policy`, `/terms` | Customer policy, hygiene FAQs, cancellation notice rules, privacy & terms of service |

### 2.2 Production Salon Booking Engine

1. **Multi-Service Selection**: Customers can select one or more services across categories; total duration and total NPR price calculate automatically.
2. **Stylist Selection**: Customers can select a specific available stylist or choose `"Any Available Stylist"` (auto-assigned on booking confirmation).
3. **Strict `Asia/Kathmandu` Timezone**:
   - All availability queries, 14-day date pickers, live clock indicators, and server validations must use `Asia/Kathmandu` (`UTC+05:45`).
   - Past dates must be rejected (`isPastDate: true`).
   - Today's elapsed time slots plus a 15-minute lead-time buffer must be disabled.
4. **Conflict & Overlap Prevention**:
   - Must check salon holidays (`holidays.is_closed`), stylist working shifts (`staff_schedules`), recurring/date-specific staff breaks (`staff_breaks`), and existing active appointments (`PENDING`, `APPROVED`).
   - Concurrent booking or rescheduling requests for the same date must serialize via PostgreSQL advisory transaction locks (`pg_advisory_xact_lock`) and return HTTP `409 Conflict` if an overlap occurs.
5. **Booking Confirmation & Management**:
   - Generates unique booking references (`TBS-YYYY-XXXX`), records customer CRM profiles, creates an admin in-app notification, and supports immediate WhatsApp confirmation handoff.
   - Customers can look up bookings by reference/phone, reschedule to any live available slot (excluding their own appointment from conflict checks), or cancel with a reason.

### 2.3 Admin Dashboard (`18 Modules`)

Every sidebar route under `/admin/*` must be fully functional, backed by RTK Query + PostgreSQL CRUD APIs, with search, filters, pagination, validation, confirmation modals, and toast feedback:

1. **Dashboard Overview (`/admin`)**: Real-time KPIs (`Asia/Kathmandu`), booking trend chart, status breakdown chart, popular services chart, recent bookings.
2. **Bookings Management (`/admin/bookings`)**: Filter by status/date/search, approve/complete/reject/cancel/no-show transitions, payment status updates, manual walk-in creation with conflict guard.
3. **Services (`/admin/services`)**: Full CRUD with category assignment, NPR pricing, duration, image selection/upload, featured & published toggles.
4. **Service Categories (`/admin/categories`)**: Full CRUD with English/Nepali names, slug, sort order, visibility toggle.
5. **Gallery (`/admin/gallery`)**: Full CRUD supporting standard photos and Before/After image pairs across 7 categories.
6. **Team & Stylists (`/admin/team`)**: Full CRUD with role title, bio, experience years, specialization tags, availability toggle.
7. **Schedules & Holidays (`/admin/schedules`)**: 7-day shift editor per stylist, daily/date-specific staff breaks manager, and Nepal festival holiday calendar (AD + Bikram Sambat).
8. **Customers CRM (`/admin/customers`)**: Searchable directory, add/edit/delete customer records, notes, visit counts, lifetime NPR spend, and full appointment history modal.
9. **Social Media Feed (`/admin/social`)**: Instagram/Facebook image & reel manager with publish/hide toggle.
10. **Blog & Tips (`/admin/blog`)**: Article CRUD with category, read time, cover image, author, and publish toggle.
11. **Offers & Promos (`/admin/offers`)**: Festival campaign CRUD (`DASHAIN`, `TIHAR`, `TEEJ`, `CHHATH`, `NEPALI_NEW_YEAR`, `SEASONAL`), promo codes, date windows.
12. **Customer Reviews (`/admin/reviews`)**: Moderation queue, star ratings, and publish/unpublish controls.
13. **Payments & Settlements (`/admin/payments`)**: Payment ledger for Cash, eSewa, Khalti, Fonepay with Recharts provider breakdown, manual recording, and verification status updates.
14. **Notifications & Inquiries (`/admin/notifications`)**: Two-tab inbox for real-time system alerts (mark read / mark all read / broadcast) and website contact messages (status workflow & WhatsApp reply).
15. **Reports & Analytics (`/admin/reports`)**: Configurable date-range (`7d`, `30d`, `90d`) revenue & booking charts, top services, stylist performance, and one-click CSV export.
16. **Website Settings (`/admin/settings`)**: Live editor for business name, tagline (EN/NE), Birgunj coordinates/address, phone, WhatsApp, email, social URLs, cancellation policy, Bikram Sambat toggle, and 7-day opening hours.
17. **Staff & Roles (`/admin/users`)**: Role-based staff invitation (binds automatically on Firebase first login), role/status management, and immutable Audit Log viewer.
18. **Admin Profile (`/admin/profile`)**: Self-service profile name/phone update and secure sign-out.

---

## 3. Non-Functional Requirements

### 3.1 Visual Design System (Royal Maroon Palette)
- **Primary Brand Color**: Royal Maroon (`#6B1222`), Crimson Hover (`#88182C`), Garnet Accent (`#9E1F32`).
- **Dark Surface**: Deep Velvet Burgundy (`#2A0810`) for dark editorial sections, admin sidebar, and dark banners.
- **Light Surface**: Warm Ivory (`#FAF8F4`), Pure White (`#FFFFFF`), Soft Blush (`#EFE1E4`), Rose Hairline Border (`#E6DADC`).
- **Typography**: Luxury editorial serif headings paired with crisp sans-serif UI text and tabular numerals (`tabular-nums`) for NPR prices, times, and metrics.
- **Motion & Ergonomics**: Smooth scrolling (`scroll-behavior: smooth`), sticky header scroll offset (`scroll-padding-top: 5rem`), Framer Motion page transitions, and strict adherence to `prefers-reduced-motion`.

### 3.2 Security & Access Control
- **Authentication**: Firebase ID token verification via Firebase Admin SDK (`Authorization: Bearer <token>`) paired with signed HTTP-only refresh cookies (`salon_refresh_token`) and short-lived access JWTs.
- **RBAC Roles**: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `RECEPTIONIST`, `CUSTOMER`.
- **Account Enforcement**: Suspended accounts (`isActive = false`) receive HTTP `403 Forbidden`; unauthenticated admin API requests receive HTTP `401 Unauthorized`.
- **API Protection**: `helmet`, `cors` (credentials enabled), `express-rate-limit` (`400 req / 15 min` on `/api`), strict Zod schema validation, and audit logging on administrative mutations.

### 3.3 Performance & Accessibility
- Route-level code splitting via `React.lazy` + `Suspense` separating public pages from the admin bundle.
- Semantic HTML landmarks, ARIA labels on icon-only controls, keyboard-dismissible modals, accessible contrast ratios on both ivory and velvet burgundy surfaces, and responsive mobile-first layouts across `360px` to `1440px+`.
