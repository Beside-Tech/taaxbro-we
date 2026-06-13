'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { invoices } from '@/lib/api';

interface LogPaymentModalProps {
  invoice: any;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function formatNaira(value: number): string {
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function LogPaymentModal({ invoice, businessId, onClose, onSuccess }: LogPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Safely calculate balance due from invoice details
  const totalAmount = invoice.total_amount ?? invoice.amount ?? 0;
  const currentPaid = invoice.amount_paid ?? 0;
  const balanceDue = Math.max(0, totalAmount - currentPaid);

  useEffect(() => {
    // Prefill the input with the remaining balance due
    setAmount(String(balanceDue));
  }, [balanceDue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid payment amount.');
      return;
    }
    if (Number(amount) > balanceDue + 0.01) {
      setErrorMsg(`Payment amount cannot exceed the balance due of ${formatNaira(balanceDue)}.`);
      return;
    }
    if (!paymentDate) {
      setErrorMsg('Payment date is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      await invoices.logPayment(businessId, invoice.id, {
        amount: Number(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to log payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const invoiceNum = invoice.invoice_number ?? `INV-${invoice.id.substring(0, 4).toUpperCase()}`;

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-md relative shadow-xl border border-grey-10'>
        <button
          onClick={onClose}
          type='button'
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <div className='flex items-center gap-3 mb-6'>
          <div className='w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0 shadow-sm'>
            <Icon icon='ph:wallet-bold' className='text-2xl' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-secondary-10'>Log Payment</h2>
            <p className='text-xs text-secondary-30 mt-0.5'>Record payment receipt for {invoiceNum}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {errorMsg && (
            <div className='p-3.5 bg-red-50 border border-red-200 text-xs text-danger rounded-xl flex items-center gap-1.5 animate-fade-in'>
              <Icon icon='ph:warning-circle-fill' className='text-base shrink-0' />
              {errorMsg}
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className='bg-grey-0/10 p-4 rounded-xl border border-grey-10/40 text-xs space-y-2'>
            <div className='flex justify-between'>
              <span className='text-secondary-30'>Client Name:</span>
              <span className='font-medium text-secondary-10'>{invoice.client_name ?? invoice.counterparty_name ?? 'Client'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-secondary-30'>Total Invoice Value:</span>
              <span className='font-medium text-secondary-10'>{formatNaira(totalAmount)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-secondary-30'>Amount Paid to date:</span>
              <span className='font-medium text-success'>{formatNaira(currentPaid)}</span>
            </div>
            <div className='flex justify-between border-t border-grey-10 pt-2 font-bold text-sm text-secondary-10'>
              <span>Current Balance Due:</span>
              <span className='text-primary-30'>{formatNaira(balanceDue)}</span>
            </div>
          </div>

          <div>
            <label className='block text-xs font-semibold text-secondary-20 mb-1'>Amount Received *</label>
            <div className='relative'>
              <span className='absolute left-4 top-1/2 -translate-y-1/2 text-secondary-30 text-sm'>₦</span>
              <input
                type='number'
                required
                min='0.01'
                max={balanceDue}
                step='any'
                placeholder='0.00'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className='w-full border border-grey-10 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white font-semibold'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white font-medium'
              >
                <option value='bank_transfer'>Bank Transfer</option>
                <option value='cash'>Cash</option>
                <option value='card'>Card</option>
                <option value='ussd'>USSD</option>
                <option value='other'>Other</option>
              </select>
            </div>

            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Payment Date</label>
              <input
                type='date'
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-semibold text-secondary-20 mb-1'>Reference / Notes</label>
            <input
              type='text'
              placeholder='e.g. Bank Reference / Check #'
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
            />
          </div>

          <div className='flex gap-3 pt-4 border-t border-grey-10/40'>
            <button
              type='button'
              onClick={onClose}
              disabled={saving}
              className='flex-1 py-3 rounded-full border border-grey-10 text-secondary-20 text-sm font-medium hover:bg-secondary-50 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='flex-[2] py-3 rounded-full bg-success text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:bg-success/50 shadow-sm font-semibold'
            >
              {saving ? 'Logging...' : 'Log Payment'}
              <Icon icon='ph:check-bold' />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
