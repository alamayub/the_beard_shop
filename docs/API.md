# REST API Reference

**Base URL**: `/api` (served on port `3000`)  
**Timezone**: `Asia/Kathmandu` (`UTC+05:45`)  
**Content-Type**: `application/json`  
**Rate Limiting**: `400 requests / 15 minutes` per IP across `/api/*`

---

## Conventions & Status Codes

| Status | Meaning |
| --- | --- |
| `200 OK` | Request succeeded |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Zod validation error or invalid request parameters |
| `401 Unauthorized` | Missing, invalid, or expired Bearer token / refresh cookie |
| `403 Forbidden` | Authenticated user lacks required RBAC role or account is suspended (`isActive = false`) |
| `404 Not Found` | Resource or booking reference not found |
| `409 Conflict` | Appointment time overlap / double-booking prevented (or duplicate unique key) |
| `429 Too Many Requests` | API rate limit exceeded |
| `500 Internal Server Error` | Unhandled server error |

### Authentication Headers
Protected endpoints accept:
```http
Authorization: Bearer <access_jwt_or_firebase_id_token>
```
Refresh sessions rely on the HTTP-only cookie `salon_refresh_token` (`SameSite=Lax`, `HttpOnly`).

---

## 1. Health & Authentication (`/api/health`, `/api/auth/*`)

### `GET /api/health`
Health check endpoint.
- **Response `200`**: `{ "status": "ok", "timezone": "Asia/Kathmandu" }`

### `POST /api/auth/session`
Exchanges a verified Firebase ID Token for an application Access JWT and sets an HTTP-only `salon_refresh_token` cookie.
- **Header**: `Authorization: Bearer <firebase_id_token>`
- **Response `200`**: `{ "user": AuthUser, "accessToken": "..." }`
- **Errors**: `401` invalid token, `403` suspended account.

### `POST /api/auth/refresh`
Issues a new Access JWT using the `salon_refresh_token` HTTP-only cookie.
- **Response `200`**: `{ "user": AuthUser, "accessToken": "..." }`
- **Errors**: `401` missing/expired refresh token, `403` suspended account.

### `POST /api/auth/logout`
Clears the `salon_refresh_token` cookie.
- **Response `200`**: `{ "ok": true }`

### `GET /api/auth/me`
Returns the currently authenticated user profile.
- **Auth**: Required (`requireAuth`)
- **Response `200`**: `{ "user": AuthUser }`

---

## 2. Public Catalog & Website Endpoints (`/api/*`)

| Method | Endpoint | Query / Params | Description |
| --- | --- | --- | --- |
| `GET` | `/api/bootstrap` | — | Combined initial payload: `settings`, `categories`, `services`, `team`, `gallery`, `socialPosts`, `blogPosts`, `offers`, `reviews`, `holidays` |
| `GET` | `/api/settings` | — | Business info, coordinates, opening hours, cancellation policy |
| `GET` | `/api/categories` | — | Published service categories ordered by `sortOrder` |
| `GET` | `/api/services` | `?category=<slug>` | Published services with optional category slug filter |
| `GET` | `/api/services/:slug` | `:slug` | Single published service detail (`404` if missing) |
| `GET` | `/api/gallery` | `?category=<ENUM>` | Published gallery items (supports `BEFORE_AFTER`, `MAKEUP`, `HAIR_COLORING`, etc.) |
| `GET` | `/api/team` | — | Stylist profiles ordered by `sortOrder` |
| `GET` | `/api/social-posts` | — | Published Instagram & Facebook posts |
| `GET` | `/api/blog` | — | Published beauty & grooming blog posts |
| `GET` | `/api/blog/:slug` | `:slug` | Single published blog post detail |
| `GET` | `/api/offers` | — | Published seasonal & Nepal festival offers |
| `GET` | `/api/reviews` | — | Published customer testimonials |
| `GET` | `/api/holidays` | — | Salon closure & festival calendar |
| `POST` | `/api/contact` | Body: `{ fullName, phone, email?, subject, message }` | Submits inquiry to `contact_messages` and creates admin notification (`201`) |

---

## 3. Booking Engine & Payments (`/api/bookings/*`, `/api/payments/*`)

### `GET /api/bookings/availability`
Computes live 30-minute appointment slots strictly in `Asia/Kathmandu`.
- **Query Parameters**:
  - `date` (required): `YYYY-MM-DD`
  - `serviceIds` (required): Comma-separated service IDs (e.g., `1,3`)
  - `staffId` (optional): Specific stylist ID (omit for any available stylist)
  - `excludeBookingId` (optional): Booking ID to exclude when rescheduling an existing appointment
