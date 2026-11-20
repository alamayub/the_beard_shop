import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { Lock, ShieldCheck } from 'lucide-react';
import { auth, googleAuthProvider } from '../../lib/firebase';
import { useExchangeFirebaseSessionMutation } from '../../api/salonApi';
import { useAppDispatch } from '../../hooks/useAppStore';
import { setCredentials } from '../../store/slices/authSlice';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { Button } from '../../components/ui/Primitives';

export function AdminLoginPage() {
  useDocumentMeta('Admin Sign In', 'Secure staff portal login for The Beard Shop Beauty Salon.');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [exchangeSession, { isLoading }] = useExchangeFirebaseSessionMutation();
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const session = await exchangeSession({ idToken }).unwrap();
      dispatch(setCredentials({ user: session.user, token: session.accessToken }));
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { data?: { error?: string }; message?: string })?.data?.error ||
        (err as { message?: string })?.message ||
        'Sign-in cancelled or failed. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2A0810] px-4 py-12">
      <div className="w-full max-w-md rounded-md border border-white/10 bg-[#FAF8F4] p-8 shadow-2xl">
        <div className="flex items-center gap-2.5 text-xs uppercase tracking-[0.14em] text-[#8B1A2D]">
          <ShieldCheck className="h-4 w-4" />
          <span>Salon Management Portal</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-medium text-[#2A0810]">
          The Beard Shop Admin
        </h1>
        <p className="mt-2 text-sm text-[#5C5852]">
          Sign in with your authorized Google account to manage bookings, services, team schedules,
          Nepal festival offers, and analytics.
        </p>

        {error && (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
          >
            <Lock className="h-4 w-4 text-[#F0B6BF]" />
            {isLoading ? 'Verifying Session...' : 'Sign in with Google'}
          </Button>
          <p className="text-[11px] leading-relaxed text-[#777777] text-center">
            Protected by Firebase Authentication, server-side RBAC, HttpOnly refresh cookies, and
            PostgreSQL audit logging.
          </p>
        </div>

        <div className="mt-8 border-t border-[#E6DADC] pt-4 text-center">
          <Link to="/" className="text-xs font-medium text-[#8B1A2D] hover:underline">
            Return to Public Salon Website
          </Link>
        </div>
      </div>
    </div>
  );
}
