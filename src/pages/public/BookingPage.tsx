import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  MessageCircle,
  User,
} from 'lucide-react';
import {
  useCreateBookingMutation,
  useGetAvailabilityQuery,
  useGetCategoriesQuery,
  useGetHolidaysQuery,
  useGetServicesQuery,
  useGetSettingsQuery,
  useGetTeamQuery,
  useInitiatePaymentMutation,
} from '../../api/salonApi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { clearBookingPreselection } from '../../store/slices/uiSlice';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import type { BookingRecord, PaymentMethod, SalonService } from '../../types/salon';
import {
  buildWhatsAppLink,
  formatBikramSambat,
  formatNpr,
  getKathmanduDateOffsetIso,
  getKathmanduNowTimeLabel,
  getKathmanduTodayIso,
} from '../../utils/nepal';
import {
  Button,
  Input,
  PageIntro,
  SafeImage,
  Textarea,
} from '../../components/ui/Primitives';
import { LUXURY_EASE } from '../../components/ui/MotionPrimitives';

const customerDetailsSchema = z.object({
  customerName: z.string().trim().min(2, 'Please enter your full name'),
  customerPhone: z
    .string()
    .trim()
    .regex(
      /^(\+?977[-\s]?)?(9[678]\d{8}|\d{7,10})$/,
      'Enter a valid Nepal phone number (e.g. +977 98XXXXXXXX)'
    ),
  customerEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  notes: z.string().max(600).optional(),
});

type CustomerFormValues = z.infer<typeof customerDetailsSchema>;

const STEPS = [
  'Services',
  'Specialist',
  'Date',
  'Time',
  'Details',
  'Review',
  'Confirmed',
];

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string; desc: string }> = [
  { id: 'CASH', label: 'Cash at Salon', desc: 'Pay in NPR at reception after your service' },
  { id: 'ESEWA', label: 'eSewa (Sandbox Ready)', desc: 'Digital wallet checkout verified server-side' },
  { id: 'KHALTI', label: 'Khalti (Sandbox Ready)', desc: 'ePayment lookup verified on backend' },
  { id: 'FONEPAY', label: 'Fonepay QR (Ready)', desc: 'Merchant PRN verification architecture' },
];

