'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { invoices } from '@/lib/api';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInvoiceModal({ onClose, onSuccess }: CreateInvoiceModalProps) {
  const { user } = useAuth();
  
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [amountPaid, setAmountPaid] = useState('0');
  
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [vatApplicable, setVatApplicable] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic live calculations
  const subtotal = Number(unitPrice || 0) * Number(quantity || 0);
  const vat = vatApplicable ? subtotal * 0.075 : 0;
  const total = subtotal + vat;
  const balanceDue = Math.max(0, total - Number(amountPaid || 0));
  const calculatedStatus = Number(amountPaid || 0) >= total ? 'paid' : Number(amountPaid || 0) > 0 ? 'partial' : 'sent';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.business_id) return;
    if (!clientName.trim()) {
      setErrorMsg('Client Name is required.');
      return;
    }
    if (!unitPrice || Number(unitPrice) <= 0) {
      setErrorMsg('Please enter a valid unit price.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setErrorMsg('Please enter a valid quantity.');
      return;
    }
    if (Number(amountPaid) < 0) {
      setErrorMsg('Amount paid cannot be negative.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      await invoices.create(user.business_id, {
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || undefined,
        client_phone: clientPhone.trim() || undefined,
        client_address: clientAddress.trim() || undefined,
        total_amount: subtotal,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
        vat_applicable: vatApplicable,
        amount_paid: Number(amountPaid),
        unit_price: Number(unitPrice),
        quantity: Number(quantity),
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to create invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-lg relative my-8 shadow-xl border border-grey-10'>
        <button
          onClick={onClose}
          type='button'
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <div className='flex items-center gap-3 mb-6'>
          <div className='w-12 h-12 rounded-xl bg-primary-50 text-primary-30 flex items-center justify-center shrink-0 shadow-sm'>
            <Icon icon='ph:file-plus' className='text-2xl' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-secondary-10'>Create New Invoice</h2>
            <p className='text-xs text-secondary-30 mt-0.5'>Provide invoice details and client information</p>
          </div>
        </div>

        <form onSubmit={handleSave} className='space-y-4'>
          {errorMsg && (
            <div className='p-3.5 bg-red-50 border border-red-200 text-xs text-danger rounded-xl flex items-center gap-1.5 animate-fade-in'>
              <Icon icon='ph:warning-circle-fill' className='text-base shrink-0' />
              {errorMsg}
            </div>
          )}

          <div className='bg-grey-0/10 p-4 rounded-xl border border-grey-10/40 space-y-3'>
            <h3 className='text-xs font-bold text-secondary-20 uppercase tracking-wider mb-2'>Client Details</h3>
            
            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Client Name *</label>
              <input
                type='text'
                required
                placeholder='e.g. Acme Corp'
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1'>Email Address</label>
                <input
                  type='email'
                  placeholder='e.g. billing@acme.com'
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1'>WhatsApp/Phone</label>
                <input
                  type='tel'
                  placeholder='e.g. +234 803 123 4567'
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                />
              </div>
            </div>

            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Physical Address</label>
              <input
                type='text'
                placeholder='e.g. 12 Marina, Lagos'
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
              />
            </div>
          </div>

          <div className='bg-grey-0/10 p-4 rounded-xl border border-grey-10/40 space-y-3'>
            <h3 className='text-xs font-bold text-secondary-20 uppercase tracking-wider mb-2'>Invoice Details</h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1'>Unit Price *</label>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-secondary-30 text-sm'>₦</span>
                  <input
                    type='number'
                    required
                    min='0.01'
                    step='any'
                    placeholder='0.00'
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className='w-full border border-grey-10 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                  />
                </div>
              </div>

              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1'>Quantity *</label>
                <input
                  type='number'
                  required
                  min='1'
                  step='any'
                  placeholder='1'
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1'>Amount Paid (installments)</label>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-secondary-30 text-sm'>₦</span>
                  <input
                    type='number'
                    min='0'
                    step='any'
                    placeholder='0.00'
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className='w-full border border-grey-10 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                  />
                </div>
              </div>

              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1'>Due Date</label>
                <input
                  type='date'
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                />
              </div>
            </div>

            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Service Description / Notes</label>
              <input
                type='text'
                placeholder='e.g. Software Development Services'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
              />
            </div>

            <div className='flex items-center gap-2 pt-1'>
              <label className='flex items-center gap-2 text-sm text-secondary-10 cursor-pointer select-none'>
                <input
                  type='checkbox'
                  checked={vatApplicable}
                  onChange={(e) => setVatApplicable(e.target.checked)}
                  className='rounded border-grey-10 text-primary-30 focus:ring-primary-30 w-4 h-4 cursor-pointer animate-fade-in'
                />
                Apply 7.5% VAT
              </label>
            </div>
          </div>

          {/* Dynamic live calculations summary box */}
          <div className='bg-primary-50/50 p-4 rounded-xl border border-primary-20/40 space-y-2 text-xs'>
            <h4 className='font-bold text-secondary-10 uppercase tracking-wider mb-1'>Calculations Summary</h4>
            <div className='flex justify-between'>
              <span className='text-secondary-30'>Subtotal (Price × Qty):</span>
              <span className='font-medium text-secondary-10'>₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            {vatApplicable && (
              <div className='flex justify-between'>
                <span className='text-secondary-30'>VAT (7.5%):</span>
                <span className='font-medium text-secondary-10'>₦{vat.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className='flex justify-between border-t border-grey-10 pt-2 font-semibold text-sm'>
              <span className='text-secondary-10'>Total Invoice Value:</span>
              <span className='text-secondary-10 font-bold'>₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className='flex justify-between text-secondary-30'>
              <span>Amount Paid:</span>
              <span className='font-medium text-secondary-10'>₦{Number(amountPaid || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className='flex justify-between border-t border-grey-10 pt-2 font-bold text-xs text-primary-30'>
              <span>Balance Due:</span>
              <span>₦{balanceDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className='flex justify-between font-bold text-[10px] uppercase pt-1'>
              <span className='text-secondary-30'>Auto-Assigned Status:</span>
              <span className={`${calculatedStatus === 'paid' ? 'text-success' : calculatedStatus === 'partial' ? 'text-amber-500' : 'text-blue-500'}`}>{calculatedStatus}</span>
            </div>
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
              className='flex-[2] py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-20/50 shadow-sm'
            >
              {saving ? 'Creating...' : 'Create Invoice'}
              <Icon icon='ph:check-bold' />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
