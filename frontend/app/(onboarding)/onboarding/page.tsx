'use client';

/**
 * Web onboarding wizard — runs once after email verification.
 *
 * Step 1 — Who are you?               (role selection)
 * Step 2 — Business / Identity Details (smart fields per role)
 * Step 3 — Brand & Logo               (optional logo upload — same as WhatsApp)
 * Step 4 — Connect Accounts           (email OAuth; Mono = coming soon)
 *
 * Unification rules
 * ─────────────────
 * • WhatsApp users who already completed the WA 11-step wizard have
 *   onboarding_completed = true and are redirected to /overview immediately.
 * • The wizard is fully skippable from Step 2 onward — a "Skip for now →"
 *   link posts the minimum payload and goes to /overview.
 *
 * Smart field matrix
 * ──────────────────
 *   business        → business_name, business_type, industry, state, TIN, CAC (rc_number)
 *   freelancer      → full_name label, sole_proprietorship type locked, state, TIN, NIN
 *   tax_professional→ full_name label, sole_proprietorship type locked, state, TIN
 *   (individual is just "freelancer" with NIN)
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { onboarding, type OnboardingPayload, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership',         label: 'Partnership' },
  { value: 'limited_liability',   label: 'Limited Company' },
  { value: 'ngo',                 label: 'NGO / Non-Profit' },
  { value: 'other',               label: 'Other' },
];

const INDUSTRIES = [
  'Technology', 'Agriculture', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Real Estate', 'Media', 'Legal', 'Consulting', 'Hospitality',
  'Transportation', 'Construction', 'Energy', 'Other',
];

const USER_TYPES = [
  {
    value: 'business',
    icon: 'ph:briefcase-fill',
    label: 'I run a business',
    description: 'SME, limited company, or registered entity',
  },
  {
    value: 'freelancer',
    icon: 'ph:laptop-fill',
    label: "I'm a freelancer / individual",
    description: 'Self-employed, sole trader, contractor, or FX earner',
  },
  {
    value: 'tax_professional',
    icon: 'ph:scales-fill',
    label: "I'm a tax professional",
    description: 'Accountant or consultant managing multiple clients',
  },
];

const STEP_LABELS = ['Who are you?', 'Your Details', 'Logo & Brand', 'Connect'];

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormData {
  user_type:     string;
  business_name: string;
  business_type: string;
  industry:      string;
  state:         string;
  tin:           string;
  rc_number:     string;
  nin:           string;
}

const EMPTY: FormData = {
  user_type:     '',
  business_name: '',
  business_type: '',
  industry:      '',
  state:         '',
  tin:           '',
  rc_number:     '',
  nin:           '',
};

interface Connections {
  email: 'idle' | 'connecting' | 'connected';
}

// ─── Shared field components ──────────────────────────────────────────────────

function Label({ children, hint, optional }: { children: React.ReactNode; hint?: string; optional?: boolean }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <div className='flex items-center gap-1.5'>
        <span className='text-sm font-medium text-secondary-10'>{children}</span>
        {optional && (
          <span className='text-[10px] font-medium text-secondary-40 bg-grey-10/60 rounded-full px-2 py-0.5'>Optional</span>
        )}
      </div>
      {hint && <span className='text-xs text-secondary-30'>{hint}</span>}
    </div>
  );
}

function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm text-secondary-10
        bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30
        transition placeholder:text-secondary-40 disabled:bg-[#f7f7f7] disabled:text-secondary-30'
    />
  );
}

function Sel({ placeholder, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  return (
    <div className='relative'>
      <select
        {...props}
        className='w-full border border-grey-10 rounded-xl px-4 py-3 pr-10 text-sm text-secondary-10
          bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30
          transition appearance-none disabled:bg-[#f7f7f7] disabled:text-secondary-30'>
        {placeholder && <option value=''>{placeholder}</option>}
        {children}
      </select>
      <Icon icon='ph:caret-down' className='absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-sm' />
    </div>
  );
}

// ─── Step progress tracker ────────────────────────────────────────────────────

function StepTracker({ current }: { current: number }) {
  return (
    <div className='flex items-start mb-10'>
      {STEP_LABELS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className='flex flex-col items-center flex-1 relative'>
            {i > 0 && (
              <div
                className={`absolute top-[18px] h-0.5 transition-colors ${done ? 'bg-primary-40' : 'bg-grey-10'}`}
                style={{ left: 'calc(-50% + 18px)', right: 'calc(50% + 18px)' }}
              />
            )}
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
              transition-all ${done || active ? 'bg-primary-40 text-white' : 'bg-white border-2 border-grey-10 text-secondary-30'}`}>
              {done ? <Icon icon='ph:check-bold' className='text-sm' /> : i + 1}
            </div>
            <span className={`mt-2 text-[10px] text-center leading-tight px-1 ${active ? 'font-medium text-secondary-10' : 'text-secondary-30'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Who are you? ─────────────────────────────────────────────────────

function Step1({ value, onChange }: { value: string; onChange(v: string): void }) {
  return (
    <>
      <h1 className='text-[28px] font-bold text-center text-secondary-10 leading-tight mb-2'>
        Who are you?
      </h1>
      <p className='text-sm text-secondary-30 text-center mb-8 leading-relaxed'>
        We'll configure your dashboard, tax types, and compliance<br />requirements to match how you work.
      </p>

      <div className='space-y-3'>
        {USER_TYPES.map((t) => {
          const selected = value === t.value;
          return (
            <button
              key={t.value}
              type='button'
              onClick={() => onChange(t.value)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all
                ${selected
                  ? 'border-primary-30 bg-primary-50'
                  : 'border-grey-10 bg-[#fafafa] hover:border-primary-20 hover:bg-primary-50'
                }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                ${selected ? 'bg-primary-40 text-white' : 'bg-secondary-40/20 text-secondary-20'}`}>
                <Icon icon={t.icon} className='text-[18px]' />
              </div>
              <div>
                <p className={`text-sm font-semibold ${selected ? 'text-primary-40' : 'text-secondary-10'}`}>{t.label}</p>
                <p className='text-xs text-secondary-30 mt-0.5'>{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Step 2: Smart details per user_type ──────────────────────────────────────

function Step2({ form, set }: { form: FormData; set(k: keyof FormData, v: string): void }) {
  const isBusiness   = form.user_type === 'business';
  const isFreelancer = form.user_type === 'freelancer';
  const isTaxPro     = form.user_type === 'tax_professional';

  // Freelancers / tax professionals are always sole proprietorships
  const lockBusinessType = isFreelancer || isTaxPro;
  const nameLabel        = isBusiness ? 'Business Name' : 'Full Name / Trading Name';
  const namePlaceholder  = isBusiness
    ? 'e.g. Daniel Incorporated'
    : isFreelancer
    ? 'e.g. Adaeze Nwosu Consulting'
    : 'e.g. Chukwuemeka Obi & Associates';

  // Auto-set business type for locked roles
  useEffect(() => {
    if (lockBusinessType && form.business_type !== 'sole_proprietorship') {
      set('business_type', 'sole_proprietorship');
    }
  }, [form.user_type]); // eslint-disable-line

  return (
    <>
      <h1 className='text-[24px] font-bold text-secondary-10 mb-1'>Your Details</h1>
      <p className='text-sm text-secondary-30 mb-6 leading-relaxed'>
        These fields determine your applicable tax types and auto-fill your invoices and filings.
      </p>

      <div className='space-y-4'>
        {/* Name */}
        <div className='flex flex-col gap-1.5'>
          <Label>{nameLabel}</Label>
          <Inp
            placeholder={namePlaceholder}
            value={form.business_name}
            onChange={(e) => set('business_name', e.target.value)}
          />
        </div>

        {/* Business type row */}
        <div className={`grid ${isBusiness ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
          {!lockBusinessType && (
            <div className='flex flex-col gap-1.5'>
              <Label>Business Type</Label>
              <Sel
                placeholder='Select type'
                value={form.business_type}
                onChange={(e) => set('business_type', e.target.value)}>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Sel>
            </div>
          )}

          {isBusiness && (
            <div className='flex flex-col gap-1.5'>
              <Label>Industry</Label>
              <Sel
                placeholder='Select industry'
                value={form.industry}
                onChange={(e) => set('industry', e.target.value)}>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind.toLowerCase().replace(' ', '_')}>{ind}</option>
                ))}
              </Sel>
            </div>
          )}

          {lockBusinessType && (
            <div className='flex flex-col gap-1.5'>
              <Label>Registration Type</Label>
              <Inp value='Sole Proprietorship / Individual' disabled />
            </div>
          )}
        </div>

        {/* State */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-1.5'>
            <Label>Country</Label>
            <Inp value='Nigeria' disabled />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>State of Operation</Label>
            <Sel
              placeholder='Select state'
              value={form.state}
              onChange={(e) => set('state', e.target.value)}>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Sel>
          </div>
        </div>
      </div>

      {/* Tax Identification — smart section */}
      <div className='mt-7 mb-5'>
        <h2 className='text-[17px] font-bold text-secondary-10 mb-1'>Tax Identification</h2>
        <p className='text-xs text-secondary-30 leading-relaxed'>
          Required by FIRS to file returns on your behalf. You can skip and add these later in Compliance Hub.
        </p>
      </div>

      <div className='space-y-4'>
        {/* TIN — shown for all types */}
        <div className='flex flex-col gap-1.5'>
          <Label optional>Tax Identification Number (TIN)</Label>
          <Inp
            placeholder='e.g. 123-223-223'
            value={form.tin}
            onChange={(e) => set('tin', e.target.value)}
          />
        </div>

        {/* CAC — only for registered businesses */}
        {isBusiness && (
          <div className='flex flex-col gap-1.5'>
            <Label optional hint='CAC Registration Number (RC number) — for incorporated companies only'>
              CAC Registration Number
            </Label>
            <Inp
              placeholder='e.g. RC 123456'
              value={form.rc_number}
              onChange={(e) => set('rc_number', e.target.value)}
            />
          </div>
        )}

        {/* NIN — only for freelancers / individuals */}
        {isFreelancer && (
          <div className='flex flex-col gap-1.5'>
            <Label optional hint='Your National Identification Number — used for individual PAYE filings'>
              National Identification Number (NIN)
            </Label>
            <Inp
              placeholder='11-digit NIN'
              value={form.nin}
              onChange={(e) => set('nin', e.target.value.replace(/\D/g, '').slice(0, 11))}
              inputMode='numeric'
              maxLength={11}
            />
          </div>
        )}
      </div>
    </>
  );
}

// ─── Step 3: Logo upload ──────────────────────────────────────────────────────

function Step3({
  logoPreview,
  logoFile,
  uploading,
  uploadError,
  onPick,
  onRemove,
}: {
  logoPreview: string | null;
  logoFile: File | null;
  uploading: boolean;
  uploadError: string;
  onPick(f: File): void;
  onRemove(): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <h1 className='text-[28px] font-bold text-center text-secondary-10 leading-tight mb-2'>
        Upload Your Logo
      </h1>
      <p className='text-sm text-secondary-30 text-center mb-8 leading-relaxed'>
        Your logo appears on all PDF invoices, tax documents, and receipts.<br />
        You can always update this later in Settings.
      </p>

      <div className='flex flex-col items-center gap-5'>
        {/* Preview / dropzone */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative w-40 h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center
            cursor-pointer transition-all overflow-hidden
            ${logoPreview
              ? 'border-primary-30 bg-primary-50'
              : 'border-grey-10 bg-[#fafafa] hover:border-primary-20 hover:bg-primary-50'
            }`}>
          {logoPreview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt='Logo preview' className='w-full h-full object-contain p-3' />
              <button
                type='button'
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className='absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition'>
                <Icon icon='ph:x-bold' className='text-xs' />
              </button>
            </>
          ) : (
            <>
              <Icon icon='ph:image-square-fill' className='text-4xl text-secondary-40 mb-2' />
              <span className='text-xs text-secondary-30 text-center px-3 leading-snug'>Click to upload<br />PNG, JPG, SVG · Max 2MB</span>
            </>
          )}
          {uploading && (
            <div className='absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl'>
              <Icon icon='ph:circle-notch' className='animate-spin text-2xl text-primary-40' />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type='file'
          accept='image/png,image/jpeg,image/svg+xml,image/webp'
          className='hidden'
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = '';
          }}
        />

        {logoFile && !uploading && (
          <p className='text-xs text-secondary-30 truncate max-w-[200px]'>{logoFile.name}</p>
        )}

        {uploadError && (
          <p className='text-xs text-red-600 flex items-center gap-1'>
            <Icon icon='ph:warning-circle' className='shrink-0' />
            {uploadError}
          </p>
        )}

        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className='flex items-center gap-2 border border-grey-10 bg-white text-secondary-10 text-sm font-medium
            px-5 py-2.5 rounded-full hover:border-primary-30 hover:text-primary-30 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed'>
          <Icon icon='ph:upload-simple' className='text-base' />
          {logoPreview ? 'Change logo' : 'Select logo'}
        </button>
      </div>

      <p className='text-xs text-secondary-30 text-center mt-6 leading-relaxed'>
        Supported formats: PNG, JPG, SVG, WEBP · Recommended: square, min 200×200 px
      </p>
    </>
  );
}

