import { baseApi } from './baseApi';
import type {
  AuthUser,
  AvailabilityResponse,
  BlogPost,
  BookingRecord,
  BootstrapResponse,
  GalleryItem,
  PaymentMethod,
  SalonHoliday,
  SalonOffer,
  SalonReview,
  SalonService,
  SalonSettings,
  ServiceCategory,
  SocialPost,
  StaffMember,
} from '../types/salon';

export const publicSalonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBootstrap: builder.query<BootstrapResponse, void>({
      query: () => '/bootstrap',
      providesTags: ['Bootstrap', 'Settings', 'Services', 'Categories', 'Team', 'Gallery', 'Offers', 'Reviews'],
    }),
    getSettings: builder.query<SalonSettings | null, void>({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    getCategories: builder.query<ServiceCategory[], void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),
    getServices: builder.query<SalonService[], { category?: string; q?: string } | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.category) search.set('category', params.category);
        if (params?.q) search.set('q', params.q);
        const qs = search.toString();
        return `/services${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Services'],
    }),
    getServiceBySlug: builder.query<SalonService, string>({
      query: (slug) => `/services/${slug}`,
      providesTags: ['Services'],
    }),
    getGallery: builder.query<GalleryItem[], string | void>({
      query: (category) => `/gallery${category && category !== 'ALL' ? `?category=${category}` : ''}`,
      providesTags: ['Gallery'],
    }),
    getTeam: builder.query<StaffMember[], void>({
      query: () => '/team',
      providesTags: ['Team'],
    }),
    getSocialPosts: builder.query<SocialPost[], void>({
      query: () => '/social-posts',
      providesTags: ['SocialPosts'],
    }),
    getBlogPosts: builder.query<BlogPost[], void>({
      query: () => '/blog',
      providesTags: ['Blog'],
    }),
    getBlogBySlug: builder.query<BlogPost, string>({
      query: (slug) => `/blog/${slug}`,
      providesTags: ['Blog'],
    }),
    getOffers: builder.query<SalonOffer[], void>({
      query: () => '/offers',
      providesTags: ['Offers'],
    }),
    getReviews: builder.query<SalonReview[], void>({
      query: () => '/reviews',
      providesTags: ['Reviews'],
    }),
    getHolidays: builder.query<SalonHoliday[], void>({
      query: () => '/holidays',
      providesTags: ['Holidays'],
    }),
    getAvailability: builder.query<
      AvailabilityResponse,
      { date: string; serviceIds: number[]; staffId?: number | null; excludeBookingId?: number }
    >({
      query: ({ date, serviceIds, staffId, excludeBookingId }) => {
        const params = new URLSearchParams({
          date,
          serviceIds: serviceIds.join(','),
        });
        if (staffId) params.set('staffId', String(staffId));
        if (excludeBookingId) params.set('excludeBookingId', String(excludeBookingId));
        return `/bookings/availability?${params.toString()}`;
      },
      providesTags: ['Bookings'],
    }),
    createBooking: builder.mutation<
      { booking: BookingRecord; services: SalonService[]; transactionRef: string },
      {
        serviceIds: number[];
        staffId?: number | null;
        appointmentDate: string;
        startTime: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        notes?: string;
        paymentMethod: PaymentMethod;
      }
    >({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bookings', 'Dashboard', 'Customers', 'Notifications', 'Payments'],
    }),
    lookupBookings: builder.query<BookingRecord[], { ref?: string; phone?: string }>({
      query: ({ ref, phone }) => {
        const params = new URLSearchParams();
        if (ref) params.set('ref', ref);
        if (phone) params.set('phone', phone);
        return `/bookings/lookup?${params.toString()}`;
      },
      providesTags: ['Bookings'],
    }),
    cancelCustomerBooking: builder.mutation<BookingRecord, { ref: string; reason: string }>({
      query: ({ ref, reason }) => ({
        url: `/bookings/${ref}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Bookings', 'Dashboard', 'Notifications'],
    }),
    rescheduleCustomerBooking: builder.mutation<
      BookingRecord,
      { ref: string; appointmentDate: string; startTime: string; staffId?: number | null }
    >({
      query: ({ ref, ...body }) => ({
        url: `/bookings/${ref}/reschedule`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Bookings', 'Dashboard', 'Notifications'],
    }),
    initiatePayment: builder.mutation<
      {
        provider: string;
        sandboxUrl?: string;
        sandboxConfigured?: boolean;
        transactionRef: string;
        amountNpr: number;
        message: string;
        payload?: Record<string, unknown>;
      },
      { bookingRef: string; provider: PaymentMethod }
    >({
      query: (body) => ({
        url: '/payments/initiate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payments'],
    }),
    submitContact: builder.mutation<
      { id: number },
      { fullName: string; phone: string; email?: string; subject: string; message: string }
    >({
      query: (body) => ({
        url: '/contact',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notifications'],
    }),
    exchangeFirebaseSession: builder.mutation<
      { user: AuthUser; accessToken: string },
      { idToken: string }
    >({
      query: (body) => ({
        url: '/auth/session',
        method: 'POST',
        body,
      }),
    }),
    logoutSession: builder.mutation<{ ok: boolean }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetBootstrapQuery,
  useGetSettingsQuery,
  useGetCategoriesQuery,
  useGetServicesQuery,
  useGetServiceBySlugQuery,
  useGetGalleryQuery,
  useGetTeamQuery,
  useGetSocialPostsQuery,
  useGetBlogPostsQuery,
  useGetBlogBySlugQuery,
  useGetOffersQuery,
  useGetReviewsQuery,
  useGetHolidaysQuery,
  useGetAvailabilityQuery,
  useCreateBookingMutation,
  useLazyLookupBookingsQuery,
  useCancelCustomerBookingMutation,
  useRescheduleCustomerBookingMutation,
  useInitiatePaymentMutation,
  useSubmitContactMutation,
  useExchangeFirebaseSessionMutation,
  useLogoutSessionMutation,
} = publicSalonApi;
