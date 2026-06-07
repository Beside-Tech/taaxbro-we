'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  onClose: () => void;
}

const initialRows = [
  { category: 'Good Sales', vat: 112875, txns: 57 },
  { category: 'Good Sales', vat: 112875, txns: 57 },
  { category: 'Good Sales', vat: 112875, txns: 57 },
  { category: 'Good Sales', vat: 112875, txns: 57 },
];

export default function EditVATModal({ onClose }: Props) {
  const [rows, setRows] = useState(initialRows.map((r) => ({ ...r, edited: false })));

  const total = rows.reduce((s, r) => s + r.vat, 0);

  const updateVat = (i: number, val: string) => {
    const n = Number(val.replace(/,/g, ''));
    if (isNaN(n)) return;
    setRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, vat: n, edited: n !== initialRows[i].vat } : r
      )
    );
  };

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto'>
        <button
          onClick={onClose}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <h2 className='text-2xl font-bold text-secondary-10 mb-1'>Edit VAT Return - May 2026</h2>
        <p className='text-sm text-secondary-30 mb-5'>
          Changes trigger a re-computation. The result stays in draft until you re-approve
        </p>

        <div className='bg-primary-50 border border-primary-10 rounded-xl p-4 flex gap-3 mb-6'>
          <Icon icon='ph:info' className='text-secondary-30 shrink-0 mt-0.5' />
          <p className='text-xs text-secondary-30 leading-relaxed'>
            You can adjust VAT collected per category if a transaction was mis-categorised
          </p>
        </div>

        <div className='border border-grey-10 rounded-xl overflow-hidden mb-5'>
          <div className='grid grid-cols-4 bg-primary-40 text-white text-xs px-4 py-3 font-medium'>
            <span>Category</span>
            <span>VAT Collected (₦)</span>
            <span>Transactions</span>
            <span>Change</span>
          </div>
          {rows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-4 items-center px-4 py-3.5 text-sm ${i > 0 ? 'border-t border-grey-10' : ''}`}
            >
              <span className='text-secondary-10'>{row.category}</span>
              <input
                type='text'
                value={row.vat.toLocaleString()}
                onChange={(e) => updateVat(i, e.target.value)}
                className='border border-grey-10 rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-10 outline-none focus:border-primary-30 w-28 transition-colors'
              />
              <span className='text-secondary-30'>{row.txns}</span>
              <span className={`font-medium ${row.edited ? 'text-success' : 'text-secondary-30 hover:text-primary-30 cursor-pointer'}`}>
                {row.edited ? 'Edited' : 'Change'}
              </span>
            </div>
          ))}

          <div className='px-4 py-4 border-t border-grey-10 bg-primary-50/40'>
            <div className='flex justify-between items-start'>
              <div>
                <p className='text-sm font-semibold text-secondary-10'>Recomputed Net VAT Payable</p>
                <p className='text-xs text-secondary-30 mt-0.5'>Updates as you edit values</p>
              </div>
              <span className='text-primary-30 font-bold text-base'>
                ₦{total.toLocaleString()}.55
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 py-3 rounded-full border border-grey-10 text-sm font-medium text-secondary-10 hover:bg-primary-50 transition-colors flex items-center justify-center gap-1.5'
          >
            <Icon icon='ph:arrows-counter-clockwise' />
            Cancel & Keep Changes
          </button>
          <button className='flex-[1.5] py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors flex items-center justify-center gap-1.5'>
            Save & Recompute <Icon icon='ph:arrows-counter-clockwise' />
          </button>
        </div>
      </div>
    </div>
  );
}
