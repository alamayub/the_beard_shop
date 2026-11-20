import { Router } from 'express';
import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../src/db/index.ts';
import { ensureSeeded } from '../../../src/db/seed.ts';
import {
  auditLogs,
  blogPosts,
  bookings,
  bookingServices,
  contactMessages,
  customers,
  galleryItems,
  holidays,
  notifications,
  offers,
  payments,
  reviews,
  salonSettings,
  serviceCategories,
  services,
  socialPosts,
  staff,
  staffBreaks,
  staffSchedules,
  users,
} from '../../../src/db/schema.ts';
import { AuthRequest, requireAuth, requireRole, writeAuditLog } from '../middleware/auth.ts';
import {
  checkStylistOverlap,
  getKathmanduDateIso,
  getKathmanduDateIsoOffset,
  getKathmanduYear,
} from '../services/bookingEngine.ts';

const router = Router();

function addMinutesToTime(startTime: string, minutesToAdd: number): string {
  const [hStr, mStr] = startTime.split(':');
  const total = Number(hStr || 10) * 60 + Number(mStr || 0) + minutesToAdd;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

router.use(async (_req, _res, next) => {
  await ensureSeeded();
  next();
});

// Protect every admin route with authentication + staff role authorization
router.use(requireAuth);
router.use(requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST'));

// ─── Dashboard Overview Analytics ──────────────────────────────────────────────
router.get('/dashboard', async (_req, res) => {
  try {
    const [allBookings, allCustomers, allBookingSvcs, allStaff, allPayments] = await Promise.all([
      db.select().from(bookings).orderBy(desc(bookings.createdAt)),
      db.select().from(customers),
      db.select().from(bookingServices),
      db.select().from(staff),
      db.select().from(payments),
    ]);

    const today = getKathmanduDateIso();
    const currentMonth = today.slice(0, 7);

    const totalBookings = allBookings.length;
    const todaysBookings = allBookings.filter((b) => b.appointmentDate === today).length;
    const pendingBookings = allBookings.filter((b) => b.status === 'PENDING').length;
    const completedBookings = allBookings.filter((b) => b.status === 'COMPLETED').length;
    const totalCustomers = allCustomers.length;

    const monthlyRevenueNpr = allBookings
      .filter(
        (b) =>
          b.appointmentDate.startsWith(currentMonth) &&
          (b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
      )
      .reduce((sum, b) => sum + b.totalPriceNpr, 0);

    const totalRevenueNpr = allBookings
      .filter((b) => b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + b.totalPriceNpr, 0);

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      REJECTED: 0,
      NO_SHOW: 0,
    };
    for (const b of allBookings) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    }

    const servicePopularity: Record<string, { name: string; bookings: number; revenueNpr: number }> =
      {};
    for (const item of allBookingSvcs) {
      if (!servicePopularity[item.serviceName]) {
        servicePopularity[item.serviceName] = { name: item.serviceName, bookings: 0, revenueNpr: 0 };
      }
      servicePopularity[item.serviceName].bookings += 1;
      servicePopularity[item.serviceName].revenueNpr += item.priceNpr;
    }
    const popularServices = Object.values(servicePopularity)
      .sort((a, b) => b.revenueNpr - a.revenueNpr)
      .slice(0, 6);

    const paymentByProvider: Record<string, { provider: string; count: number; amountNpr: number }> =
      {};
    for (const p of allPayments) {
      if (!paymentByProvider[p.provider]) {
        paymentByProvider[p.provider] = { provider: p.provider, count: 0, amountNpr: 0 };
      }
      paymentByProvider[p.provider].count += 1;
      paymentByProvider[p.provider].amountNpr += p.amountNpr;
    }

    const trendDays: Array<{ date: string; bookings: number; revenueNpr: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = getKathmanduDateIsoOffset(-i);
      const dayBookings = allBookings.filter((b) => b.appointmentDate === d);
      trendDays.push({
        date: d.slice(5),
        bookings: dayBookings.length,
        revenueNpr: dayBookings
          .filter((b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
          .reduce((s, b) => s + b.totalPriceNpr, 0),
      });
    }

    const staffMap: Record<number, string> = {};
    for (const st of allStaff) staffMap[st.id] = st.fullName;

    const recentBookings = allBookings.slice(0, 8).map((b) => ({
      ...b,
      staffName: b.staffId ? staffMap[b.staffId] || 'Assigned Stylist' : 'Unassigned',
    }));

    return res.json({
      kpis: {
        totalBookings,
        todaysBookings,
        pendingBookings,
        completedBookings,
        totalCustomers,
        monthlyRevenueNpr,
        totalRevenueNpr,
      },
      statusChart: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      trendsChart: trendDays,
      popularServices,
      paymentBreakdown: Object.values(paymentByProvider),
      recentBookings,
    });
  } catch (error) {
    console.error('Admin dashboard analytics error:', error);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

// ─── Bookings Management ───────────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    const [allBookings, allItems, allStaff] = await Promise.all([
      db.select().from(bookings).orderBy(desc(bookings.createdAt)),
      db.select().from(bookingServices),
      db.select().from(staff),
    ]);

    const staffMap: Record<number, string> = {};
    for (const s of allStaff) staffMap[s.id] = s.fullName;

    let list = allBookings.map((b) => ({
      ...b,
      staffName: b.staffId ? staffMap[b.staffId] || 'Assigned Stylist' : 'Unassigned',
      services: allItems.filter((item) => item.bookingId === b.id),
    }));

    if (status && status !== 'ALL') {
      list = list.filter((b) => b.status === status);
    }
    if (q) {
      list = list.filter(
        (b) =>
          b.bookingRef.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.toLowerCase().includes(q) ||
          (b.staffName || '').toLowerCase().includes(q)
      );
    }
    return res.json(list);
  } catch (error) {
    console.error('Admin bookings fetch error:', error);
    return res.status(500).json({ error: 'Failed to load bookings.' });
  }
});

router.post('/bookings', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      serviceIds: z.array(z.number().int().positive()).min(1),
      staffId: z.number().int().positive().nullable().optional(),
      appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      customerName: z.string().trim().min(2),
      customerPhone: z.string().trim().min(7),
      customerEmail: z.string().trim().optional().default(''),
      notes: z.string().max(600).optional().default(''),
      status: z
        .enum(['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'])
        .optional()
        .default('APPROVED'),
      paymentMethod: z.enum(['CASH', 'ESEWA', 'KHALTI', 'FONEPAY']).optional().default('CASH'),
      paymentStatus: z
        .enum(['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED'])
        .optional()
        .default('UNPAID'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid booking data' });
    }

    const data = parsed.data;
    const allSvcs = await db.select().from(services);
    const chosenSvcs = allSvcs.filter((s) => data.serviceIds.includes(s.id));
    if (chosenSvcs.length === 0) {
      return res.status(400).json({ error: 'Please select at least one valid service.' });
    }

    const totalDurationMinutes = chosenSvcs.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalPriceNpr = chosenSvcs.reduce((sum, s) => sum + s.priceNpr, 0);
    const endTime = addMinutesToTime(data.startTime, totalDurationMinutes);

    // Prevent overlapping appointments for the assigned specialist
    if (
      data.staffId &&
      !['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(data.status)
    ) {
      const overlap = await checkStylistOverlap(db, {
        staffId: data.staffId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        endTime,
      });
      if (overlap.conflict) {
        return res.status(409).json({
          error: `Overlap conflict: Specialist is already booked (${overlap.bookingRef}, ${overlap.startTime}–${overlap.endTime} NPT).`,
        });
      }
    }

    // Upsert customer record by phone
    const existingCust = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, data.customerPhone))
      .limit(1);

    let customerId: number;
    if (existingCust[0]) {
      customerId = existingCust[0].id;
    } else {
      const createdCust = await db
        .insert(customers)
        .values({
          fullName: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail,
          totalVisits: data.status === 'COMPLETED' ? 1 : 0,
          totalSpentNpr: data.status === 'COMPLETED' ? totalPriceNpr : 0,
        })
        .returning();
      customerId = createdCust[0].id;
    }

    const bookingRef = `TBS-${getKathmanduYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [created] = await db
      .insert(bookings)
      .values({
        bookingRef,
        customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        staffId: data.staffId ?? null,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        endTime,
        totalDurationMinutes,
        totalPriceNpr,
        status: data.status,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        notes: data.notes,
      })
      .returning();

    await db.insert(bookingServices).values(
      chosenSvcs.map((svc) => ({
        bookingId: created.id,
        serviceId: svc.id,
        serviceName: svc.name,
        priceNpr: svc.priceNpr,
        durationMinutes: svc.durationMinutes,
      }))
    );

    await db.insert(payments).values({
      bookingId: created.id,
      provider: data.paymentMethod,
      amountNpr: totalPriceNpr,
      status: data.paymentStatus === 'PAID' ? 'VERIFIED' : 'INITIATED',
      transactionRef: `DESK-${Date.now().toString().slice(-8)}`,
      verifiedAt: data.paymentStatus === 'PAID' ? new Date() : null,
    });

    await db.insert(notifications).values({
      type: 'BOOKING_CREATED',
      channel: 'IN_APP',
      recipient: data.customerPhone,
      title: `Desk Booking ${bookingRef}`,
      message: `${data.customerName} scheduled for ${data.appointmentDate} at ${data.startTime} NPT.`,
      isRead: false,
      status: 'SENT',
    });

    await writeAuditLog(req, 'CREATE_BOOKING', 'BOOKING', created.id, { bookingRef });
    return res.status(201).json(created);
  } catch (error) {
    console.error('Admin booking create error:', error);
    return res.status(500).json({ error: 'Failed to create booking.' });
  }
});

router.patch('/bookings/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const schema = z.object({
      status: z
        .enum(['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'])
        .optional(),
      paymentMethod: z.enum(['CASH', 'ESEWA', 'KHALTI', 'FONEPAY']).optional(),
      paymentStatus: z
        .enum(['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED'])
        .optional(),
      appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      staffId: z.number().int().positive().nullable().optional(),
      notes: z.string().max(600).optional(),
      cancellationReason: z.string().max(400).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid booking update payload.' });
    }

    const existing = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (existing.length === 0) return res.status(404).json({ error: 'Booking not found' });

    const prev = existing[0];
    const nextStatus = parsed.data.status ?? prev.status;
    const nextDate = parsed.data.appointmentDate ?? prev.appointmentDate;
    const nextStartTime = parsed.data.startTime ?? prev.startTime;
    const nextEndTime = parsed.data.startTime
      ? addMinutesToTime(parsed.data.startTime, prev.totalDurationMinutes)
      : prev.endTime;
    const nextStaffId =
      parsed.data.staffId !== undefined ? parsed.data.staffId : prev.staffId;

    // Prevent overlapping appointments when rescheduling, reassigning, or reactivating
    if (
      nextStaffId &&
      !['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(nextStatus) &&
      (parsed.data.appointmentDate !== undefined ||
        parsed.data.startTime !== undefined ||
        parsed.data.staffId !== undefined ||
        (parsed.data.status && ['PENDING', 'APPROVED'].includes(parsed.data.status)))
    ) {
      const overlap = await checkStylistOverlap(db, {
        staffId: nextStaffId,
        appointmentDate: nextDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
        excludeBookingId: id,
      });
      if (overlap.conflict) {
        return res.status(409).json({
          error: `Overlap conflict: Specialist already has ${overlap.bookingRef} (${overlap.startTime}–${overlap.endTime} NPT).`,
        });
      }
    }

    const patchData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.startTime) {
      patchData.endTime = nextEndTime;
    }

    const updated = await db
      .update(bookings)
      .set(patchData)
      .where(eq(bookings.id, id))
      .returning();

    if (parsed.data.status === 'COMPLETED' && prev.status !== 'COMPLETED' && prev.customerId) {
      const custRows = await db
        .select()
        .from(customers)
        .where(eq(customers.id, prev.customerId))
        .limit(1);
      if (custRows[0]) {
        await db
          .update(customers)
          .set({
            totalVisits: custRows[0].totalVisits + 1,
            totalSpentNpr: custRows[0].totalSpentNpr + prev.totalPriceNpr,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, prev.customerId));
      }
    }

    if (parsed.data.paymentStatus === 'PAID') {
      await db
        .update(payments)
        .set({ status: 'VERIFIED', verifiedAt: new Date() })
        .where(eq(payments.bookingId, id));
    } else if (parsed.data.paymentStatus === 'REFUNDED') {
      await db
        .update(payments)
        .set({ status: 'REFUNDED' })
        .where(eq(payments.bookingId, id));
    }

    await writeAuditLog(req, 'UPDATE_BOOKING', 'BOOKING', id, parsed.data);
    return res.json(updated[0]);
  } catch (error) {
    console.error('Admin booking update error:', error);
    return res.status(500).json({ error: 'Failed to update booking.' });
  }
});

router.delete(
  '/bookings/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(bookings).where(eq(bookings.id, id));
      await writeAuditLog(req, 'DELETE_BOOKING', 'BOOKING', id);
      return res.json({ ok: true });
    } catch (error) {
      console.error('Admin booking delete error:', error);
      return res.status(500).json({ error: 'Failed to delete booking.' });
    }
  }
);

// ─── Services & Categories CRUD ────────────────────────────────────────────────
router.get('/services', async (_req, res) => {
  try {
    const rows = await db.select().from(services).orderBy(asc(services.sortOrder), asc(services.id));
    return res.json(rows);
  } catch (error) {
    console.error('Admin services fetch failed:', error);
    return res.status(500).json({ error: 'Failed to load services.' });
  }
});

router.post(
  '/services',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        categoryId: z.number().int().positive(),
        name: z.string().min(2).max(150),
        nameNe: z.string().optional().default(''),
        slug: z.string().min(2).max(150),
        description: z.string().min(5),
        descriptionNe: z.string().optional().default(''),
        priceNpr: z.number().int().min(0),
        durationMinutes: z.number().int().min(10).max(480),
        imageUrl: z.string().min(1),
        isFeatured: z.boolean().optional().default(false),
        isPublished: z.boolean().optional().default(true),
        isDemoPrice: z.boolean().optional().default(false),
        sortOrder: z.number().int().optional().default(0),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid service' });
      }
      const created = await db.insert(services).values(parsed.data).returning();
      await writeAuditLog(req, 'CREATE_SERVICE', 'SERVICE', created[0].id, { name: parsed.data.name });
      return res.status(201).json(created[0]);
    } catch (error) {
      console.error('Service create error:', error);
      return res.status(400).json({ error: 'Could not create service (slug must be unique).' });
    }
  }
);

router.patch(
  '/services/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await db
        .update(services)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(services.id, id))
        .returning();
      if (!updated[0]) return res.status(404).json({ error: 'Service not found' });
      await writeAuditLog(req, 'UPDATE_SERVICE', 'SERVICE', id, req.body);
      return res.json(updated[0]);
    } catch (error) {
      console.error('Service update error:', error);
      return res.status(400).json({ error: 'Failed to update service.' });
    }
  }
);

router.delete(
  '/services/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(services).where(eq(services.id, id));
      await writeAuditLog(req, 'DELETE_SERVICE', 'SERVICE', id);
      return res.json({ ok: true });
    } catch (error) {
      console.error('Service delete error:', error);
      return res.status(500).json({ error: 'Failed to delete service.' });
    }
  }
);

router.get('/categories', async (_req, res) => {
  const rows = await db
    .select()
    .from(serviceCategories)
    .orderBy(asc(serviceCategories.sortOrder), asc(serviceCategories.id));
  return res.json(rows);
});

router.post(
  '/categories',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2),
        nameNe: z.string().optional().default(''),
        slug: z.string().min(2),
        description: z.string().optional().default(''),
        sortOrder: z.number().int().optional().default(0),
        isPublished: z.boolean().optional().default(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid category data' });
      const created = await db.insert(serviceCategories).values(parsed.data).returning();
      await writeAuditLog(req, 'CREATE_CATEGORY', 'CATEGORY', created[0].id);
      return res.status(201).json(created[0]);
    } catch {
      return res.status(400).json({ error: 'Failed to create category (slug must be unique).' });
    }
  }
);

router.patch(
  '/categories/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await db
        .update(serviceCategories)
        .set(req.body)
        .where(eq(serviceCategories.id, id))
        .returning();
      if (!updated[0]) return res.status(404).json({ error: 'Category not found' });
      await writeAuditLog(req, 'UPDATE_CATEGORY', 'CATEGORY', id, req.body);
      return res.json(updated[0]);
    } catch {
      return res.status(400).json({ error: 'Failed to update category.' });
    }
  }
);

router.delete(
  '/categories/:id',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
    await writeAuditLog(req, 'DELETE_CATEGORY', 'CATEGORY', id);
    return res.json({ ok: true });
  }
);

// ─── Gallery CRUD ──────────────────────────────────────────────────────────────
router.get('/gallery', async (_req, res) => {
  const rows = await db
    .select()
    .from(galleryItems)
    .orderBy(asc(galleryItems.sortOrder), desc(galleryItems.createdAt));
  return res.json(rows);
});

router.post(
  '/gallery',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        title: z.string().min(2),
        description: z.string().optional().default(''),
        category: z.string().min(2),
        imageUrl: z.string().min(1),
        beforeImageUrl: z.string().optional().default(''),
        isFeatured: z.boolean().optional().default(false),
        isPublished: z.boolean().optional().default(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid gallery item' });
      const created = await db.insert(galleryItems).values(parsed.data).returning();
      await writeAuditLog(req, 'CREATE_GALLERY', 'GALLERY', created[0].id);
      return res.status(201).json(created[0]);
    } catch {
      return res.status(400).json({ error: 'Failed to create gallery item.' });
    }
  }
);

router.patch(
  '/gallery/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const updated = await db
      .update(galleryItems)
      .set(req.body)
      .where(eq(galleryItems.id, id))
      .returning();
    await writeAuditLog(req, 'UPDATE_GALLERY', 'GALLERY', id);
    return res.json(updated[0]);
  }
);

router.delete(
  '/gallery/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(galleryItems).where(eq(galleryItems.id, id));
    await writeAuditLog(req, 'DELETE_GALLERY', 'GALLERY', id);
    return res.json({ ok: true });
  }
);

// ─── Team, Staff Schedules & Breaks CRUD ───────────────────────────────────────
router.get('/team', async (_req, res) => {
  const [members, schedules, breaks] = await Promise.all([
    db.select().from(staff).orderBy(asc(staff.sortOrder), asc(staff.id)),
    db.select().from(staffSchedules),
    db.select().from(staffBreaks),
  ]);
  return res.json(
    members.map((m) => ({
      ...m,
      schedules: schedules.filter((sc) => sc.staffId === m.id),
      breaks: breaks.filter((br) => br.staffId === m.id),
    }))
  );
});

router.post(
  '/team',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        fullName: z.string().min(2),
        roleTitle: z.string().min(2),
        bio: z.string().min(5),
        experienceYears: z.number().int().min(0).max(50),
        specializations: z.array(z.string()).default([]),
        avatarUrl: z.string().min(1),
        isAvailable: z.boolean().optional().default(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid team member details' });
      const created = await db
        .insert(staff)
        .values({ ...parsed.data, isDemoProfile: false })
        .returning();
      await db.insert(staffSchedules).values(
        [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          staffId: created[0].id,
          dayOfWeek,
          startTime: '10:00',
          endTime: '20:00',
          isWorking: true,
        }))
      );
      await writeAuditLog(req, 'CREATE_STAFF', 'STAFF', created[0].id);
      return res.status(201).json(created[0]);
    } catch {
      return res.status(400).json({ error: 'Failed to add team member.' });
    }
  }
);

router.patch(
  '/team/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const updated = await db.update(staff).set(req.body).where(eq(staff.id, id)).returning();
    await writeAuditLog(req, 'UPDATE_STAFF', 'STAFF', id);
    return res.json(updated[0]);
  }
);

router.delete(
  '/team/:id',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(staff).where(eq(staff.id, id));
    await writeAuditLog(req, 'DELETE_STAFF', 'STAFF', id);
    return res.json({ ok: true });
  }
);

router.put(
  '/team/:id/schedules',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const staffId = Number(req.params.id);
      const schema = z.array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: z.string(),
          endTime: z.string(),
          isWorking: z.boolean(),
        })
      );
      const parsed = schema.safeParse(req.body?.schedules);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid schedule array' });

      await db.delete(staffSchedules).where(eq(staffSchedules.staffId, staffId));
      const inserted = await db
        .insert(staffSchedules)
        .values(parsed.data.map((s) => ({ ...s, staffId })))
        .returning();
      await writeAuditLog(req, 'UPDATE_STAFF_SCHEDULE', 'STAFF', staffId);
      return res.json(inserted);
    } catch {
      return res.status(500).json({ error: 'Failed to update schedule.' });
    }
  }
);

router.post(
  '/team/:id/breaks',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const staffId = Number(req.params.id);
      const schema = z.object({
        breakDate: z.string().nullable().optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        reason: z.string().min(2).max(120).default('Lunch Break'),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid break schedule' });
      const created = await db
        .insert(staffBreaks)
        .values({
          staffId,
          breakDate: parsed.data.breakDate || null,
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          reason: parsed.data.reason,
        })
        .returning();
      await writeAuditLog(req, 'CREATE_STAFF_BREAK', 'STAFF_BREAK', created[0].id);
      return res.status(201).json(created[0]);
    } catch {
      return res.status(400).json({ error: 'Failed to create staff break.' });
    }
  }
);

router.delete(
  '/team/breaks/:breakId',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const breakId = Number(req.params.breakId);
    await db.delete(staffBreaks).where(eq(staffBreaks.id, breakId));
    await writeAuditLog(req, 'DELETE_STAFF_BREAK', 'STAFF_BREAK', breakId);
    return res.json({ ok: true });
  }
);

// ─── Customers CRUD ────────────────────────────────────────────────────────────
router.get('/customers', async (_req, res) => {
  const [custRows, bookingRows] = await Promise.all([
    db.select().from(customers).orderBy(desc(customers.createdAt)),
    db.select().from(bookings).orderBy(desc(bookings.createdAt)),
  ]);
  return res.json(
    custRows.map((c) => ({
      ...c,
      bookings: bookingRows.filter((b) => b.customerId === c.id),
    }))
  );
});

router.post('/customers', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      fullName: z.string().trim().min(2),
      phone: z.string().trim().min(7),
      email: z.string().trim().optional().default(''),
      notes: z.string().max(1000).optional().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid customer data' });
    const created = await db.insert(customers).values(parsed.data).returning();
    await writeAuditLog(req, 'CREATE_CUSTOMER', 'CUSTOMER', created[0].id);
    return res.status(201).json({ ...created[0], bookings: [] });
  } catch {
    return res.status(400).json({ error: 'Failed to create customer.' });
  }
});

router.patch('/customers/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const schema = z.object({
      fullName: z.string().trim().min(2).optional(),
      phone: z.string().trim().min(7).optional(),
      email: z.string().trim().optional(),
      notes: z.string().max(1000).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid customer update' });
    const updated = await db
      .update(customers)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!updated[0]) return res.status(404).json({ error: 'Customer not found' });
    await writeAuditLog(req, 'UPDATE_CUSTOMER', 'CUSTOMER', id);
    return res.json(updated[0]);
  } catch {
    return res.status(400).json({ error: 'Failed to update customer.' });
  }
});

router.delete(
  '/customers/:id',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(customers).where(eq(customers.id, id));
    await writeAuditLog(req, 'DELETE_CUSTOMER', 'CUSTOMER', id);
    return res.json({ ok: true });
  }
);

// ─── Social Media Posts CRUD ───────────────────────────────────────────────────
router.get('/social-posts', async (_req, res) => {
  const rows = await db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt));
  return res.json(rows);
});

router.post(
  '/social-posts',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      platform: z.enum(['INSTAGRAM', 'FACEBOOK']),
      mediaType: z.enum(['IMAGE', 'REEL']).default('IMAGE'),
      caption: z.string().min(3),
      imageUrl: z.string().min(1),
      postUrl: z.string().url(),
      isFeatured: z.boolean().optional().default(false),
      isPublished: z.boolean().optional().default(true),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid social post data' });
    const created = await db.insert(socialPosts).values(parsed.data).returning();
    await writeAuditLog(req, 'CREATE_SOCIAL_POST', 'SOCIAL_POST', created[0].id);
    return res.status(201).json(created[0]);
  }
);

router.patch(
  '/social-posts/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const updated = await db
      .update(socialPosts)
      .set(req.body)
      .where(eq(socialPosts.id, id))
      .returning();
    await writeAuditLog(req, 'UPDATE_SOCIAL_POST', 'SOCIAL_POST', id);
    return res.json(updated[0]);
  }
);

router.delete(
  '/social-posts/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
    await writeAuditLog(req, 'DELETE_SOCIAL_POST', 'SOCIAL_POST', id);
    return res.json({ ok: true });
  }
);

// ─── Blog Posts CRUD ───────────────────────────────────────────────────────────
router.get('/blog', async (_req, res) => {
  const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  return res.json(rows);
});

router.post(
  '/blog',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      title: z.string().min(4),
      slug: z.string().min(3),
      excerpt: z.string().min(10),
      content: z.string().min(20),
      category: z.string().min(2),
      coverImageUrl: z.string().min(1),
      authorName: z.string().default('Editorial Desk'),
      readTimeMinutes: z.number().int().min(1).default(4),
      isFeatured: z.boolean().optional().default(false),
      isPublished: z.boolean().optional().default(true),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid blog post payload' });
    const created = await db.insert(blogPosts).values(parsed.data).returning();
    await writeAuditLog(req, 'CREATE_BLOG_POST', 'BLOG', created[0].id);
    return res.status(201).json(created[0]);
  }
);

router.patch(
  '/blog/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await db
        .update(blogPosts)
        .set(req.body)
        .where(eq(blogPosts.id, id))
        .returning();
      if (!updated[0]) return res.status(404).json({ error: 'Article not found' });
      await writeAuditLog(req, 'UPDATE_BLOG_POST', 'BLOG', id);
      return res.json(updated[0]);
    } catch {
      return res.status(400).json({ error: 'Failed to update article.' });
    }
  }
);

router.delete(
  '/blog/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    await writeAuditLog(req, 'DELETE_BLOG_POST', 'BLOG', id);
    return res.json({ ok: true });
  }
);

// ─── Offers & Festival Promotions CRUD ─────────────────────────────────────────
router.get('/offers', async (_req, res) => {
  const rows = await db.select().from(offers).orderBy(desc(offers.createdAt));
  return res.json(rows);
});

router.post(
  '/offers',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      title: z.string().min(3),
      titleNe: z.string().optional().default(''),
      festivalTag: z.string().default('SEASONAL'),
      description: z.string().min(5),
      discountText: z.string().min(2),
      promoCode: z.string().optional().default(''),
      validFrom: z.string(),
      validUntil: z.string(),
      imageUrl: z.string().min(1),
      isFeatured: z.boolean().optional().default(false),
      isPublished: z.boolean().optional().default(true),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid offer payload' });
    const created = await db.insert(offers).values(parsed.data).returning();
    await writeAuditLog(req, 'CREATE_OFFER', 'OFFER', created[0].id);
    return res.status(201).json(created[0]);
  }
);

router.patch(
  '/offers/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await db
        .update(offers)
        .set(req.body)
        .where(eq(offers.id, id))
        .returning();
      if (!updated[0]) return res.status(404).json({ error: 'Offer not found' });
      await writeAuditLog(req, 'UPDATE_OFFER', 'OFFER', id);
      return res.json(updated[0]);
    } catch {
      return res.status(400).json({ error: 'Failed to update offer.' });
    }
  }
);

router.delete(
  '/offers/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(offers).where(eq(offers.id, id));
    await writeAuditLog(req, 'DELETE_OFFER', 'OFFER', id);
    return res.json({ ok: true });
  }
);

// ─── Reviews CRUD ──────────────────────────────────────────────────────────────
router.get('/reviews', async (_req, res) => {
  const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  return res.json(rows);
});

router.post(
  '/reviews',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const schema = z.object({
      customerName: z.string().trim().min(2),
      serviceName: z.string().trim().min(2),
      rating: z.number().int().min(1).max(5).default(5),
      comment: z.string().trim().min(5),
      isDemoReview: z.boolean().optional().default(false),
      isPublished: z.boolean().optional().default(true),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid review payload' });
    const created = await db.insert(reviews).values(parsed.data).returning();
    await writeAuditLog(req, 'CREATE_REVIEW', 'REVIEW', created[0].id);
    return res.status(201).json(created[0]);
  }
);

router.patch(
  '/reviews/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const updated = await db.update(reviews).set(req.body).where(eq(reviews.id, id)).returning();
    await writeAuditLog(req, 'UPDATE_REVIEW', 'REVIEW', id);
    return res.json(updated[0]);
  }
);

router.delete(
  '/reviews/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(reviews).where(eq(reviews.id, id));
    await writeAuditLog(req, 'DELETE_REVIEW', 'REVIEW', id);
    return res.json({ ok: true });
  }
);

// ─── Holidays CRUD ─────────────────────────────────────────────────────────────
router.get('/holidays', async (_req, res) => {
  const rows = await db.select().from(holidays).orderBy(asc(holidays.date));
  return res.json(rows);
});

router.post(
  '/holidays',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        bsDate: z.string().optional().default(''),
        description: z.string().optional().default(''),
        isClosed: z.boolean().default(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid holiday data' });
      const created = await db.insert(holidays).values(parsed.data).returning();
      await writeAuditLog(req, 'CREATE_HOLIDAY', 'HOLIDAY', created[0].id);
      return res.status(201).json(created[0]);
    } catch {
      return res.status(400).json({ error: 'Holiday date already exists.' });
    }
  }
);

router.patch(
  '/holidays/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await db.update(holidays).set(req.body).where(eq(holidays.id, id)).returning();
      await writeAuditLog(req, 'UPDATE_HOLIDAY', 'HOLIDAY', id);
      return res.json(updated[0]);
    } catch {
      return res.status(400).json({ error: 'Failed to update holiday.' });
    }
  }
);

router.delete(
  '/holidays/:id',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    await db.delete(holidays).where(eq(holidays.id, id));
    await writeAuditLog(req, 'DELETE_HOLIDAY', 'HOLIDAY', id);
    return res.json({ ok: true });
  }
);

// ─── Payments CRUD ─────────────────────────────────────────────────────────────
router.get('/payments', async (_req, res) => {
  const [payRows, bkRows] = await Promise.all([
    db.select().from(payments).orderBy(desc(payments.createdAt)),
    db.select().from(bookings),
  ]);
  const bkMap: Record<number, (typeof bkRows)[number]> = {};
  for (const b of bkRows) bkMap[b.id] = b;
  return res.json(
    payRows.map((p) => ({
      ...p,
      bookingRef: bkMap[p.bookingId]?.bookingRef || `#${p.bookingId}`,
      customerName: bkMap[p.bookingId]?.customerName || 'Client',
    }))
  );
});

