import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '../../../src/db/index.ts';
import {
  bookings,
  bookingServices,
  customers,
  holidays,
  notifications,
  payments,
  salonSettings,
  services,
  staff,
  staffBreaks,
  staffSchedules,
} from '../../../src/db/schema.ts';

const NEPAL_TIMEZONE = 'Asia/Kathmandu';
const LEAD_TIME_MINUTES = 15;

export function getKathmanduDateIso(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NEPAL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getKathmanduDateIsoOffset(daysOffset: number): string {
  const now = new Date();
  const target = new Date(now.getTime() + daysOffset * 86_400_000);
  return getKathmanduDateIso(target);
}

function getKathmanduCurrentMinutes(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: NEPAL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return (h % 24) * 60 + m;
}

export function getKathmanduYear(date: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: NEPAL_TIMEZONE,
      year: 'numeric',
    }).format(date)
  );
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

export class BookingConflictError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 409) {
    super(message);
    this.name = 'BookingConflictError';
    this.statusCode = statusCode;
  }
}

interface SlotAvailabilityResult {
  date: string;
  timezone: string;
  isPastDate?: boolean;
  isClosedDay?: boolean;
  isHoliday: boolean;
  holidayName?: string;
  totalDurationMinutes: number;
  slots: Array<{
    time: string;
    endTime: string;
    available: boolean;
    availableStaffIds: number[];
  }>;
}

type DbExecutor = Pick<typeof db, 'select'>;

async function computeAvailabilityWithExecutor(
  executor: DbExecutor,
  params: {
    date: string;
    serviceIds: number[];
    staffId?: number | null;
    excludeBookingId?: number;
  }
): Promise<SlotAvailabilityResult> {
  const todayKathmandu = getKathmanduDateIso();
  const isPastDate = params.date < todayKathmandu;
  const isToday = params.date === todayKathmandu;
  const currentKathmanduMin = isToday ? getKathmanduCurrentMinutes() : -1;

  // 1. Calculate total duration from DB services
  const selectedServices =
    params.serviceIds.length > 0
      ? await executor.select().from(services).where(inArray(services.id, params.serviceIds))
      : [];
  const totalDurationMinutes =
    selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0) || 45;

  if (isPastDate) {
    return {
      date: params.date,
      timezone: NEPAL_TIMEZONE,
      isPastDate: true,
      isHoliday: false,
      totalDurationMinutes,
      slots: [],
    };
  }

  // 2. Check holiday calendar
  const holidayMatch = await executor
    .select()
    .from(holidays)
    .where(and(eq(holidays.date, params.date), eq(holidays.isClosed, true)))
    .limit(1);

  if (holidayMatch.length > 0) {
    return {
      date: params.date,
      timezone: NEPAL_TIMEZONE,
      isHoliday: true,
      holidayName: holidayMatch[0].name,
      totalDurationMinutes,
      slots: [],
    };
  }

  const dayOfWeek = new Date(`${params.date}T12:00:00+05:45`).getDay();
  const settingsRows = await executor.select().from(salonSettings).limit(1);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const salonDayHours = settingsRows[0]?.openingHours?.find((h) => h.day === dayNames[dayOfWeek]);

  if (salonDayHours?.closed) {
    return {
      date: params.date,
      timezone: NEPAL_TIMEZONE,
      isClosedDay: true,
      isHoliday: false,
      totalDurationMinutes,
      slots: [],
    };
  }

  const openMin = timeToMinutes(salonDayHours?.open || '10:00');
  const closeMin = timeToMinutes(salonDayHours?.close || '20:00');

  // 3. Determine candidate staff members
  const candidateStaff = params.staffId
    ? await executor
        .select()
        .from(staff)
        .where(and(eq(staff.id, params.staffId), eq(staff.isAvailable, true)))
    : await executor.select().from(staff).where(eq(staff.isAvailable, true));

  if (candidateStaff.length === 0) {
    return {
      date: params.date,
      timezone: NEPAL_TIMEZONE,
      isHoliday: false,
      totalDurationMinutes,
      slots: [],
    };
  }

  const candidateIds = candidateStaff.map((s) => s.id);
  const schedules = await executor
    .select()
    .from(staffSchedules)
    .where(
      and(inArray(staffSchedules.staffId, candidateIds), eq(staffSchedules.dayOfWeek, dayOfWeek))
    );

  const breaks = await executor
    .select()
    .from(staffBreaks)
    .where(inArray(staffBreaks.staffId, candidateIds));

  const existingBookings = await executor
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.appointmentDate, params.date),
        ne(bookings.status, 'CANCELLED'),
        ne(bookings.status, 'REJECTED'),
        ne(bookings.status, 'NO_SHOW')
      )
    );

  const activeBookings = params.excludeBookingId
    ? existingBookings.filter((bk) => bk.id !== params.excludeBookingId)
    : existingBookings;

  const slots: SlotAvailabilityResult['slots'] = [];
  for (let t = openMin; t + totalDurationMinutes <= closeMin; t += 30) {
    const slotEnd = t + totalDurationMinutes;

    // Prevent booking past slots on today's date in Asia/Kathmandu
    if (isToday && t <= currentKathmanduMin + LEAD_TIME_MINUTES) {
      slots.push({
        time: minutesToTime(t),
        endTime: minutesToTime(slotEnd),
        available: false,
        availableStaffIds: [],
      });
      continue;
    }

    const availableStaffIds: number[] = [];

    for (const member of candidateStaff) {
      const sched = schedules.find((sc) => sc.staffId === member.id);
      if (sched && !sched.isWorking) continue;
      const staffOpen = sched ? timeToMinutes(sched.startTime) : openMin;
      const staffClose = sched ? timeToMinutes(sched.endTime) : closeMin;
      if (t < staffOpen || slotEnd > staffClose) continue;

      const memberBreaks = breaks.filter(
        (b) => b.staffId === member.id && (!b.breakDate || b.breakDate === params.date)
      );
      const hitsBreak = memberBreaks.some((b) =>
        overlaps(t, slotEnd, timeToMinutes(b.startTime), timeToMinutes(b.endTime))
      );
      if (hitsBreak) continue;

      const memberBookings = activeBookings.filter((bk) => bk.staffId === member.id);
      const hitsBooking = memberBookings.some((bk) =>
        overlaps(t, slotEnd, timeToMinutes(bk.startTime), timeToMinutes(bk.endTime))
      );
      if (hitsBooking) continue;

      availableStaffIds.push(member.id);
    }

    slots.push({
      time: minutesToTime(t),
      endTime: minutesToTime(slotEnd),
      available: availableStaffIds.length > 0,
      availableStaffIds,
    });
  }

  return {
    date: params.date,
    timezone: NEPAL_TIMEZONE,
    isHoliday: false,
    totalDurationMinutes,
    slots,
  };
}

