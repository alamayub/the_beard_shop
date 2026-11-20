# Database Architecture & Schema Reference

The application uses **PostgreSQL (Cloud SQL)** managed with **Drizzle ORM** (`src/db/schema.ts`). All 20 relational tables support strict foreign-key integrity, cascade behaviors, JSONB structured fields where appropriate, and PostgreSQL advisory locking for appointment conflict prevention.

---

## 1. Core Entity Relationship Overview

```text
users ──(0..1)──> customers ──(1..N)──> bookings <──(0..N)── staff
                                          │  │                  │
                            (1..N)────────┘  └────────(1..N)    ├──(1..7)──> staff_schedules
                              ▼                         ▼       └──(0..N)──> staff_breaks
                       booking_services             payments
                              │
                              ▼ (0..1)
                          services <──(1..N)── service_categories
```

Independent CMS & Operational Tables:
- `gallery_items`, `social_posts`, `blog_posts`, `offers`, `reviews`
- `salon_settings`, `holidays`, `notifications`, `contact_messages`, `audit_logs`

---

## 2. Table Catalog (20 Tables)

### 2.1 Identity & CRM

| Table | Primary Key | Key Columns & Constraints |
| --- | --- | --- |
| `users` | `id` (serial) | `uid` (unique), `email`, `full_name`, `phone`, `role` (`SUPER_ADMIN \| ADMIN \| MANAGER \| RECEPTIONIST \| CUSTOMER`), `is_active` (boolean), `created_at`, `updated_at` |
| `customers` | `id` (serial) | `user_id` (FK → `users.id` ON DELETE SET NULL), `full_name`, `phone`, `email`, `notes`, `total_visits`, `total_spent_npr`, `created_at`, `updated_at` |

### 2.2 Service Catalog

| Table | Primary Key | Key Columns & Constraints |
| --- | --- | --- |
| `service_categories` | `id` (serial) | `name`, `name_ne`, `slug` (unique), `description`, `sort_order`, `is_published`, `created_at` |
| `services` | `id` (serial) | `category_id` (FK → `service_categories.id` ON DELETE CASCADE), `name`, `name_ne`, `slug` (unique), `description`, `description_ne`, `price_npr` (int), `duration_minutes` (int), `image_url`, `is_featured`, `is_published`, `is_demo_price`, `sort_order` |

### 2.3 Team & Scheduling

| Table | Primary Key | Key Columns & Constraints |
| --- | --- | --- |
| `staff` | `id` (serial) | `full_name`, `role_title`, `bio`, `experience_years`, `specializations` (`jsonb<string[]>`), `avatar_url`, `is_available`, `is_demo_profile`, `sort_order` |
| `staff_schedules` | `id` (serial) | `staff_id` (FK → `staff.id` ON DELETE CASCADE), `day_of_week` (`0=Sun` … `6=Sat`), `start_time` (`HH:mm`), `end_time` (`HH:mm`), `is_working` (boolean) |
| `staff_breaks` | `id` (serial) | `staff_id` (FK → `staff.id` ON DELETE CASCADE), `break_date` (`YYYY-MM-DD` or `NULL` for daily recurring), `start_time`, `end_time`, `reason` |
| `holidays` | `id` (serial) | `name`, `date` (`YYYY-MM-DD`, unique), `bs_date`, `description`, `is_closed` (boolean) |

### 2.4 Booking Engine & Payments

| Table | Primary Key | Key Columns & Constraints |
| --- | --- | --- |
| `bookings` | `id` (serial) | `booking_ref` (unique, `TBS-YYYY-XXXX`), `customer_id` (FK → `customers.id`), `customer_name`, `customer_phone`, `customer_email`, `staff_id` (FK → `staff.id`), `appointment_date` (`YYYY-MM-DD` NPT), `start_time` (`HH:mm`), `end_time` (`HH:mm`), `total_duration_minutes`, `total_price_npr`, `status` (`PENDING \| APPROVED \| COMPLETED \| CANCELLED \| REJECTED \| NO_SHOW`), `payment_method` (`CASH \| ESEWA \| KHALTI \| FONEPAY`), `payment_status` (`UNPAID \| PENDING_VERIFICATION \| PAID \| FAILED \| REFUNDED`), `notes`, `cancellation_reason` |
| `booking_services` | `id` (serial) | `booking_id` (FK → `bookings.id` ON DELETE CASCADE), `service_id` (FK → `services.id` ON DELETE SET NULL), `service_name` (snapshot), `price_npr` (snapshot), `duration_minutes` (snapshot) |
| `payments` | `id` (serial) | `booking_id` (FK → `bookings.id` ON DELETE CASCADE), `provider` (`CASH \| ESEWA \| KHALTI \| FONEPAY`), `amount_npr`, `status` (`INITIATED \| PENDING_VERIFICATION \| VERIFIED \| FAILED \| REFUNDED`), `transaction_ref`, `provider_payload` (`jsonb`), `verified_at`, `created_at` |

