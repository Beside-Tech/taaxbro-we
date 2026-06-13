/**
 * Taaxbro API client
 * All calls go to NEXT_PUBLIC_API_URL (Railway).
 * Cookies are sent automatically (credentials: 'include').
 * On 401, attempts one silent token refresh then retries.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

let sessionExpiredCallback: (() => void) | null = null;

export function onSessionExpired(cb: () => void) {
  sessionExpiredCallback = cb;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Auth routes that must NEVER trigger the silent-refresh retry.
// They legitimately return 401 on bad credentials — retrying them would
// swallow the real error message and show "Session expired" instead.
const NO_RETRY_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
];

let activeRefreshPromise: Promise<boolean> | null = null;

async function executeSilentRefresh(): Promise<boolean> {
  if (!activeRefreshPromise) {
    activeRefreshPromise = fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => {
        activeRefreshPromise = null;
        return res.ok;
      })
      .catch(() => {
        activeRefreshPromise = null;
        return false;
      });
  }
  return activeRefreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...headers, ...options.headers },
  });

  // On 401: attempt one silent token refresh, then retry the original request.
  // Skip this for auth endpoints — they return 401 for bad credentials and
  // must surface the real error (e.g. "Invalid password") to the user.
  const shouldRetry = res.status === 401 && retry && !NO_RETRY_PATHS.includes(path);
  if (shouldRetry) {
    const refreshedOk = await executeSilentRefresh();
    if (refreshedOk) {
      return request<T>(path, options, false);
    }
    if (sessionExpiredCallback) {
      const isProtectedRoute = typeof window !== 'undefined' &&
        ['/overview', '/books', '/pay', '/tax', '/settings', '/onboarding'].some(p => window.location.pathname.startsWith(p));
      if (isProtectedRoute) {
        sessionExpiredCallback();
      }
    }
    throw new ApiError(401, 'Session expired. Please log in again.');
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
  user_type?: string | null;
  industry?: string | null;
  two_fa_enabled?: boolean | null;
}

export interface UserSessionInfo {
  id: string;
  ip_address: string | null;
  device_info: {
    os: string;
    browser: string;
    raw: string;
  } | null;
  created_at: string;
  is_current: boolean;
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
    return request<AuthUser | { requires_2fa: boolean; user_id: string }>('/api/v1/auth/login', {
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

  getSessions() {
    return request<UserSessionInfo[]>('/api/v1/auth/sessions');
  },

  revokeSession(sessionId: string) {
    return request<{ ok: boolean }>(`/api/v1/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  revokeOtherSessions() {
    return request<{ ok: boolean }>('/api/v1/auth/sessions', {
      method: 'DELETE',
    });
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

  setup2fa() {
    return request<{ secret: string; qr_code_base64: string }>('/api/v1/auth/2fa/setup', {
      method: 'POST',
    });
  },

  enable2fa(code: string) {
    return request<{ message: string }>('/api/v1/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  disable2fa(code: string) {
    return request<{ message: string }>('/api/v1/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  verify2fa(userId: string, code: string) {
    return request<AuthUser>('/api/v1/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, code }),
    });
  },

  changePassword(data: { current_password: string; new_password: string }) {
    return request<{ message: string }>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
// ─── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  revenue_current_month: number;
  revenue_prev_month: number;
  revenue_change_pct: number | null;
  expenses_current_month: number;
  expenses_prev_month: number;
  expenses_change_pct: number | null;
  tax_liabilities_due: number;
  tax_liabilities_status: 'At Risk' | 'On Track' | 'Overdue';
  outstanding_invoices_amount: number;
  outstanding_invoices_unpaid: number;
  outstanding_invoices_overdue: number;
  tax_reserve: number;
  next_filing_date: string | null; // ISO date
}

export interface DashboardTransaction {
  id: string;
  transaction_date: string;
  type: 'credit' | 'debit';
  counterparty_name: string | null;
  bank_name: string | null;
  amount: number;
  vat_amount: number | null;
  category: string | null;
}

export interface ComplianceItem {
  label: string;
  ok: boolean;
}

export interface DashboardCompliance {
  score: number;
  items: ComplianceItem[];
}

export interface MonthlyHistoryItem {
  month: string;
  revenue: number;
  expenses: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_transactions: DashboardTransaction[];
  compliance: DashboardCompliance | null;
  history: MonthlyHistoryItem[];
}

export const dashboard = {
  get(): Promise<DashboardData> {
    return request<DashboardData>('/api/v1/dashboard');
  },
};

// ─── Onboarding ──────────────────────────────────────────────────────

export interface OnboardingPayload {
  // Step 1
  user_type: string;             // 'business' | 'freelancer' | 'tax_professional'

  // Step 2 — required
  business_name: string;
  business_type: string;
  state: string;

  // Step 2 — optional
  industry?: string;
  tin?: string;
  rc_number?: string;
  nin?: string;                  // 11-digit NIN, freelancers only
  vat_registered: boolean;
  vat_registration_no?: string;
  address?: string;
  phone?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  owner_name?: string;
}

export const onboarding = {
  complete(data: OnboardingPayload): Promise<AuthUser> {
    return request<AuthUser>('/api/v1/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export interface BusinessProfile {
  business_id:   string;
  name:          string | null;
  business_type: string | null;
  industry:      string | null;
  state:         string | null;
  tin:           string | null;
  rc_number:     string | null;
  logo_url:      string | null;
  nin:                  string | null;
  vat_registered:       boolean;
  vat_registration_no:  string | null;
  address:              string | null;
  phone:                string | null;
  bank_name:            string | null;
  account_number:       string | null;
  account_name:         string | null;
  user_type:            string | null;
  owner_name:           string | null;
}

export const business = {
  getProfile(): Promise<BusinessProfile> {
    return request<BusinessProfile>('/api/v1/business/me');
  },
  uploadLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ logo_url: string }>('/api/v1/business/logo', {
      method: 'POST',
      body: formData,
    });
  },
};

// ─── Integrations ────────────────────────────────────────────────────────────

export interface WhatsAppSettings {
  id: string;
  business_id: string;
  phone_number: string;
  enabled: boolean;
  notifications_enabled: boolean;
  ocr_mode: 'manual' | 'auto';
  auto_reply_enabled: boolean;
  auto_reply_text: string | null;
  last_tested_at: string | null;
}

export interface WhatsAppSettingsUpdate {
  phone_number?: string;
  enabled?: boolean;
  notifications_enabled?: boolean;
  ocr_mode?: 'manual' | 'auto';
  auto_reply_enabled?: boolean;
  auto_reply_text?: string;
}

export const integrations = {
  getWhatsAppSettings(businessId: string): Promise<WhatsAppSettings> {
    return request<WhatsAppSettings>(`/api/v1/integrations/whatsapp?business_id=${businessId}`);
  },
  updateWhatsAppSettings(businessId: string, data: WhatsAppSettingsUpdate): Promise<WhatsAppSettings> {
    return request<WhatsAppSettings>(`/api/v1/integrations/whatsapp?business_id=${businessId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  testWhatsAppIntegration(businessId: string): Promise<{ status: string; message: string; message_id?: string }> {
    return request<{ status: string; message: string; message_id?: string }>(`/api/v1/integrations/whatsapp/test?business_id=${businessId}`, {
      method: 'POST',
    });
  },
  sendWhatsAppOtp(businessId: string, phoneNumber: string): Promise<{ message: string; debug_code?: string }> {
    return request<{ message: string; debug_code?: string }>(`/api/v1/integrations/whatsapp/otp/send?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  },
  verifyWhatsAppOtp(businessId: string, phoneNumber: string, code: string): Promise<WhatsAppSettings> {
    return request<WhatsAppSettings>(`/api/v1/integrations/whatsapp/otp/verify?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, code }),
    });
  },
  disconnectWhatsApp(businessId: string): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>(`/api/v1/integrations/whatsapp?business_id=${businessId}`, {
      method: 'DELETE',
    });
  },
  connectMonoAccount(businessId: string, code: string, bankName: string): Promise<any> {
    return request<any>(`/api/v1/integrations/mono/connect?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify({ code, bank_name: bankName }),
    });
  },
  getBankAccounts(businessId: string): Promise<any[]> {
    return request<any[]>(`/api/v1/integrations/bank-accounts?business_id=${businessId}`);
  },
  disconnectBankAccount(businessId: string, accountId: string): Promise<any> {
    return request<any>(`/api/v1/integrations/bank-accounts/${accountId}?business_id=${businessId}`, {
      method: 'DELETE',
    });
  },
  createPaymentLink(businessId: string, data: { amount: number; description: string; client_id?: string }): Promise<{ url: string }> {
    return request<{ url: string }>(`/api/v1/pay/links?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  sendInvoiceViaWhatsApp(businessId: string, invoiceId: string, payload?: { client_phone?: string; message?: string }): Promise<any> {
    return request<any>(`/api/v1/invoices/${invoiceId}/send-whatsapp?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    });
  },
};

export const ai = {
  /** Legacy — kept for backwards compatibility. New code: use ai.chat() */
  askAssistant(message: string, conversationId?: string): Promise<{ answer: string; sources: unknown[]; conversation_id: string }> {
    return request<{ answer: string; sources: unknown[]; conversation_id: string }>('/api/v1/ai/tax-assistant', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  },

  /** Unified endpoint — works for both guests and logged-in users */
  chat(
    message: string,
    conversationId?: string,
    dashboardPage?: string,
  ): Promise<{ answer: string; sources: unknown[]; conversation_id: string; mode: string }> {
    return request<{ answer: string; sources: unknown[]; conversation_id: string; mode: string }>('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId, dashboard_page: dashboardPage }),
    });
  },

  /** Public guest endpoint — no auth required */
  chatGuest(
    message: string,
    conversationId?: string,
  ): Promise<{ answer: string; sources: unknown[]; conversation_id: string; mode: string }> {
    return request<{ answer: string; sources: unknown[]; conversation_id: string; mode: string }>('/api/v1/ai/chat/guest', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  },

  /** Image/PDF upload → OCR extraction → Elon response (logged-in only) */
  chatOCR(
    file: File,
    conversationId?: string,
  ): Promise<{ answer: string; conversation_id: string; extracted_text?: string; amount_detected?: string }> {
    const fd = new FormData();
    fd.append('file', file);
    if (conversationId) fd.append('conversation_id', conversationId);
    return request<{ answer: string; conversation_id: string; extracted_text?: string; amount_detected?: string }>(
      '/api/v1/ai/chat/ocr',
      { method: 'POST', body: fd },
    );
  },

  /** Audio blob → Whisper transcription (logged-in only) */
  chatVoice(
    blob: Blob,
    conversationId?: string,
  ): Promise<{ transcript: string; conversation_id: string }> {
    const fd = new FormData();
    fd.append('audio', blob, 'recording.webm');
    if (conversationId) fd.append('conversation_id', conversationId);
    return request<{ transcript: string; conversation_id: string }>(
      '/api/v1/ai/chat/voice',
      { method: 'POST', body: fd },
    );
  },
};