router.post('/payments', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      bookingId: z.number().int().positive(),
      provider: z.enum(['CASH', 'ESEWA', 'KHALTI', 'FONEPAY']),
      amountNpr: z.number().int().min(0),
      status: z
        .enum(['INITIATED', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED', 'REFUNDED'])
        .default('VERIFIED'),
      transactionRef: z.string().trim().min(2),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payment payload' });

    const [created] = await db
      .insert(payments)
      .values({
        ...parsed.data,
        verifiedAt: parsed.data.status === 'VERIFIED' ? new Date() : null,
      })
      .returning();

    if (parsed.data.status === 'VERIFIED') {
      await db
        .update(bookings)
        .set({ paymentStatus: 'PAID', paymentMethod: parsed.data.provider, updatedAt: new Date() })
        .where(eq(bookings.id, parsed.data.bookingId));
    }

    await writeAuditLog(req, 'RECORD_PAYMENT', 'PAYMENT', created.id, parsed.data);
    return res.status(201).json(created);
  } catch {
    return res.status(400).json({ error: 'Failed to record payment.' });
  }
});

router.patch('/payments/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const schema = z.object({
      status: z.enum(['INITIATED', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED', 'REFUNDED']),
      transactionRef: z.string().trim().min(2).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payment update' });

    const existing = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!existing[0]) return res.status(404).json({ error: 'Payment not found' });

    const [updated] = await db
      .update(payments)
      .set({
        status: parsed.data.status,
        transactionRef: parsed.data.transactionRef ?? existing[0].transactionRef,
        verifiedAt: parsed.data.status === 'VERIFIED' ? new Date() : existing[0].verifiedAt,
      })
      .where(eq(payments.id, id))
      .returning();

    // Sync parent booking paymentStatus
    const bookingPaymentStatus =
      parsed.data.status === 'VERIFIED'
        ? 'PAID'
        : parsed.data.status === 'REFUNDED'
          ? 'REFUNDED'
          : parsed.data.status === 'FAILED'
            ? 'FAILED'
            : parsed.data.status === 'PENDING_VERIFICATION'
              ? 'PENDING_VERIFICATION'
              : 'UNPAID';

    await db
      .update(bookings)
      .set({ paymentStatus: bookingPaymentStatus, updatedAt: new Date() })
      .where(eq(bookings.id, existing[0].bookingId));

    await writeAuditLog(req, 'UPDATE_PAYMENT', 'PAYMENT', id, parsed.data);
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Failed to update payment.' });
  }
});