> **Price & Service Snapshotting**: `booking_services` stores `service_name`, `price_npr`, and `duration_minutes` at booking time so future service price edits never alter historical invoices or revenue reports.

### 2.5 Marketing, Content & Social Proof

| Table | Primary Key | Key Columns & Constraints |
| --- | --- | --- |
| `gallery_items` | `id` (serial) | `title`, `description`, `category` (`MENS_HAIRSTYLE \| WOMENS_HAIRSTYLE \| HAIR_COLORING \| MAKEUP \| INTERIOR \| BEFORE_AFTER`), `image_url`, `before_image_url`, `is_featured`, `is_published`, `sort_order` |
| `social_posts` | `id` (serial) | `platform` (`INSTAGRAM \| FACEBOOK`), `media_type` (`IMAGE \| REEL`), `caption`, `image_url`, `post_url`, `is_featured`, `is_published`, `published_at` |
| `blog_posts` | `id` (serial) | `title`, `slug` (unique), `excerpt`, `content`, `category`, `cover_image_url`, `author_name`, `read_time_minutes`, `is_featured`, `is_published`, `published_at` |
| `offers` | `id` (serial) | `title`, `title_ne`, `festival_tag` (`DASHAIN \| TIHAR \| TEEJ \| CHHATH \| NEPALI_NEW_YEAR \| SEASONAL`), `description`, `discount_text`, `promo_code`, `valid_from`, `valid_until`, `image_url`, `is_featured`, `is_published` |
| `reviews` | `id` (serial) | `customer_name`, `service_name`, `rating` (1–5), `comment`, `is_demo_review`, `is_published`, `created_at` |

### 2.6 Operations, Settings & Governance

| Table | Primary Key | Key Columns & Constraints |
| --- | --- | --- |
| `salon_settings` | `id` (serial) | `business_name`, `tagline`, `tagline_ne`, `address`, `city`, `province`, `country`, `latitude`, `longitude`, `phone`, `whatsapp_number`, `email`, `instagram_url`, `facebook_url`, `google_maps_url`, `opening_hours` (`jsonb`), `cancellation_policy`, `currency_code` (`NPR`), `timezone` (`Asia/Kathmandu`), `show_bikram_sambat` |
| `notifications` | `id` (serial) | `type` (`BOOKING_CREATED \| BOOKING_STATUS \| PAYMENT \| CONTACT`), `channel` (`EMAIL \| WHATSAPP \| SMS \| IN_APP`), `recipient`, `title`, `message`, `is_read`, `status`, `created_at` |
| `contact_messages` | `id` (serial) | `full_name`, `phone`, `email`, `subject`, `message`, `status` (`NEW \| REPLIED \| RESOLVED`), `created_at` |
| `audit_logs` | `id` (serial) | `actor_uid`, `actor_email`, `actor_role`, `action`, `entity_type`, `entity_id`, `details` (`jsonb`), `created_at` |

---

## 3. Timezone & Concurrency Conventions

1. **Wall-Clock Nepal Time Storage**:
   - `bookings.appointment_date` and `holidays.date` store ISO calendar dates (`YYYY-MM-DD`) strictly interpreted in `Asia/Kathmandu`.
   - `start_time` and `end_time` store 24-hour `HH:mm` strings in `Asia/Kathmandu`.
   - Audit and creation timestamps (`created_at`, `updated_at`) use PostgreSQL `TIMESTAMP DEFAULT NOW()`.
2. **Per-Date Advisory Transaction Locks**:
   - Booking creation and rescheduling execute inside `db.transaction` and call:
     ```sql
     SELECT pg_advisory_xact_lock(hashtext('booking:' || $appointment_date))
     ```
   - Advisory locks automatically release on transaction commit or rollback, serializing concurrent slot reservations for the same date without locking unrelated dates or read queries.
