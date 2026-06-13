'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { auth, type AuthUser, ApiError, onSessionExpired } from '@/lib/api';
import { Icon } from '@iconify/react';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Call after verify-email or onboarding completes to hydrate context. */
  setUser: (user: AuthUser) => void;
  /** Proactively refresh the session, returning true if successful. */
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Silently hit the refresh endpoint.
 * Returns true if a new access token was issued, false otherwise.
 * Does NOT throw — callers decide what to do on failure.
 */
async function silentRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  // Track when the tab was last hidden so we know if the access token
  // (15 min TTL) may have expired while we were away.
  const hiddenAtRef = useRef<number | null>(null);

  // Expose a stable logout reference so the visibility handler below
  // can call it without needing it in a useEffect dependency array.
  const logoutRef = useRef<(() => Promise<void>) | null>(null);

  const router = useRouter();

  // ── Hydrate on mount ────────────────────────────────────────────────────
  useEffect(() => {
    auth
      .me()
      .then((u) => {
        setUser(u);
        if (typeof window !== 'undefined') {
          const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify'].some(p => window.location.pathname.startsWith(p));
          if (isAuthRoute) {
            router.push(u.onboarding_completed ? '/overview' : '/onboarding');
          }
        }
      })
      .catch(async () => {
        // auth.me() failed — try a silent refresh before giving up.
        // This handles the case where the access_token just expired but the
        // refresh_token is still valid (common right after login or on tab reload).
        const refreshed = await silentRefresh();
        if (refreshed) {
          try {
            const u = await auth.me();
            setUser(u);
            return;
          } catch {
            // refresh succeeded but me() still failed — fall through to null
          }
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const logout = useCallback(async () => {
    await auth.logout().catch(() => {});
    setUser(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  // Keep ref in sync so the visibility handler always calls the latest logout
  logoutRef.current = logout;

  // ── Register Global 401 Session Expiry Callback ────────────────────────
  useEffect(() => {
    onSessionExpired(() => {
      console.log('[AuthContext] Session expired globally. Showing modal...');
      setShowSessionExpiredModal(true);
    });
  }, []);

  // ── Expose Refresh Session ──────────────────────────────────────────────
  const refreshSession = useCallback(async () => {
    const ok = await silentRefresh();
    if (ok) {
      try {
        const u = await auth.me();
        setUser(u);
      } catch {}
    }
    return ok;
  }, []);

  // ── Proactive refresh on tab focus ──────────────────────────────────────
  //
  // Problem: middleware checks for the access_token cookie on every navigation.
  // If the user was on another tab for >15 min, the cookie has expired and
  // middleware redirects to /login — before the silent-refresh-on-401 in
  // api.ts ever gets a chance to run.
  //
  // Fix: listen to visibilitychange. When the tab becomes visible again,
  // check how long it was hidden. If ≥13 minutes (access token TTL is 15 min,
  // we refresh 2 min early to have margin), silently call /auth/refresh.
  // If refresh succeeds → user stays logged in seamlessly.
  // If refresh fails (refresh token also expired) → logout cleanly.
  //
  useEffect(() => {
    // Only run in browser, only when there's a logged-in user
    if (typeof window === 'undefined') return;

    const ACCESS_TOKEN_MINUTES = 15;
    // Refresh proactively when hidden for this fraction of the TTL
    const REFRESH_THRESHOLD_MS = (ACCESS_TOKEN_MINUTES - 2) * 60 * 1000; // 13 min

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // Record when we left
        hiddenAtRef.current = Date.now();
        return;
      }

      // Tab is visible again
      if (hiddenAtRef.current === null) return;
      if (!user) return; // not logged in — nothing to refresh

      const hiddenDurationMs = Date.now() - hiddenAtRef.current;
      hiddenAtRef.current = null;

      if (hiddenDurationMs < REFRESH_THRESHOLD_MS) {
        // Tab was away for less than 13 minutes — access token is still valid
        return;
      }

      // Tab was away long enough that the access token may have expired.
      // Refresh proactively before the user clicks anything.
      const ok = await silentRefresh();
      if (!ok) {
        // Refresh token also expired or revoked — log out cleanly
        await logoutRef.current?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await auth.login({ email, password });
    if ('requires_2fa' in res && res.requires_2fa) {
      router.push(`/login/2fa?user_id=${res.user_id}`);
    } else {
      const loggedInUser = res as AuthUser;
      setUser(loggedInUser);
      router.push(loggedInUser.onboarding_completed ? '/overview' : '/onboarding');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refreshSession }}>
      {children}

      {showSessionExpiredModal && (
        <div className='fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in'>
          <div className='bg-white rounded-3xl p-8 max-w-md w-full mx-4 border border-grey-10 shadow-2xl space-y-6 text-center animate-scale-up'>
            <div className='mx-auto w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm'>
              <Icon icon='ph:lock-key-bold' className='text-3xl' />
            </div>

            <div className='space-y-2'>
              <h3 className='text-xl font-bold text-secondary-10'>Session Expired</h3>
              <p className='text-sm text-secondary-30 leading-relaxed'>
                For your security, you have been logged out because your session expired or you signed in from another device.
              </p>
            </div>

            <div className='pt-2'>
              <button
                type='button'
                onClick={async () => {
                  setShowSessionExpiredModal(false);
                  await logoutRef.current?.();
                }}
                className='w-full px-6 py-3 bg-primary-30 hover:bg-primary-40 text-sm font-bold text-white transition rounded-full flex items-center justify-center gap-2 shadow-md shadow-primary-30/10'
              >
                Log In Again
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}