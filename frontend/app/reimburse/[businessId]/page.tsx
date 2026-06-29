'use client';

import { useState, useRef } from 'react';
import { Icon } from '@iconify/react';

const CATEGORIES = [
  'meals',
  'transport',
  'utilities',
  'supplies',
  'accommodation',
  'software',
  'entertainment',
  'medical',
  'other',
];

type Step = 'form' | 'success';

interface Props {
  params: { businessId: string };
}

export default function ReimbursePublicPage({ params }: Props) {
  const { businessId } = params;

  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      setError('Please upload a JPEG, PNG, WebP or PDF file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10 MB.');
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Please enter your full name.');
    if (!phone.trim()) return setError('Please enter your phone number.');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return setError('Please enter a valid amount.');
    if (!category) return setError('Please select a category.');

    setSubmitting(true);
    try {
      // Build multipart form — backend corporate_expenses router accepts JSON
      // for claims. Receipt upload would be a separate field if the API supports it.
      const payload: Record<string, any> = {
        employee_name: name.trim(),
        employee_phone: phone.trim(),
        amount: Number(amount),
        category,
        description: description.trim() || undefined,
      };

      // If a file is attached, upload it first (using the expenses scan-ocr endpoint
      // just to get a stored URL, then set receipt_url). For now we attach as
      // base64 data URI so the backend can store it.
      if (file) {
        const reader = new FileReader();
        const dataUrl: string = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        payload.receipt_url = dataUrl;
      }

      const res = await fetch(`/api/v1/corporate/claims?business_id=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail ?? `Server error ${res.status}`);
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#fafafa] to-[#f0eeff] flex items-center justify-center p-4'>
        <div className='max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-grey-10 text-center'>
          <div className='w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5'>
            <Icon icon='ph:check-circle-duotone' className='text-4xl text-success' />
          </div>
          <h2 className='text-2xl font-bold text-secondary-10 mb-2'>Claim Submitted!</h2>
          <p className='text-sm text-secondary-30 leading-relaxed mb-6'>
            Your expense claim has been submitted successfully. Your employer will review it and
            get back to you via WhatsApp or email.
          </p>
          <button
            onClick={() => {
              setStep('form');
              setName(''); setPhone(''); setAmount(''); setCategory('');
              setDescription(''); setFile(null);
            }}
            className='w-full bg-primary-30 hover:bg-primary-40 text-white rounded-full px-6 py-3 text-sm font-semibold transition-colors'
          >
            Submit Another Claim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#fafafa] to-[#f0eeff] flex items-center justify-center p-4'>
      <div className='max-w-lg w-full'>
        {/* Header */}
        <div className='text-center mb-8'>
          <img src='/assets/StackedLogo.png' alt='Taaxbro' className='h-10 mx-auto mb-5' />
          <h1 className='text-2xl font-bold text-secondary-10 mb-1'>Submit an Expense Claim</h1>
          <p className='text-sm text-secondary-30'>
            Fill in the details below and attach your receipt. Your manager will review and approve
            the claim.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className='bg-white rounded-3xl border border-grey-10 shadow-xl p-6 sm:p-8 space-y-5'
        >
          {/* Error alert */}
          {error && (
            <div className='flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3'>
              <Icon icon='ph:warning-circle' className='shrink-0 text-lg' />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className='block text-xs font-semibold text-secondary-20 mb-1.5 uppercase tracking-wide'>
              Full Name <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <Icon
                icon='ph:user'
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-30'
              />
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Your full name'
                className='w-full border border-grey-10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className='block text-xs font-semibold text-secondary-20 mb-1.5 uppercase tracking-wide'>
              Phone Number <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <Icon
                icon='ph:phone'
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-30'
              />
              <input
                type='tel'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='+234 800 000 0000'
                className='w-full border border-grey-10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
              />
            </div>
          </div>

          {/* Amount + Category */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1.5 uppercase tracking-wide'>
                Amount (₦) <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-30 text-sm font-semibold'>
                  ₦
                </span>
                <input
                  type='number'
                  min='1'
                  step='0.01'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder='0.00'
                  className='w-full border border-grey-10 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
                />
              </div>
            </div>
            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1.5 uppercase tracking-wide'>
                Category <span className='text-red-500'>*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-3 py-3 text-sm outline-none focus:border-primary-30 transition-colors text-secondary-10 appearance-none capitalize'
              >
                <option value=''>Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className='capitalize'>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className='block text-xs font-semibold text-secondary-20 mb-1.5 uppercase tracking-wide'>
              Description <span className='text-secondary-40 font-normal'>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='What was the expense for?'
              rows={2}
              className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40 resize-none'
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className='block text-xs font-semibold text-secondary-20 mb-1.5 uppercase tracking-wide'>
              Receipt <span className='text-secondary-40 font-normal'>(optional)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0] ?? null);
              }}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary-30 bg-primary-50'
                  : file
                  ? 'border-success bg-green-50'
                  : 'border-grey-10 hover:border-primary-30/60 hover:bg-primary-50/50'
              }`}
            >
              <input
                ref={fileRef}
                type='file'
                accept='image/*,application/pdf'
                className='hidden'
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className='flex items-center justify-center gap-2'>
                  <Icon icon='ph:check-circle' className='text-2xl text-success' />
                  <div className='text-left'>
                    <p className='text-sm font-medium text-secondary-10'>{file.name}</p>
                    <p className='text-xs text-secondary-30'>
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className='ml-2 text-secondary-30 hover:text-danger transition-colors'
                  >
                    <Icon icon='ph:x-circle' className='text-lg' />
                  </button>
                </div>
              ) : (
                <>
                  <Icon
                    icon='ph:cloud-arrow-up-duotone'
                    className='text-4xl text-primary-30/50 mx-auto mb-2'
                  />
                  <p className='text-sm text-secondary-20 font-medium'>
                    Drag & drop or <span className='text-primary-30'>browse</span>
                  </p>
                  <p className='text-xs text-secondary-40 mt-1'>
                    JPEG, PNG, WebP or PDF — max 10 MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={submitting}
            className='w-full flex items-center justify-center gap-2 bg-primary-30 hover:bg-primary-40 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-full px-6 py-3.5 text-sm font-semibold transition-colors shadow-md shadow-primary-30/20'
          >
            {submitting ? (
              <>
                <Icon icon='ph:circle-notch' className='animate-spin text-base' />
                Submitting…
              </>
            ) : (
              <>
                <Icon icon='ph:paper-plane-right' />
                Submit Claim
              </>
            )}
          </button>

          <p className='text-center text-xs text-secondary-40'>
            Powered by{' '}
            <a
              href='https://taaxbro.com'
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary-30 font-medium'
            >
              Taaxbro
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
