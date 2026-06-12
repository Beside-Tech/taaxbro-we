'use client';

import { Icon } from '@iconify/react';

type TransactionRow = {
  id: string;
  transaction_date: string;
  type: string;
  counterparty_name?: string | null;
  bank_name?: string | null;
  amount: number;
  vat_amount?: number | null;
  category?: string | null;
};

interface Props {
  transaction: TransactionRow;
  onClose: () => void;
}

function formatNaira(value: number): string {
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function ViewTransactionModal({ transaction, onClose }: Props) {
  const isCredit = transaction.type === 'credit';
  const dateObj = new Date(transaction.transaction_date);
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in'>
      <div className='bg-white rounded-3xl p-8 w-full max-w-md relative border border-grey-10 shadow-xl'>
        <button
          onClick={onClose}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <div className='flex flex-col items-center text-center space-y-3 mb-6'>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
            <Icon icon={isCredit ? 'ph:arrow-down-left-bold' : 'ph:arrow-up-right-bold'} className='text-2xl' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-secondary-10'>Transaction Details</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${isCredit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isCredit ? 'Money In (Credit)' : 'Money Out (Debit)'}
            </span>
          </div>
          <p className={`text-2xl font-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
            {isCredit ? '+' : '-'}{formatNaira(Number(transaction.amount))}
          </p>
        </div>

        <div className='border border-grey-10 rounded-2xl overflow-hidden mb-6 bg-grey-0'>
          {[
            { label: 'Counterparty', value: transaction.counterparty_name || 'General Transaction' },
            { label: 'Bank Name', value: transaction.bank_name || 'N/A' },
            { label: 'Category', value: transaction.category || 'Uncategorized' },
            { label: 'Date', value: formattedDate },
            { label: 'Time', value: formattedTime },
            { label: 'VAT Amount', value: transaction.vat_amount ? formatNaira(Number(transaction.vat_amount)) : '—' },
            { label: 'Status', value: 'Reconciled' },
          ].map((row, i) => (
            <div key={row.label} className={`flex justify-between px-4 py-3 text-sm ${i > 0 ? 'border-t border-grey-10/50' : ''}`}>
              <span className='text-secondary-30'>{row.label}</span>
              <span className='text-secondary-10 font-semibold text-right'>{row.value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className='w-full py-3 bg-primary-30 hover:bg-primary-40 text-white rounded-full text-sm font-bold transition-all shadow-sm'
        >
          Close
        </button>
      </div>
    </div>
  );
}
