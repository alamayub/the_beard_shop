# Deployment, Configuration & Operations Guide

This guide covers environment configuration, third-party integrations, database migrations, and production readiness for **The Beard Shop Beauty Salon**.

---

## 1. Environment Variables

Configure the following variables in `.env` (refer to `.env.example` as the template; never commit real secrets to version control):

| Variable | Required | Scope | Description |
| --- | --- | --- | --- |
| `PORT` | No (default `3000`) | Server | HTTP server listen port (`0.0.0.0`) |
| `NODE_ENV` | Production: `production` | Server | Switches Express from Vite dev middleware to static `dist/` serving |
| `DATABASE_URL` | Yes | Server | PostgreSQL / Cloud SQL connection string used by Drizzle ORM (`pg`) |
| `JWT_SECRET` | Yes (prod) | Server | Secret key for signing short-lived Access JWTs |
| `JWT_REFRESH_SECRET` | Yes (prod) | Server | Secret key for signing HTTP-only `salon_refresh_token` cookies |
| `APP_URL` | Recommended | Server | Public application URL for callbacks & self-referential links |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Client | Enables interactive Google Map widget on the Contact & Home pages |
| `CLOUDINARY_CLOUD_NAME` | Optional | Server | Cloudinary cloud name for admin media uploads (falls back gracefully if unset) |
| `CLOUDINARY_API_KEY` | Optional | Server | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | Server | Cloudinary API secret |
| `ESEWA_MERCHANT_CODE` | Optional | Server | eSewa merchant code (sandbox default: `EPAYTEST`) |
| `ESEWA_SECRET_KEY` | Optional | Server | eSewa HMAC/verification secret |
| `KHALTI_SECRET_KEY` | Optional | Server | Khalti server-side secret key |
| `FONEPAY_MERCHANT_CODE` | Optional | Server | Fonepay merchant identifier |
| `FONEPAY_SECRET_KEY` | Optional | Server | Fonepay verification secret |

---

## 2. Database Setup & Seeding

1. **Provision PostgreSQL (Cloud SQL)**: Ensure `DATABASE_URL` points to an active PostgreSQL instance (recommended region: `asia-southeast1` for low latency to Nepal).
2. **Apply Schema**: Schema definitions reside in `src/db/schema.ts` and are managed with Drizzle Kit (`src/db/drizzle.config.ts`).
3. **Automatic Bootstrap Seed**: On initial startup or bootstrap when tables are empty, the server seeds initial salon records (salon settings for Birgunj, service categories, 13 unisex services, 4 stylists with default weekly shifts, gallery items, social posts, blog articles, Nepal festival offers, holidays, and customer reviews).

---

## 3. Firebase Authentication & First Admin Setup

1. Firebase client settings live in `firebase-applet-config.json` and initialize the Auth SDK (`src/lib/firebase.ts`).
2. `firebase-admin` on the backend verifies incoming Firebase ID Tokens on `/api/auth/session` and `/api/admin/*`.
3. **Onboarding Additional Staff**:
   - Sign in as a `SUPER_ADMIN` or `ADMIN` at `/admin/login`.
   - Navigate to **Staff & Roles (`/admin/users`)** and click **Invite Staff Member**.
   - Enter the staff member's email and target role (`ADMIN`, `MANAGER`, or `RECEPTIONIST`).
   - When that person signs in via Firebase Authentication for the first time with that email, their real Firebase UID automatically binds to their pre-assigned role.

---

## 4. Build & Production Run Commands

```bash
# 1. Install all dependencies
npm install

# 2. Verify strict TypeScript types (0 errors expected)
npm run lint

# 3. Build optimized production frontend bundle into dist/
npm run build

# 4. Launch production Express server on port 3000
NODE_ENV=production npm start
```

> **Static Assets Note**: `vite.config.ts` includes a post-build hook (`copy-unbundled-src-assets`) that copies `src/assets` into `dist/src/assets` so generated editorial salon images resolve cleanly in production builds.

---

## 5. Pre-Launch Go-Live Checklist for Birgunj Salon Owner

- [ ] Sign in to `/admin/settings` and verify the Birgunj street address, phone number, WhatsApp number, email, Instagram/Facebook links, and opening hours.
- [ ] Review and confirm service prices and durations in `/admin/services`.
- [ ] Review stylist profiles in `/admin/team` and configure individual weekly shifts & lunch breaks in `/admin/schedules`.
- [ ] Add upcoming Dashain, Tihar, Chhath, and local public holidays in `/admin/schedules`.
- [ ] Upload real salon interior and Before/After portfolio photography in `/admin/gallery`.
- [ ] Replace `JWT_SECRET` and `JWT_REFRESH_SECRET` with strong random 64-character secrets in production.
- [ ] Configure production `ESEWA_*`, `KHALTI_*`, or `FONEPAY_*` credentials if accepting live online prepayments.
- [ ] Confirm `GET /api/health` returns `{ "status": "ok", "timezone": "Asia/Kathmandu" }`.
