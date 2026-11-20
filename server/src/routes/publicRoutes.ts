import { Router } from 'express';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../src/db/index.ts';
import { ensureSeeded } from '../../../src/db/seed.ts';
import {
  blogPosts,
  bookings,
  bookingServices,
  contactMessages,
  galleryItems,
  holidays,
  notifications,
  offers,
  reviews,
  salonSettings,
  serviceCategories,
  services,
  socialPosts,
  staff,
} from '../../../src/db/schema.ts';
import {
  BookingConflictError,
  computeAvailability,
  createBookingTransaction,
  rescheduleBookingTransaction,
} from '../services/bookingEngine.ts';
import { initiatePaymentSession, verifyOnlinePayment } from '../services/paymentService.ts';

const router = Router();

const bookingSchema = z.object({
  serviceIds: z.array(z.number().int().positive()).min(1, 'Select at least one service'),
  staffId: z.number().int().positive().nullable().optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  customerName: z.string().trim().min(2, 'Full name is required').max(120),
  customerPhone: z
    .string()
    .trim()
    .min(7, 'Valid Nepal phone number is required')
    .max(25),
  customerEmail: z.string().trim().email().optional().or(z.literal('')),
  notes: z.string().max(600).optional().default(''),
  paymentMethod: z.enum(['CASH', 'ESEWA', 'KHALTI', 'FONEPAY']).default('CASH'),
});

const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(25),
  email: z.string().trim().email().optional().or(z.literal('')),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(5).max(2000),
});

router.use(async (_req, _res, next) => {
  await ensureSeeded();
  next();
});

router.get('/bootstrap', async (_req, res) => {
  try {
    const [
      settingsRows,
      cats,
      svcs,
      teamRows,
      galleryRows,
      socialRows,
      blogRows,
      offerRows,
      reviewRows,
      holidayRows,
    ] = await Promise.all([
      db.select().from(salonSettings).limit(1),
      db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.isPublished, true))
        .orderBy(asc(serviceCategories.sortOrder)),
      db
        .select()
        .from(services)
        .where(eq(services.isPublished, true))
        .orderBy(asc(services.sortOrder)),
      db.select().from(staff).orderBy(asc(staff.sortOrder)),
      db
        .select()
        .from(galleryItems)
        .where(eq(galleryItems.isPublished, true))
        .orderBy(asc(galleryItems.sortOrder)),
      db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.isPublished, true))
        .orderBy(desc(socialPosts.publishedAt)),
      db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.isPublished, true))
        .orderBy(desc(blogPosts.publishedAt)),
      db
        .select()
        .from(offers)
        .where(eq(offers.isPublished, true))
        .orderBy(desc(offers.createdAt)),
      db
        .select()
        .from(reviews)
        .where(eq(reviews.isPublished, true))
        .orderBy(desc(reviews.createdAt)),
      db.select().from(holidays).orderBy(asc(holidays.date)),
    ]);

    return res.json({
      settings: settingsRows[0] || null,
      categories: cats,
      services: svcs,
      team: teamRows,
      gallery: galleryRows,
      socialPosts: socialRows,
      blogPosts: blogRows,
      offers: offerRows,
      reviews: reviewRows,
      holidays: holidayRows,
    });
  } catch (error) {
    console.error('Bootstrap fetch failed:', error);
    return res.status(500).json({ error: 'Unable to load salon data. Please try again.' });
  }
});

router.get('/settings', async (_req, res) => {
  try {
    const rows = await db.select().from(salonSettings).limit(1);
    return res.json(rows[0] || null);
  } catch (error) {
    console.error('Settings fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load salon settings.' });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.isPublished, true))
      .orderBy(asc(serviceCategories.sortOrder));
    return res.json(rows);
  } catch (error) {
    console.error('Categories fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load categories.' });
  }
});

router.get('/services', async (req, res) => {
  try {
    const categorySlug = typeof req.query.category === 'string' ? req.query.category : '';
    const search = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    const allCategories = await db.select().from(serviceCategories);
    const catById: Record<number, (typeof allCategories)[number]> = {};
    for (const c of allCategories) catById[c.id] = c;

    let rows = await db
      .select()
      .from(services)
      .where(eq(services.isPublished, true))
      .orderBy(asc(services.sortOrder));

    if (categorySlug && categorySlug !== 'all') {
      const targetCat = allCategories.find((c) => c.slug === categorySlug);
      if (targetCat) {
        rows = rows.filter((s) => s.categoryId === targetCat.id);
      }
    }

    if (search) {
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search)
      );
    }

    return res.json(
      rows.map((s) => ({
        ...s,
        categoryName: catById[s.categoryId]?.name || 'Salon Service',
        categorySlug: catById[s.categoryId]?.slug || 'other-services',
      }))
    );
  } catch (error) {
    console.error('Services fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load services.' });
  }
});

