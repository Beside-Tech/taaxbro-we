'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import GreetingHeading from '@/components/dashboard/GreetingHeading';
import { dashboard, type DashboardData } from '@/lib/api';

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

export default function OverviewPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    dashboard
      .get()
      .then(setData)
      .catch((e) => setError(e.message ?? 'Failed to load dashboard'))
      .finally(() => setLoading(false));
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
    </div>
  );
}