// ─── Invoices ───────────────────────────────────────────────────────────────

export interface InvoiceResponse {
  id: string;
  invoice_number: string;
  client_name: string;
  client_phone?: string | null;
  total_amount: number;
  due_date: string;
  status: string;
  created_at: string;
}

export const invoices = {
  list(businessId: string): Promise<InvoiceResponse[]> {
    return request<InvoiceResponse[]>(`/api/v1/invoices?business_id=${businessId}`);
  },
  create(businessId: string, data: {
    client_name: string;
    total_amount: number;
    due_date?: string;
    notes?: string;
    items?: Array<{ description: string; quantity: number; unit_price: number }>;
  }): Promise<InvoiceResponse> {
    return request<InvoiceResponse>(`/api/v1/invoices?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface ExpenseResponse {
  id: string;
  category: string;
  amount: number;
  vendor_name: string | null;
  expense_date: string;
  description: string | null;
  vat_amount: number;
  created_at: string;
  source: string;
  wht_applicable: boolean;
  wht_amount: number;
  receipt_url: string | null;
}

export const expenses = {
  list(businessId: string): Promise<ExpenseResponse[]> {
    return request<ExpenseResponse[]>(`/api/v1/expenses?business_id=${businessId}`);
  },
  create(businessId: string, data: {
    category: string;
    amount: number;
    vendor_name?: string | null;
    expense_date?: string | null;
    description?: string | null;
    vat_amount?: number;
  }): Promise<ExpenseResponse> {
    return request<ExpenseResponse>(`/api/v1/expenses?business_id=${businessId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};