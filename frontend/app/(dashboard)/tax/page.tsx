'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import FlagIssueModal from '@/components/dashboard/tax/FlagIssueModal';
import EditVATModal from '@/components/dashboard/tax/EditVATModal';

const statCards = [
  { label: 'Filed this year', value: '14', sub: 'All confirmed', border: 'border-success' },
  { label: 'Next Deadline', value: '21st June', sub: '20 days away', border: 'border-danger' },
  { label: 'Total due this month', value: '₦362,900', sub: '3 Active Obligations', subClass: 'text-primary-30', border: 'border-primary-30' },
  { label: 'Overdue', value: '0', sub: 'All filings up to date', border: 'border-secondary-40' },
];

const vatBreakdown = [
  { category: 'Goods Sales', collected: '₦112,500', txns: 40 },
  { category: 'Goods Sales', collected: '₦112,500', txns: 40 },
  { category: 'Goods Sales', collected: '₦112,500', txns: 40 },
];

const obligations = [
  { name: 'Value Added Tax (VAT)', meta: '7.5% | Monthly | NRS | Due 21 June', amount: '₦12,500', status: 'Awaiting Approval', statusClass: 'bg-orange-400 text-white' },
  { name: 'Witholding Tax (VAT)', meta: 'At source · Monthly · NRS · Due 21 Jun', amount: '₦11,500', status: 'Filing Ready', statusClass: 'bg-primary-20 text-primary-40' },
  { name: 'Company Income Tax (CIT)', meta: '30% · Annual · Due Dec 2026', amount: 'Est. ₦186K', status: 'Accumulating', statusClass: 'bg-primary-10 text-primary-30' },
  { name: 'PAYE - Lagos State (LIRS)', meta: 'Monthly · Lagos IRS · Filed 10 June', amount: '₦15,689.22', status: 'Filed', statusClass: 'bg-success/15 text-success' },
];

const filingTabs = ['All', 'VAT (45)', 'WHT', 'CIT (2)', 'LIRS (16)'];

const filingHistory = [
  { period: 'May 2026', authority: 'NRS', ref: 'NRS/VAT/2026/04/8821', submitted: 'May 2026', amount: '₦7,214.22', status: 'Confirmed', statusClass: 'bg-success text-white' },
  { period: 'May 2026', authority: 'NRS', ref: 'NRS/VAT/2026/04/8821', submitted: 'May 2026', amount: '₦7,214.22', status: 'Confirmed', statusClass: 'bg-success text-white' },
  { period: 'May 2026', authority: 'LIRS', ref: 'NRS/VAT/2026/04/8821', submitted: 'May 2026', amount: '₦7,214.22', status: 'Confirmed', statusClass: 'bg-success text-white' },
  { period: 'May 2026', authority: 'NRS', ref: '--', submitted: 'May 2026', amount: '₦7,214.22', status: 'Awaiting Approval', statusClass: 'bg-orange-400 text-white' },
  { period: 'May 2026', authority: 'NRS', ref: 'NRS/VAT/2026/04/8821', submitted: 'May 2026', amount: '₦7,214.22', status: 'Confirmed', statusClass: 'bg-success text-white' },
];

const steps = [
  { n: 1, label: 'Computed', done: true },
  { n: 2, label: 'Ready for review', done: true },
  { n: 3, label: 'Approve & Submit', done: false },
  { n: 4, label: 'Confirmed by NRS', done: false },
];