export async function computeAvailability(params: {
  date: string;
  serviceIds: number[];
  staffId?: number | null;
  excludeBookingId?: number;
}): Promise<SlotAvailabilityResult> {
  try {
    return await computeAvailabilityWithExecutor(db, params);
  } catch (error) {
    console.error('Availability calculation failed:', error);
    throw new Error('Unable to compute live appointment availability.', { cause: error });
  }
}

export async function checkStylistOverlap(
  executor: DbExecutor,
  params: {
    staffId: number;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    excludeBookingId?: number;
  }
): Promise<{ conflict: boolean; bookingRef?: string; startTime?: string; endTime?: string }> {
  const startMin = timeToMinutes(params.startTime);
  const endMin = timeToMinutes(params.endTime);

  const existing = await executor
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.appointmentDate, params.appointmentDate),
        eq(bookings.staffId, params.staffId),
        ne(bookings.status, 'CANCELLED'),
        ne(bookings.status, 'REJECTED'),
        ne(bookings.status, 'NO_SHOW')
      )
    );

  const clash = existing.find(
    (bk) =>
      bk.id !== params.excludeBookingId &&
      overlaps(startMin, endMin, timeToMinutes(bk.startTime), timeToMinutes(bk.endTime))
  );

  if (clash) {
    return {
      conflict: true,
      bookingRef: clash.bookingRef,
      startTime: clash.startTime,
      endTime: clash.endTime,
    };
  }
  return { conflict: false };
}

async function generateUniqueBookingRef(executor: DbExecutor): Promise<string> {
  const year = getKathmanduYear();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = Math.floor(1000 + Math.random() * 9000);
    const ref = `TBS-${year}-${code}`;
    const existing = await executor
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.bookingRef, ref))
      .limit(1);
    if (existing.length === 0) return ref;
  }
  return `TBS-${year}-${Date.now().toString().slice(-5)}`;
}

