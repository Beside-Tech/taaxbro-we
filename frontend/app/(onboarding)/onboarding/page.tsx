'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { onboarding, type OnboardingPayload, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ─── Constants ───────────────────────────────────────────────────────────────

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership',         label: 'Partnership' },
  { value: 'limited_liability',   label: 'Limited Liability Company (LLC)' },
  { value: 'ngo',                 label: 'NGO / Non-Profit' },
  { value: 'other',               label: 'Other' },
];

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({
  label, required, children, hint,
}: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-sm font-medium text-secondary-10'>
        {label} {required && <span className='text-danger'>*</span>}
      </label>
      {children}
      {hint && <p className='text-xs text-secondary-30'>{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm text-secondary-10 focus:outline-none focus:ring-2 focus:ring-primary-30 focus:border-primary-30 transition placeholder:text-secondary-40'
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  const { placeholder, children, ...rest } = props;
  return (
    <select
      {...rest}
      className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm text-secondary-10 bg-white focus:outline-none focus:ring-2 focus:ring-primary-30 focus:border-primary-30 transition appearance-none'>
      {placeholder && <option value=''>{placeholder}</option>}
      {children}
    </select>
  );
}

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className='flex items-center gap-2 mb-8'>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current ? 'w-6 bg-primary-40' : i === current ? 'w-8 bg-primary-30' : 'w-6 bg-grey-10'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormData = Omit<OnboardingPayload, 'vat_registered'> & { vat_registered: boolean };

const EMPTY: FormData = {
  full_name: '',
  phone: '',
  business_name: '',
  business_type: '',
  state: '',
  tin: '',
  rc_number: '',
  vat_registered: false,
  vat_registration_no: '',
};

export default function OnboardingPage() {
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState<FormData>(EMPTY);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router                  = useRouter();
  const { setUser }             = useAuth();

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Step validation ────────────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === 0) return !!form.full_name.trim() && !!form.phone.trim();
    if (step === 1) return !!form.business_name.trim() && !!form.business_type && !!form.state;
    return true; // step 2 is all optional
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const payload: OnboardingPayload = {
        ...form,
        tin:                  form.tin || undefined,
        rc_number:            form.rc_number || undefined,
        vat_registration_no:  form.vat_registration_no || undefined,
      };
      const user = await onboarding.complete(payload);
      setUser(user);
      router.push('/overview');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Steps ──────────────────────────────────────────────────────────────────
  const steps = [
    {
      title: 'Welcome to Taaxbro',
      subtitle: "Let's start with your personal details.",
      content: (
        <div className='space-y-4'>
          <Field label='Your Full Name' required>
            <Input
              placeholder='e.g. Adaeze Nwosu'
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
            />
          </Field>
          <Field label='Phone Number' required hint='Used for WhatsApp notifications'>
            <Input
              placeholder='e.g. 08012345678'
              type='tel'
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </Field>
        </div>
      ),
    },
    {
      title: 'Tell us about your business',
      subtitle: 'This helps us set up your tax profile correctly.',
      content: (
        <div className='space-y-4'>
          <Field label='Business Name' required>
            <Input
              placeholder='e.g. Nwosu Ventures Ltd'
              value={form.business_name}
              onChange={(e) => set('business_name', e.target.value)}
            />
          </Field>
          <Field label='Business Type' required>
            <Select
              placeholder='Select business type'
              value={form.business_type}
              onChange={(e) => set('business_type', e.target.value)}>
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <Field label='State of Operation' required>
            <Select
              placeholder='Select state'
              value={form.state}
              onChange={(e) => set('state', e.target.value)}>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
      ),
    },
    {
      title: 'Tax & Compliance',
      subtitle: 'Optional — you can always add these later in Settings.',
      content: (
        <div className='space-y-4'>
          <Field label='Tax Identification Number (TIN)' hint='Your FIRS-issued TIN'>
            <Input
              placeholder='e.g. 1234567890'
              value={form.tin}
              onChange={(e) => set('tin', e.target.value)}
            />
          </Field>
          <Field label='RC Number' hint='CAC Registration Number (for registered companies)'>
            <Input
              placeholder='e.g. RC1234567'
              value={form.rc_number}
              onChange={(e) => set('rc_number', e.target.value)}
            />
          </Field>
          <Field label='VAT Registration'>
            <label className='flex items-center gap-3 cursor-pointer'>
              <div
                onClick={() => set('vat_registered', !form.vat_registered)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                  form.vat_registered ? 'bg-primary-40' : 'bg-grey-10'
                }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.vat_registered ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
              <span className='text-sm text-secondary-20'>
                {form.vat_registered ? 'Registered for VAT' : 'Not VAT registered'}
              </span>
            </label>
          </Field>
          {form.vat_registered && (
            <Field label='VAT Registration Number'>
              <Input
                placeholder='e.g. 12345678-0001'
                value={form.vat_registration_no}
                onChange={(e) => set('vat_registration_no', e.target.value)}
              />
            </Field>
          )}
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className='w-full max-w-lg'>
      {/* Card */}
      <div className='bg-white rounded-2xl border border-grey-10 shadow-sm p-8'>
        {/* Logo */}
        <img src='/assets/StackedLogo.png' alt='Taaxbro' className='h-12 mb-6' />

        <StepDots current={step} total={steps.length} />

        <h1 className='text-2xl font-bold text-secondary-10 mb-1'>{currentStep.title}</h1>
        <p className='text-sm text-secondary-30 mb-6'>{currentStep.subtitle}</p>

        {currentStep.content}

        {error && (
          <div className='mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className='flex items-center justify-between mt-8 gap-3'>
          {step > 0 ? (
            <button
              type='button'
              onClick={() => setStep((s) => s - 1)}
              className='flex items-center gap-1.5 text-sm text-secondary-20 hover:text-secondary-10 transition-colors'>
              <Icon icon='ph:arrow-left' />
              Back
            </button>
          ) : (
            <div />
          )}

          {isLast ? (
            <button
              type='button'
              disabled={loading}
              onClick={handleSubmit}
              className='flex-1 flex items-center justify-center gap-2 bg-primary-40 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'>
              {loading ? (
                <Icon icon='ph:circle-notch' className='animate-spin text-lg' />
              ) : (
                <>
                  Get Started <Icon icon='ph:arrow-right' />
                </>
              )}
            </button>
          ) : (
            <button
              type='button'
              disabled={!canAdvance()}
              onClick={() => setStep((s) => s + 1)}
              className='flex-1 flex items-center justify-center gap-2 bg-primary-40 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
              Continue <Icon icon='ph:arrow-right' />
            </button>
          )}
        </div>
      </div>

      <p className='text-center text-xs text-secondary-30 mt-4'>
        Step {step + 1} of {steps.length}
      </p>
    </div>
  );
}