export function BookingPage() {
  useDocumentMeta(
    'Book Appointment',
    'Reserve hair, beard grooming, facial, or party makeup appointments online with real-time stylist availability in Birgunj, Nepal.'
  );

  const dispatch = useAppDispatch();
  const lang = useAppSelector((s) => s.ui.language);
  const preselectedServiceId = useAppSelector((s) => s.ui.preselectedServiceId);
  const preselectedStaffId = useAppSelector((s) => s.ui.preselectedStaffId);

  const panelRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(
    preselectedServiceId ? [preselectedServiceId] : []
  );
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(preselectedStaffId);
  const [appointmentDate, setAppointmentDate] = useState<string>(getKathmanduTodayIso());
  const [startTime, setStartTime] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [submitError, setSubmitError] = useState<string>('');
  const [confirmedResult, setConfirmedResult] = useState<{
    booking: BookingRecord;
    services: SalonService[];
    transactionRef: string;
  } | null>(null);
  const [paymentSessionMsg, setPaymentSessionMsg] = useState<string>('');
  const [nptClock, setNptClock] = useState(getKathmanduNowTimeLabel());

  const { data: services = [] } = useGetServicesQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: team = [] } = useGetTeamQuery();
  const { data: settings } = useGetSettingsQuery();
  const { data: holidays = [] } = useGetHolidaysQuery();

  const {
    data: availability,
    isFetching: loadingSlots,
    isError: slotError,
    refetch: refetchAvailability,
  } = useGetAvailabilityQuery(
    { date: appointmentDate, serviceIds: selectedServiceIds, staffId: selectedStaffId },
    { skip: selectedServiceIds.length === 0 || !appointmentDate }
  );

  const [createBooking, { isLoading: submitting }] = useCreateBookingMutation();
  const [initiatePayment, { isLoading: initiatingPay }] = useInitiatePaymentMutation();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '+977 ',
      customerEmail: '',
      notes: '',
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNptClock(getKathmanduNowTimeLabel()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (preselectedServiceId || preselectedStaffId) {
      dispatch(clearBookingPreselection());
    }
  }, [dispatch, preselectedServiceId, preselectedStaffId]);

  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredServices = useMemo(() => {
    if (categoryFilter === 'ALL') return services;
    return services.filter((s) => String(s.categoryId) === categoryFilter);
  }, [services, categoryFilter]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );
  const totalPriceNpr = selectedServices.reduce((s, item) => s + item.priceNpr, 0);
  const totalDurationMinutes = selectedServices.reduce((s, item) => s + item.durationMinutes, 0);
  const selectedStaff = team.find((m) => m.id === selectedStaffId) || null;

  const toggleService = (id: number) => {
    setStartTime('');
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Strictly formatted in Asia/Kathmandu timezone
  const upcomingDates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => getKathmanduDateOffsetIso(i));
  }, []);

  const handleDetailsValid = () => {
    goToStep(6);
  };

  const handleConfirmBooking = async () => {
    setSubmitError('');
    const details = getValues();
    try {
      const res = await createBooking({
        serviceIds: selectedServiceIds,
        staffId: selectedStaffId,
        appointmentDate,
        startTime,
        customerName: details.customerName,
        customerPhone: details.customerPhone,
        customerEmail: details.customerEmail || '',
        notes: details.notes || '',
        paymentMethod,
      }).unwrap();
      setConfirmedResult(res);
      goToStep(7);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ||
        'Unable to confirm booking. Please check slot availability and try again.';
      setSubmitError(msg);
      refetchAvailability();
    }
  };

  const handleInitiateSandboxPayment = async () => {
    if (!confirmedResult) return;
    try {
      const res = await initiatePayment({
        bookingRef: confirmedResult.booking.bookingRef,
        provider: confirmedResult.booking.paymentMethod,
      }).unwrap();
      setPaymentSessionMsg(res.message);
    } catch {
      setPaymentSessionMsg('Could not initiate payment session. Please try again.');
    }
  };

  return (
    <div className="bg-[#FAF8F4]">
      <PageIntro
        kicker={`Online Reservation · Asia/Kathmandu (${nptClock} NPT)`}
        title="Reserve Your Chair"
        subtitle="Real-time stylist availability, conflict-proof scheduling in Nepal Time, transparent NPR totals, and instant confirmation."
      />

      <div ref={panelRef} className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Mobile Progress Summary */}
        <div className="mb-6 flex items-center justify-between rounded-[4px] border border-[#E6DADC] bg-white px-4 py-3.5 sm:hidden">
          <div>
            <p className="font-mono text-[11px] text-[#8B1A2D] tabular-nums">
              Step {step} of {STEPS.length}
            </p>
            <p className="font-serif text-lg font-medium text-[#2A0810]">{STEPS[step - 1]}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#7D6C70] tabular-nums">
              {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} ·{' '}
              {totalDurationMinutes}m
            </p>
            <p className="font-mono text-sm font-semibold text-[#2A0810] tabular-nums">
              {formatNpr(totalPriceNpr, lang)}
            </p>
          </div>
        </div>

        {/* Luxury Interactive Stepper */}
        <div className="relative border-b border-[#E6DADC] pb-6">
          <div className="mb-4 h-[2px] w-full overflow-hidden bg-[#EFE1E4]">
            <motion.div
              className="h-full bg-[#9E1F32]"
              initial={false}
              animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.35, ease: LUXURY_EASE }}
            />
          </div>
          <ol className="grid grid-cols-7 gap-2">
            {STEPS.map((label, idx) => {
              const num = idx + 1;
              const active = step === num;
              const completed = step > num && step < 7;
              return (
                <li key={label} className="flex flex-col items-start gap-1.5">
                  <button
                    type="button"
                    disabled={!completed}
                    onClick={() => completed && goToStep(num)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs transition-all duration-200 ${
                      active
                        ? 'bg-[#6B1222] text-[#FAF8F4] ring-4 ring-[#9E1F32]/20'
                        : completed
                          ? 'bg-[#9E1F32] text-[#FAF8F4] cursor-pointer hover:bg-[#B8293E]'
                          : 'bg-[#EFE1E4] text-[#7D6C70] cursor-default'
                    }`}
                  >
                    {completed ? <Check className="h-3.5 w-3.5" /> : num}
                  </button>
                  <span
                    className={`hidden sm:block text-xs whitespace-nowrap ${
                      active ? 'font-semibold text-[#6B1222]' : 'text-[#7D6C70]'
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Interactive Step Panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: LUXURY_EASE }}
                className="rounded-[4px] border border-[#E6DADC] bg-white p-6 sm:p-9"
              >
                {/* STEP 1: SELECT SERVICES */}
                {step === 1 && (
                  <div>
                    <h2 className="font-serif text-2xl text-[#2A0810]">
                      Step 1. Select Your Treatments
                    </h2>
                    <p className="mt-1 text-sm text-[#5C4B4E]">
                      Choose one or more services. Duration and starting NPR totals calculate
                      automatically.
                    </p>

                    {categories.length > 0 && (
                      <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        <button
                          type="button"
                          onClick={() => setCategoryFilter('ALL')}
                          className={`rounded-[4px] px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            categoryFilter === 'ALL'
                              ? 'bg-[#6B1222] text-[#FAF8F4]'
                              : 'bg-[#F5EAEB] text-[#5C4B4E] hover:text-[#6B1222]'
                          }`}
                        >
                          All Services
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategoryFilter(String(cat.id))}
                            className={`rounded-[4px] px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                              categoryFilter === String(cat.id)
                                ? 'bg-[#6B1222] text-[#FAF8F4]'
                                : 'bg-[#F5EAEB] text-[#5C4B4E] hover:text-[#6B1222]'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 space-y-3">
                      {filteredServices.map((svc) => {
                        const chosen = selectedServiceIds.includes(svc.id);
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => toggleService(svc.id)}
                            className={`flex w-full items-center justify-between gap-4 rounded-[4px] border p-4 text-left transition-colors cursor-pointer ${
                              chosen
                                ? 'border-[#6B1222] bg-[#FAF3F4]'
                                : 'border-[#E6DADC] bg-white hover:border-[#9E1F32]'
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="h-14 w-16 shrink-0 overflow-hidden rounded-[3px] bg-[#EFE1E4]">
                                <SafeImage
                                  src={svc.imageUrl}
                                  alt={svc.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-[#2A0810] truncate">
                                  {lang === 'ne' && svc.nameNe ? svc.nameNe : svc.name}
                                </p>
                                <p className="text-xs text-[#7D6C70] mt-0.5 tabular-nums">
                                  {svc.durationMinutes} min · {svc.categoryName || 'Treatment'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="font-mono text-sm font-medium text-[#2A0810] tabular-nums">
                                {formatNpr(svc.priceNpr, lang)}
                              </span>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-[3px] border ${
                                  chosen
                                    ? 'border-[#6B1222] bg-[#6B1222] text-[#FAF8F4]'
                                    : 'border-[#CBB6BA]'
                                }`}
                              >
                                {chosen && <Check className="h-3.5 w-3.5" />}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-8 flex justify-end">
                      <Button
                        variant="primary"
                        disabled={selectedServiceIds.length === 0}
                        onClick={() => goToStep(2)}
                      >
                        Choose Specialist <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: SELECT STYLIST */}
                {step === 2 && (
                  <div>
                    <h2 className="font-serif text-2xl text-[#2A0810]">
                      Step 2. Choose Your Specialist
                    </h2>
                    <p className="mt-1 text-sm text-[#5C4B4E]">
                      Select a preferred specialist or allow us to pair you with the earliest
                      available artisan.
                    </p>
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(null);
                          setStartTime('');
                        }}
                        className={`flex items-center gap-4 rounded-[4px] border p-4 text-left cursor-pointer transition-colors ${
                          selectedStaffId === null
                            ? 'border-[#6B1222] bg-[#FAF3F4]'
                            : 'border-[#E6DADC] hover:border-[#9E1F32]'
                        }`}
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6B1222] text-[#FAF8F4]">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#2A0810]">
                            Any Available Specialist
                          </p>
                          <p className="text-xs text-[#7D6C70] mt-0.5">
                            Maximum time slot flexibility
                          </p>
                        </div>
                      </button>

                      {team
                        .filter((m) => m.isAvailable)
                        .map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setSelectedStaffId(member.id);
                              setStartTime('');
                            }}
                            className={`flex items-center gap-4 rounded-[4px] border p-4 text-left cursor-pointer transition-colors ${
                              selectedStaffId === member.id
                                ? 'border-[#6B1222] bg-[#FAF3F4]'
                                : 'border-[#E6DADC] hover:border-[#9E1F32]'
                            }`}
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#EFE1E4]">
                              <SafeImage
                                src={member.avatarUrl}
                                alt={member.fullName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-[#2A0810] truncate">
                                {member.fullName}
                              </p>
                              <p className="text-xs text-[#8B1A2D] truncate">{member.roleTitle}</p>
                              <p className="text-[11px] text-[#7D6C70] mt-0.5 truncate">
                                {(member.specializations || []).slice(0, 2).join(' · ')}
                              </p>
                            </div>
                          </button>
                        ))}
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <Button variant="outline" onClick={() => goToStep(1)}>
                        <ChevronLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button variant="primary" onClick={() => goToStep(3)}>
                        Select Date <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: SELECT DATE */}
                {step === 3 && (
                  <div>
                    <h2 className="font-serif text-2xl text-[#2A0810]">
                      Step 3. Select Appointment Date
                    </h2>
                    <p className="mt-1 text-sm text-[#5C4B4E]">
                      All dates follow Nepal Time (Asia/Kathmandu) with Bikram Sambat reference.
                    </p>

                    <div className="mt-6">
                      <label className="block text-xs font-medium text-[#5C4B4E] mb-2">
                        Quick 14-Day Calendar (Asia/Kathmandu)
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {upcomingDates.map((iso) => {
                          const dt = new Date(`${iso}T12:00:00+05:45`);
                          const holiday = holidays.find((h) => h.date === iso && h.isClosed);
                          const selected = appointmentDate === iso;
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => {
                                setAppointmentDate(iso);
                                setStartTime('');
                              }}
                              className={`rounded-[4px] border p-3 text-left transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#6B1222] bg-[#6B1222] text-[#FAF8F4]'
                                  : holiday
                                    ? 'border-red-200 bg-red-50/70 text-red-900'
                                    : 'border-[#E6DADC] bg-white hover:border-[#9E1F32]'
                              }`}
                            >
                              <p
                                className={`text-[11px] ${
                                  selected ? 'text-[#F0B6BF]' : 'text-[#7D6C70]'
                                }`}
                              >
                                {dt.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  timeZone: 'Asia/Kathmandu',
                                })}
                              </p>
                              <p className="font-mono text-sm font-medium mt-0.5 tabular-nums">
                                {dt.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  timeZone: 'Asia/Kathmandu',
                                })}
                              </p>
                              <p
                                className={`text-[10px] mt-1 truncate ${
                                  selected ? 'text-[#E8D2D6]' : 'text-[#7D6C70]'
                                }`}
                              >
                                {holiday ? holiday.name : formatBikramSambat(iso, lang)}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6">
                        <label
                          htmlFor="custom-date"
                          className="block text-xs font-medium text-[#5C4B4E] mb-1.5"
                        >
                          Or choose any future date
                        </label>
                        <Input
                          id="custom-date"
                          type="date"
                          min={getKathmanduTodayIso()}
                          value={appointmentDate}
                          onChange={(e) => {
                            setAppointmentDate(e.target.value);
                            setStartTime('');
                          }}
                          className="max-w-xs"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                      <Button variant="outline" onClick={() => goToStep(2)}>
                        <ChevronLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button
                        variant="primary"
                        disabled={!appointmentDate}
                        onClick={() => goToStep(4)}
                      >
                        View Live Time Slots <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 4: SELECT AVAILABLE TIME */}
                {step === 4 && (
                  <div>
                    <h2 className="font-serif text-2xl text-[#2A0810]">
                      Step 4. Choose Available Time (NPT)
                    </h2>
                    <p className="mt-1 text-sm text-[#5C4B4E]">
                      Live slots computed from stylist schedules, breaks, current Nepal time, and
                      existing appointments for{' '}
                      <span className="font-mono font-medium text-[#2A0810]">
                        {appointmentDate}
                      </span>{' '}
                      ({formatBikramSambat(appointmentDate, lang)}).
                    </p>

                    {loadingSlots ? (
                      <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="h-11 rounded-[4px] bg-[#EFE1E4]/75 animate-pulse" />
                        ))}
                      </div>
                    ) : slotError ? (
                      <div className="mt-6 rounded-[4px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        Unable to fetch live availability right now. Please try another date.
                      </div>
                    ) : availability?.isHoliday ? (
                      <div className="mt-6 rounded-[4px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                        The salon is closed on <strong>{appointmentDate}</strong> in observance of{' '}
                        <strong>{availability.holidayName}</strong>. Please choose another date.
                      </div>
                    ) : (availability?.slots || []).filter((s) => s.available).length === 0 ? (
                      <div className="mt-6 rounded-[4px] border border-[#E6DADC] bg-[#FAF8F4] p-6 text-center text-sm text-[#5C4B4E]">
                        No open slots remain for {totalDurationMinutes} minutes on this date in
                        Asia/Kathmandu time. Please select another day or choose “Any Available
                        Specialist”.
                      </div>
                    ) : (
                      <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                        {(availability?.slots || []).map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setStartTime(slot.time)}
                            className={`rounded-[4px] border px-3 py-2.5 font-mono text-sm tabular-nums transition-colors ${
                              !slot.available
                                ? 'border-[#EFE4E6] bg-[#F7F2F3] text-[#BBA7AB] line-through cursor-not-allowed'
                                : startTime === slot.time
                                  ? 'border-[#6B1222] bg-[#6B1222] text-[#FAF8F4] cursor-pointer'
                                  : 'border-[#E6DADC] bg-white text-[#2A0810] hover:border-[#9E1F32] cursor-pointer'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-8 flex items-center justify-between">
                      <Button variant="outline" onClick={() => goToStep(3)}>
                        <ChevronLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button
                        variant="primary"
                        disabled={!startTime}
                        onClick={() => goToStep(5)}
                      >
                        Customer Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 5: CUSTOMER DETAILS & PAYMENT METHOD */}
                {step === 5 && (
                  <form onSubmit={handleSubmit(handleDetailsValid)} className="space-y-6">
                    <div>
                      <h2 className="font-serif text-2xl text-[#2A0810]">
                        Step 5. Your Contact & Payment Preference
                      </h2>
                      <p className="mt-1 text-sm text-[#5C4B4E]">
                        We use your +977 Nepal mobile number to issue your booking reference and
                        WhatsApp updates.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="customerName"
                          className="block text-xs font-medium text-[#5C4B4E] mb-1.5"
                        >
                          Full Name *
                        </label>
                        <Input
                          id="customerName"
                          placeholder="e.g. Aarav Sah"
                          {...register('customerName')}
                        />
                        {errors.customerName && (
                          <p className="mt-1 text-xs text-red-700">{errors.customerName.message}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="customerPhone"
                          className="block text-xs font-medium text-[#5C4B4E] mb-1.5"
                        >
                          Nepal Mobile / WhatsApp Number *
                        </label>
                        <Input
                          id="customerPhone"
                          placeholder="+977 98XXXXXXXX"
                          {...register('customerPhone')}
                        />
                        {errors.customerPhone && (
                          <p className="mt-1 text-xs text-red-700">
                            {errors.customerPhone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="customerEmail"
                        className="block text-xs font-medium text-[#5C4B4E] mb-1.5"
                      >
                        Email Address (Optional)
                      </label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="you@example.com"
                        {...register('customerEmail')}
                      />
                      {errors.customerEmail && (
                        <p className="mt-1 text-xs text-red-700">{errors.customerEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-xs font-medium text-[#5C4B4E] mb-1.5"
                      >
                        Styling Notes or Special Requests (Optional)
                      </label>
                      <Textarea
                        id="notes"
                        placeholder="Allergies, preferred reference style, sensitivity notes..."
                        {...register('notes')}
                      />
                    </div>

                    <div className="border-t border-[#E6DADC] pt-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#5C4B4E] mb-3">
                        Preferred Payment Method (NPR)
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {PAYMENT_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPaymentMethod(opt.id)}
                            className={`rounded-[4px] border p-3.5 text-left transition-colors cursor-pointer ${
                              paymentMethod === opt.id
                                ? 'border-[#6B1222] bg-[#FAF3F4]'
                                : 'border-[#E6DADC] hover:border-[#9E1F32]'
                            }`}
                          >
                            <p className="text-sm font-medium text-[#2A0810]">{opt.label}</p>
                            <p className="text-xs text-[#7D6C70] mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => goToStep(4)}>
                        <ChevronLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button type="submit" variant="primary">
                        Review Reservation <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}

                {/* STEP 6: REVIEW BOOKING */}
                {step === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-serif text-2xl text-[#2A0810]">
                        Step 6. Review & Confirm
                      </h2>
                      <p className="mt-1 text-sm text-[#5C4B4E]">
                        Verify your selected services, schedule, and cancellation terms before
                        submitting.
                      </p>
                    </div>

                    {submitError && (
                      <div className="flex items-start gap-2.5 rounded-[4px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <dl className="divide-y divide-[#E6DADC] border-y border-[#E6DADC] text-sm">
                      <div className="py-3.5 flex justify-between gap-4">
                        <dt className="text-[#7D6C70]">Client</dt>
                        <dd className="font-medium text-[#2A0810] text-right">
                          {getValues('customerName')} · {getValues('customerPhone')}
                        </dd>
                      </div>
                      <div className="py-3.5 flex justify-between gap-4">
                        <dt className="text-[#7D6C70]">Date & Time (NPT)</dt>
                        <dd className="font-mono font-medium text-[#2A0810] text-right tabular-nums">
                          {appointmentDate} ({formatBikramSambat(appointmentDate, lang)}) at{' '}
                          {startTime}
                        </dd>
                      </div>
                      <div className="py-3.5 flex justify-between gap-4">
                        <dt className="text-[#7D6C70]">Specialist</dt>
                        <dd className="font-medium text-[#2A0810]">
                          {selectedStaff ? selectedStaff.fullName : 'Any Available Specialist'}
                        </dd>
                      </div>
                      <div className="py-3.5 flex justify-between gap-4">
                        <dt className="text-[#7D6C70]">Payment Method</dt>
                        <dd className="font-medium text-[#2A0810]">{paymentMethod}</dd>
                      </div>
                      <div className="py-3.5 flex justify-between gap-4">
                        <dt className="text-[#7D6C70]">Estimated Total</dt>
                        <dd className="font-mono text-lg font-semibold text-[#6B1222] tabular-nums">
                          {formatNpr(totalPriceNpr, lang)} ({totalDurationMinutes} min)
                        </dd>
                      </div>
                    </dl>

                    <p className="text-xs leading-relaxed text-[#5C4B4E]">
                      Cancellation Rule: {settings?.cancellationPolicy}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <Button variant="outline" onClick={() => goToStep(5)}>
                        <ChevronLeft className="h-4 w-4" /> Edit Details
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        disabled={submitting}
                        onClick={handleConfirmBooking}
                      >
                        {submitting ? 'Confirming Reservation...' : 'Confirm Appointment'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 7: CONFIRMATION */}
                {step === 7 && confirmedResult && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-[#2A0810]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6B1222] text-[#FAF8F4]">
                        <Check className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#8B1A2D]">
                          Reservation Recorded
                        </p>
                        <h2 className="font-serif text-3xl text-[#2A0810]">
                          Booking Reference: {confirmedResult.booking.bookingRef}
                        </h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#5C4B4E]">
                      Thank you, <strong>{confirmedResult.booking.customerName}</strong>. Your
                      appointment is registered for{' '}
                      <span className="font-mono text-[#2A0810]">
                        {confirmedResult.booking.appointmentDate}
                      </span>{' '}
                      at{' '}
                      <span className="font-mono text-[#2A0810]">
                        {confirmedResult.booking.startTime}–{confirmedResult.booking.endTime} NPT
                      </span>{' '}
                      (Status: <strong>{confirmedResult.booking.status}</strong>).
                    </p>

                    {confirmedResult.booking.paymentMethod !== 'CASH' && (
                      <div className="rounded-[4px] border border-[#E6DADC] bg-[#FAF8F4] p-5 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#2A0810]">
                          <CreditCard className="h-4 w-4 text-[#8B1A2D]" />
                          <span>
                            {confirmedResult.booking.paymentMethod} Sandbox Payment Verification
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-[#5C4B4E]">
                          {paymentSessionMsg ||
                            `Your booking is held as Pending Verification. Click below to generate a server-signed ${confirmedResult.booking.paymentMethod} sandbox session.`}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={initiatingPay}
                          onClick={handleInitiateSandboxPayment}
                        >
                          {initiatingPay
                            ? 'Preparing Sandbox Payload...'
                            : `Prepare ${confirmedResult.booking.paymentMethod} Checkout`}
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2">
                      <a
                        href={buildWhatsAppLink(
                          settings?.whatsappNumber || '9779800000000',
                          `Namaste! My booking reference is ${confirmedResult.booking.bookingRef} on ${confirmedResult.booking.appointmentDate} at ${confirmedResult.booking.startTime} NPT for ${confirmedResult.services.map((s) => s.name).join(', ')}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="gold">
                          <MessageCircle className="h-4 w-4" /> Send WhatsApp Confirmation
                        </Button>
                      </a>
                      <Link to="/my-bookings">
                        <Button variant="outline">Manage in My Bookings</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Live Booking Summary Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 rounded-[4px] border border-[#E6DADC] bg-white p-6 sm:p-7 space-y-5">
            <h3 className="font-serif text-2xl font-medium text-[#2A0810] border-b border-[#E6DADC] pb-3.5">
              Reservation Summary
            </h3>

            {selectedServices.length === 0 ? (
              <p className="text-xs leading-relaxed text-[#7D6C70]">
                Select one or more treatments to begin building your visit.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {selectedServices.map((svc) => (
                  <li key={svc.id} className="flex justify-between gap-3">
                    <span className="text-[#2A1216] leading-snug">{svc.name}</span>
                    <span className="font-mono text-xs font-medium text-[#2A0810] tabular-nums shrink-0">
                      {formatNpr(svc.priceNpr, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2.5 border-t border-[#E6DADC] pt-4 text-xs text-[#5C4B4E]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#8B1A2D]" /> Specialist
                </span>
                <span className="font-medium text-[#2A0810]">
                  {selectedStaff ? selectedStaff.fullName.split(' (')[0] : 'Any Available'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#8B1A2D]" /> Date
                </span>
                <span className="font-mono text-[#2A0810] tabular-nums">{appointmentDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#8B1A2D]" /> Time & Duration
                </span>
                <span className="font-mono text-[#2A0810] tabular-nums">
                  {startTime ? `${startTime} · ` : ''}
                  {totalDurationMinutes}m
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between border-t border-[#E6DADC] pt-4">
              <span className="text-xs tracking-[0.06em] text-[#7D6C70]">Estimated Total</span>
              <span className="font-mono text-xl font-semibold text-[#6B1222] tabular-nums">
                {formatNpr(totalPriceNpr, lang)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