// ─── Notifications & Contact Messages CRUD ─────────────────────────────────────
router.get('/notifications', async (_req, res) => {
  const [notifRows, msgRows] = await Promise.all([
    db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100),
  ]);
  return res.json({ notifications: notifRows, contactMessages: msgRows });
});

router.post('/notifications', async (req: AuthRequest, res) => {
  const schema = z.object({
    type: z.enum(['BOOKING_CREATED', 'BOOKING_STATUS', 'PAYMENT', 'CONTACT']).default('BOOKING_STATUS'),
    channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'IN_APP']).default('WHATSAPP'),
    recipient: z.string().trim().min(2),
    title: z.string().trim().min(2),
    message: z.string().trim().min(4),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid notification payload' });

  const [created] = await db
    .insert(notifications)
    .values({ ...parsed.data, isRead: true, status: 'SENT' })
    .returning();
  await writeAuditLog(req, 'SEND_NOTIFICATION', 'NOTIFICATION', created.id);
  return res.status(201).json(created);
});

router.patch('/notifications/read-all', async (_req, res) => {
  await db.update(notifications).set({ isRead: true });
  return res.json({ ok: true });
});

router.patch('/notifications/:id/read', async (req, res) => {
  const id = Number(req.params.id);
  const updated = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();
  return res.json(updated[0]);
});

