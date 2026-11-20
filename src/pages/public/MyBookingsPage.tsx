import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, RefreshCw, Search, User } from 'lucide-react';
import {
  useCancelCustomerBookingMutation,
  useGetAvailabilityQuery,
  useGetTeamQuery,
  useLazyLookupBookingsQuery,
  useRescheduleCustomerBookingMutation,
} from '../../api/salonApi';
import { useAppSelector } from '../../hooks/useAppStore';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import type { BookingRecord } from '../../types/salon';
import {
  formatBikramSambat,
  formatNpr,
  getKathmanduTodayIso,
} from '../../utils/nepal';
import { Button, Input, Modal, PageIntro, Select } from '../../components/ui/Primitives';
import {
  EditorialReveal,
  StaggerContainer,
  StaggerItem,
} from '../../components/ui/MotionPrimitives';

export function MyBookingsPage() {
  useDocumentMeta(
    'My Bookings',
    'Look up your appointment status, reschedule online, or cancel an upcoming reservation at The Beard Shop.'
  );

  const lang = useAppSelector((s) => s.ui.language);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

  const [triggerLookup, { data: bookings, isFetching, isError }] = useLazyLookupBookingsQuery();
  const [cancelBooking, { isLoading: cancelling }] = useCancelCustomerBookingMutation();
  const [rescheduleBooking, { isLoading: rescheduling }] = useRescheduleCustomerBookingMutation();
  const { data: team = [] } = useGetTeamQuery();

  // Cancel confirmation modal state
  const [cancelTarget, setCancelTarget] = useState<BookingRecord | null>(null);

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRecord | null>(null);
  const [newDate, setNewDate] = useState(getKathmanduTodayIso());
  const [newStaffId, setNewStaffId] = useState<number | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  const rescheduleServiceIds = (rescheduleTarget?.services || [])
    .map((s) => s.serviceId)
    .filter((id): id is number => Boolean(id));

  const { data: liveSlots, isFetching: fetchingSlots } = useGetAvailabilityQuery(
    {
      date: newDate,
      serviceIds: rescheduleServiceIds,
      staffId: newStaffId,
      excludeBookingId: rescheduleTarget?.id,
    },
    { skip: !rescheduleTarget || !newDate }
  );

  const runLastSearch = async (fallbackRef?: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      if (trimmed.toUpperCase().startsWith('TBS-')) {
        await triggerLookup({ ref: trimmed.toUpperCase() });
      } else {
        await triggerLookup({ phone: trimmed });
      }
    } else if (fallbackRef) {
      await triggerLookup({ ref: fallbackRef });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');
    setErrorFeedback('');
    const trimmed = query.trim();
    if (!trimmed) return;
    if (trimmed.toUpperCase().startsWith('TBS-')) {
      await triggerLookup({ ref: trimmed.toUpperCase() });
    } else {
      await triggerLookup({ phone: trimmed });
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setFeedback('');
    setErrorFeedback('');
    try {
      await cancelBooking({
        ref: cancelTarget.bookingRef,
        reason: 'Cancelled via My Bookings portal',
      }).unwrap();
      setFeedback(`Appointment ${cancelTarget.bookingRef} has been cancelled.`);
      const ref = cancelTarget.bookingRef;
      setCancelTarget(null);
      await runLastSearch(ref);
    } catch (err: unknown) {
      setErrorFeedback(
        (err as { data?: { error?: string } })?.data?.error || 'Unable to cancel booking.'
      );
      setCancelTarget(null);
    }
  };

  const openReschedule = (bk: BookingRecord) => {
    setRescheduleTarget(bk);
    setNewDate(bk.appointmentDate >= getKathmanduTodayIso() ? bk.appointmentDate : getKathmanduTodayIso());
    setNewStaffId(bk.staffId ?? null);
    setNewStartTime('');
    setRescheduleError('');
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget || !newStartTime) return;
    setRescheduleError('');
    setFeedback('');
    try {
      await rescheduleBooking({
        ref: rescheduleTarget.bookingRef,
        appointmentDate: newDate,
        startTime: newStartTime,
        staffId: newStaffId,
      }).unwrap();
      setFeedback(
        `Appointment ${rescheduleTarget.bookingRef} rescheduled to ${newDate} at ${newStartTime} NPT.`
      );
      const ref = rescheduleTarget.bookingRef;
      setRescheduleTarget(null);
      await runLastSearch(ref);
    } catch (err: unknown) {
      setRescheduleError(
        (err as { data?: { error?: string } })?.data?.error || 'Unable to reschedule booking.'
      );
    }
  };

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker="Client Portal · Asia/Kathmandu"
        title="Manage Your Appointments"
        subtitle="Enter your Booking Reference (for example TBS-2026-1001) or the +977 mobile number used during booking to inspect, reschedule, or cancel your reserved slot."
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <EditorialReveal>
          <form
            onSubmit={handleSearch}
            className="rounded-[4px] border border-[#E6DADC] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(42,8,16,0.04)] flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A767A]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. TBS-2026-1001 or +9779801122334"
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="primary" size="md" disabled={isFetching}>
              {isFetching ? 'Searching...' : 'Find Booking'}
            </Button>
          </form>
        </EditorialReveal>

        {feedback && (
          <div className="mt-6 rounded-[4px] border border-[#9E1F32]/30 bg-[#FAF3F4] p-4 text-sm text-[#2A0810]">
            {feedback}
          </div>
        )}

        {(errorFeedback || isError) && (
          <div className="mt-6 rounded-[4px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {errorFeedback || 'Could not look up bookings. Please check your input and try again.'}
          </div>
        )}

        {bookings && bookings.length === 0 && (
          <div className="mt-10 rounded-[4px] border border-[#E6DADC] bg-white p-12 text-center">
            <p className="font-serif text-3xl text-[#2A0810]">No appointments found</p>
            <p className="mt-2.5 text-sm text-[#5C4B4E] max-w-md mx-auto">
              Double-check your reference code or phone number, or reserve a new visit with our
              Birgunj specialists.
            </p>
            <Link to="/booking" className="mt-6 inline-block">
              <Button variant="primary">Book New Appointment</Button>
            </Link>
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <StaggerContainer className="mt-10 space-y-6">
            {bookings.map((bk) => (
              <StaggerItem key={bk.id}>
                <div className="rounded-[4px] border border-[#E6DADC] bg-white p-6 sm:p-8 shadow-[0_6px_24px_rgba(42,8,16,0.03)]">
                  <div className="flex flex-col gap-5 border-b border-[#EFE4E6] pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-xs tracking-[0.06em] text-[#8B1A2D]">
                        {bk.bookingRef}
                      </p>
                      <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-medium text-[#2A0810]">
                        {bk.customerName}
                      </h2>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#5C4B4E]">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-[#8B1A2D]" />
                          {bk.appointmentDate} ({formatBikramSambat(bk.appointmentDate, lang)})
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Clock className="h-3.5 w-3.5 text-[#8B1A2D]" />
                          {bk.startTime} – {bk.endTime} NPT
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-[#8B1A2D]" />
                          {bk.staffName}
                        </span>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[#8B1A2D]">
                        Status · {bk.status}
                      </p>
                      <p className="mt-1.5 font-mono text-lg font-semibold text-[#2A0810] tabular-nums">
                        {formatNpr(bk.totalPriceNpr, lang)}
                      </p>
                      <p className="mt-0.5 text-xs text-[#7D6C70]">
                        {bk.paymentMethod} · {bk.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs leading-relaxed text-[#5C4B4E]">
                      <span className="font-medium text-[#2A0810] mr-1.5">Services:</span>
                      {(bk.services || []).map((s) => s.serviceName).join(' · ')}
                    </div>
                    {['PENDING', 'APPROVED'].includes(bk.status) && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openReschedule(bk)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancelling}
                          onClick={() => setCancelTarget(bk)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Reschedule Modal with Live Asia/Kathmandu Slot Check */}
      <Modal
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title={`Reschedule ${rescheduleTarget?.bookingRef || ''}`}
        maxWidth="max-w-lg"
      >
        {rescheduleTarget && (
          <div className="space-y-4">
            {rescheduleError && (
              <div className="rounded-[4px] border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {rescheduleError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
                  New Date (NPT)
                </label>
                <Input
                  type="date"
                  min={getKathmanduTodayIso()}
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setNewStartTime('');
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A3B3E] mb-1">
                  Specialist
                </label>
                <Select
                  value={newStaffId ?? ''}
                  onChange={(e) => {
                    setNewStaffId(e.target.value ? Number(e.target.value) : null);
                    setNewStartTime('');
                  }}
                >
                  <option value="">Any Available Specialist</option>
                  {team
                    .filter((m) => m.isAvailable)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#4A3B3E] mb-2">
                Available Time Slots ({rescheduleTarget.totalDurationMinutes} min · NPT)
              </p>
              {fetchingSlots ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-9 rounded-[4px] bg-[#EFE1E4]/80 animate-pulse" />
                  ))}
                </div>
              ) : liveSlots?.isHoliday ? (
                <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-[4px] border border-amber-200">
                  Salon is closed for {liveSlots.holidayName}. Please choose another date.
                </p>
              ) : (liveSlots?.slots || []).filter((s) => s.available).length === 0 ? (
                <p className="text-xs text-[#6A5A5D] bg-[#FAF8F4] p-4 rounded-[4px] border border-[#E6DADC]">
                  No open slots available on {newDate}. Try another date or specialist.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {(liveSlots?.slots || []).map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setNewStartTime(slot.time)}
                      className={`rounded-[4px] border px-2.5 py-2 font-mono text-xs tabular-nums transition-colors ${
                        !slot.available
                          ? 'border-[#EFE4E6] bg-[#F7F2F3] text-[#BBA7AB] line-through cursor-not-allowed'
                          : newStartTime === slot.time
                            ? 'border-[#6B1222] bg-[#6B1222] text-[#FAF8F4] cursor-pointer'
                            : 'border-[#E6DADC] bg-white text-[#2A0810] hover:border-[#9E1F32] cursor-pointer'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
              <Button variant="outline" size="sm" onClick={() => setRescheduleTarget(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newStartTime || rescheduling}
                onClick={handleConfirmReschedule}
              >
                {rescheduling ? 'Rescheduling...' : 'Confirm New Slot'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel Appointment"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5C4B4E] leading-relaxed">
            Are you sure you want to cancel reservation{' '}
            <strong className="font-mono text-[#2A0810]">{cancelTarget?.bookingRef}</strong> on{' '}
            <strong className="font-mono text-[#2A0810]">{cancelTarget?.appointmentDate}</strong>{' '}
            at <strong className="font-mono text-[#2A0810]">{cancelTarget?.startTime} NPT</strong>?
          </p>
          <div className="flex justify-end gap-2 border-t border-[#E6DADC] pt-4">
            <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
              Keep Booking
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={cancelling}
              onClick={handleConfirmCancel}
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
