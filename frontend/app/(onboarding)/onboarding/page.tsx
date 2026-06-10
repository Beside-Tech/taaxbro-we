'use client';

/**
 * Web onboarding wizard — runs once after email verification.
 *
 * Step 1 — Who are you?          (role selection)
 * Step 2 — Business Details       (name / type / industry / state + TIN / CAC / NIN)
 * Step 3 — Connect Accounts       (Mono bank, email OAuth, WhatsApp notify)
 *
 * On completion: POST /api/v1/onboarding → redirects to /overview.
 *
 * WhatsApp users who registered via the WA wizard skip this page entirely
 * because their Business record is already created; they land on /overview
 * directly (onboarding_completed may still be false for them — the WA path
 * sets it to true via its own route on first profile completion).
 */

import { useEffect, useState } from 'react';
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
    label: "I'm a freelancer",
    description: 'Self-employed, sole trader, or FX earner',
  },
  {
    value: 'tax_professional',
    icon: 'ph:scales-fill',
    label: "I'm a tax professional",
    description: 'Accountant managing multiple client businesses',
  },
];

const STEP_LABELS = ['Who are you?', 'Tax Identity/Business Details', 'Connect Accounts'];

// ─── Form state ────────────────────────────────────────────────────────────────

interface FormData {
  user_type:    string;
  business_name: string;
  business_type: string;
  industry:      string;
  state:         string;
  tin:           string;
  rc_number:     string;
  nin:           string;
}

const EMPTY: FormData = {
  user_type:    '',
  business_name: '',
  business_type: '',
  industry:      '',
  state:         '',
  tin:           '',
  rc_number:     '',
  nin:           '',
};

// Connection state — tracks which integrations the user has initiated.
// The actual OAuth / Mono widget completes out-of-band; we mark "connecting"
// optimistically. Real status is confirmed server-side on /overview load.
interface Connections {
  bank:      'idle' | 'connecting' | 'connected';
  email:     'idle' | 'connecting' | 'connected';
  whatsapp:  'idle' | 'connecting' | 'connected';
}

// ─── Shared field components ───────────────────────────────────────────────────

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-sm font-medium text-secondary-10'>{children}</span>
      {hint && <span className='text-xs text-secondary-30 -mt-0.5'>{hint}</span>}
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
          transition appearance-none'>
        {placeholder && <option value=''>{placeholder}</option>}
        {children}
      </select>
      <Icon icon='ph:caret-down' className='absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-sm' />
    </div>
  );
}

// ─── Step progress tracker ─────────────────────────────────────────────────────

