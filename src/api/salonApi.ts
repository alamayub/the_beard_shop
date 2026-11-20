import { baseApi } from './baseApi';
import {
  FALLBACK_BLOG_POSTS,
  FALLBACK_BOOTSTRAP,
  FALLBACK_CATEGORIES,
  FALLBACK_HOLIDAYS,
  FALLBACK_OFFERS,
  FALLBACK_REVIEWS,
  FALLBACK_SERVICES,
  FALLBACK_SETTINGS,
  FALLBACK_SOCIAL_POSTS,
  FALLBACK_TEAM,
  computeFallbackAvailability,
  getFallbackBlogBySlug,
  getFallbackGallery,
  getFallbackServiceBySlug,
  getFallbackServices,
} from '../data/fallbackSalonData';
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
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/bootstrap');
        if (res.error || !res.data) {
          return { data: FALLBACK_BOOTSTRAP };
        }
        const live = res.data as BootstrapResponse;
        return {
          data: {
            settings: live.settings || FALLBACK_SETTINGS,
            categories: live.categories?.length ? live.categories : FALLBACK_CATEGORIES,
            services: live.services?.length ? live.services : FALLBACK_SERVICES,
            team: live.team?.length ? live.team : FALLBACK_TEAM,
            gallery: live.gallery?.length ? live.gallery : FALLBACK_BOOTSTRAP.gallery,
            socialPosts: live.socialPosts?.length ? live.socialPosts : FALLBACK_SOCIAL_POSTS,
            blogPosts: live.blogPosts?.length ? live.blogPosts : FALLBACK_BLOG_POSTS,
            offers: live.offers?.length ? live.offers : FALLBACK_OFFERS,
            reviews: live.reviews?.length ? live.reviews : FALLBACK_REVIEWS,
            holidays: live.holidays?.length ? live.holidays : FALLBACK_HOLIDAYS,
          },
        };
      },
      providesTags: ['Bootstrap', 'Settings', 'Services', 'Categories', 'Team', 'Gallery', 'Offers', 'Reviews'],
    }),
    getSettings: builder.query<SalonSettings | null, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/settings');
        if (res.error || !res.data) {
          return { data: FALLBACK_SETTINGS };
        }
        return { data: res.data as SalonSettings };
      },
      providesTags: ['Settings'],
    }),
    getCategories: builder.query<ServiceCategory[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/categories');
        const rows = !res.error && Array.isArray(res.data) ? (res.data as ServiceCategory[]) : [];
        return { data: rows.length > 0 ? rows : FALLBACK_CATEGORIES };
      },
      providesTags: ['Categories'],
    }),
    getServices: builder.query<SalonService[], { category?: string; q?: string } | void>({
      async queryFn(params, _api, _extraOptions, fetchWithBQ) {
        const search = new URLSearchParams();
        if (params?.category) search.set('category', params.category);
        if (params?.q) search.set('q', params.q);
        const qs = search.toString();
        const res = await fetchWithBQ(`/services${qs ? `?${qs}` : ''}`);
        if (res.error || !Array.isArray(res.data)) {
          return { data: getFallbackServices(params || undefined) };
        }
        const rows = res.data as SalonService[];
        // Only fall back when unfiltered request is empty or backend failed; preserve empty search hits when DB has data
        if (rows.length === 0 && !params?.q && (!params?.category || params.category === 'all')) {
          return { data: getFallbackServices(params || undefined) };
        }
        return { data: rows };
      },
      providesTags: ['Services'],
    }),
    getServiceBySlug: builder.query<SalonService, string>({
      async queryFn(slug, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ(`/services/${slug}`);
        if (!res.error && res.data) {
          return { data: res.data as SalonService };
        }
        const fallback = getFallbackServiceBySlug(slug);
        if (fallback) return { data: fallback };
        return { error: res.error || { status: 404, data: { error: 'Service not found' } } };
      },
      providesTags: ['Services'],
    }),
    getGallery: builder.query<GalleryItem[], string | void>({
      async queryFn(category, _api, _extraOptions, fetchWithBQ) {
        const url = `/gallery${category && category !== 'ALL' ? `?category=${category}` : ''}`;
        const res = await fetchWithBQ(url);
        if (res.error || !Array.isArray(res.data)) {
          return { data: getFallbackGallery(category || undefined) };
        }
        const rows = res.data as GalleryItem[];
        if (rows.length === 0 && (!category || category === 'ALL')) {
          return { data: getFallbackGallery(category || undefined) };
        }
        return { data: rows };
      },
      providesTags: ['Gallery'],
    }),
    getTeam: builder.query<StaffMember[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/team');
        const rows = !res.error && Array.isArray(res.data) ? (res.data as StaffMember[]) : [];
        return { data: rows.length > 0 ? rows : FALLBACK_TEAM };
      },
      providesTags: ['Team'],
    }),
    getSocialPosts: builder.query<SocialPost[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/social-posts');
        const rows = !res.error && Array.isArray(res.data) ? (res.data as SocialPost[]) : [];
        return { data: rows.length > 0 ? rows : FALLBACK_SOCIAL_POSTS };
      },
      providesTags: ['SocialPosts'],
    }),
    getBlogPosts: builder.query<BlogPost[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/blog');
        const rows = !res.error && Array.isArray(res.data) ? (res.data as BlogPost[]) : [];
        return { data: rows.length > 0 ? rows : FALLBACK_BLOG_POSTS };
      },
      providesTags: ['Blog'],
    }),
    getBlogBySlug: builder.query<BlogPost, string>({
      async queryFn(slug, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ(`/blog/${slug}`);
        if (!res.error && res.data) {
          return { data: res.data as BlogPost };
        }
        const fallback = getFallbackBlogBySlug(slug);
        if (fallback) return { data: fallback };
        return { error: res.error || { status: 404, data: { error: 'Article not found' } } };
      },
      providesTags: ['Blog'],
    }),
    getOffers: builder.query<SalonOffer[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/offers');
        const rows = !res.error && Array.isArray(res.data) ? (res.data as SalonOffer[]) : [];
        return { data: rows.length > 0 ? rows : FALLBACK_OFFERS };
      },
      providesTags: ['Offers'],
    }),
    getReviews: builder.query<SalonReview[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/reviews');
        const rows = !res.error && Array.isArray(res.data) ? (res.data as SalonReview[]) : [];
        return { data: rows.length > 0 ? rows : FALLBACK_REVIEWS };
      },
      providesTags: ['Reviews'],
    }),
    getHolidays: builder.query<SalonHoliday[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const res = await fetchWithBQ('/holidays');
        const rows = !res.error && Array.isArray(res.data) ? (res.data as SalonHoliday[]) : [];
        return { data: rows.length > 0 ? rows : FALLBACK_HOLIDAYS };
      },
      providesTags: ['Holidays'],
    }),
    getAvailability: builder.query<
      AvailabilityResponse,
      { date: string; serviceIds: number[]; staffId?: number | null; excludeBookingId?: number }
    >({
      async queryFn({ date, serviceIds, staffId, excludeBookingId }, _api, _extraOptions, fetchWithBQ) {
        const params = new URLSearchParams({
          date,
          serviceIds: serviceIds.join(','),
        });
        if (staffId) params.set('staffId', String(staffId));
        if (excludeBookingId) params.set('excludeBookingId', String(excludeBookingId));
        const res = await fetchWithBQ(`/bookings/availability?${params.toString()}`);
        if (res.error || !res.data) {
          return { data: computeFallbackAvailability({ date, serviceIds, staffId }) };
        }
        return { data: res.data as AvailabilityResponse };
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