- **Response `200`**:
```json
{
  "date": "2026-11-23",
  "timezone": "Asia/Kathmandu",
  "isPastDate": false,
  "isHoliday": false,
  "totalDurationMinutes": 40,
  "slots": [
    {
      "time": "10:00",
      "endTime": "10:40",
      "available": true,
      "availableStaffIds": [1, 2]
    }
  ]
}
```

### `POST /api/bookings`
Creates a transactional appointment with `pg_advisory_xact_lock` overlap protection.
- **Request Body**:
```json
{
  "customerName": "Aarav Sharma",
  "customerPhone": "+9779801234567",
  "customerEmail": "aarav@example.com",
  "serviceIds": [1, 2],
  "staffId": 1,
  "appointmentDate": "2026-11-23",
  "startTime": "11:00",
  "paymentMethod": "CASH",
  "notes": "Prefer low skin fade"
}
```
- **Response `201`**: `{ "booking": BookingRecord, "services": BookingServiceItem[] }`
- **Response `409`**: `{ "error": "This time slot is no longer available or has already passed in Nepal Time (NPT). Please choose another slot." }`

### `GET /api/bookings/lookup`
Self-service customer lookup by booking reference or phone number.
- **Query Parameters**: `?ref=TBS-2026-1234` and/or `?phone=+9779801234567`
- **Response `200`**: `BookingRecord[]` (with attached `services` and `staffName`)