function StepTracker({ current }: { current: number }) {
  return (
    <div className='flex items-start mb-10'>
      {STEP_LABELS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className='flex flex-col items-center flex-1 relative'>
            {/* connector line — sits behind the circles */}
            {i > 0 && (
              <div
                className={`absolute top-[18px] h-0.5 transition-colors ${done ? 'bg-primary-40' : 'bg-grey-10'}`}
                style={{ left: 'calc(-50% + 18px)', right: 'calc(50% + 18px)' }}
              />
            )}
            {/* circle */}
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
              transition-all ${done || active ? 'bg-primary-40 text-white' : 'bg-white border-2 border-grey-10 text-secondary-30'}`}>
              {done ? <Icon icon='ph:check-bold' className='text-sm' /> : i + 1}
            </div>
            <span className={`mt-2 text-[11px] text-center leading-tight px-1 ${active ? 'font-medium text-secondary-10' : 'text-secondary-30'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Who are you? ──────────────────────────────────────────────────────

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

// ─── Step 2: Business Details + Tax Identification ─────────────────────────────

function Step2({ form, set }: { form: FormData; set(k: keyof FormData, v: string): void }) {
  const isFreelancer = form.user_type === 'freelancer';
  return (
    <>
      <h1 className='text-[26px] font-bold text-secondary-10 mb-1'>Business Details</h1>
      <p className='text-sm text-secondary-30 mb-6 leading-relaxed'>
        These fields determine your applicable tax types and auto-fill your invoices and filings.
      </p>

      <div className='space-y-4'>
        <div className='flex flex-col gap-1.5'>
          <Label>Business Name</Label>
          <Inp
            placeholder={isFreelancer ? 'e.g. Adaeze Nwosu Consulting' : 'e.g. Daniel Incorporated'}
            value={form.business_name}
            onChange={(e) => set('business_name', e.target.value)}
          />
        </div>

        <div className='grid grid-cols-2 gap-3'>
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
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-1.5'>
            <Label>Country of Operation</Label>
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

      {/* Tax Identification */}
      <div className='mt-8 mb-6'>
        <h2 className='text-xl font-bold text-secondary-10 mb-1'>Tax Identification</h2>
        <p className='text-sm text-secondary-30 leading-relaxed'>
          Required by NRS to file VAT and CIT returns on your behalf. You can skip and add this
          later in Compliance Hub
        </p>
      </div>

      <div className='space-y-4'>
        <div className='flex flex-col gap-1.5'>
          <Label>Tax Identification Number (TIN)</Label>
          <Inp
            placeholder='eg. 123-223-223'
            value={form.tin}
            onChange={(e) => set('tin', e.target.value)}
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <Label>CAC Registration Number</Label>
          <Inp
            placeholder='eg. RC 123456'
            value={form.rc_number}
            onChange={(e) => set('rc_number', e.target.value)}
          />
        </div>

        {/* NIN only shown for freelancers */}
        {isFreelancer && (
          <div className='flex flex-col gap-1.5'>
            <Label>NIN (Freelancers)</Label>
            <Inp
              placeholder='11 Digit National Identification Number'
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

// ─── Step 3: Connect Accounts ──────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    key:         'bank' as const,
    label:       'Bank Account',
    description: 'Real-time sync via Mono open banking',
    counted:     true,  // counts toward the "X out of 2 Connected" required total
  },
  {
    key:         'email' as const,
    label:       'Email Inbox',
    description: 'Auto-detect invoices & payment confirmations',
    counted:     true,
  },
  {
    key:         'whatsapp' as const,
    label:       'Whatsapp (Optional)',
    description: 'Get notified the moment a customer pays you. Tax deadlines, invoice alerts, and compliance updates – straight to WhatsApp.',
    counted:     false,
  },
];

function Step3({
  connections,
  onConnect,
}: {
  connections: Connections;
  onConnect(key: keyof Connections): void;
}) {
  const connectedCount = (['bank', 'email'] as const)
    .filter((k) => connections[k] === 'connected').length;

  return (
    <>
      <h1 className='text-[28px] font-bold text-center text-secondary-10 leading-tight mb-2'>
        Connect Accounts
      </h1>
      <p className='text-sm text-secondary-30 text-center mb-8 leading-relaxed'>
        Select what to connect now. Everything can be added or removed<br />later in Integrations.
      </p>

      <div className='space-y-3'>
        {INTEGRATIONS.map((intg) => {
          const status = connections[intg.key];
          return (
            <div
              key={intg.key}
              className='flex items-center justify-between gap-4 border border-grey-10 rounded-2xl p-5 bg-[#fafafa]'>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold text-secondary-10'>{intg.label}</p>
                <p className='text-xs text-secondary-30 mt-1 leading-relaxed'>{intg.description}</p>
              </div>

              {status === 'connected' ? (
                <div className='shrink-0 flex items-center gap-1.5 bg-success text-white text-sm font-medium px-4 py-2 rounded-full'>
                  <Icon icon='ph:check' />
                  Connected
                </div>
              ) : (
                <button
                  type='button'
                  onClick={() => onConnect(intg.key)}
                  disabled={status === 'connecting'}
                  className='shrink-0 border border-grey-10 bg-white text-secondary-10 text-sm font-medium px-4 py-2
                    rounded-full hover:border-primary-30 hover:text-primary-30 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'>
                  {status === 'connecting' && (
                    <Icon icon='ph:circle-notch' className='animate-spin text-base' />
                  )}
                  {status === 'connecting' ? 'Connecting…' : 'Connect'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className='mt-6 pt-5 border-t border-grey-10'>
        <p className='text-sm font-medium text-secondary-10'>
          {connectedCount} out of 2 Connected
        </p>
      </div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep]               = useState(0);
  const [form, setForm]               = useState<FormData>(EMPTY);
  const [connections, setConnections] = useState<Connections>({ bank: 'idle', email: 'idle', whatsapp: 'idle' });
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const router                        = useRouter();
  const { setUser, user }             = useAuth();

  // If already onboarded (e.g. WA user who somehow lands here), skip straight to overview
  useEffect(() => {
    if (user?.onboarding_completed) router.replace('/overview');
  }, [user, router]);

  const setField = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Advance guard ────────────────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === 0) return !!form.user_type;
    if (step === 1) return !!form.business_name.trim() && !!form.business_type && !!form.state;
    return true; // step 2: connections are opt-in; CTA becomes "Complete Verification"
  }

  // ── Connect handler ──────────────────────────────────────────────────────────
  async function handleConnect(key: keyof Connections) {
    setConnections((prev) => ({ ...prev, [key]: 'connecting' }));

    if (key === 'bank') {
      // Launch Mono Connect widget
      // The widget calls back with a `code`; exchange via POST /api/v1/mono/connect
      // For now, open Mono Connect in a popup (real implementation wires the JS SDK)
      try {
        const { MonoConnect } = await import('@mono.co/connect.js').catch(() => ({ MonoConnect: null }));
        if (MonoConnect) {
          const mono = new MonoConnect({
            key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY ?? '',
            scope: 'auth',
            onSuccess: async ({ code }: { code: string }) => {
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/mono/connect`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code }),
                });
                if (res.ok) {
                  setConnections((prev) => ({ ...prev, bank: 'connected' }));
                } else {
                  setConnections((prev) => ({ ...prev, bank: 'idle' }));
                }
              } catch {
                setConnections((prev) => ({ ...prev, bank: 'idle' }));
              }
            },
            onClose: () => setConnections((prev) => ({ ...prev, bank: 'idle' })),
          });
          mono.open();
        } else {
          // Mono SDK not available in this environment — mark connected for now
          // (remove this fallback once @mono.co/connect.js is installed)
          await new Promise((r) => setTimeout(r, 800));
          setConnections((prev) => ({ ...prev, bank: 'connected' }));
        }
      } catch {
        setConnections((prev) => ({ ...prev, bank: 'idle' }));
      }
      return;
    }

    if (key === 'email') {
      // Phase 2: Google OAuth for Gmail read-only
      // For now: stub
      await new Promise((r) => setTimeout(r, 600));
      setConnections((prev) => ({ ...prev, email: 'connected' }));
      return;
    }

    if (key === 'whatsapp') {
      // Redirect to settings page where WA integration lives
      // or open a mini-modal with the WA connect flow
      await new Promise((r) => setTimeout(r, 400));
      setConnections((prev) => ({ ...prev, whatsapp: 'connected' }));
      return;
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const payload: OnboardingPayload = {
        user_type:    form.user_type,
        business_name: form.business_name,
        business_type: form.business_type,
        industry:      form.industry   || undefined,
        state:         form.state,
        tin:           form.tin        || undefined,
        rc_number:     form.rc_number  || undefined,
        nin:           form.nin        || undefined,
        vat_registered: false, // collected later in Compliance Hub
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className='w-full max-w-[560px] mx-auto'>
      <div className='bg-white rounded-3xl border border-grey-10/80 shadow-sm px-8 py-9 md:px-12 md:py-10'>
        <StepTracker current={step} />

        <div className='min-h-[380px]'>
          {step === 0 && (
            <Step1 value={form.user_type} onChange={(v) => setField('user_type', v)} />
          )}
          {step === 1 && (
            <Step2 form={form} set={setField} />
          )}
          {step === 2 && (
            <Step3 connections={connections} onConnect={handleConnect} />
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
                hover:border-secondary-20 hover:text-secondary-10 transition-colors'>
              Back
            </button>
          )}

          {step < 2 ? (
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
                : 'Complete Verification'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}