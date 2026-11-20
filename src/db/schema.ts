import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull().default('Salon Staff'),
  phone: text('phone').default(''),
  role: text('role').notNull().default('CUSTOMER'), // SUPER_ADMIN | ADMIN | MANAGER | RECEPTIONIST | CUSTOMER
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').default(''),
  notes: text('notes').default(''),
  totalVisits: integer('total_visits').notNull().default(0),
  totalSpentNpr: integer('total_spent_npr').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const serviceCategories = pgTable('service_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nameNe: text('name_ne').notNull().default(''),
  slug: text('slug').notNull().unique(),
  description: text('description').default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .references(() => serviceCategories.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  nameNe: text('name_ne').notNull().default(''),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  descriptionNe: text('description_ne').default(''),
  priceNpr: integer('price_npr').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(45),
  imageUrl: text('image_url').notNull(),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  isDemoPrice: boolean('is_demo_price').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  roleTitle: text('role_title').notNull(),
  bio: text('bio').notNull(),
  experienceYears: integer('experience_years').notNull().default(3),
  specializations: jsonb('specializations').$type<string[]>().notNull().default([]),
  avatarUrl: text('avatar_url').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  isDemoProfile: boolean('is_demo_profile').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const staffSchedules = pgTable('staff_schedules', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sun ... 6 = Sat
  startTime: text('start_time').notNull().default('10:00'),
  endTime: text('end_time').notNull().default('20:00'),
  isWorking: boolean('is_working').notNull().default(true),
});

export const staffBreaks = pgTable('staff_breaks', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id')
    .references(() => staff.id, { onDelete: 'cascade' })
    .notNull(),
  breakDate: text('break_date'), // YYYY-MM-DD or null for daily recurring break
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  reason: text('reason').default('Lunch Break'),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingRef: text('booking_ref').notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email').default(''),
  staffId: integer('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  appointmentDate: text('appointment_date').notNull(), // YYYY-MM-DD (Asia/Kathmandu)
  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time').notNull(), // HH:mm
  totalDurationMinutes: integer('total_duration_minutes').notNull(),
  totalPriceNpr: integer('total_price_npr').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | APPROVED | COMPLETED | CANCELLED | REJECTED | NO_SHOW
  paymentMethod: text('payment_method').notNull().default('CASH'), // CASH | ESEWA | KHALTI | FONEPAY
  paymentStatus: text('payment_status').notNull().default('UNPAID'), // UNPAID | PENDING_VERIFICATION | PAID | FAILED | REFUNDED
  notes: text('notes').default(''),
  cancellationReason: text('cancellation_reason').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bookingServices = pgTable('booking_services', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id')
    .references(() => bookings.id, { onDelete: 'cascade' })
    .notNull(),
  serviceId: integer('service_id').references(() => services.id, { onDelete: 'set null' }),
  serviceName: text('service_name').notNull(),
  priceNpr: integer('price_npr').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id')
    .references(() => bookings.id, { onDelete: 'cascade' })
    .notNull(),
  provider: text('provider').notNull(), // CASH | ESEWA | KHALTI | FONEPAY
  amountNpr: integer('amount_npr').notNull(),
  status: text('status').notNull().default('INITIATED'), // INITIATED | PENDING_VERIFICATION | VERIFIED | FAILED | REFUNDED
  transactionRef: text('transaction_ref').notNull(),
  providerPayload: jsonb('provider_payload').$type<Record<string, unknown>>().default({}),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const galleryItems = pgTable('gallery_items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').default(''),
  category: text('category').notNull(), // MENS_HAIRSTYLE | WOMENS_HAIRSTYLE | HAIR_COLORING | MAKEUP | INTERIOR | BEFORE_AFTER
  imageUrl: text('image_url').notNull(),
  beforeImageUrl: text('before_image_url').default(''),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const socialPosts = pgTable('social_posts', {
  id: serial('id').primaryKey(),
  platform: text('platform').notNull().default('INSTAGRAM'), // INSTAGRAM | FACEBOOK
  mediaType: text('media_type').notNull().default('IMAGE'), // IMAGE | REEL
  caption: text('caption').notNull(),
  imageUrl: text('image_url').notNull(),
  postUrl: text('post_url').notNull().default('https://www.instagram.com/the_beard_shop1/'),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  coverImageUrl: text('cover_image_url').notNull(),
  authorName: text('author_name').notNull().default('Editorial Desk'),
  readTimeMinutes: integer('read_time_minutes').notNull().default(4),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  titleNe: text('title_ne').default(''),
  festivalTag: text('festival_tag').notNull().default('SEASONAL'), // DASHAIN | TIHAR | TEEJ | CHHATH | NEPALI_NEW_YEAR | SEASONAL
  description: text('description').notNull(),
  discountText: text('discount_text').notNull(),
  promoCode: text('promo_code').default(''),
  validFrom: text('valid_from').notNull(),
  validUntil: text('valid_until').notNull(),
  imageUrl: text('image_url').notNull(),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  serviceName: text('service_name').notNull(),
  rating: integer('rating').notNull().default(5),
  comment: text('comment').notNull(),
  isDemoReview: boolean('is_demo_review').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // BOOKING_CREATED | BOOKING_STATUS | PAYMENT | CONTACT
  channel: text('channel').notNull().default('IN_APP'), // EMAIL | WHATSAPP | SMS | IN_APP
  recipient: text('recipient').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  status: text('status').notNull().default('SENT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const salonSettings = pgTable('salon_settings', {
  id: serial('id').primaryKey(),
  businessName: text('business_name').notNull().default('The Beard Shop Beauty Salon'),
  tagline: text('tagline').notNull().default('Your Style. Your Identity.'),
  taglineNe: text('tagline_ne').notNull().default('तपाईंको शैली, तपाईंको पहिचान।'),
  address: text('address').notNull().default('Birgunj, Parsa, Madhesh Province, Nepal (Editable Demo Address)'),
  city: text('city').notNull().default('Birgunj'),
  province: text('province').notNull().default('Madhesh Province'),
  country: text('country').notNull().default('Nepal'),
  latitude: doublePrecision('latitude').notNull().default(27.014045),
  longitude: doublePrecision('longitude').notNull().default(84.8482375),
  phone: text('phone').notNull().default('+977 980-0000000 (Demo Placeholder)'),
  whatsappNumber: text('whatsapp_number').notNull().default('9779800000000'),
  email: text('email').notNull().default('hello@thebeardshop-demo.np'),
  instagramUrl: text('instagram_url').notNull().default('https://www.instagram.com/the_beard_shop1/'),
  facebookUrl: text('facebook_url').notNull().default('https://www.facebook.com/'),
  googleMapsUrl: text('google_maps_url').notNull().default('https://www.google.com/maps/place/The+Beard+Shop+Beauty+Salon/@27.014045,84.8482375,14z/'),
  openingHours: jsonb('opening_hours')
    .$type<Array<{ day: string; open: string; close: string; closed?: boolean }>>()
    .notNull()
    .default([
      { day: 'Sunday', open: '10:00', close: '20:00' },
      { day: 'Monday', open: '10:00', close: '20:00' },
      { day: 'Tuesday', open: '10:00', close: '20:00' },
      { day: 'Wednesday', open: '10:00', close: '20:00' },
      { day: 'Thursday', open: '10:00', close: '20:00' },
      { day: 'Friday', open: '10:00', close: '20:00' },
      { day: 'Saturday', open: '09:30', close: '20:30' },
    ]),
  cancellationPolicy: text('cancellation_policy')
    .notNull()
    .default('Appointments may be rescheduled or cancelled free of charge at least 3 hours before the scheduled time.'),
  currencyCode: text('currency_code').notNull().default('NPR'),
  timezone: text('timezone').notNull().default('Asia/Kathmandu'),
  showBikramSambat: boolean('show_bikram_sambat').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const holidays = pgTable('holidays', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  bsDate: text('bs_date').default(''),
  description: text('description').default(''),
  isClosed: boolean('is_closed').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid').notNull(),
  actorEmail: text('actor_email').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').default(''),
  details: jsonb('details').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').default(''),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('NEW'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
}));

export const staffRelations = relations(staff, ({ many }) => ({
  schedules: many(staffSchedules),
  breaks: many(staffBreaks),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  staffMember: one(staff, {
    fields: [bookings.staffId],
    references: [staff.id],
  }),
  items: many(bookingServices),
  payments: many(payments),
}));

export const bookingServicesRelations = relations(bookingServices, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingServices.bookingId],
    references: [bookings.id],
  }),
  service: one(services, {
    fields: [bookingServices.serviceId],
    references: [services.id],
  }),
}));