// ─── Step 4: Connect accounts ─────────────────────────────────────────────────

function Step4({ connections, onConnect }: {
  connections: Connections;
  onConnect(key: keyof Connections): void;
}) {
  return (
    <>
      <h1 className='text-[28px] font-bold text-center text-secondary-10 leading-tight mb-2'>
        Connect Accounts
      </h1>
      <p className='text-sm text-secondary-30 text-center mb-8 leading-relaxed'>
        Everything can be added or removed later in Integrations.
      </p>

      <div className='space-y-3'>
        {/* Email */}
        <div className='flex items-center justify-between gap-4 border border-grey-10 rounded-2xl p-5 bg-[#fafafa]'>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-semibold text-secondary-10'>Email Inbox</p>
            <p className='text-xs text-secondary-30 mt-1 leading-relaxed'>
              Auto-detect invoices & payment confirmations from Gmail or Outlook
            </p>
          </div>
          {connections.email === 'connected' ? (
            <div className='shrink-0 flex items-center gap-1.5 bg-success text-white text-sm font-medium px-4 py-2 rounded-full'>
              <Icon icon='ph:check' />Connected
            </div>
          ) : (
            <button
              type='button'
              onClick={() => onConnect('email')}
              disabled={connections.email === 'connecting'}
              className='shrink-0 border border-grey-10 bg-white text-secondary-10 text-sm font-medium px-4 py-2
                rounded-full hover:border-primary-30 hover:text-primary-30 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'>
              {connections.email === 'connecting' && (
                <Icon icon='ph:circle-notch' className='animate-spin text-base' />
              )}
              {connections.email === 'connecting' ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>

        {/* Mono — Coming Soon */}
        <div className='flex items-center justify-between gap-4 border border-grey-10 rounded-2xl p-5 bg-[#fafafa] opacity-60'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-0.5'>
              <p className='text-sm font-semibold text-secondary-10'>Bank Account via Mono</p>
              <span className='text-[10px] font-semibold text-primary-30 bg-primary-50 rounded-full px-2 py-0.5 shrink-0'>
                Coming Soon
              </span>
            </div>
            <p className='text-xs text-secondary-30 leading-relaxed'>
              Real-time bank sync via Mono open banking — launching soon
            </p>
          </div>
          <button
            type='button'
            disabled
            className='shrink-0 border border-grey-10 bg-white text-secondary-30 text-sm font-medium px-4 py-2
              rounded-full cursor-not-allowed'>
            Soon
          </button>
        </div>

        {/* WhatsApp */}
        <div className='flex items-center justify-between gap-4 border border-grey-10 rounded-2xl p-5 bg-[#fafafa]'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-0.5'>
              <p className='text-sm font-semibold text-secondary-10'>WhatsApp Notifications</p>
              <span className='text-[10px] font-medium text-secondary-40 bg-grey-10/60 rounded-full px-2 py-0.5 shrink-0'>Optional</span>
            </div>
            <p className='text-xs text-secondary-30 leading-relaxed'>
              Get paid alerts, tax deadlines, and invoice confirmations on WhatsApp
            </p>
          </div>
          <a
            href='https://wa.me/your-taaxbro-number'
            target='_blank'
            rel='noopener noreferrer'
            className='shrink-0 border border-grey-10 bg-white text-secondary-10 text-sm font-medium px-4 py-2
              rounded-full hover:border-primary-30 hover:text-primary-30 transition-colors'>
            Connect
          </a>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep]               = useState(0);
  const [form, setForm]               = useState<FormData>(EMPTY);
  const [connections, setConnections] = useState<Connections>({ email: 'idle' });
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const router                        = useRouter();
  const { setUser, user }             = useAuth();

  // ── Redirect if already onboarded (WA users, or returning web users) ──────
  useEffect(() => {
    if (user?.onboarding_completed) router.replace('/overview');
  }, [user, router]);

  const setField = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Logo file pick ────────────────────────────────────────────────────────
  function handleLogoPick(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File too large — max 2MB');
      return;
    }
    setUploadError('');
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleLogoRemove() {
    setLogoFile(null);
    setLogoPreview(null);
    setUploadError('');
  }

  // ── Upload logo to backend ────────────────────────────────────────────────
  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/business/logo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        setUploadError('Logo upload failed — you can add it later in Settings.');
        return null;
      }
      const data = await res.json();
      return data.logo_url as string;
    } catch {
      setUploadError('Logo upload failed — you can add it later in Settings.');
      return null;
    } finally {
      setUploading(false);
    }
  }

  // ── Advance guard ─────────────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === 0) return !!form.user_type;
    if (step === 1) return !!form.business_name.trim() && !!form.business_type && !!form.state;
    return true; // logo and connections are optional
  }

  // ── Connect handler ───────────────────────────────────────────────────────
  async function handleConnect(key: keyof Connections) {
    setConnections((prev) => ({ ...prev, [key]: 'connecting' }));
    // Phase 2: real Google Gmail OAuth
    await new Promise((r) => setTimeout(r, 600));
    setConnections((prev) => ({ ...prev, [key]: 'connected' }));
  }

  // ── Submit (step 3 = logo, step 4 CTA) ───────────────────────────────────
  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      // Upload logo first (non-blocking — failures are swallowed with a warning)
      if (logoFile) await uploadLogo();

      const payload: OnboardingPayload = {
        user_type:     form.user_type,
        business_name: form.business_name,
        business_type: form.business_type,
        industry:      form.industry   || undefined,
        state:         form.state,
        tin:           form.tin        || undefined,
        rc_number:     form.rc_number  || undefined,
        nin:           form.nin        || undefined,
        vat_registered: false,
      };
      const updatedUser = await onboarding.complete(payload);
      setUser(updatedUser);
      router.push('/overview');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Skip from any step >= 1 ───────────────────────────────────────────────
  async function handleSkip() {
    if (step === 0) return; // step 0 requires a role selection
    setError('');
    setLoading(true);
    try {
      const payload: OnboardingPayload = {
        user_type:     form.user_type || 'business',
        business_name: form.business_name || (user?.full_name ?? 'My Business'),
        business_type: form.business_type || 'sole_proprietorship',
        state:         form.state || 'Lagos',
        vat_registered: false,
      };
      const updatedUser = await onboarding.complete(payload);
      setUser(updatedUser);
      router.push('/overview');
    } catch {
      // If skip fails, just redirect — don't block the user
      router.push('/overview');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const isLastStep = step === STEP_LABELS.length - 1;

  return (
    <div className='w-full max-w-[560px] mx-auto'>
      <div className='bg-white rounded-3xl border border-grey-10/80 shadow-sm px-8 py-9 md:px-12 md:py-10'>
        <StepTracker current={step} />

        <div className='min-h-[360px]'>
          {step === 0 && (
            <Step1 value={form.user_type} onChange={(v) => setField('user_type', v)} />
          )}
          {step === 1 && (
            <Step2 form={form} set={setField} />
          )}
          {step === 2 && (
            <Step3
              logoPreview={logoPreview}
              logoFile={logoFile}
              uploading={uploading}
              uploadError={uploadError}
              onPick={handleLogoPick}
              onRemove={handleLogoRemove}
            />
          )}
          {step === 3 && (
            <Step4 connections={connections} onConnect={handleConnect} />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className='mt-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-base shrink-0' />
            {error}
          </div>
        )}

        {/* Nav buttons */}
        <div className='flex items-center gap-3 mt-8'>
          {step > 0 && (
            <button
              type='button'
              onClick={() => { setError(''); setStep((s) => s - 1); }}
              className='border border-grey-10 text-secondary-10 text-sm font-medium px-6 py-3 rounded-full
                hover:border-secondary-20 transition-colors'>
              Back
            </button>
          )}

          {!isLastStep ? (
            <button
              type='button'
              disabled={!canAdvance()}
              onClick={() => { setError(''); setStep((s) => s + 1); }}
              className='flex-1 bg-primary-40 text-white text-sm font-medium rounded-full py-3
                hover:bg-primary-30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
              Continue
            </button>
          ) : (
            <button
              type='button'
              disabled={loading}
              onClick={handleSubmit}
              className='flex-1 flex items-center justify-center gap-2 bg-primary-40 text-white text-sm
                font-medium rounded-full py-3 hover:bg-primary-30 transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed'>
              {loading
                ? <Icon icon='ph:circle-notch' className='animate-spin text-base' />
                : 'Complete Setup'
              }
            </button>
          )}
        </div>

        {/* Skip link — visible from step 1 onward */}
        {step >= 1 && !loading && (
          <div className='text-center mt-4'>
            <button
              type='button'
              onClick={handleSkip}
              className='text-xs text-secondary-30 hover:text-secondary-10 transition-colors'>
              Skip for now → I'll finish this later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}