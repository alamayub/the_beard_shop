import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { clearCredentials, setCredentials, setHydrated } from '../store/slices/authSlice';
import { useExchangeFirebaseSessionMutation } from '../api/salonApi';

export function AdminGuard() {
  const { user, token, isHydrated } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [exchangeSession] = useExchangeFirebaseSessionMutation();

  useEffect(() => {
    if (user && token) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const res = await exchangeSession({ idToken }).unwrap();
          dispatch(setCredentials({ user: res.user, token: res.accessToken }));
          return;
        } catch {
          dispatch(clearCredentials());
          return;
        }
      }

      // Fallback: attempt HttpOnly refresh cookie
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user && data?.accessToken) {
            dispatch(setCredentials({ user: data.user, token: data.accessToken }));
            return;
          }
        }
      } catch {
        // ignore network errors
      }
      dispatch(setHydrated());
    });

    return () => unsubscribe();
  }, [dispatch, exchangeSession, token, user]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F4] text-sm text-[#5C5852]">
        Verifying staff session...
      </div>
    );
  }

  if (!user || !token || user.role === 'CUSTOMER') {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