router.delete('/notifications/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(notifications).where(eq(notifications.id, id));
  await writeAuditLog(req, 'DELETE_NOTIFICATION', 'NOTIFICATION', id);
  return res.json({ ok: true });
});

router.patch('/contact-messages/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const schema = z.object({
    status: z.enum(['NEW', 'REPLIED', 'ARCHIVED']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });
  const updated = await db
    .update(contactMessages)
    .set({ status: parsed.data.status })
    .where(eq(contactMessages.id, id))
    .returning();
  await writeAuditLog(req, 'UPDATE_CONTACT_MESSAGE', 'CONTACT', id, parsed.data);
  return res.json(updated[0]);
});

router.delete('/contact-messages/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  await writeAuditLog(req, 'DELETE_CONTACT_MESSAGE', 'CONTACT', id);
  return res.json({ ok: true });
});

// ─── Reports & CSV Export ──────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const period = typeof req.query.period === 'string' ? req.query.period : 'monthly';
    const [allBookings, allItems, allStaff] = await Promise.all([
      db.select().from(bookings).orderBy(desc(bookings.appointmentDate)),
      db.select().from(bookingServices),
      db.select().from(staff),
    ]);

    const cutoffDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : 3650;
    const cutoffStr = getKathmanduDateIsoOffset(-cutoffDays);

    const filtered =
      period === 'all' ? allBookings : allBookings.filter((b) => b.appointmentDate >= cutoffStr);

    const servicePerf: Record<string, { name: string; count: number; revenueNpr: number }> = {};
    const filteredIds = new Set(filtered.map((b) => b.id));
    for (const item of allItems) {
      if (!filteredIds.has(item.bookingId)) continue;
      if (!servicePerf[item.serviceName]) {
        servicePerf[item.serviceName] = { name: item.serviceName, count: 0, revenueNpr: 0 };
      }
      servicePerf[item.serviceName].count += 1;
      servicePerf[item.serviceName].revenueNpr += item.priceNpr;
    }

    const staffPerf = allStaff.map((member) => {
      const mBookings = filtered.filter((b) => b.staffId === member.id);
      return {
        staffId: member.id,
        fullName: member.fullName,
        totalBookings: mBookings.length,
        completedBookings: mBookings.filter((b) => b.status === 'COMPLETED').length,
        revenueNpr: mBookings
          .filter((b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
          .reduce((s, b) => s + b.totalPriceNpr, 0),
      };
    });

    if (req.query.format === 'csv') {
      const headers = [
        'Booking Ref',
        'Date',
        'Start Time',
        'Customer',
        'Phone',
        'Status',
        'Payment Method',
        'Payment Status',
        'Total (NPR)',
      ];
      const csvRows = [
        headers.join(','),
        ...filtered.map((b) =>
          [
            b.bookingRef,
            b.appointmentDate,
            b.startTime,
            `"${b.customerName.replace(/"/g, '""')}"`,
            b.customerPhone,
            b.status,
            b.paymentMethod,
            b.paymentStatus,
            b.totalPriceNpr,
          ].join(',')
        ),
      ];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="salon-report-${period}-${getKathmanduDateIso()}.csv"`
      );
      return res.send(csvRows.join('\n'));
    }

    return res.json({
      period,
      totalBookings: filtered.length,
      completedBookings: filtered.filter((b) => b.status === 'COMPLETED').length,
      cancelledBookings: filtered.filter((b) => b.status === 'CANCELLED').length,
      grossRevenueNpr: filtered
        .filter((b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
        .reduce((s, b) => s + b.totalPriceNpr, 0),
      collectedRevenueNpr: filtered
        .filter((b) => b.paymentStatus === 'PAID')
        .reduce((s, b) => s + b.totalPriceNpr, 0),
      servicePerformance: Object.values(servicePerf).sort((a, b) => b.revenueNpr - a.revenueNpr),
      staffPerformance: staffPerf,
      bookings: filtered,
    });
  } catch (error) {
    console.error('Reports generation error:', error);
    return res.status(500).json({ error: 'Failed to generate report.' });
  }
});

// ─── Website Settings (Editable Business Info) ─────────────────────────────────
router.get('/settings', async (_req, res) => {
  const rows = await db.select().from(salonSettings).limit(1);
  return res.json(rows[0] || null);
});

router.put(
  '/settings',
  requireRole('SUPER_ADMIN', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const existing = await db.select().from(salonSettings).limit(1);
      if (existing.length === 0) {
        const created = await db.insert(salonSettings).values(req.body).returning();
        await writeAuditLog(req, 'CREATE_SETTINGS', 'SETTINGS', created[0].id);
        return res.json(created[0]);
      }
      const updated = await db
        .update(salonSettings)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(salonSettings.id, existing[0].id))
        .returning();
      await writeAuditLog(req, 'UPDATE_SETTINGS', 'SETTINGS', existing[0].id);
      return res.json(updated[0]);
    } catch (error) {
      console.error('Settings update error:', error);
      return res.status(500).json({ error: 'Failed to save website settings.' });
    }
  }
);

// ─── Users, Roles & Audit Logs ─────────────────────────────────────────────────
router.get('/users', requireRole('SUPER_ADMIN', 'ADMIN'), async (_req, res) => {
  const [userRows, logRows] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100),
  ]);
  return res.json({ users: userRows, auditLogs: logRows });
});

router.post('/users', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      email: z.string().trim().email(),
      fullName: z.string().trim().min(2),
      phone: z.string().trim().optional().default(''),
      role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid user details' });

    const uid = `invite-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const [created] = await db
      .insert(users)
      .values({
        uid,
        email: parsed.data.email.toLowerCase(),
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        role: parsed.data.role,
        isActive: true,
      })
      .returning();

    await writeAuditLog(req, 'INVITE_USER', 'USER', created.id, {
      email: created.email,
      role: created.role,
    });
    return res.status(201).json(created);
  } catch {
    return res.status(400).json({ error: 'Failed to create staff account.' });
  }
});