router.get('/services/:slug', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(services)
      .where(and(eq(services.slug, req.params.slug), eq(services.isPublished, true)))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const cat = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.id, rows[0].categoryId))
      .limit(1);

    return res.json({
      ...rows[0],
      categoryName: cat[0]?.name || 'Salon Service',
      categorySlug: cat[0]?.slug || 'other-services',
    });
  } catch (error) {
    console.error('Service detail fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load service details.' });
  }
});

router.get('/gallery', async (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    let rows = await db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.isPublished, true))
      .orderBy(asc(galleryItems.sortOrder));
    if (category && category !== 'ALL') {
      rows = rows.filter((g) => g.category === category);
    }
    return res.json(rows);
  } catch (error) {
    console.error('Gallery fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load gallery.' });
  }
});

router.get('/team', async (_req, res) => {
  try {
    const rows = await db.select().from(staff).orderBy(asc(staff.sortOrder));
    return res.json(rows);
  } catch (error) {
    console.error('Team fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load team members.' });
  }
});

router.get('/social-posts', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.isPublished, true))
      .orderBy(desc(socialPosts.publishedAt));
    return res.json(rows);
  } catch (error) {
    console.error('Social posts fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load social posts.' });
  }
});

router.get('/blog', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt));
    return res.json(rows);
  } catch (error) {
    console.error('Blog fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load blog posts.' });
  }
});

router.get('/blog/:slug', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, req.params.slug), eq(blogPosts.isPublished, true)))
      .limit(1);
    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    return res.json(rows[0]);
  } catch (error) {
    console.error('Blog detail fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load article.' });
  }
});

router.get('/offers', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(offers)
      .where(eq(offers.isPublished, true))
      .orderBy(desc(offers.createdAt));
    return res.json(rows);
  } catch (error) {
    console.error('Offers fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load offers.' });
  }
});

router.get('/reviews', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.isPublished, true))
      .orderBy(desc(reviews.createdAt));
    return res.json(rows);
  } catch (error) {
    console.error('Reviews fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load reviews.' });
  }
});

router.get('/holidays', async (_req, res) => {
  try {
    const rows = await db.select().from(holidays).orderBy(asc(holidays.date));
    return res.json(rows);
  } catch (error) {
    console.error('Holidays fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load holidays.' });
  }
});

router.get('/bookings/availability', async (req, res) => {
  try {
    const date = typeof req.query.date === 'string' ? req.query.date : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Valid YYYY-MM-DD date query parameter is required.' });
    }
    const rawIds = typeof req.query.serviceIds === 'string' ? req.query.serviceIds : '';
    const serviceIds = rawIds
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    const staffId = req.query.staffId ? Number(req.query.staffId) : null;
    const excludeBookingId = req.query.excludeBookingId
      ? Number(req.query.excludeBookingId)
      : undefined;

    const result = await computeAvailability({
      date,
      serviceIds,
      staffId: staffId && Number.isInteger(staffId) ? staffId : null,
      excludeBookingId:
        excludeBookingId && Number.isInteger(excludeBookingId) ? excludeBookingId : undefined,
    });
    return res.json(result);
  } catch (error) {
    console.error('Availability endpoint error:', error);
    return res.status(500).json({ error: 'Could not check live slot availability.' });
  }
});

router.post('/bookings', async (req, res) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid booking payload',
        issues: parsed.error.issues,
      });
    }

    const result = await createBookingTransaction(parsed.data);
    return res.status(201).json(result);
  } catch (error: unknown) {
    if (error instanceof BookingConflictError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : 'Unable to create booking.';
    return res.status(400).json({ error: message });
  }
});

