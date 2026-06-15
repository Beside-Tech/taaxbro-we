'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  onClose: () => void;
  onSubmit: (issueType: string, description: string, affectedTransactionIds?: string[]) => Promise<void>;
  transactions: Array<{ id: string; displayId: string; date: string; desc: string; amount: string }>;
  period: string;
  authority: string;
}

export default function FlagIssueModal({ onClose, onSubmit, transactions, period, authority }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [issueType, setIssueType] = useState('Wrong transaction included');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const affectedIds = selected.map((idx) => transactions[idx].id);
      await onSubmit(issueType, description, affectedIds);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit flag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto shadow-xl border border-grey-10/40'>
        <button
          onClick={onClose}
          disabled={loading}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors disabled:opacity-50'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <h2 className='text-2xl font-bold text-secondary-10 mb-0.5'>Flag an Issue</h2>
        <p className='text-sm text-secondary-30 mb-5 uppercase font-semibold tracking-wider text-primary-30'>
          VAT Return {period} | {authority}
        </p>

        {error && (
          <div className='mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-base shrink-0' />
            {error}
          </div>
        )}

        <div className='bg-primary-50 border border-primary-10 rounded-xl p-4 flex gap-3 mb-6'>
          <Icon icon='ph:info' className='text-secondary-30 shrink-0 mt-0.5' />
          <p className='text-xs text-secondary-30 leading-relaxed'>
            Flaging pauses this filing. It will not be submitted to {authority} until the flag is resolved or
            dismissed. Taaxbro will notify you to re-review once the issue is addressed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-sm text-secondary-10 mb-2 font-medium'>Issue type</label>
            <div className='relative'>
              <select
                value={issueType}
                disabled={loading}
                onChange={(e) => setIssueType(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors appearance-none bg-white text-secondary-10 font-medium'
              >
                <option>Wrong transaction included</option>
                <option>Incorrect VAT rate</option>
                <option>Missing transaction</option>
                <option>Other</option>
              </select>
              <Icon icon='ph:caret-down' className='absolute right-4 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none' />
            </div>
          </div>

          <div>
            <label className='block text-sm text-secondary-10 mb-2 font-medium'>
              Affected Transaction <span className='text-secondary-30 font-normal'>(Select all that apply)</span>
            </label>
            <div className='border border-grey-10 rounded-xl overflow-hidden max-h-48 overflow-y-auto'>
              <div className='bg-primary-40 text-white text-xs px-4 py-2.5 font-medium sticky top-0 z-10'>
                {transactions.length} transactions available to flag
              </div>
              {transactions.length === 0 ? (
                <div className='py-6 text-center text-xs text-secondary-30 bg-grey-10/10'>
                  No transactions available to select.
                </div>
              ) : (
                transactions.map((tx, i) => (
                  <div
                    key={tx.id}
                    onClick={() => !loading && toggle(i)}
                    className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${i > 0 ? 'border-t border-grey-10' : ''} ${selected.includes(i) ? 'bg-primary-50/50' : 'hover:bg-grey-10/20'} ${loading ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${selected.includes(i) ? 'bg-primary-30 border-primary-30' : 'border-grey-10'}`}
                    >
                      {selected.includes(i) && <Icon icon='ph:check-bold' className='text-white text-[10px]' />}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm text-secondary-10 font-medium truncate'>
                        {tx.displayId} | {tx.date}
                      </p>
                      <p className='text-xs text-secondary-30 truncate'>{tx.desc}</p>
                    </div>
                    <span className='text-sm text-secondary-10 font-medium shrink-0'>{tx.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className='block text-sm text-secondary-10 mb-2 font-medium'>Describe the Issue</label>
            <textarea
              rows={4}
              required
              placeholder='Eg. This transaction was a refund not new revenue. The VAT on it should not be included'
              value={description}
              disabled={loading}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40 resize-none text-secondary-10'
            />
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
              className='flex-[2] py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-30/50 disabled:cursor-not-allowed shadow-md'
            >
              {loading ? (
                <>
                  <Icon icon='line-md:loading-twotone-loop' className='text-lg' />
                  Submitting Flag...
                </>
              ) : (
                'Submit Flag - Pause Filing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