### `PATCH /api/bookings/:ref/reschedule`
Reschedules an active customer booking inside a serialized transaction (excluding the booking's own current slot from conflict checks).
- **Request Body**: `{ "phone": "+977...", "appointmentDate": "YYYY-MM-DD", "startTime": "HH:mm", "staffId": 1 | null }`
- **Response `200`**: Updated `BookingRecord`
- **Errors**: `400` invalid status/input, `403` phone mismatch, `404` booking not found, `409` overlapping slot.

### `POST /api/bookings/:ref/cancel`
Cancels an active customer booking after phone verification.
- **Request Body**: `{ "phone": "+977...", "reason": "Schedule changed" }`
- **Response `200`**: `{ "ok": true, "booking": BookingRecord }`

### `POST /api/payments/initiate`
Initiates a payment record for `CASH`, `ESEWA`, `KHALTI`, or `FONEPAY`.
- **Request Body**: `{ "bookingRef": "TBS-2026-1234", "provider": "ESEWA" | "KHALTI" | "FONEPAY" | "CASH" }`
- **Response `201`**: Payment record + provider checkout metadata.

### `POST /api/payments/verify`
Verifies a payment transaction and synchronizes `bookings.paymentStatus`.
- **Request Body**: `{ "transactionRef": "...", "status": "VERIFIED" | "FAILED", "providerRef"?: "..." }`
- **Response `200`**: Updated payment & booking status.

---

## 4. Protected Admin API (`/api/admin/*`)

All `/api/admin/*` routes require authentication (`requireAuth`) and at least one staff role (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `RECEPTIONIST`). Stricter role requirements are noted per route.

### Role Abbreviations
- **All Staff**: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `RECEPTIONIST`
- **Mgr+**: `SUPER_ADMIN`, `ADMIN`, `MANAGER`
- **Admin+**: `SUPER_ADMIN`, `ADMIN`

### 4.1 Dashboard, Bookings & Reports

| Method | Endpoint | Allowed Roles | Description |
| --- | --- | --- | --- |
| `GET` | `/api/admin/dashboard` | All Staff | KPIs (NPT today/monthly), 7-day trend chart, status distribution, popular services, payment breakdown, recent bookings |
| `GET` | `/api/admin/bookings` | All Staff | List bookings (`?status=&date=&search=`) with services & stylist names |
| `POST` | `/api/admin/bookings` | All Staff | Create manual/walk-in booking with stylist overlap check (`409` on conflict) |
| `PATCH` | `/api/admin/bookings/:id` | All Staff | Update booking status, schedule, stylist (overlap checked -> `409`), payment status, or notes |
| `DELETE` | `/api/admin/bookings/:id` | Mgr+ | Permanently delete booking |
| `GET` | `/api/admin/reports` | All Staff | Revenue, bookings by day (`?days=7\|30\|90` in NPT), service revenue, stylist performance, payment breakdown |

### 4.2 Catalog, Gallery & Content

| Method | Endpoint | Allowed Roles | Description |
| --- | --- | --- | --- |
| `GET` | `/api/admin/services` | All Staff | List all services (published & hidden) |
| `POST` / `PATCH /:id` / `DELETE /:id` | `/api/admin/services` | Mgr+ | Create, update, delete service |
| `GET` | `/api/admin/categories` | All Staff | List all service categories |
| `POST` / `PATCH /:id` | `/api/admin/categories` | Mgr+ | Create or update category |
| `DELETE` | `/api/admin/categories/:id` | Admin+ | Delete category (cascades services) |
| `GET` | `/api/admin/gallery` | All Staff | List all gallery items |
| `POST` / `PATCH /:id` / `DELETE /:id` | `/api/admin/gallery` | Mgr+ | Create, update, delete gallery item |
| `GET` | `/api/admin/social-posts` | All Staff | List all Instagram/Facebook posts |
| `POST` / `PATCH /:id` / `DELETE /:id` | `/api/admin/social-posts` | Mgr+ | Create, update, delete social post (`imageUrl`, `mediaType: IMAGE \| REEL`) |
| `GET` | `/api/admin/blog` | All Staff | List all blog articles |
| `POST` / `PATCH /:id` / `DELETE /:id` | `/api/admin/blog` | Mgr+ | Create, update, delete blog article |
| `GET` | `/api/admin/offers` | All Staff | List all promotional offers |
| `POST` / `PATCH /:id` / `DELETE /:id` | `/api/admin/offers` | Mgr+ | Create, update, delete festival offer |
| `GET` | `/api/admin/reviews` | All Staff | List all reviews |
| `POST` / `PATCH /:id` / `DELETE /:id` | `/api/admin/reviews` | Mgr+ | Create, moderate/publish, delete review |
| `POST` | `/api/admin/upload` | Mgr+ | Validate & process JPEG/PNG/WebP image uploads (Cloudinary if configured, safe data URL fallback) |

### 4.3 Team, Schedules, Holidays & Customers CRM

| Method | Endpoint | Allowed Roles | Description |
| --- | --- | --- | --- |
| `GET` | `/api/admin/team` | All Staff | List staff members with nested `schedules` and `breaks` |
| `POST` / `PATCH /:id` | `/api/admin/team` | Mgr+ | Create or update staff profile |
| `DELETE` | `/api/admin/team/:id` | Admin+ | Remove staff profile |
| `PUT` | `/api/admin/team/:id/schedules` | Mgr+ | Replace 7-day weekly shift schedule (`dayOfWeek` 0–6) |
| `POST` | `/api/admin/team/:id/breaks` | Mgr+ | Add recurring (`breakDate: null`) or specific-date break |
| `DELETE` | `/api/admin/team/breaks/:breakId` | Mgr+ | Remove staff break |
| `GET` | `/api/admin/holidays` | All Staff | List salon holidays |
| `POST` / `PATCH /:id` / `DELETE /:id` | `/api/admin/holidays` | Mgr+ | Create, update, delete Nepal holiday (`date`, `bsDate`, `name`, `description`, `isClosed`) |
| `GET` | `/api/admin/customers` | All Staff | List customers with booking history |
| `POST` / `PATCH /:id` | `/api/admin/customers` | All Staff | Add or edit customer CRM profile |
| `DELETE` | `/api/admin/customers/:id` | Admin+ | Delete customer record |

### 4.4 Payments, Notifications, Settings, Users & Profile

| Method | Endpoint | Allowed Roles | Description |
| --- | --- | --- | --- |
| `GET` | `/api/admin/payments` | All Staff | Payment ledger joined with booking references & customer names |
| `POST` / `PATCH /:id` | `/api/admin/payments` | All Staff | Record manual receipt or update verification status |
| `GET` | `/api/admin/notifications` | All Staff | Returns `{ notifications, contactMessages }` |
| `POST` | `/api/admin/notifications` | All Staff | Create manual alert / broadcast notification |
| `PATCH` | `/api/admin/notifications/read-all` | All Staff | Mark all notifications as read |
| `PATCH` | `/api/admin/notifications/:id/read` | All Staff | Mark single notification as read |
| `DELETE` | `/api/admin/notifications/:id` | All Staff | Delete notification |
| `PATCH` / `DELETE` | `/api/admin/contact-messages/:id` | All Staff | Update inquiry status (`NEW`, `REPLIED`, `RESOLVED`) or delete |
| `GET` | `/api/admin/settings` | All Staff | Fetch current salon settings |
| `PUT` | `/api/admin/settings` | Admin+ | Save editable business profile, coordinates, policies & 7-day opening hours |
| `GET` | `/api/admin/users` | Admin+ | Returns `{ users, auditLogs }` |
| `POST` | `/api/admin/users` | Admin+ | Invite staff member by email + role (auto-binds on Firebase first login) |
| `PATCH` | `/api/admin/users/:id/role` | Admin+ | Update user `role` or toggle `isActive` suspension |
| `GET` / `PATCH` | `/api/admin/profile` | All Staff | View or update own admin `fullName` and `phone` |