router.patch('/users/:id/role', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const schema = z.object({
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER']),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid role update' });

  const updated = await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  await writeAuditLog(req, 'UPDATE_USER_ROLE', 'USER', id, parsed.data);
  return res.json(updated[0]);
});

// ─── Current Staff Profile ─────────────────────────────────────────────────────
router.get('/profile', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const [userRow] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
  const recentActivity = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.actorUid, req.user.uid))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);
  return res.json({ user: userRow || req.user, recentActivity });
});

router.patch('/profile', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const schema = z.object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(40).optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile details' });

  const [updated] = await db
    .update(users)
    .set({ fullName: parsed.data.fullName, phone: parsed.data.phone, updatedAt: new Date() })
    .where(eq(users.id, req.user.id))
    .returning();
  await writeAuditLog(req, 'UPDATE_PROFILE', 'USER', req.user.id);
  return res.json(updated);
});

// ─── Safe Image Upload Validation (Cloudinary-ready or validated Data URL) ─────
router.post(
  '/upload',
  requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  async (req: AuthRequest, res) => {
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const allowedPrefix = /^data:image\/(jpeg|png|webp);base64,/;
    if (!allowedPrefix.test(dataUrl)) {
      return res.status(400).json({
        error: 'Only JPEG, PNG, and WebP image uploads are permitted.',
      });
    }
    if (dataUrl.length > 2_800_000) {
      return res.status(400).json({ error: 'Image size must be under 2 MB.' });
    }
    await writeAuditLog(req, 'UPLOAD_IMAGE', 'MEDIA', 'upload', { bytes: dataUrl.length });
    return res.json({
      url: dataUrl,
      provider: process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary-ready' : 'validated-inline',
    });
  }
);

export default router;