router.get('/bookings/lookup', async (req, res) => {
  try {
    const ref = typeof req.query.ref === 'string' ? req.query.ref.trim().toUpperCase() : '';
    const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';

    if (!ref && !phone) {
      return res
        .status(400)
        .json({ error: 'Provide a booking reference (e.g. TBS-2026-1001) or phone number.' });
    }

    const allStaff = await db.select().from(staff);
    const staffMap: Record<number, string> = {};
    for (const s of allStaff) staffMap[s.id] = s.fullName;

    let rows = ref
      ? await db.select().from(bookings).where(eq(bookings.bookingRef, ref))
      : await db.select().from(bookings).orderBy(desc(bookings.createdAt));

    if (!ref && phone) {
      const normalized = phone.replace(/\D/g, '').slice(-10);
      rows = rows.filter((b) => b.customerPhone.replace(/\D/g, '').endsWith(normalized));
    }

    const enriched = await Promise.all(
      rows.map(async (bk) => {
        const items = await db
          .select()
          .from(bookingServices)
          .where(eq(bookingServices.bookingId, bk.id));
        return {
          ...bk,
          staffName: bk.staffId ? staffMap[bk.staffId] || 'Assigned Stylist' : 'Any Available Stylist',
          services: items,
        };
      })
    );

    return res.json(enriched);
  } catch (error) {
    console.error('Booking lookup failed:', error);
    return res.status(500).json({ error: 'Failed to look up bookings.' });
  }
});

router.post('/bookings/:ref/cancel', async (req, res) => {
  try {
    const ref = req.params.ref.trim().toUpperCase();
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 300) : 'Cancelled by client';

    const rows = await db.select().from(bookings).where(eq(bookings.bookingRef, ref)).limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = rows[0];
    if (['CANCELLED', 'COMPLETED', 'REJECTED'].includes(booking.status)) {
      return res.status(400).json({ error: `Booking is already ${booking.status}.` });
    }

    // Enforce 3-hour cancellation rule relative to Nepal Time (+05:45)
    const apptDateTime = new Date(`${booking.appointmentDate}T${booking.startTime}:00+05:45`);
    const hoursUntil = (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 3 && hoursUntil > -24) {
      return res.status(400).json({
        error:
          'Online cancellation closes 3 hours before your appointment. Please contact the salon via WhatsApp or phone to reschedule.',
      });
    }

    const updated = await db
      .update(bookings)
      .set({ status: 'CANCELLED', cancellationReason: reason, updatedAt: new Date() })
      .where(eq(bookings.id, booking.id))
      .returning();

    await db.insert(notifications).values({
      type: 'BOOKING_STATUS',
      channel: 'IN_APP',
      recipient: 'Admin Desk',
      title: `Booking Cancelled (${booking.bookingRef})`,
      message: `${booking.customerName} cancelled their appointment for ${booking.appointmentDate} at ${booking.startTime}.`,
      isRead: false,
      status: 'SENT',
    });

    return res.json(updated[0]);
  } catch (error) {
    console.error('Booking cancel failed:', error);
    return res.status(500).json({ error: 'Could not cancel booking.' });
  }
});

router.patch('/bookings/:ref/reschedule', async (req, res) => {
  try {
    const schema = z.object({
      appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
      staffId: z.number().int().positive().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid reschedule request.',
      });
    }

    const updated = await rescheduleBookingTransaction({
      bookingRef: req.params.ref,
      appointmentDate: parsed.data.appointmentDate,
      startTime: parsed.data.startTime,
      staffId: parsed.data.staffId,
    });
    return res.json(updated);
  } catch (error: unknown) {
    if (error instanceof BookingConflictError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : 'Could not reschedule booking.';
    return res.status(400).json({ error: message });
  }
});

router.post('/payments/initiate', async (req, res) => {
  try {
    const schema = z.object({
      bookingRef: z.string().min(3),
      provider: z.enum(['CASH', 'ESEWA', 'KHALTI', 'FONEPAY']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payment initiation request' });
    }
    const session = await initiatePaymentSession(parsed.data.bookingRef, parsed.data.provider);
    return res.json(session);
  } catch (error: unknown) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Payment initiation failed' });
  }
});

router.post('/payments/verify', async (req, res) => {
  try {
    const schema = z.object({
      provider: z.enum(['ESEWA', 'KHALTI', 'FONEPAY']),
      transactionRef: z.string().min(3),
      pidx: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payment verification payload' });
    }
    const result = await verifyOnlinePayment(parsed.data);
    return res.json(result);
  } catch (error: unknown) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Payment verification failed' });
  }
});

router.post('/contact', async (req, res) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Please complete all required fields.' });
    }
    const inserted = await db.insert(contactMessages).values(parsed.data).returning();
    await db.insert(notifications).values({
      type: 'CONTACT',
      channel: 'IN_APP',
      recipient: 'Admin Desk',
      title: `New Inquiry: ${parsed.data.subject}`,
      message: `${parsed.data.fullName} (${parsed.data.phone}) sent a contact message.`,
      isRead: false,
      status: 'SENT',
    });
    return res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Contact submission failed:', error);
    return res.status(500).json({ error: 'Failed to submit contact form.' });
  }
});

export default router;
