'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import GreetingHeading from '@/components/dashboard/GreetingHeading';
import { dashboard, business, onboarding, type DashboardData, type BusinessProfile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatNaira(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

function formatFilingDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className='bg-white rounded-xl border border-t-4 border-grey-10 p-5 animate-pulse'>
      <div className='h-3 bg-grey-10 rounded w-24 mb-3' />
      <div className='h-7 bg-grey-10 rounded w-32 mb-4' />
      <div className='h-3 bg-grey-10 rounded w-20' />
    </div>
  );
}

const quickActions = [
  { label: 'Send Invoice',    icon: 'ph:file-text',      href: '/pay' },
  { label: 'Scan Receipt',    icon: 'ph:camera',         href: '/books' },
  { label: 'Record Expense',  icon: 'ph:plus',           href: '/books' },
  { label: 'Next Filing',     icon: 'ph:file-arrow-up',  href: '/tax' },
];

const typeBadge: Record<string, string> = {
  credit: 'bg-success text-white',
  debit:  'bg-danger text-white',
};

const typeLabel: Record<string, string> = {
  credit: 'Credit',
  debit:  'Debit',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Technology', 'Agriculture', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Real Estate', 'Media', 'Legal', 'Consulting', 'Hospitality',
  'Transportation', 'Construction', 'Energy', 'Other',
];

const USER_TYPES = [
  {
    value: 'business',
    icon: 'ph:briefcase-fill',
    label: 'I run a business',
  },
  {
    value: 'freelancer',
    icon: 'ph:laptop-fill',
    label: "I'm a freelancer / individual",
  },
  {
    value: 'tax_professional',
    icon: 'ph:scales-fill',
    label: "I'm a tax professional",
  },
];