export async function createBookingTransaction(input: {
  serviceIds: number[];
  staffId?: number | null;
  appointmentDate: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  paymentMethod: 'CASH' | 'ESEWA' | 'KHALTI' | 'FONEPAY';
}) {
  return await db.transaction(async (tx) => {
    // Serialize concurrent booking writes for the same appointment date to prevent race conditions
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`booking:${input.appointmentDate}`}))`);

    const chosenServices = await tx
      .select()
      .from(services)
      .where(and(inArray(services.id, input.serviceIds), eq(services.isPublished, true)));

    if (chosenServices.length === 0) {
      throw new BookingConflictError('Please select at least one valid published service.', 400);
    }

    const totalDurationMinutes = chosenServices.reduce((s, item) => s + item.durationMinutes, 0);
    const totalPriceNpr = chosenServices.reduce((s, item) => s + item.priceNpr, 0);
    const startMin = timeToMinutes(input.startTime);
    const endMin = startMin + totalDurationMinutes;
    const endTime = minutesToTime(endMin);

    // Re-verify live availability strictly inside transaction under advisory lock
    const availability = await computeAvailabilityWithExecutor(tx, {
      date: input.appointmentDate,
      serviceIds: input.serviceIds,
      staffId: input.staffId ?? null,
    });

    if (availability.isPastDate) {
      throw new BookingConflictError(
        'Cannot book appointments for past dates in Asia/Kathmandu time.',
        400
      );
    }

    if (availability.isHoliday) {
      throw new BookingConflictError(
        `Salon is closed on ${input.appointmentDate} (${availability.holidayName || 'Public Holiday'}).`,
        409
      );
    }

    const matchingSlot = availability.slots.find((s) => s.time === input.startTime);
    if (!matchingSlot || !matchingSlot.available || matchingSlot.availableStaffIds.length === 0) {
      throw new BookingConflictError(
        'This time slot is no longer available or has already passed in Nepal Time (NPT). Please choose another slot.',
        409
      );
    }

    const assignedStaffId = input.staffId || matchingSlot.availableStaffIds[0];

    // Final overlap safeguard for assignedStaffId inside locked transaction
    const overlapCheck = await checkStylistOverlap(tx, {
      staffId: assignedStaffId,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime,
    });
    if (overlapCheck.conflict) {
      throw new BookingConflictError(
        `Double-booking conflict detected with ${overlapCheck.bookingRef} (${overlapCheck.startTime}–${overlapCheck.endTime} NPT). Please select another slot.`,
        409
      );
    }

    // Upsert customer by phone
    const existingCustomer = await tx
      .select()
      .from(customers)
      .where(eq(customers.phone, input.customerPhone))
      .limit(1);

    let customerId: number;
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      await tx
        .update(customers)
        .set({
          fullName: input.customerName,
          email: input.customerEmail || existingCustomer[0].email,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customerId));
    } else {
      const insertedCustomer = await tx
        .insert(customers)
        .values({
          fullName: input.customerName,
          phone: input.customerPhone,
          email: input.customerEmail || '',
          totalVisits: 0,
          totalSpentNpr: 0,
        })
        .returning();
      customerId = insertedCustomer[0].id;
    }

    const bookingRef = await generateUniqueBookingRef(tx);

    const initialPaymentStatus =
      input.paymentMethod === 'CASH' ? 'UNPAID' : 'PENDING_VERIFICATION';

    const insertedBooking = await tx
      .insert(bookings)
      .values({
        bookingRef,
        customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail || '',
        staffId: assignedStaffId,
        appointmentDate: input.appointmentDate,
        startTime: input.startTime,
        endTime,
        totalDurationMinutes,
        totalPriceNpr,
        status: 'PENDING',
        paymentMethod: input.paymentMethod,
        paymentStatus: initialPaymentStatus,
        notes: input.notes || '',
      })
      .returning();

    const createdBooking = insertedBooking[0];

    await tx.insert(bookingServices).values(
      chosenServices.map((svc) => ({
        bookingId: createdBooking.id,
        serviceId: svc.id,
        serviceName: svc.name,
        priceNpr: svc.priceNpr,
        durationMinutes: svc.durationMinutes,
      }))
    );

    const txRef = `${input.paymentMethod}-${bookingRef}-${Date.now().toString().slice(-5)}`;
    await tx.insert(payments).values({
      bookingId: createdBooking.id,
      provider: input.paymentMethod,
      amountNpr: totalPriceNpr,
      status: input.paymentMethod === 'CASH' ? 'INITIATED' : 'PENDING_VERIFICATION',
      transactionRef: txRef,
      providerPayload: {
        mode: input.paymentMethod === 'CASH' ? 'pay_at_salon' : 'nepal_sandbox_architecture',
      },
    });

    await tx.insert(notifications).values({
      type: 'BOOKING_CREATED',
      channel: 'IN_APP',
      recipient: 'Admin Desk',
      title: `New Booking ${bookingRef}`,
      message: `${input.customerName} booked ${chosenServices.map((s) => s.name).join(', ')} on ${input.appointmentDate} at ${input.startTime} NPT.`,
      isRead: false,
      status: 'SENT',
    });

    return {
      booking: createdBooking,
      services: chosenServices,
      transactionRef: txRef,
    };
  });
}

export async function rescheduleBookingTransaction(input: {
  bookingRef: string;
  appointmentDate: string;
  startTime: string;
  staffId?: number | null;
}) {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`booking:${input.appointmentDate}`}))`);

    const rows = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.bookingRef, input.bookingRef.trim().toUpperCase()))
      .limit(1);

    if (rows.length === 0) {
      throw new BookingConflictError('Booking not found.', 404);
    }

    const existing = rows[0];
    if (!['PENDING', 'APPROVED'].includes(existing.status)) {
      throw new BookingConflictError(
        `Cannot reschedule a booking that is already ${existing.status}.`,
        400
      );
    }

    // Enforce 3-hour policy before existing appointment in Asia/Kathmandu (+05:45)
    const currentApptDt = new Date(`${existing.appointmentDate}T${existing.startTime}:00+05:45`);
    const hoursUntil = (currentApptDt.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 3 && hoursUntil > -24) {
      throw new BookingConflictError(
        'Online rescheduling closes 3 hours before your scheduled appointment. Please contact the salon via WhatsApp.',
        400
      );
    }

    const items = await tx
      .select()
      .from(bookingServices)
      .where(eq(bookingServices.bookingId, existing.id));
    const serviceIds = items.map((i) => i.serviceId).filter((id): id is number => Boolean(id));

    const availability = await computeAvailabilityWithExecutor(tx, {
      date: input.appointmentDate,
      serviceIds,
      staffId: input.staffId !== undefined ? input.staffId : existing.staffId,
      excludeBookingId: existing.id,
    });

    if (availability.isPastDate) {
      throw new BookingConflictError('Please choose a current or future date (Asia/Kathmandu).', 400);
    }
    if (availability.isHoliday) {
      throw new BookingConflictError(
        `Salon is closed on ${input.appointmentDate} (${availability.holidayName || 'Holiday'}).`,
        409
      );
    }

    const matchingSlot = availability.slots.find((s) => s.time === input.startTime);
    if (!matchingSlot || !matchingSlot.available || matchingSlot.availableStaffIds.length === 0) {
      throw new BookingConflictError(
        'The requested reschedule slot is unavailable. Please select another open time.',
        409
      );
    }

    const assignedStaffId =
      input.staffId ||
      (existing.staffId && matchingSlot.availableStaffIds.includes(existing.staffId)
        ? existing.staffId
        : matchingSlot.availableStaffIds[0]);

    const startMin = timeToMinutes(input.startTime);
    const endTime = minutesToTime(startMin + existing.totalDurationMinutes);

    const overlapCheck = await checkStylistOverlap(tx, {
      staffId: assignedStaffId,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime,
      excludeBookingId: existing.id,
    });
    if (overlapCheck.conflict) {
      throw new BookingConflictError(
        'Stylist already has an overlapping appointment at that time. Please select another slot.',
        409
      );
    }

    const [updated] = await tx
      .update(bookings)
      .set({
        appointmentDate: input.appointmentDate,
        startTime: input.startTime,
        endTime,
        staffId: assignedStaffId,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, existing.id))
      .returning();

    await tx.insert(notifications).values({
      type: 'BOOKING_STATUS',
      channel: 'IN_APP',
      recipient: 'Admin Desk',
      title: `Booking Rescheduled (${existing.bookingRef})`,
      message: `${existing.customerName} moved their appointment to ${input.appointmentDate} at ${input.startTime} NPT.`,
      isRead: false,
      status: 'SENT',
    });

    return updated;
  });
}
