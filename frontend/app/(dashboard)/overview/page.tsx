'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import GreetingHeading from '@/components/dashboard/GreetingHeading';

const statCards = [
  {
    label: 'Revenue (May)',
    value: '₦4.82M',
    footer: {
      text: '18% vs April',
      icon: 'ph:trend-up',
      className: 'text-success',
    },
    border: 'border-success',
  },
  {
    label: 'Tax Liabilities Due',
    value: '₦362K',
    footer: {
      text: 'At Risk',
      badge: true,
      className: 'text-orange-500 bg-orange-50',
    },
    border: 'border-danger',
  },
  {
    label: 'Outstanding Invoices',
    value: '₦4.82M',
    footer: { text: '7 Unpaid | 2 Overdue', className: 'text-orange-500' },
    border: 'border-orange-400',
  },
  {
    label: 'Tax Reserve',
    value: '₦218K',
    footer: { text: 'Next Filing: 28th June', className: 'text-primary-30' },
    border: 'border-primary-30',
  },
];

const quickActions = [
  { label: 'Send Invoice', icon: 'ph:file-text' },
  { label: 'Scan Receipt', icon: 'ph:camera' },
  { label: 'Record Expense', icon: 'ph:plus' },
  { label: 'Next Filing', icon: 'ph:file-arrow-up' },
];

const complianceItems = [
  { label: 'Filed on time', ok: true },
  { label: 'Filed on time', ok: true },
  { label: 'Banks Connected', ok: true },
  { label: 'VAT Records', ok: true },
  { label: 'Anomaly Detected', ok: false },
  { label: 'Missing Returns', ok: false },
];

const transactions = [
  {
    date: '26-07-2026',
    time: '9:14am',
    type: 'Credit',
    source: 'GT Bank',
    amount: '+₦276,214',
    tax: '₦423.53 (VAT)',
  },
  {
    date: '26-07-2026',
    time: '9:14am',
    type: 'Debit',
    source: 'Moniepoint',
    amount: '+₦276,214',
    tax: '₦423.53 (WHT)',
  },
  {
    date: '26-07-2026',
    time: '9:14am',
    type: 'Tax remittance',
    source: 'Anthropic',
    amount: '+₦276,214',
    tax: '₦423.53 (VAT)',
  },
];

const typeBadge: Record<string, string> = {
  Credit: 'bg-success text-white',
  Debit: 'bg-danger text-white',
  'Tax remittance': 'bg-orange-400 text-white',
};

export default function OverviewPage() {
  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <GreetingHeading />
      </TopBar>

      <main className='flex-1 p-8 space-y-5 overflow-y-auto'>
        {/* Stat cards */}
        <div className='grid grid-cols-4 gap-4'>
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`bg-white rounded-xl border border-t-4 ${card.border} p-5`}>
              <p className='text-xs text-secondary-30 mb-2'>{card.label}</p>
              <p className='text-2xl font-bold text-secondary-10 mb-3'>
                {card.value}
              </p>
              {card.footer.icon ? (
                <p
                  className={`text-xs flex items-center gap-1 ${card.footer.className}`}>
                  <Icon icon={card.footer.icon} />
                  {card.footer.text}
                </p>
              ) : card.footer.badge ? (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${card.footer.className}`}>
                  {card.footer.text}
                </span>
              ) : (
                <p className={`text-xs ${card.footer.className}`}>
                  {card.footer.text}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions + Compliance Score */}
        <div className='grid grid-cols-[1fr_1.1fr] gap-4'>
          <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
            <h2 className='text-base font-semibold text-secondary-10 mb-4'>
              Quick Actions
            </h2>
            <div className='grid grid-cols-2 gap-3'>
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  className='flex flex-col items-center justify-center gap-2 border border-grey-10 rounded-xl py-5 hover:bg-primary-50 hover:border-primary-20 transition-colors'>
                  <Icon icon={a.icon} className='text-2xl text-secondary-10' />
                  <span className='text-xs text-secondary-10'>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
            <h2 className='text-base font-semibold text-secondary-10 mb-4'>
              Compliance Score
            </h2>
            <div className='flex items-center gap-5'>
              <div className='relative w-28 h-28 shrink-0'>
                <svg viewBox='0 0 100 100' className='w-full h-full'>
                  <circle
                    cx='50'
                    cy='50'
                    r='40'
                    fill='none'
                    stroke='#e5e7eb'
                    strokeWidth='8'
                  />
                  <circle
                    cx='50'
                    cy='50'
                    r='40'
                    fill='none'
                    stroke='#26ab47'
                    strokeWidth='8'
                    strokeDasharray='213.6 251.3'
                    strokeLinecap='round'
                    transform='rotate(-90 50 50)'
                  />
                </svg>
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='text-2xl font-bold text-secondary-10 leading-none'>
                    85
                  </span>
                  <span className='text-xs text-secondary-30'>/100</span>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-x-4 gap-y-2.5 flex-1'>
                {complianceItems.map((item, i) => (
                  <div key={i} className='flex items-center gap-1.5'>
                    <Icon
                      icon={
                        item.ok ? 'ph:check-circle-fill' : 'ph:warning-fill'
                      }
                      className={`text-sm shrink-0 ${item.ok ? 'text-success' : 'text-orange-400'}`}
                    />
                    <span className='text-xs text-secondary-20 leading-tight'>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
            <h2 className='text-base font-semibold text-secondary-10'>
              Recent Transactions
            </h2>
            <Link
              href='/pay'
              className='text-sm text-primary-30 hover:underline flex items-center gap-1'>
              View All <Icon icon='ph:arrow-right' />
            </Link>
          </div>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-primary-40 text-white text-xs'>
                <th className='text-left px-6 py-3 font-medium'>
                  <span className='flex items-center gap-1.5'>
                    <Icon icon='ph:calendar-blank' />
                    Date
                  </span>
                </th>
                <th className='text-left px-4 py-3 font-medium'>
                  <span className='flex items-center gap-1.5'>
                    <Icon icon='ph:arrows-down-up' />
                    Type
                  </span>
                </th>
                <th className='text-left px-4 py-3 font-medium'>
                  <span className='flex items-center gap-1.5'>
                    <Icon icon='ph:git-branch' />
                    Source
                  </span>
                </th>
                <th className='text-left px-4 py-3 font-medium'>
                  <span className='flex items-center gap-1.5'>
                    <Icon icon='ph:currency-circle-dollar' />
                    Amount
                  </span>
                </th>
                <th className='text-left px-4 py-3 font-medium'>
                  <span className='flex items-center gap-1.5'>
                    <Icon icon='ph:receipt' />
                    Tax Included
                  </span>
                </th>
                <th className='text-left px-4 py-3 font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr
                  key={i}
                  className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                  <td className='px-6 py-3.5 text-secondary-20'>
                    <div className='text-sm'>{tx.date}</div>
                    <div className='text-xs text-secondary-30'>{tx.time}</div>
                  </td>
                  <td className='px-4 py-3.5'>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeBadge[tx.type] ?? 'bg-grey-10 text-secondary-10'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className='px-4 py-3.5 text-secondary-20 text-sm'>
                    {tx.source}
                  </td>
                  <td
                    className={`px-4 py-3.5 text-sm font-medium ${tx.amount.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                    {tx.amount}
                  </td>
                  <td className='px-4 py-3.5 text-sm text-primary-30 font-medium'>
                    {tx.tax}
                  </td>
                  <td className='px-4 py-3.5'>
                    <button className='text-primary-30 text-sm font-medium hover:underline'>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
