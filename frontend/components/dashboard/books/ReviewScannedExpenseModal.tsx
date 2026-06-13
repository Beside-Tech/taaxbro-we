'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { expenses, OcrStructuredResult } from '@/lib/api';

interface ReviewScannedExpenseModalProps {
  ocrData: OcrStructuredResult;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function formatNaira(value: number): string {
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'fuel', label: 'Fuel / Gas' },
  { value: 'legal', label: 'Legal Fees' },
  { value: 'accounting', label: 'Accounting / Audit' },
  { value: 'software', label: 'Software / SaaS' },
  { value: 'travel', label: 'Travel / Logistics' },
  { value: 'utility', label: 'Utilities (Power, Internet)' },
  { value: 'groceries', label: 'Groceries / Pantry' },
  { value: 'equipment', label: 'Equipment / Tools' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'other', label: 'Other' },
];

export default function ReviewScannedExpenseModal({
  ocrData,
  businessId,
  onClose,
  onSuccess,
}: ReviewScannedExpenseModalProps) {
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState('other');
  const [expenseDate, setExpenseDate] = useState('');
  const [amount, setAmount] = useState('');
  const [vatAmount, setVatAmount] = useState('0');
  const [description, setDescription] = useState('');

  // WHT state
  const [whtApplicable, setWhtApplicable] = useState(false);
  const [whtRate, setWhtRate] = useState(5); // default 5%
  const [whtAmount, setWhtAmount] = useState('0');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize fields from OCR extraction results
  useEffect(() => {
    if (ocrData) {
      setVendorName(ocrData.vendor_name || '');
      
      // Attempt to map category
      const ocrCat = (ocrData.category || '').toLowerCase().trim();
      const matchedCat = CATEGORIES.find(
        (c) =>
          c.value === ocrCat ||
          ocrCat.includes(c.value) ||
          c.value.includes(ocrCat)
      );
      setCategory(matchedCat ? matchedCat.value : 'other');

      // Date parsing
      if (ocrData.transaction_date) {
        setExpenseDate(ocrData.transaction_date);
      } else {
        setExpenseDate(new Date().toISOString().split('T')[0]);
      }

      setAmount(String(ocrData.total_amount || 0));
      setVatAmount(String(ocrData.total_vat || 0));
      setDescription(ocrData.description || ocrData.notes || '');

      setWhtApplicable(!!ocrData.wht_applicable);
      setWhtRate(ocrData.wht_rate || 5);
      setWhtAmount(String(ocrData.wht_amount || 0));
    }
  }, [ocrData]);

  // Recalculate WHT if amount, rate, or status changes
  useEffect(() => {
    if (whtApplicable) {
      const baseAmount = Number(amount) || 0;
      const rateFraction = Number(whtRate) / 100;
      const calculatedWht = (baseAmount * rateFraction).toFixed(2);
      setWhtAmount(calculatedWht);
    } else {
      setWhtAmount('0');
    }
  }, [whtApplicable, amount, whtRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      setErrorMsg('Vendor name is required.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }
    if (!expenseDate) {
      setErrorMsg('Expense date is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      await expenses.create(businessId, {
        category,
        amount: Number(amount),
        vendor_name: vendorName.trim(),
        expense_date: expenseDate,
        description: description.trim() || undefined,
        vat_amount: Number(vatAmount) || 0,
        wht_applicable: whtApplicable,
        wht_rate: whtApplicable ? Number(whtRate) : undefined,
        wht_amount: whtApplicable ? Number(whtAmount) : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to log expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-lg relative shadow-xl border border-grey-10 my-8'>
        <button
          onClick={onClose}
          type='button'
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <div className='flex items-center gap-3 mb-6'>
          <div className='w-12 h-12 rounded-xl bg-primary-30/10 text-primary-30 flex items-center justify-center shrink-0 shadow-sm'>
            <Icon icon='ph:file-search-bold' className='text-2xl' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-secondary-10'>Review Scanned Receipt</h2>
            <p className='text-xs text-secondary-30 mt-0.5'>Confirm or adjust details extracted from your scan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {errorMsg && (
            <div className='p-3.5 bg-red-50 border border-red-200 text-xs text-danger rounded-xl flex items-center gap-1.5 animate-fade-in'>
              <Icon icon='ph:warning-circle-fill' className='text-base shrink-0' />
              {errorMsg}
            </div>
          )}

          <div className='p-3 bg-primary-50/20 border border-primary-50/50 rounded-xl text-xs text-secondary-20 flex gap-2'>
            <Icon icon='ph:info-bold' className='text-base shrink-0 mt-0.5 text-primary-30' />
            <p className='leading-relaxed'>
              We successfully ran OCR scan on your receipt. Please inspect the populated fields below to ensure correct logging.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Vendor Name *</label>
              <input
                type='text'
                required
                placeholder='e.g. Shoprite Ltd'
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white text-secondary-10 font-medium'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white text-secondary-10 font-medium'
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Expense Date *</label>
              <input
                type='date'
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white text-secondary-10'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Total Amount *</label>
              <div className='relative'>
                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-secondary-30 text-sm'>₦</span>
                <input
                  type='number'
                  required
                  min='0.01'
                  step='any'
                  placeholder='0.00'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white font-semibold text-secondary-10'
                />
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>VAT Amount (included)</label>
              <div className='relative'>
                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-secondary-30 text-sm'>₦</span>
                <input
                  type='number'
                  min='0'
                  step='any'
                  placeholder='0.00'
                  value={vatAmount}
                  onChange={(e) => setVatAmount(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white text-secondary-10'
                />
              </div>
            </div>

            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>Description / Purpose</label>
              <input
                type='text'
                placeholder='e.g. Office laptop charger replacement'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white text-secondary-10'
              />
            </div>
          </div>

          {/* Withholding Tax Card */}
          <div className='bg-grey-0/10 p-4 rounded-xl border border-grey-10/40 text-xs space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='wht_applicable_toggle'
                  checked={whtApplicable}
                  onChange={(e) => setWhtApplicable(e.target.checked)}
                  className='w-4 h-4 text-primary-30 border-grey-10 rounded focus:ring-primary-30'
                />
                <label htmlFor='wht_applicable_toggle' className='font-semibold text-secondary-20 cursor-pointer select-none'>
                  Subject to Withholding Tax (WHT)
                </label>
              </div>
              {whtApplicable && (
                <span className='text-xs text-primary-30 bg-primary-30/10 px-2 py-0.5 rounded font-semibold'>
                  WHT Active
                </span>
              )}
            </div>

            {whtApplicable && (
              <div className='grid grid-cols-2 gap-3 pt-2 border-t border-grey-10/40 animate-fade-in'>
                <div>
                  <label className='block text-[10px] font-bold text-secondary-30 uppercase tracking-wider mb-1'>WHT Rate</label>
                  <select
                    value={whtRate}
                    onChange={(e) => setWhtRate(Number(e.target.value))}
                    className='w-full border border-grey-10 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary-30 bg-white font-medium text-secondary-10'
                  >
                    <option value={5}>5% (Supplies / Individual Rent)</option>
                    <option value={10}>10% (Legal / Consultancy / Corp Rent)</option>
                  </select>
                </div>
                <div>
                  <label className='block text-[10px] font-bold text-secondary-30 uppercase tracking-wider mb-1'>Calculated WHT Amount</label>
                  <div className='text-sm font-bold text-secondary-10 pt-1.5'>
                    {formatNaira(Number(whtAmount) || 0)}
                  </div>
                </div>
              </div>
            )}
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
              className='flex-[2] py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-30/95 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-30/50 shadow-sm font-semibold'
            >
              {saving ? 'Saving...' : 'Save to Books'}
              <Icon icon='ph:check-bold' />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
