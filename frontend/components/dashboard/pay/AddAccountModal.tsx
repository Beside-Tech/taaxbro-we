'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { integrations } from '@/lib/api';

interface Props {
  onClose: () => void;
}

const banks = [
  { name: 'FCMB', color: '#6d1bff' },
  { name: 'Guarantee Trust Bank', short: 'GTB', color: '#e85b2a' },
  { name: 'Access Bank', short: 'ACC', color: '#e85b2a' },
  { name: 'First Bank', short: 'FB', color: '#c47f1a' },
  { name: 'United Bank for Africa', short: 'UBA', color: '#a00000' },
  { name: 'Eco Bank', short: 'ECO', color: '#0a3f6b' },
  { name: 'Moniepoint MFB', short: 'MP', color: '#1a73e8' },
  { name: 'Opay Digital Services', short: 'OP', color: '#1a8f3f' },
  { name: 'Zenith Bank', short: 'ZB', color: '#cc0000' },
];

type Step = 1 | 2 | 3;

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Country' },
    { n: 2, label: 'Choose Bank' },
    { n: 3, label: 'Connect' },
  ];
  return (
    <div className='flex items-center gap-0 mb-6'>
      {steps.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className='flex items-center'>
            <div className='flex items-center gap-2'>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  done || active ? 'bg-primary-30 text-white' : 'bg-secondary-40 text-secondary-30'
                }`}
              >
                {done ? <Icon icon='ph:check-bold' className='text-sm' /> : s.n}
              </div>
              <span
                className={`text-sm ${active || done ? 'text-secondary-10 font-medium' : 'text-secondary-30'}`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-16 mx-3 ${done ? 'bg-primary-30' : 'bg-secondary-40'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AddAccountModal({ onClose }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [country, setCountry] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [search, setSearch] = useState('');

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [monoInstance, setMonoInstance] = useState<any>(null);

  const selectedBankRef = useRef(selectedBank);
  useEffect(() => {
    selectedBankRef.current = selectedBank;
  }, [selectedBank]);

  const handleSuccessRef = useRef<(code: string) => void>(() => {});

  useEffect(() => {
    handleSuccessRef.current = async (code: string) => {
      if (!user?.business_id) {
        setConnectError("No business connected. Please complete onboarding.");
        return;
      }
      setConnecting(true);
      setConnectError(null);
      try {
        await integrations.connectMonoAccount(user.business_id, code, selectedBankRef.current);
        onClose();
        window.location.reload();
      } catch (err: any) {
        setConnectError(err.message ?? "Failed to connect account.");
      } finally {
        setConnecting(false);
      }
    };
  }, [user, onClose]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@mono.co/connect.js')
        .then((module) => {
          const MonoConnectClass = module.MonoConnect;
          const mono = new MonoConnectClass({
            key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY || '',
            onSuccess: ({ code }: { code: string }) => {
              handleSuccessRef.current(code);
            },
            onClose: () => {
              console.log('Mono widget closed');
            },
          });
          setMonoInstance(mono);
        })
        .catch((err) => {
          console.error('Failed to load Mono Connect SDK', err);
        });
    }
  }, []);

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto'>
        <button
          onClick={onClose}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <h2 className='text-2xl font-bold text-secondary-10 mb-1'>
          {step === 1 ? 'Add Account' : 'Select Bank'}
        </h2>
        <p className='text-sm text-secondary-30 mb-6'>First, tell us where your bank is based</p>

        <StepIndicator current={step} />

        {step === 1 && (
          <>
            <div className='mb-6'>
              <label className='block text-sm text-secondary-10 mb-2'>Where is your Bank Based?</label>
              <div className='relative'>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors appearance-none bg-white text-secondary-10'
                >
                  <option value=''>Select Country</option>
                  <option value='Nigeria'>Nigeria</option>
                  <option value='Ghana'>Ghana</option>
                  <option value='Kenya'>Kenya</option>
                  <option value='South Africa'>South Africa</option>
                </select>
                <Icon
                  icon='ph:caret-down'
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none'
                />
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!country}
              className={`w-full py-3.5 rounded-full text-sm font-medium transition-colors ${
                country
                  ? 'bg-primary-30 text-white hover:bg-primary-40'
                  : 'bg-primary-20/50 text-white/70 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className='relative mb-4'>
              <Icon
                icon='ph:magnifying-glass'
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-30'
              />
              <input
                type='text'
                placeholder='Search for your bank'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full border border-grey-10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors'
              />
            </div>

            <div className='grid grid-cols-3 gap-3 mb-4'>
              {filteredBanks.map((bank) => (
                <button
                  key={bank.name}
                  onClick={() => setSelectedBank(bank.name)}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-3 text-xs text-left transition-colors ${
                    selectedBank === bank.name
                      ? 'border-primary-30 bg-primary-50'
                      : 'border-grey-10 hover:border-primary-20'
                  }`}
                >
                  <div
                    className='w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0'
                    style={{ backgroundColor: bank.color }}
                  >
                    {(bank.short ?? bank.name).slice(0, 2).toUpperCase()}
                  </div>
                  <span className='text-secondary-10 leading-tight'>{bank.name}</span>
                </button>
              ))}
            </div>

            <button className='text-sm text-primary-30 font-medium hover:underline mb-6 block mx-auto'>
              Load More Banks
            </button>

            <div className='flex gap-3'>
              <button
                onClick={() => setStep(1)}
                className='flex-1 py-3 rounded-full border border-grey-10 text-sm font-medium text-secondary-10 hover:bg-primary-50 transition-colors'
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedBank}
                className={`flex-[2] py-3 rounded-full text-sm font-medium transition-colors ${
                  selectedBank
                    ? 'bg-primary-30 text-white hover:bg-primary-40'
                    : 'bg-primary-20/50 text-white/70 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className='border border-grey-10 rounded-xl overflow-hidden mb-5'>
              {[
                { label: 'Country', value: country },
                { label: 'Bank', value: selectedBank },
                { label: 'Currency', value: 'Nigerian Naira (₦)' },
                { label: 'Connected Via', value: 'Mono' },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={`flex justify-between px-4 py-3 text-sm ${
                    i > 0 ? 'border-t border-grey-10' : ''
                  }`}
                >
                  <span className='text-secondary-30'>{row.label}</span>
                  <span className='text-secondary-10 font-medium'>{row.value}</span>
                </div>
              ))}
            </div>

            <div className='bg-primary-50 rounded-xl p-5 mb-5'>
              <div className='flex items-center gap-2 mb-3'>
                <Icon icon='ph:lock-simple-open' className='text-lg text-secondary-10' />
                <span className='text-sm font-semibold text-secondary-10'>What Taaxbro will access</span>
              </div>
              <div className='space-y-2'>
                {[
                  { text: 'View your account balance and transaction history', ok: true },
                  { text: 'Sync new transactions automatically as they happen', ok: true },
                  { text: 'Cannot move, withdraw or transfer your money', ok: false },
                  { text: 'Cannot share your banking details with anyone.', ok: false },
                ].map((item) => (
                  <div key={item.text} className='flex items-start gap-2'>
                    <Icon
                      icon={item.ok ? 'ph:check' : 'ph:x'}
                      className={`text-base mt-0.5 shrink-0 ${item.ok ? 'text-success' : 'text-danger'}`}
                    />
                    <span className={`text-sm ${item.ok ? 'text-success' : 'text-danger'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='flex items-start gap-3 bg-grey-10/40 rounded-xl p-4 mb-6'>
              <Icon icon='ph:lock-simple' className='text-lg text-secondary-30 shrink-0 mt-0.5' />
              <p className='text-xs text-secondary-30 leading-relaxed'>
                You will be redirected to Mono&apos;s secure page to log in with your bank
                credentials. Taaxbro never sees or stores your password.
              </p>
            </div>

            {connectError && (
              <div className='mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2'>
                <Icon icon='ph:warning-circle' className='text-base shrink-0' />
                {connectError}
              </div>
            )}

            <div className='flex gap-3'>
              <button
                type='button'
                disabled={connecting}
                onClick={() => setStep(2)}
                className='flex-1 py-3 rounded-full border border-grey-10 text-sm font-medium text-secondary-10 hover:bg-primary-50 transition-colors disabled:opacity-50'
              >
                Back
              </button>
              <button
                type='button'
                disabled={connecting || !monoInstance}
                onClick={() => monoInstance?.open()}
                className='flex-[2] py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
              >
                {connecting && <Icon icon='ph:circle-notch' className='animate-spin' />}
                Connect Via Mono
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