export default function OverviewPage() {
  const { user, setUser } = useAuth();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [dismissBanner, setDismissBanner] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState({ user_type: '', industry: '' });

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const profile = await business.getProfile();
      const payload = {
        user_type: modalForm.user_type,
        business_name: profile.name ?? user?.full_name ?? 'My Business',
        business_type: profile.business_type ?? 'sole_proprietorship',
        state: profile.state ?? 'Lagos',
        industry: modalForm.industry,
        tin: profile.tin ?? undefined,
        rc_number: profile.rc_number ?? undefined,
        vat_registered: profile.vat_registered ?? false,
        vat_registration_no: profile.vat_registration_no ?? undefined,
        owner_name: profile.owner_name ?? undefined,
        nin: profile.nin ?? undefined,
        address: profile.address ?? undefined,
        phone: profile.phone ?? undefined,
        bank_name: profile.bank_name ?? undefined,
        account_number: profile.account_number ?? undefined,
        account_name: profile.account_name ?? undefined,
      };
      const updatedUser = await onboarding.complete(payload);
      setUser(updatedUser);
      setOpenModal(false);
    } catch (err: any) {
      setModalError(err.message ?? 'Failed to update profile settings.');
    } finally {
      setModalLoading(false);
    }
  }

  const showCompleteProfileBanner =
    user?.onboarding_completed &&
    (!user?.user_type || !user?.industry) &&
    !dismissBanner;

  const getMissingSections = () => {
    if (!profile) return [];
    const missing = [];
    if (!profile.tin) missing.push('Tax ID (TIN)');
    if (profile.user_type === 'business' && !profile.rc_number) {
      missing.push('CAC Registration (RC/BN)');
    } else if (profile.user_type === 'freelancer' && !profile.nin) {
      missing.push('National Identity Number (NIN)');
    }
    if (!profile.address || !profile.phone) {
      missing.push('Invoice Contact Details');
    }
    if (!profile.bank_name || !profile.account_number || !profile.account_name) {
      missing.push('Remittance Bank Details');
    }
    return missing;
  };

  const missingSections = getMissingSections();
  const showMissingSectionsBanner =
    user?.onboarding_completed &&
    user?.user_type &&
    user?.industry &&
    profile &&
    missingSections.length > 0 &&
    !dismissBanner;

  useEffect(() => {
    dashboard
      .get()
      .then(setData)
      .catch((e) => setError(e.message ?? 'Failed to load dashboard'))
      .finally(() => setLoading(false));

    business
      .getProfile()
      .then(setProfile)
      .catch((e) => console.error('Failed to load profile:', e));
  }, []);

  const stats = data?.stats;
  const txs   = data?.recent_transactions ?? [];
  const cs    = data?.compliance;

  // Tax status badge colours
  const taxStatusClass =
    stats?.tax_liabilities_status === 'Overdue'  ? 'text-danger  bg-red-50' :
    stats?.tax_liabilities_status === 'At Risk'   ? 'text-orange-500 bg-orange-50' :
                                                    'text-success bg-green-50';

  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <GreetingHeading />
      </TopBar>

      <main className='flex-1 p-8 space-y-5 overflow-y-auto'>

        {/* Error banner */}
        {error && (
          <div className='px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
            {error}
          </div>
        )}

        {/* Profile Completion Banner */}
        {showCompleteProfileBanner && (
          <div className='relative overflow-hidden bg-gradient-to-r from-primary-40 via-primary-30 to-purple-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all animate-fade-in'>
            <div className='absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none' />
            <div className='absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none' />
            
            <div className='flex items-start gap-4 z-10'>
              <div className='w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner'>
                <Icon icon='ph:rocket-launch-fill' className='text-2xl text-white' />
              </div>
              <div>
                <h3 className='font-bold text-lg leading-snug'>Complete Your Profile</h3>
                <p className='text-sm text-white/80 mt-1 max-w-xl leading-relaxed'>
                  Choose your business role and industry to unlock personalized tax calculation metrics, custom deadlines, and tailored compliance schedules.
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 shrink-0 z-10'>
              <button
                type='button'
                onClick={() => setOpenModal(true)}
                className='bg-white text-primary-40 text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-grey-10 hover:scale-[1.02] active:scale-[0.98] transition shadow-md'>
                Set Up Now
              </button>
              <button
                type='button'
                onClick={() => setDismissBanner(true)}
                className='bg-white/10 text-white hover:bg-white/20 text-sm font-semibold px-4 py-2.5 rounded-full transition'>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Missing Sections Checklist Banner */}
        {showMissingSectionsBanner && (
          <div className='relative overflow-hidden bg-white border border-secondary-40/30 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all animate-fade-in'>
            <div className='absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500' />
            
            <div className='flex items-start gap-4 z-10'>
              <div className='w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-inner'>
                <Icon icon='ph:clipboard-text-bold' className='text-2xl text-amber-600' />
              </div>
              <div>
                <h3 className='font-bold text-lg text-secondary-10 leading-snug'>Complete Your Account Setup</h3>
                <p className='text-sm text-secondary-30 mt-1 max-w-xl leading-relaxed'>
                  Some sections from onboarding were skipped. Add these now to enable professional invoices and FIRS compliance filings:
                </p>
                <div className='flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs font-semibold text-secondary-20'>
                  {missingSections.map((sec) => (
                    <span key={sec} className='flex items-center gap-1 bg-grey-0 border border-grey-10 px-2.5 py-1 rounded-full text-secondary-20'>
                      <Icon icon='ph:warning-circle' className='text-amber-500 text-sm' />
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 shrink-0 z-10'>
              <Link
                href='/settings'
                className='bg-primary-30 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary-40 hover:scale-[1.02] active:scale-[0.98] transition shadow-sm'>
                Complete in Settings
              </Link>
              <button
                type='button'
                onClick={() => setDismissBanner(true)}
                className='bg-grey-0 text-secondary-30 hover:bg-grey-10 border border-grey-10 text-sm font-semibold px-4 py-2.5 rounded-full transition'>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className='grid grid-cols-4 gap-4'>
          {loading ? (
            [0,1,2,3].map((i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* Revenue */}
              <div className='bg-white rounded-xl border border-t-4 border-success p-5'>
                <p className='text-xs text-secondary-30 mb-2'>
                  Revenue ({new Date().toLocaleString('en-GB', { month: 'long' })})
                </p>
                <p className='text-2xl font-bold text-secondary-10 mb-3'>
                  {stats ? formatNaira(stats.revenue_current_month) : '—'}
                </p>
                {stats?.revenue_change_pct != null ? (
                  <p className={`text-xs flex items-center gap-1 ${stats.revenue_change_pct >= 0 ? 'text-success' : 'text-danger'}`}>
                    <Icon icon={stats.revenue_change_pct >= 0 ? 'ph:trend-up' : 'ph:trend-down'} />
                    {Math.abs(stats.revenue_change_pct)}% vs last month
                  </p>
                ) : (
                  <p className='text-xs text-secondary-30'>No prior month data</p>
                )}
              </div>

              {/* Tax Liabilities */}
              <div className='bg-white rounded-xl border border-t-4 border-danger p-5'>
                <p className='text-xs text-secondary-30 mb-2'>Tax Liabilities Due</p>
                <p className='text-2xl font-bold text-secondary-10 mb-3'>
                  {stats ? formatNaira(stats.tax_liabilities_due) : '—'}
                </p>
                {stats ? (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${taxStatusClass}`}>
                    {stats.tax_liabilities_status}
                  </span>
                ) : null}
              </div>

              {/* Outstanding Invoices */}
              <div className='bg-white rounded-xl border border-t-4 border-orange-400 p-5'>
                <p className='text-xs text-secondary-30 mb-2'>Outstanding Invoices</p>
                <p className='text-2xl font-bold text-secondary-10 mb-3'>
                  {stats ? formatNaira(stats.outstanding_invoices_amount) : '—'}
                </p>
                {stats ? (
                  <p className='text-xs text-orange-500'>
                    {stats.outstanding_invoices_unpaid} Unpaid
                    {stats.outstanding_invoices_overdue > 0
                      ? ` | ${stats.outstanding_invoices_overdue} Overdue`
                      : ''}
                  </p>
                ) : null}
              </div>

              {/* Tax Reserve */}
              <div className='bg-white rounded-xl border border-t-4 border-primary-30 p-5'>
                <p className='text-xs text-secondary-30 mb-2'>Tax Reserve</p>
                <p className='text-2xl font-bold text-secondary-10 mb-3'>
                  {stats ? formatNaira(stats.tax_reserve) : '—'}
                </p>
                {stats?.next_filing_date ? (
                  <p className='text-xs text-primary-30'>
                    Next Filing: {formatFilingDate(stats.next_filing_date)}
                  </p>
                ) : (
                  <p className='text-xs text-secondary-30'>No upcoming filing</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Quick Actions + Compliance ──────────────────────────────────── */}
        <div className='grid grid-cols-[1fr_1.1fr] gap-4'>
          {/* Quick Actions */}
          <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
            <h2 className='text-base font-semibold text-secondary-10 mb-4'>Quick Actions</h2>
            <div className='grid grid-cols-2 gap-3'>
              {quickActions.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className='flex flex-col items-center justify-center gap-2 border border-grey-10 rounded-xl py-5 hover:bg-primary-50 hover:border-primary-20 transition-colors'>
                  <Icon icon={a.icon} className='text-2xl text-secondary-10' />
                  <span className='text-xs text-secondary-10'>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Compliance Score */}
          <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
            <h2 className='text-base font-semibold text-secondary-10 mb-4'>Compliance Score</h2>
            {loading ? (
              <div className='flex items-center gap-5 animate-pulse'>
                <div className='w-28 h-28 rounded-full bg-grey-10 shrink-0' />
                <div className='flex-1 space-y-2'>
                  {[0,1,2,3,4].map((i) => <div key={i} className='h-3 bg-grey-10 rounded w-32' />)}
                </div>
              </div>
            ) : !cs ? (
              <p className='text-sm text-secondary-30'>
                Compliance score will appear after your first month of activity.
              </p>
            ) : (
              <div className='flex items-center gap-5'>
                {/* Donut */}
                <div className='relative w-28 h-28 shrink-0'>
                  <svg viewBox='0 0 100 100' className='w-full h-full'>
                    <circle cx='50' cy='50' r='40' fill='none' stroke='#e5e7eb' strokeWidth='8' />
                    <circle
                      cx='50' cy='50' r='40' fill='none'
                      stroke={cs.score >= 80 ? '#26ab47' : cs.score >= 50 ? '#f97316' : '#ef4444'}
                      strokeWidth='8'
                      strokeDasharray={`${(cs.score / 100) * 251.3} 251.3`}
                      strokeLinecap='round'
                      transform='rotate(-90 50 50)'
                    />
                  </svg>
                  <div className='absolute inset-0 flex flex-col items-center justify-center'>
                    <span className='text-2xl font-bold text-secondary-10 leading-none'>{cs.score}</span>
                    <span className='text-xs text-secondary-30'>/100</span>
                  </div>
                </div>
                {/* Checklist */}
                <div className='grid grid-cols-2 gap-x-4 gap-y-2.5 flex-1'>
                  {cs.items.map((item, i) => (
                    <div key={i} className='flex items-center gap-1.5'>
                      <Icon
                        icon={item.ok ? 'ph:check-circle-fill' : 'ph:warning-fill'}
                        className={`text-sm shrink-0 ${item.ok ? 'text-success' : 'text-orange-400'}`}
                      />
                      <span className='text-xs text-secondary-20 leading-tight'>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Transactions ─────────────────────────────────────────── */}
        <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
            <h2 className='text-base font-semibold text-secondary-10'>Recent Transactions</h2>
            <Link href='/pay' className='text-sm text-primary-30 hover:underline flex items-center gap-1'>
              View All <Icon icon='ph:arrow-right' />
            </Link>
          </div>

          {loading ? (
            <div className='p-6 space-y-3 animate-pulse'>
              {[0,1,2].map((i) => (
                <div key={i} className='flex gap-4'>
                  <div className='h-4 bg-grey-10 rounded w-24' />
                  <div className='h-4 bg-grey-10 rounded w-16' />
                  <div className='h-4 bg-grey-10 rounded w-32' />
                  <div className='h-4 bg-grey-10 rounded w-20' />
                </div>
              ))}
            </div>
          ) : txs.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16 text-secondary-30'>
              <Icon icon='ph:receipt' className='text-4xl mb-3' />
              <p className='text-sm'>No transactions yet</p>
              <p className='text-xs mt-1'>Connect a bank account to see your transactions here.</p>
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-primary-40 text-white text-xs'>
                  <th className='text-left px-6 py-3 font-medium'>
                    <span className='flex items-center gap-1.5'><Icon icon='ph:calendar-blank' />Date</span>
                  </th>
                  <th className='text-left px-4 py-3 font-medium'>
                    <span className='flex items-center gap-1.5'><Icon icon='ph:arrows-down-up' />Type</span>
                  </th>
                  <th className='text-left px-4 py-3 font-medium'>
                    <span className='flex items-center gap-1.5'><Icon icon='ph:git-branch' />Source</span>
                  </th>
                  <th className='text-left px-4 py-3 font-medium'>
                    <span className='flex items-center gap-1.5'><Icon icon='ph:currency-circle-dollar' />Amount</span>
                  </th>
                  <th className='text-left px-4 py-3 font-medium'>
                    <span className='flex items-center gap-1.5'><Icon icon='ph:receipt' />Tax Included</span>
                  </th>
                  <th className='text-left px-4 py-3 font-medium'>Action</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx) => {
                  const { date: d, time: t } = formatDate(tx.transaction_date);
                  const isCredit = tx.type === 'credit';
                  return (
                    <tr key={tx.id} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                      <td className='px-6 py-3.5 text-secondary-20'>
                        <div className='text-sm'>{d}</div>
                        <div className='text-xs text-secondary-30'>{t}</div>
                      </td>
                      <td className='px-4 py-3.5'>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeBadge[tx.type] ?? 'bg-grey-10 text-secondary-10'}`}>
                          {typeLabel[tx.type] ?? tx.type}
                        </span>
                      </td>
                      <td className='px-4 py-3.5 text-secondary-20 text-sm'>
                        {tx.counterparty_name ?? tx.bank_name ?? '—'}
                      </td>
                      <td className={`px-4 py-3.5 text-sm font-medium ${isCredit ? 'text-success' : 'text-danger'}`}>
                        {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
                      </td>
                      <td className='px-4 py-3.5 text-sm text-primary-30 font-medium'>
                        {tx.vat_amount != null ? `${formatNaira(tx.vat_amount)} (VAT)` : '—'}
                      </td>
                      <td className='px-4 py-3.5'>
                        <button className='text-primary-30 text-sm font-medium hover:underline'>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Profile Completion Modal */}
      {openModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-10/40 backdrop-blur-sm animate-fade-in'>
          <div className='bg-white rounded-3xl border border-grey-10 shadow-xl max-w-md w-full p-6 md:p-8 animate-scale-up'>
            <div className='flex items-center justify-between mb-5'>
              <div className='flex items-center gap-2.5'>
                <div className='w-9 h-9 rounded-lg bg-primary-50 text-primary-30 flex items-center justify-center'>
                  <Icon icon='ph:user-circle-gear-fill' className='text-xl' />
                </div>
                <h2 className='text-xl font-bold text-secondary-10'>Configure Profile</h2>
              </div>
              <button
                type='button'
                onClick={() => setOpenModal(false)}
                className='text-secondary-30 hover:text-secondary-10 transition p-1.5 hover:bg-grey-10/50 rounded-full'>
                <Icon icon='ph:x-bold' className='text-lg' />
              </button>
            </div>

            {modalError && (
              <div className='mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2'>
                <Icon icon='ph:warning-circle' className='text-base shrink-0' />
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className='space-y-5'>
              {/* Role Selection */}
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-secondary-10'>Business Role</label>
                <div className='grid grid-cols-1 gap-2'>
                  {USER_TYPES.map((t) => {
                    const selected = modalForm.user_type === t.value;
                    return (
                      <button
                        key={t.value}
                        type='button'
                        onClick={() => setModalForm(prev => ({ ...prev, user_type: t.value }))}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition
                          ${selected
                            ? 'border-primary-30 bg-primary-50/50 font-medium'
                            : 'border-grey-10 hover:border-primary-20 bg-white'
                          }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                          ${selected ? 'bg-primary-40 text-white' : 'bg-secondary-40/10 text-secondary-30'}`}>
                          <Icon icon={t.icon} className='text-sm' />
                        </div>
                        <span className={`text-xs ${selected ? 'text-primary-40 font-semibold' : 'text-secondary-10'}`}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Industry Selection */}
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-secondary-10'>Industry / Sector</label>
                <select
                  required
                  value={modalForm.industry}
                  onChange={(e) => setModalForm(prev => ({ ...prev, industry: e.target.value }))}
                  className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm text-secondary-10
                    bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30
                    transition appearance-none pr-10 relative'>
                  <option value=''>Select your industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind.toLowerCase().replace(' ', '_')}>{ind}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className='flex items-center gap-3 mt-6 pt-2'>
                <button
                  type='button'
                  onClick={() => setOpenModal(false)}
                  className='flex-1 border border-grey-10 text-secondary-10 text-sm font-medium px-5 py-3 rounded-full
                    hover:bg-grey-10/40 transition-colors'>
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={modalLoading || !modalForm.user_type || !modalForm.industry}
                  className='flex-1 flex items-center justify-center gap-2 bg-primary-40 hover:bg-primary-30 text-white text-sm
                    font-semibold rounded-full py-3 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md'>
                  {modalLoading ? (
                    <Icon icon='ph:circle-notch' className='animate-spin text-base' />
                  ) : (
                    'Save Configuration'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}