'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  onClose: () => void;
  onSubmit: (reference: string, amount: number) => Promise<void>;
  computedAmount: number;
  taxType: string;
  period: string;
  authority: string;
}

export default function RecordFilingModal({
  onClose,
  onSubmit,
  computedAmount,
  taxType,
  period,
  authority,
}: Props) {
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(computedAmount.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError('Receipt Reference / NRS number is required');
      return;
    }
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(reference, parsedAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record filing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto shadow-xl border border-grey-10/40'>
        <button
          onClick={onClose}
          disabled={loading}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors disabled:opacity-50'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <h2 className='text-2xl font-bold text-secondary-10 mb-0.5'>Record Tax Filing</h2>
        <p className='text-sm text-secondary-30 mb-5 uppercase font-semibold tracking-wider text-primary-30'>
          {taxType} Return | {period} | {authority}
        </p>

        {error && (
          <div className='mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-base shrink-0' />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-sm font-medium text-secondary-10 mb-1.5'>
              Filing Amount (₦)
            </label>
            <input
              type='number'
              step='0.01'
              min='0'
              value={amount}
              disabled={loading}
              onChange={(e) => setAmount(e.target.value)}
              className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors disabled:bg-grey-10/20 text-secondary-10 font-semibold'
              placeholder='0.00'
            />
            <p className='text-xs text-secondary-40 mt-1'>
              Pre-filled with computed net liability. Use 0.00 for Nil Returns.
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-secondary-10 mb-1.5'>
              Receipt Reference / NRS Number
            </label>
            <input
              type='text'
              value={reference}
              disabled={loading}
              onChange={(e) => setReference(e.target.value)}
              className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors disabled:opacity-50 text-secondary-10'
              placeholder='e.g. NRS-202606-987654'
              required
            />
            <p className='text-xs text-secondary-40 mt-1'>
              Enter the official reference number received from {authority}.
            </p>
          </div>

          <div className='flex gap-3 pt-3'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='flex-1 py-3 rounded-full border border-grey-10 text-sm font-medium text-secondary-10 hover:bg-primary-50 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-[2] py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-30/50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <>
                  <Icon icon='line-md:loading-twotone-loop' className='text-lg' />
                  Recording...
                </>
              ) : (
                'Confirm Filing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
