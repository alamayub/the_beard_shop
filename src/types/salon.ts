export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'CUSTOMER';

export interface AuthUser {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface SalonSettings {
  id: number;
  businessName: string;
  tagline: string;
  taglineNe: string;
  address: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsappNumber: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  googleMapsUrl: string;
  openingHours: OpeningHour[];
  cancellationPolicy: string;
  currencyCode: string;
  timezone: string;
  showBikramSambat: boolean;
}

export interface ServiceCategory {
  id: number;
  name: string;
  nameNe: string;
  slug: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface SalonService {
  id: number;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  name: string;
  nameNe: string;
  slug: string;
  description: string;
  descriptionNe: string;
  priceNpr: number;
  durationMinutes: number;
  imageUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  isDemoPrice: boolean;
  sortOrder: number;
}

export interface StaffSchedule {
  id?: number;
  staffId?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export interface StaffBreak {
  id: number;
  staffId: number;
  breakDate: string | null;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface StaffMember {
  id: number;
  fullName: string;
  roleTitle: string;
  bio: string;
  experienceYears: number;
  specializations: string[];
  avatarUrl: string;
  isAvailable: boolean;
  isDemoProfile: boolean;
  sortOrder: number;
  schedules?: StaffSchedule[];
  breaks?: StaffBreak[];
}

export interface GalleryItem {
  id: number;
  title: string;
  description: string;
  category:
    | 'MENS_HAIRSTYLE'
    | 'WOMENS_HAIRSTYLE'
    | 'HAIR_COLORING'
    | 'MAKEUP'
    | 'INTERIOR'
    | 'BEFORE_AFTER';
  imageUrl: string;
  beforeImageUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface SocialPost {
  id: number;
  platform: 'INSTAGRAM' | 'FACEBOOK';
  mediaType: 'IMAGE' | 'REEL';
  caption: string;
  imageUrl: string;
  postUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImageUrl: string;
  authorName: string;
  readTimeMinutes: number;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string;
}

export interface SalonOffer {
  id: number;
  title: string;
  titleNe: string;
  festivalTag: string;
  description: string;
  discountText: string;
  promoCode: string;
  validFrom: string;
  validUntil: string;
  imageUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface SalonReview {
  id: number;
  customerName: string;
  serviceName: string;
  rating: number;
  comment: string;
  isDemoReview: boolean;
  isPublished: boolean;
  createdAt: string;
}

export interface SalonHoliday {
  id: number;
  name: string;
  date: string;
  bsDate: string;
  description: string;
  isClosed: boolean;
}

export interface BookingServiceItem {
  id: number;
  bookingId: number;
  serviceId: number | null;
  serviceName: string;
  priceNpr: number;
  durationMinutes: number;
}

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'NO_SHOW';

export type PaymentMethod = 'CASH' | 'ESEWA' | 'KHALTI' | 'FONEPAY';
export type PaymentStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface BookingRecord {
  id: number;
  bookingRef: string;
  customerId: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  staffId: number | null;
  staffName?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  totalPriceNpr: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string;
  cancellationReason: string;
  createdAt: string;
  services?: BookingServiceItem[];
}

export interface CustomerRecord {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  totalVisits: number;
  totalSpentNpr: number;
  createdAt: string;
  bookings?: BookingRecord[];
}

export interface AvailabilityResponse {
  date: string;
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

export interface BootstrapResponse {
  settings: SalonSettings | null;
  categories: ServiceCategory[];
  services: SalonService[];
  team: StaffMember[];
  gallery: GalleryItem[];
  socialPosts: SocialPost[];
  blogPosts: BlogPost[];
  offers: SalonOffer[];
  reviews: SalonReview[];
  holidays: SalonHoliday[];
}

export interface AdminDashboardData {
  kpis: {
    totalBookings: number;
    todaysBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalCustomers: number;
    monthlyRevenueNpr: number;
    totalRevenueNpr: number;
  };
  statusChart: Array<{ status: string; count: number }>;
  trendsChart: Array<{ date: string; bookings: number; revenueNpr: number }>;
  popularServices: Array<{ name: string; bookings: number; revenueNpr: number }>;
  paymentBreakdown?: Array<{ provider: string; count: number; amountNpr: number }>;
  recentBookings: BookingRecord[];
}
