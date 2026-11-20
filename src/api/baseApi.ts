import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';
import { clearCredentials, setCredentials } from '../store/slices/authSlice';
import type { AuthUser } from '../types/salon';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );
    if (refreshResult.data) {
      const data = refreshResult.data as { user: AuthUser; accessToken: string };
      api.dispatch(setCredentials({ user: data.user, token: data.accessToken }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'salonApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Bootstrap',
    'Settings',
    'Services',
    'Categories',
    'Gallery',
    'Team',
    'SocialPosts',
    'Blog',
    'Offers',
    'Reviews',
    'Holidays',
    'Bookings',
    'Customers',
    'Payments',
    'Notifications',
    'Dashboard',
    'Reports',
    'Users',
  ],
  endpoints: () => ({}),
});
