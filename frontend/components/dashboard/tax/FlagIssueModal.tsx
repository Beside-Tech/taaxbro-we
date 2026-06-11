'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  onClose: () => void;
  transactions: Array<{ id: string; date: string; desc: string; amount: string }>;
  period: string;
  authority: string;
}

export default function FlagIssueModal({ onClose, transactions, period, authority }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [issueType, setIssueType] = useState('Wrong transaction included');
  const [description, setDescription] = useState('');

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto'>
        <button
          onClick={onClose}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <h2 className='text-2xl font-bold text-secondary-10 mb-0.5'>Flag an Issue</h2>
        <p className='text-sm text-secondary-30 mb-5'>VAT Return {period} | {authority}</p>

        <div className='bg-primary-50 border border-primary-10 rounded-xl p-4 flex gap-3 mb-6'>
          <Icon icon='ph:info' className='text-secondary-30 shrink-0 mt-0.5' />
          <p className='text-xs text-secondary-30 leading-relaxed'>
            Flagging pauses this filing, it will not be submitted to {authority} until the flag is resolved or
            dismissed. Taaxbro will notify you to re-review once the issue is addressed.
          </p>
        </div>

        <div className='mb-5'>
          <label className='block text-sm text-secondary-10 mb-2'>Issue type</label>
          <div className='relative'>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors appearance-none bg-white text-secondary-10'
            >
              <option>Wrong transaction included</option>
              <option>Incorrect VAT rate</option>
              <option>Missing transaction</option>
              <option>Other</option>
            </select>
            <Icon icon='ph:caret-down' className='absolute right-4 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none' />
          </div>
        </div>

        <div className='mb-5'>
          <label className='block text-sm text-secondary-10 mb-2'>
            Affected Transaction <span className='text-secondary-30'>(Select all that apply)</span>
          </label>
          <div className='border border-grey-10 rounded-xl overflow-hidden'>
            <div className='bg-primary-40 text-white text-xs px-4 py-2.5 font-medium'>
              {transactions.length} transactions available to flag
            </div>
            {transactions.map((tx, i) => (
              <div
                key={i}
                onClick={() => toggle(i)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${i > 0 ? 'border-t border-grey-10' : ''} ${selected.includes(i) ? 'bg-primary-50/50' : 'hover:bg-grey-10/20'}`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${selected.includes(i) ? 'bg-primary-30 border-primary-30' : 'border-grey-10'}`}
                >
                  {selected.includes(i) && <Icon icon='ph:check-bold' className='text-white text-[10px]' />}
                </div>
                <div className='flex-1'>
                  <p className='text-sm text-secondary-10 font-medium'>
                    {tx.id} | {tx.date}
                  </p>
                  <p className='text-xs text-secondary-30'>{tx.desc}</p>
                </div>
                <span className='text-sm text-secondary-10 font-medium shrink-0'>{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='mb-5'>
          <label className='block text-sm text-secondary-10 mb-2'>Describe the Issue</label>
          <textarea
            rows={4}
            placeholder='Eg. This transaction was a refund not new revenue. The VAT on it should not be included'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40 resize-none'
          />
        </div>

        <div className='mb-7'>
          <label className='block text-sm text-secondary-10 mb-2'>
            Supporting Document <span className='text-secondary-30'>(Optional)</span>
          </label>
          <div className='border-2 border-dashed border-grey-10 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary-20 transition-colors cursor-pointer'>
            <Icon icon='ph:upload-simple' className='text-2xl text-secondary-30' />
            <p className='text-sm text-secondary-30'>Drop a file or click to upload</p>
            <p className='text-xs text-secondary-40'>(PNG, PDF, JPEG. Max 5mb)</p>
          </div>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 py-3 rounded-full border border-grey-10 text-sm font-medium text-secondary-10 hover:bg-primary-50 transition-colors'
          >
            Cancel
          </button>
          <button onClick={onClose} className='flex-[2] py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors'>
            Submit Flag - Pause Filing
          </button>
        </div>
      </div>
    </div>
  );
}
