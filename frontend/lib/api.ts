/**
 * Taaxbro API client
 * All calls go to NEXT_PUBLIC_API_URL (Railway).
 * Cookies are sent automatically (credentials: 'include').
 * On 401, attempts one silent token refresh then retries.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = {
    ...options.headers,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 && retry) {
    // Attempt silent refresh
    const refreshed = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      return request<T>(path, options, false);
    }
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
    } catch { /* non-JSON body */ }
    throw new ApiError(res.status, detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  user_id: string;
  email: string;
  full_name: string | null;
  business_id: string | null;
  onboarding_completed: boolean;
}

export const auth = {
  signup(data: { full_name: string; email: string; password: string }) {
    return request<{ message: string; email: string }>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyEmail(data: { email: string; otp: string }) {
    return request<AuthUser>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resendOtp(email: string) {
    return request<{ message: string }>('/api/v1/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  login(data: { email: string; password: string }) {
    return request<AuthUser>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout() {
    return request<{ ok: boolean }>('/api/v1/auth/logout', { method: 'POST' });
  },

  me() {
    return request<AuthUser>('/api/v1/auth/me');
  },

  forgotPassword(email: string) {
    return request<{ message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(data: { token: string; new_password: string }) {
    return request<{ message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};