import { baseApi } from './baseApi';
import type {
  AdminDashboardData,
  AuthUser,
  BlogPost,
  BookingRecord,
  CustomerRecord,
  GalleryItem,
  PaymentMethod,
  SalonHoliday,
  SalonOffer,
  SalonReview,
  SalonService,
  SalonSettings,
  ServiceCategory,
  SocialPost,
  StaffBreak,
  StaffMember,
  StaffSchedule,
} from '../types/salon';

export interface AdminPaymentRow {
  id: number;
  bookingId: number;
  bookingRef: string;
  customerName: string;
  provider: string;
  amountNpr: number;
  status: string;
  transactionRef: string;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface AdminNotificationRow {
  id: number;
  type: string;
  channel: string;
  recipient: string;
  title: string;
  message: string;
  isRead: boolean;
  status: string;
  createdAt: string;
}

export interface AdminContactMessageRow {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: 'NEW' | 'REPLIED' | 'ARCHIVED';
  createdAt: string;
}

interface AdminAuditLogRow {
  id: number;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<AdminDashboardData, void>({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard', 'Bookings', 'Customers', 'Payments'],
    }),
    getAdminBookings: builder.query<BookingRecord[], { status?: string; q?: string } | void>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
        if (params?.q) sp.set('q', params.q);
        const qs = sp.toString();
        return `/admin/bookings${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Bookings'],
    }),
    createAdminBooking: builder.mutation<
      BookingRecord,
      {
        serviceIds: number[];
        staffId?: number | null;
        appointmentDate: string;
        startTime: string;
        customerName: string;
        customerPhone: string;
        customerEmail?: string;
        notes?: string;
        status?: string;
        paymentMethod?: PaymentMethod;
        paymentStatus?: string;
      }
    >({
      query: (body) => ({
        url: '/admin/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bookings', 'Dashboard', 'Customers', 'Payments', 'Notifications', 'Reports'],
    }),
    updateAdminBooking: builder.mutation<
      BookingRecord,
      {
        id: number;
        status?: string;
        paymentMethod?: PaymentMethod;
        paymentStatus?: string;
        appointmentDate?: string;
        startTime?: string;
        staffId?: number | null;
        notes?: string;
        cancellationReason?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/bookings/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Bookings', 'Dashboard', 'Customers', 'Payments', 'Reports'],
    }),
    deleteAdminBooking: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Bookings', 'Dashboard', 'Payments', 'Reports'],
    }),

    // Services & Categories
    getAdminServices: builder.query<SalonService[], void>({
      query: () => '/admin/services',
      providesTags: ['Services'],
    }),
    createAdminService: builder.mutation<SalonService, Partial<SalonService>>({
      query: (body) => ({ url: '/admin/services', method: 'POST', body }),
      invalidatesTags: ['Services', 'Bootstrap'],
    }),
    updateAdminService: builder.mutation<SalonService, { id: number; data: Partial<SalonService> }>({
      query: ({ id, data }) => ({ url: `/admin/services/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Services', 'Bootstrap'],
    }),
    deleteAdminService: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/services/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Services', 'Bootstrap'],
    }),
    getAdminCategories: builder.query<ServiceCategory[], void>({
      query: () => '/admin/categories',
      providesTags: ['Categories'],
    }),
    createAdminCategory: builder.mutation<ServiceCategory, Partial<ServiceCategory>>({
      query: (body) => ({ url: '/admin/categories', method: 'POST', body }),
      invalidatesTags: ['Categories', 'Bootstrap'],
    }),
    updateAdminCategory: builder.mutation<
      ServiceCategory,
      { id: number; data: Partial<ServiceCategory> }
    >({
      query: ({ id, data }) => ({ url: `/admin/categories/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Categories', 'Bootstrap'],
    }),
    deleteAdminCategory: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories', 'Bootstrap'],
    }),

    // Gallery
    getAdminGallery: builder.query<GalleryItem[], void>({
      query: () => '/admin/gallery',
      providesTags: ['Gallery'],
    }),
    createAdminGalleryItem: builder.mutation<GalleryItem, Partial<GalleryItem>>({
      query: (body) => ({ url: '/admin/gallery', method: 'POST', body }),
      invalidatesTags: ['Gallery', 'Bootstrap'],
    }),
    updateAdminGalleryItem: builder.mutation<GalleryItem, { id: number; data: Partial<GalleryItem> }>({
      query: ({ id, data }) => ({ url: `/admin/gallery/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Gallery', 'Bootstrap'],
    }),
    deleteAdminGalleryItem: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/gallery/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Gallery', 'Bootstrap'],
    }),

    // Team, Schedules & Breaks
    getAdminTeam: builder.query<StaffMember[], void>({
      query: () => '/admin/team',
      providesTags: ['Team'],
    }),
    createAdminTeamMember: builder.mutation<StaffMember, Partial<StaffMember>>({
      query: (body) => ({ url: '/admin/team', method: 'POST', body }),
      invalidatesTags: ['Team', 'Bootstrap'],
    }),
    updateAdminTeamMember: builder.mutation<StaffMember, { id: number; data: Partial<StaffMember> }>({
      query: ({ id, data }) => ({ url: `/admin/team/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Team', 'Bootstrap'],
    }),
    deleteAdminTeamMember: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/team/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Team', 'Bootstrap'],
    }),
    updateStaffSchedules: builder.mutation<
      StaffSchedule[],
      { id: number; schedules: StaffSchedule[] }
    >({
      query: ({ id, schedules }) => ({
        url: `/admin/team/${id}/schedules`,
        method: 'PUT',
        body: { schedules },
      }),
      invalidatesTags: ['Team'],
    }),
    createStaffBreak: builder.mutation<
      StaffBreak,
      { staffId: number; breakDate?: string | null; startTime: string; endTime: string; reason: string }
    >({
      query: ({ staffId, ...body }) => ({
        url: `/admin/team/${staffId}/breaks`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Team'],
    }),
    deleteStaffBreak: builder.mutation<{ ok: boolean }, number>({
      query: (breakId) => ({ url: `/admin/team/breaks/${breakId}`, method: 'DELETE' }),
      invalidatesTags: ['Team'],
    }),

    // Customers
    getAdminCustomers: builder.query<CustomerRecord[], void>({
      query: () => '/admin/customers',
      providesTags: ['Customers'],
    }),
    createAdminCustomer: builder.mutation<
      CustomerRecord,
      { fullName: string; phone: string; email?: string; notes?: string }
    >({
      query: (body) => ({ url: '/admin/customers', method: 'POST', body }),
      invalidatesTags: ['Customers', 'Dashboard'],
    }),
    updateAdminCustomer: builder.mutation<
      CustomerRecord,
      { id: number; data: { fullName?: string; phone?: string; email?: string; notes?: string } }
    >({
      query: ({ id, data }) => ({ url: `/admin/customers/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Customers'],
    }),
    deleteAdminCustomer: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customers', 'Dashboard'],
    }),

    // Social, Blog, Offers, Reviews
    getAdminSocialPosts: builder.query<SocialPost[], void>({
      query: () => '/admin/social-posts',
      providesTags: ['SocialPosts'],
    }),
    createAdminSocialPost: builder.mutation<SocialPost, Partial<SocialPost>>({
      query: (body) => ({ url: '/admin/social-posts', method: 'POST', body }),
      invalidatesTags: ['SocialPosts', 'Bootstrap'],
    }),
    updateAdminSocialPost: builder.mutation<SocialPost, { id: number; data: Partial<SocialPost> }>({
      query: ({ id, data }) => ({ url: `/admin/social-posts/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['SocialPosts', 'Bootstrap'],
    }),
    deleteAdminSocialPost: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/social-posts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SocialPosts', 'Bootstrap'],
    }),

    getAdminBlogPosts: builder.query<BlogPost[], void>({
      query: () => '/admin/blog',
      providesTags: ['Blog'],
    }),
    createAdminBlogPost: builder.mutation<BlogPost, Partial<BlogPost>>({
      query: (body) => ({ url: '/admin/blog', method: 'POST', body }),
      invalidatesTags: ['Blog', 'Bootstrap'],
    }),
    updateAdminBlogPost: builder.mutation<BlogPost, { id: number; data: Partial<BlogPost> }>({
      query: ({ id, data }) => ({ url: `/admin/blog/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Blog', 'Bootstrap'],
    }),
    deleteAdminBlogPost: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/blog/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Blog', 'Bootstrap'],
    }),

    getAdminOffers: builder.query<SalonOffer[], void>({
      query: () => '/admin/offers',
      providesTags: ['Offers'],
    }),
    createAdminOffer: builder.mutation<SalonOffer, Partial<SalonOffer>>({
      query: (body) => ({ url: '/admin/offers', method: 'POST', body }),
      invalidatesTags: ['Offers', 'Bootstrap'],
    }),
    updateAdminOffer: builder.mutation<SalonOffer, { id: number; data: Partial<SalonOffer> }>({
      query: ({ id, data }) => ({ url: `/admin/offers/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Offers', 'Bootstrap'],
    }),
    deleteAdminOffer: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/offers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Offers', 'Bootstrap'],
    }),

    getAdminReviews: builder.query<SalonReview[], void>({
      query: () => '/admin/reviews',
      providesTags: ['Reviews'],
    }),
    createAdminReview: builder.mutation<SalonReview, Partial<SalonReview>>({
      query: (body) => ({ url: '/admin/reviews', method: 'POST', body }),
      invalidatesTags: ['Reviews', 'Bootstrap'],
    }),
    updateAdminReview: builder.mutation<SalonReview, { id: number; data: Partial<SalonReview> }>({
      query: ({ id, data }) => ({ url: `/admin/reviews/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Reviews', 'Bootstrap'],
    }),
    deleteAdminReview: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reviews', 'Bootstrap'],
    }),

    // Holidays
    getAdminHolidays: builder.query<SalonHoliday[], void>({
      query: () => '/admin/holidays',
      providesTags: ['Holidays'],
    }),
    createAdminHoliday: builder.mutation<SalonHoliday, Partial<SalonHoliday>>({
      query: (body) => ({ url: '/admin/holidays', method: 'POST', body }),
      invalidatesTags: ['Holidays', 'Bootstrap'],
    }),
    updateAdminHoliday: builder.mutation<SalonHoliday, { id: number; data: Partial<SalonHoliday> }>({
      query: ({ id, data }) => ({ url: `/admin/holidays/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Holidays', 'Bootstrap'],
    }),
    deleteAdminHoliday: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/holidays/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Holidays', 'Bootstrap'],
    }),

    // Payments
    getAdminPayments: builder.query<AdminPaymentRow[], void>({
      query: () => '/admin/payments',
      providesTags: ['Payments'],
    }),
    createAdminPayment: builder.mutation<
      AdminPaymentRow,
      {
        bookingId: number;
        provider: PaymentMethod;
        amountNpr: number;
        status: string;
        transactionRef: string;
      }
    >({
      query: (body) => ({ url: '/admin/payments', method: 'POST', body }),
      invalidatesTags: ['Payments', 'Bookings', 'Dashboard', 'Reports'],
    }),
    updateAdminPayment: builder.mutation<
      AdminPaymentRow,
      { id: number; status: string; transactionRef?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/payments/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Payments', 'Bookings', 'Dashboard', 'Reports'],
    }),

    // Notifications & Contact Messages
    getAdminNotifications: builder.query<
      {
        notifications: AdminNotificationRow[];
        contactMessages: AdminContactMessageRow[];
      },
      void
    >({
      query: () => '/admin/notifications',
      providesTags: ['Notifications'],
    }),
    createAdminNotification: builder.mutation<
      AdminNotificationRow,
      { type: string; channel: string; recipient: string; title: string; message: string }
    >({
      query: (body) => ({ url: '/admin/notifications', method: 'POST', body }),
      invalidatesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/admin/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/admin/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),
    deleteAdminNotification: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notifications'],
    }),
    updateContactMessageStatus: builder.mutation<
      AdminContactMessageRow,
      { id: number; status: 'NEW' | 'REPLIED' | 'ARCHIVED' }
    >({
      query: ({ id, status }) => ({
        url: `/admin/contact-messages/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteContactMessage: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/admin/contact-messages/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notifications'],
    }),

    // Reports, Settings, Users, Profile
    getAdminReports: builder.query<
      {
        period: string;
        totalBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        grossRevenueNpr: number;
        collectedRevenueNpr: number;
        servicePerformance: Array<{ name: string; count: number; revenueNpr: number }>;
        staffPerformance: Array<{
          staffId: number;
          fullName: string;
          totalBookings: number;
          completedBookings: number;
          revenueNpr: number;
        }>;
        bookings: BookingRecord[];
      },
      string
    >({
      query: (period) => `/admin/reports?period=${period}`,
      providesTags: ['Reports', 'Bookings'],
    }),
    getAdminSettings: builder.query<SalonSettings | null, void>({
      query: () => '/admin/settings',
      providesTags: ['Settings'],
    }),
    saveAdminSettings: builder.mutation<SalonSettings, Partial<SalonSettings>>({
      query: (body) => ({ url: '/admin/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings', 'Bootstrap'],
    }),
    getAdminUsers: builder.query<
      {
        users: AuthUser[];
        auditLogs: AdminAuditLogRow[];
      },
      void
    >({
      query: () => '/admin/users',
      providesTags: ['Users'],
    }),
    createAdminUser: builder.mutation<
      AuthUser,
      { email: string; fullName: string; phone?: string; role: string }
    >({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }),
      invalidatesTags: ['Users'],
    }),
    updateAdminUserRole: builder.mutation<
      AuthUser,
      { id: number; role: string; isActive?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Users'],
    }),
    getAdminProfile: builder.query<
      { user: AuthUser; recentActivity: AdminAuditLogRow[] },
      void
    >({
      query: () => '/admin/profile',
      providesTags: ['Users'],
    }),
    updateAdminProfile: builder.mutation<AuthUser, { fullName: string; phone?: string }>({
      query: (body) => ({ url: '/admin/profile', method: 'PATCH', body }),
      invalidatesTags: ['Users'],
    }),
    uploadAdminImage: builder.mutation<{ url: string; provider: string }, { dataUrl: string }>({
      query: (body) => ({ url: '/admin/upload', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminBookingsQuery,
  useCreateAdminBookingMutation,
  useUpdateAdminBookingMutation,
  useDeleteAdminBookingMutation,
  useGetAdminServicesQuery,
  useCreateAdminServiceMutation,
  useUpdateAdminServiceMutation,
  useDeleteAdminServiceMutation,
  useGetAdminCategoriesQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useGetAdminGalleryQuery,
  useCreateAdminGalleryItemMutation,
  useUpdateAdminGalleryItemMutation,
  useDeleteAdminGalleryItemMutation,
  useGetAdminTeamQuery,
  useCreateAdminTeamMemberMutation,
  useUpdateAdminTeamMemberMutation,
  useDeleteAdminTeamMemberMutation,
  useUpdateStaffSchedulesMutation,
  useCreateStaffBreakMutation,
  useDeleteStaffBreakMutation,
  useGetAdminCustomersQuery,
  useCreateAdminCustomerMutation,
  useUpdateAdminCustomerMutation,
  useDeleteAdminCustomerMutation,
  useGetAdminSocialPostsQuery,
  useCreateAdminSocialPostMutation,
  useUpdateAdminSocialPostMutation,
  useDeleteAdminSocialPostMutation,
  useGetAdminBlogPostsQuery,
  useCreateAdminBlogPostMutation,
  useUpdateAdminBlogPostMutation,
  useDeleteAdminBlogPostMutation,
  useGetAdminOffersQuery,
  useCreateAdminOfferMutation,
  useUpdateAdminOfferMutation,
  useDeleteAdminOfferMutation,
  useGetAdminReviewsQuery,
  useCreateAdminReviewMutation,
  useUpdateAdminReviewMutation,
  useDeleteAdminReviewMutation,
  useGetAdminHolidaysQuery,
  useCreateAdminHolidayMutation,
  useUpdateAdminHolidayMutation,
  useDeleteAdminHolidayMutation,
  useGetAdminPaymentsQuery,
  useCreateAdminPaymentMutation,
  useUpdateAdminPaymentMutation,
  useGetAdminNotificationsQuery,
  useCreateAdminNotificationMutation,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteAdminNotificationMutation,
  useUpdateContactMessageStatusMutation,
  useDeleteContactMessageMutation,
  useGetAdminReportsQuery,
  useGetAdminSettingsQuery,
  useSaveAdminSettingsMutation,
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserRoleMutation,
  useGetAdminProfileQuery,
  useUpdateAdminProfileMutation,
  useUploadAdminImageMutation,
} = adminApi;