export default function TaxPage() {
  const [vatTab, setVatTab] = useState<'input' | 'output'>('input');
  const [activeFilingTab, setActiveFilingTab] = useState('All');
  const [showFlag, setShowFlag] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <div>
          <h1 className='text-2xl font-bold text-secondary-10'>Taaxbro Tax</h1>
          <p className='text-sm text-secondary-30 mt-0.5'>
            Federal and state tax compliance – all obligations in one place
          </p>
        </div>
      </TopBar>

      <main className='flex-1 p-8 space-y-5 overflow-y-auto'>
        {/* Stat cards */}
        <div className='grid grid-cols-4 gap-4'>
          {statCards.map((c) => (
            <div key={c.label} className={`bg-white rounded-xl border ${c.border} p-5`}>
              <p className='text-xs text-secondary-30 mb-2'>{c.label}</p>
              <p className='text-2xl font-bold text-secondary-10 mb-2'>{c.value}</p>
              <p className={`text-xs ${c.subClass ?? 'text-secondary-30'}`}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* VAT Return banner */}
        <div className='bg-primary-50 border border-primary-10 rounded-xl p-6'>
          <h2 className='text-xl font-semibold text-secondary-10 mb-1'>
            VAT Return for May 2026 is ready for your review
          </h2>
          <div className='flex items-center gap-4 text-sm text-secondary-30 mb-5'>
            <span>Total Liability: <strong className='text-secondary-10'>₦161,400.22</strong></span>
            <span className='text-secondary-40'>|</span>
            <span>Filed to NRS</span>
            <span className='text-secondary-40'>|</span>
            <span className='text-danger font-medium'>Due 21 Jun 2026</span>
          </div>
          <div className='flex items-center gap-0'>
            {steps.map((s, i) => (
              <div key={s.n} className='flex items-center'>
                <div className='flex items-center gap-2'>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${s.done ? 'bg-primary-30 text-white' : 'bg-secondary-40 text-secondary-30'}`}>
                    {s.done ? <Icon icon='ph:check-bold' className='text-sm' /> : s.n}
                  </div>
                  <span className={`text-sm ${s.done ? 'text-primary-30 font-medium' : 'text-secondary-30'}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-12 mx-3 ${s.done ? 'bg-primary-30' : 'bg-secondary-40'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* VAT Breakdown + Active Obligations */}
        <div className='grid grid-cols-[1.1fr_1fr] gap-5'>
          {/* VAT Breakdown */}
          <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-base font-semibold text-secondary-10'>VAT - May Breakdown</h2>
              <button className='text-sm text-primary-30 hover:underline flex items-center gap-1'>
                View Transactions <Icon icon='ph:arrow-right' />
              </button>
            </div>

            {/* Input/Output tabs */}
            <div className='flex gap-6 border-b border-grey-10 mb-4'>
              {(['input', 'output'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setVatTab(t)}
                  className={`pb-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${vatTab === t ? 'border-primary-30 text-primary-30' : 'border-transparent text-secondary-30'}`}
                >
                  {t === 'input' ? 'Input VAT' : 'Output VAT'}
                </button>
              ))}
            </div>

            <div className='border border-grey-10 rounded-xl overflow-hidden mb-4'>
              <div className='grid grid-cols-3 bg-primary-40 text-white text-xs px-4 py-3 font-medium'>
                <span>Category</span>
                <span>VAT Collected</span>
                <span>Transactions</span>
              </div>
              {vatBreakdown.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 px-4 py-3 text-sm ${i > 0 ? 'border-t border-grey-10' : ''}`}>
                  <span className='text-secondary-10'>{row.category}</span>
                  <span className='text-secondary-10'>{row.collected}</span>
                  <span className='text-secondary-30'>{row.txns}</span>
                </div>
              ))}
              {[
                { label: 'Output Total', val: '₦112,500', txns: 40 },
                { label: 'Input VAT Paid', val: '₦112,500', txns: 40 },
              ].map((r) => (
                <div key={r.label} className='grid grid-cols-3 px-4 py-3 text-sm border-t border-grey-10 font-semibold text-secondary-10'>
                  <span>{r.label}</span>
                  <span>{r.val}</span>
                  <span className='font-normal text-secondary-30'>{r.txns}</span>
                </div>
              ))}
              <div className='grid grid-cols-3 px-4 py-3 border-t border-grey-10 bg-primary-50/50'>
                <span className='text-sm font-bold text-primary-30'>Net VAT Payable</span>
                <span className='text-sm font-bold text-secondary-10'>₦112,500</span>
                <span />
              </div>
            </div>

            <div className='flex items-center gap-4 mb-4'>
              <button onClick={() => setShowEdit(true)} className='flex items-center gap-1.5 text-sm text-secondary-30 hover:text-secondary-10 transition-colors'>
                <Icon icon='ph:pencil-simple' /> Edit Breakdown
              </button>
              <button onClick={() => setShowFlag(true)} className='flex items-center gap-1.5 text-sm text-secondary-30 hover:text-secondary-10 transition-colors'>
                <Icon icon='ph:warning' /> Flag an Issue
              </button>
            </div>

            <button className='w-full py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors'>
              Approve &amp; Submit
            </button>
          </div>

          {/* Active Obligations */}
          <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
            <h2 className='text-base font-semibold text-secondary-10 mb-1'>Active Obligations</h2>
            <p className='text-xs text-secondary-30 flex items-center gap-1 mb-5'>
              <Icon icon='ph:info' /> Click on item to view more info
            </p>
            <div className='space-y-3'>
              {obligations.map((ob, i) => (
                <div key={i} className='border border-grey-10 rounded-xl p-4 hover:border-primary-20 cursor-pointer transition-colors'>
                  <div className='flex items-start justify-between gap-2 mb-2'>
                    <div>
                      <p className='text-sm font-medium text-secondary-10'>{ob.name}</p>
                      <p className='text-xs text-secondary-30 mt-0.5'>{ob.meta}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium shrink-0 ${ob.statusClass}`}>
                      {ob.status}
                    </span>
                  </div>
                  <p className='text-sm font-semibold text-secondary-10'>{ob.amount}</p>
                </div>
              ))}
            </div>
            <button className='w-full mt-4 py-3 rounded-full bg-primary-40 text-white text-sm font-medium hover:bg-primary-30 transition-colors'>
              View Full List
            </button>
          </div>
        </div>

        {/* Filing History */}
        <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
            <h2 className='text-base font-semibold text-secondary-10'>Filing History</h2>
            <button className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
              Export <Icon icon='ph:download-simple' />
            </button>
          </div>

          <div className='flex items-center gap-2 px-6 py-3 border-b border-grey-10/60'>
            {filingTabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveFilingTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${activeFilingTab === t ? 'bg-primary-30 text-white font-medium' : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-primary-40 text-white text-xs'>
                {['Period', 'Authority', 'Reference', 'Submitted', 'Amount Filed', 'Status'].map((h) => (
                  <th key={h} className='text-left px-5 py-3 font-medium'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filingHistory.map((row, i) => (
                <tr key={i} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                  <td className='px-5 py-3.5 text-secondary-10'>{row.period}</td>
                  <td className='px-5 py-3.5 text-secondary-10'>{row.authority}</td>
                  <td className='px-5 py-3.5 text-secondary-30'>{row.ref}</td>
                  <td className='px-5 py-3.5 text-secondary-10'>{row.submitted}</td>
                  <td className='px-5 py-3.5 font-medium text-secondary-10'>{row.amount}</td>
                  <td className='px-5 py-3.5'>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${row.statusClass}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className='flex items-center justify-between px-6 py-4 border-t border-grey-10/60'>
            <p className='text-xs text-secondary-30'>Showing 7 out of 268</p>
            <div className='flex items-center gap-1'>
              {[1, 2, 3].map((n) => (
                <button key={n} className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors ${n === 1 ? 'bg-primary-30 text-white' : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'}`}>{n}</button>
              ))}
              <span className='w-8 h-8 flex items-center justify-center text-secondary-30 text-sm'>...</span>
              <button className='w-8 h-8 rounded-full border border-grey-10 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>12</button>
              <button className='w-8 h-8 rounded-full border border-grey-10 text-secondary-10 flex items-center justify-center hover:bg-primary-50 transition-colors'>
                <Icon icon='ph:arrow-right' className='text-sm' />
              </button>
            </div>
            <div className='flex items-center gap-2 text-xs text-secondary-30'>
              Rows:
              <div className='relative'>
                <select className='border border-grey-10 rounded-lg px-2 py-1 text-xs text-secondary-10 outline-none appearance-none pr-5'>
                  <option>10</option><option>20</option><option>50</option>
                </select>
                <Icon icon='ph:caret-down' className='absolute right-1 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-xs' />
              </div>
            </div>
          </div>
        </div>
      </main>

      {showFlag && <FlagIssueModal onClose={() => setShowFlag(false)} />}
      {showEdit && <EditVATModal onClose={() => setShowEdit(false)} />}
    </div>
  );
}
