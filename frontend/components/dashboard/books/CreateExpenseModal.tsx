'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { expenses } from '@/lib/api';

interface CreateExpenseModalProps {
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function formatNaira(value: number): string {
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

const CATEGORIES = [
  { value: 'office', label: 'Office Supplies' },
  { value: 'software', label: 'Software / SaaS' },
  { value: 'utility', label: 'Utilities (Power, Internet)' },
  { value: 'fuel', label: 'Fuel / Gas' },
  { value: 'travel', label: 'Travel / Logistics' },
  { value: 'rent', label: 'Rent' },
  { value: 'legal', label: 'Legal Fees' },
  { value: 'accounting', label: 'Accounting / Audit' },
  { value: 'groceries', label: 'Groceries / Pantry' },
  { value: 'equipment', label: 'Equipment / Tools' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'payroll', label: '💼 Payroll / Salaries' },
  { value: 'other', label: 'Other' },
];

export default function CreateExpenseModal({
  businessId,
  onClose,
  onSuccess,
}: CreateExpenseModalProps) {
  const [vendorName, setVendorName] = useState('');
  const [vendorTin, setVendorTin] = useState('');
  const [category, setCategory] = useState('office');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [vatAmount, setVatAmount] = useState('0');
  const [description, setDescription] = useState('');

  const isPayroll = category === 'payroll';

  // WHT state
  const [whtApplicable, setWhtApplicable] = useState(false);
  const [whtRate, setWhtRate] = useState(5); // default 5%
  const [whtAmount, setWhtAmount] = useState('0');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

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
    if (isPayroll && !vendorTin.trim()) {
      setErrorMsg('Employee / Vendor TIN is required for payroll expenses.');
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
      const res = await expenses.create(businessId, {
        category,
        amount: Number(amount),
        vendor_name: vendorName.trim(),
        vendor_tin: vendorTin.trim() || undefined,
        expense_date: expenseDate,
        description: description.trim() || undefined,
        vat_amount: Number(vatAmount) || 0,
        wht_applicable: whtApplicable,
        wht_rate: whtApplicable ? Number(whtRate) : undefined,
        wht_amount: whtApplicable ? Number(whtAmount) : undefined,
      });

      if (res.warnings && res.warnings.length > 0) {
        setWarnings(res.warnings);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to log expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // If warnings exist, show Compliance Alert screen
  if (warnings.length > 0) {
    return (
      <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in'>
        <div className='bg-white rounded-2xl p-8 w-full max-w-lg relative shadow-xl border border-grey-10 my-8'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-sm border border-orange-200'>
              <Icon icon='ph:warning-bold' className='text-2xl' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-secondary-10'>Compliance Alert</h2>
              <p className='text-xs text-secondary-30 mt-0.5'>We detected a potential tax compliance issue</p>
            </div>
          </div>

          <div className='space-y-4'>
            {warnings.map((warn, index) => (
              <div key={index} className='p-4 bg-orange-50 border border-orange-200 text-sm text-orange-800 rounded-xl flex items-start gap-2.5 leading-relaxed'>
                <Icon icon='ph:warning-circle-fill' className='text-lg shrink-0 mt-0.5 text-orange-600' />
                <span>{warn}</span>
              </div>
            ))}

            <p className='text-xs text-secondary-30 leading-relaxed'>
              This expense has been successfully logged to your books, but a compliance anomaly and an in-app alert have been raised. Please review if you need to adjust this transaction.
            </p>

            <div className='pt-4 border-t border-grey-10/40 flex justify-end'>
              <button
                type='button'
                onClick={onSuccess}
                className='px-6 py-2.5 rounded-full bg-primary-30 text-white text-sm font-semibold hover:bg-primary-40 transition-colors shadow-sm'
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <Icon icon='ph:plus-circle' className='text-2xl' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-secondary-10'>Add Expense</h2>
            <p className='text-xs text-secondary-30 mt-0.5'>Record a new expense to your books</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {errorMsg && (
            <div className='p-3.5 bg-red-50 border border-red-200 text-xs text-danger rounded-xl flex items-center gap-1.5 animate-fade-in'>
              <Icon icon='ph:warning-circle-fill' className='text-base shrink-0' />
              {errorMsg}
            </div>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>
                {isPayroll ? 'Employee / Payee Name *' : 'Vendor Name *'}
              </label>
              <input
                type='text'
                required
                placeholder={isPayroll ? 'e.g. John Adebayo' : 'e.g. Shoprite Ltd'}
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

          {/* Payroll TIN field — shown only when category is payroll */}
          {isPayroll && (
            <div className='animate-fade-in'>
              <label className='block text-xs font-semibold text-secondary-20 mb-1'>
                Employee / Vendor TIN *
                <span className='ml-1 text-[10px] font-normal text-secondary-30'>(Tax Identification Number — required for payroll)</span>
              </label>
              <div className='relative'>
                <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-30'>
                  <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 256 256' fill='currentColor'><path d='M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z'/></svg>
                </span>
                <input
                  type='text'
                  required={isPayroll}
                  placeholder='e.g. 12345678-0001'
                  value={vendorTin}
                  onChange={(e) => setVendorTin(e.target.value)}
                  className='w-full border border-amber-300 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition-colors bg-amber-50/40 text-secondary-10 font-medium'
                />
              </div>
              <p className='text-[10px] text-amber-700 mt-1 flex items-center gap-1'>
                <svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 256 256' fill='currentColor'><path d='M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z'/></svg>
                Payroll payments require TIN for PAYE compliance (FIRS regulation)
              </p>
            </div>
          )}

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
                  id='create_wht_applicable_toggle'
                  checked={whtApplicable}
                  onChange={(e) => setWhtApplicable(e.target.checked)}
                  className='w-4 h-4 text-primary-30 border-grey-10 rounded focus:ring-primary-30'
                />
                <label htmlFor='create_wht_applicable_toggle' className='font-semibold text-secondary-20 cursor-pointer select-none'>
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
