'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { business, integrations } from '@/lib/api';

interface Props {
  onClose: () => void;
}

type Step = 'form' | 'preview' | 'ready';

interface LocalAccount {
  id: string;
  bank: string;
  last4: string;
}

export default function PaymentLinkModal({ onClose }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [description, setDescription] = useState('');
  const [payerName, setPayerName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [showAccountDrop, setShowAccountDrop] = useState(false);
  const [shareMode, setShareMode] = useState<'whatsapp' | 'email' | 'qr' | null>(null);

  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAccountsLoading(true);
    business.getProfile().then((profile) => {
      if (profile.bank_name && profile.account_number) {
        const last4 = profile.account_number.slice(-4);
        setAccounts([{
          id: 'manual',
          bank: profile.bank_name,
          last4: last4
        }]);
        setAccountId('manual');
      }
    }).catch((err) => {
      console.error('Failed to load manual bank profile:', err);
    }).finally(() => {
      setAccountsLoading(false);
    });
  }, []);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const formValid = description && accountId && amount && !generating;

  const handleGenerateLink = async () => {
    if (!user?.business_id) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await integrations.createPaymentLink(user.business_id, {
        amount: Number(amount),
        description: description
      });
      setPaymentLink(res.url);
      setStep('ready');
    } catch (err: any) {
      setError(err.message ?? 'Failed to generate payment link. Please ensure your bank details are configured in Settings.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto shadow-xl border border-grey-10'>
        <button
          onClick={onClose}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        {step === 'form' && (
          <>
            <h2 className='text-2xl font-bold text-secondary-10 mb-1'>New Payment Link</h2>
            <p className='text-sm text-secondary-30 mb-7'>
              Create a link to collect payment from a customer
            </p>

            <div className='space-y-5'>
              <div>
                <label className='block text-sm text-secondary-10 mb-2'>What is this payment for?</label>
                <input
                  type='text'
                  placeholder='Payment description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
                />
              </div>

              <div>
                <label className='block text-sm text-secondary-10 mb-2'>
                  Payer/Customer&apos;s Name{' '}
                  <span className='text-secondary-30'>(Optional)</span>
                </label>
                <input
                  type='text'
                  placeholder="Enter Payer's Name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
                />
              </div>

              <div>
                <label className='block text-sm text-secondary-10 mb-2'>Receiving Account</label>
                <div className='relative'>
                  <button
                    type='button'
                    onClick={() => setShowAccountDrop((v) => !v)}
                    disabled={accountsLoading || accounts.length === 0}
                    className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none text-left flex items-center justify-between focus:border-primary-30 transition-colors disabled:bg-secondary-50 disabled:cursor-not-allowed'
                  >
                    <span className={selectedAccount ? 'text-secondary-10' : 'text-secondary-40'}>
                      {accountsLoading 
                        ? 'Loading bank details...' 
                        : (selectedAccount
                            ? `${selectedAccount.bank} ****${selectedAccount.last4}`
                            : (accounts.length === 0 
                                ? 'No bank details set in Settings' 
                                : 'Select Account'))}
                    </span>
                    <Icon icon='ph:caret-down' className='text-secondary-30' />
                  </button>
                  {showAccountDrop && accounts.length > 0 && (
                    <div className='absolute z-10 top-full left-0 right-0 border border-grey-10 rounded-xl bg-white shadow-sm mt-1 overflow-hidden'>
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          type='button'
                          onClick={() => {
                            setAccountId(acc.id);
                            setShowAccountDrop(false);
                          }}
                          className='w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-primary-50 transition-colors'
                        >
                          <span className='text-secondary-10'>
                            {acc.bank} ****{acc.last4}
                          </span>
                          {accountId === acc.id && (
                            <Icon icon='ph:check' className='text-primary-30' />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {accounts.length === 0 && !accountsLoading && (
                  <p className='text-xs text-danger mt-1.5 flex items-center gap-1'>
                    <Icon icon='ph:warning' />
                    Please save your bank details in Settings &gt; Profile to generate payment links.
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm text-secondary-10 mb-2'>Amount</label>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-secondary-30 text-sm'>
                    ₦
                  </span>
                  <input
                    type='number'
                    placeholder='Enter Amount to be paid'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className='w-full border border-grey-10 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => formValid && setStep('preview')}
              disabled={!formValid}
              className={`w-full mt-8 py-3.5 rounded-full text-sm font-medium transition-colors ${
                formValid
                  ? 'bg-primary-30 text-white hover:bg-primary-40'
                  : 'bg-primary-20/50 text-white/70 cursor-not-allowed'
              }`}
            >
              Preview
            </button>
          </>
        )}

        {step === 'preview' && (
          <>
            <h2 className='text-2xl font-bold text-secondary-10 mb-1'>Preview Details</h2>
            <p className='text-sm text-secondary-30 mb-7'>
              Confirm payment details before generating link
            </p>

            {error && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 text-xs text-danger rounded-xl flex items-center gap-1.5'>
                <Icon icon='ph:warning-circle' className='text-base shrink-0' />
                {error}
              </div>
            )}

            <div className='border border-grey-10 rounded-xl overflow-hidden mb-8'>
              {[
                { label: 'Description', value: description },
                { label: "Payer's/Customer's Name", value: payerName || '—' },
                {
                  label: 'Receiving Account',
                  value: selectedAccount
                    ? `${selectedAccount.bank}\n****${selectedAccount.last4}`
                    : '—',
                },
                { label: 'Amount', value: `₦${Number(amount).toLocaleString()}.00` },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={`flex justify-between items-start px-4 py-3.5 text-sm ${
                    i > 0 ? 'border-t border-grey-10' : ''
                  }`}
                >
                  <span className='text-secondary-30'>{row.label}</span>
                  <span className='text-secondary-10 font-medium text-right whitespace-pre-line'>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className='flex gap-3'>
              <button
                onClick={() => setStep('form')}
                disabled={generating}
                className='flex-1 py-3.5 rounded-full border border-grey-10 text-secondary-20 text-sm font-medium hover:bg-secondary-50 transition-colors disabled:opacity-50'
              >
                Back
              </button>
              <button
                onClick={handleGenerateLink}
                disabled={generating}
                className='flex-[2] py-3.5 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-20/50'
              >
                {generating ? 'Generating...' : 'Generate Link'} <Icon icon='ph:link' />
              </button>
            </div>
          </>
        )}

        {step === 'ready' && (
          <>
            <h2 className='text-2xl font-bold text-secondary-10 mb-1'>Payment Link Ready</h2>
            <p className='text-sm text-secondary-30 mb-6'>
              Share it with your customer to collect payment
            </p>

            <div className='mb-5'>
              <p className='text-sm text-secondary-10 mb-2'>Your Payment Link</p>
              <div className='flex items-center gap-2 bg-primary-50 border border-primary-10 rounded-xl px-4 py-3'>
                <Icon icon='ph:link' className='text-primary-30 shrink-0' />
                <span className='text-primary-30 text-sm flex-1 truncate'>{paymentLink}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(paymentLink)}
                  className='flex items-center gap-1.5 bg-primary-30 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary-40 transition-colors shrink-0'
                >
                  Copy <Icon icon='ph:copy' />
                </button>
              </div>
            </div>

            <div className='mb-5'>
              <p className='text-sm text-secondary-10 mb-3'>Share Via</p>
              <div className='grid grid-cols-3 gap-3'>
                {(
                  [
                    { id: 'whatsapp', label: 'Whatsapp', icon: 'ph:whatsapp-logo' },
                    { id: 'email', label: 'Email', icon: 'ph:envelope' },
                    { id: 'qr', label: 'QR Code', icon: 'ph:qr-code' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setShareMode(shareMode === opt.id ? null : opt.id)}
                    className={`flex flex-col items-center gap-2 border rounded-xl py-4 text-xs font-medium transition-colors ${
                      shareMode === opt.id
                        ? 'border-primary-30 bg-primary-50 text-primary-30'
                        : 'border-grey-10 text-secondary-10 hover:border-primary-20'
                    }`}
                  >
                    <Icon icon={opt.icon} className='text-2xl' />
                    {opt.label}
                  </button>
                ))}
              </div>

              {shareMode === 'qr' && (
                <div className='mt-4 flex flex-col items-center gap-2'>
                  <div className='w-36 h-36 flex items-center justify-center bg-grey-10/30 rounded-xl'>
                    <Icon icon='ph:qr-code' className='text-8xl text-secondary-10' />
                  </div>
                  <p className='text-xs text-secondary-30'>
                    Scan to pay
                  </p>
                </div>
              )}
            </div>

            <div className='mb-7'>
              <p className='text-sm text-secondary-10 mb-3'>Link Summary</p>
              <div className='border border-grey-10 rounded-xl overflow-hidden'>
                {[
                  { label: 'Description', value: description },
                  { label: "Payer's/Customer's Name", value: payerName || '—' },
                  {
                    label: 'Receiving Account',
                    value: selectedAccount
                      ? `${selectedAccount.bank}\n****${selectedAccount.last4}`
                      : '—',
                  },
                  { label: 'Amount', value: `₦${Number(amount).toLocaleString()}.00` },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className={`flex justify-between items-start px-4 py-3 text-sm ${
                      i > 0 ? 'border-t border-grey-10' : ''
                    }`}
                  >
                    <span className='text-secondary-30'>{row.label}</span>
                    <span className='text-secondary-10 font-medium text-right whitespace-pre-line'>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className='w-full py-3.5 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors'
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
