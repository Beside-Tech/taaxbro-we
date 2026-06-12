'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { business, type BusinessProfile } from '@/lib/api';

interface Props {
  onClose: () => void;
}

export default function TransferModal({ onClose }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    business
      .getProfile()
      .then(setProfile)
      .catch((e) => console.error('Failed to load profile for bank details:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const bankName = profile?.bank_name || 'Not Configured';
  const accountNumber = profile?.account_number || 'Not Configured';
  const accountName = profile?.account_name || profile?.name || 'Not Configured';

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in'>
      <div className='bg-white rounded-3xl p-8 w-full max-w-md relative border border-grey-10 shadow-xl'>
        <button
          onClick={onClose}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        <div className='flex flex-col items-center text-center space-y-4 mb-6'>
          <div className='w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-10 shadow-sm'>
            <Icon icon='hugeicons:money-send-01' className='text-2xl text-primary-30' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-secondary-10'>Make a Transfer</h3>
            <span className='text-[10px] font-semibold text-primary-30 bg-primary-50 rounded-full px-2 py-0.5 mt-1 inline-block'>
              Direct Outbound Coming Soon
            </span>
          </div>
          <p className='text-xs text-secondary-30 leading-relaxed max-w-sm'>
            Direct bank transfers from the Taaxbro dashboard are currently in sandbox setup. 
            For now, please initiate transfers from your regular bank application.
          </p>
        </div>

        <div className='bg-grey-0 border border-grey-10 rounded-2xl p-5 space-y-4 mb-6'>
          <div className='flex items-center gap-2 mb-1 border-b border-grey-10/40 pb-2.5'>
            <Icon icon='ph:bank' className='text-secondary-30 text-lg' />
            <span className='text-xs font-bold text-secondary-20 uppercase tracking-wider'>Your Manual Bank Details</span>
          </div>

          {loading ? (
            <div className='space-y-3 animate-pulse py-2'>
              <div className='h-3 bg-grey-10 rounded w-24' />
              <div className='h-3 bg-grey-10 rounded w-32' />
              <div className='h-3 bg-grey-10 rounded w-20' />
            </div>
          ) : (
            <div className='space-y-3.5'>
              <div className='flex justify-between items-start'>
                <div>
                  <span className='text-[10px] text-secondary-30 uppercase font-semibold block'>Bank Name</span>
                  <span className='text-sm font-semibold text-secondary-10'>{bankName}</span>
                </div>
              </div>

              <div className='flex justify-between items-start'>
                <div>
                  <span className='text-[10px] text-secondary-30 uppercase font-semibold block'>Account Number</span>
                  <span className='text-sm font-bold text-secondary-10 font-mono'>{accountNumber}</span>
                </div>
                {profile?.account_number && (
                  <button
                    onClick={() => handleCopy(accountNumber)}
                    className='p-1.5 text-primary-30 hover:bg-primary-50 rounded-lg transition-colors'
                    title='Copy Account Number'
                  >
                    <Icon icon={copied ? 'ph:check-bold' : 'ph:copy'} className='text-base' />
                  </button>
                )}
              </div>

              <div className='flex justify-between items-start'>
                <div>
                  <span className='text-[10px] text-secondary-30 uppercase font-semibold block'>Account Name</span>
                  <span className='text-sm font-semibold text-secondary-10'>{accountName}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className='w-full py-3 bg-primary-30 hover:bg-primary-40 text-white rounded-full text-sm font-bold transition-all shadow-sm'
        >
          Got It, Thanks
        </button>

        {copied && (
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-secondary-10 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg animate-fade-in'>
            Account number copied!
          </div>
        )}
      </div>
    </div>
  );
}
