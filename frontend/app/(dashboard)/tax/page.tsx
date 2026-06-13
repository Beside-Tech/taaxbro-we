'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import Link from 'next/link';
import FlagIssueModal from '@/components/dashboard/tax/FlagIssueModal';

import EditVATModal from '@/components/dashboard/tax/EditVATModal';
import { dashboard, business, tax, type DashboardData, type BusinessProfile, type TaxFilingResponse } from '@/lib/api';

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatNaira(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function formatFilingDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

const filingTabs = ['All', 'VAT', 'WHT', 'CIT', 'LIRS'];

export default function TaxPage() {
  const [vatTab, setVatTab] = useState<'input' | 'output'>('input');
  const [activeFilingTab, setActiveFilingTab] = useState('All');
  const [showFlag, setShowFlag] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isVatSubmitted, setIsVatSubmitted] = useState(false);

  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filingsList, setFilingsList] = useState<TaxFilingResponse[]>([]);
  const [filingsLoading, setFilingsLoading] = useState(false);

  useEffect(() => {
    Promise.all([dashboard.get(), business.getProfile()])
      .then(([dash, prof]) => { setData(dash); setProfile(prof); })
      .catch((e) => setError(e.message ?? 'Failed to load tax data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profile?.business_id) return;
    setFilingsLoading(true);
    tax.getFilings(profile.business_id)
      .then((res) => setFilingsList(res))
      .catch((e) => console.error('Failed to load filings:', e))
      .finally(() => setFilingsLoading(false));
  }, [profile?.business_id]);

  // ── Derived values ───────────────────────────────────────────────────────
  const stats = data?.stats;
  const revenue = stats ? Number(stats.revenue_current_month) : 0;
  const businessName = profile?.name ?? null;
  const state = profile?.state ?? 'Lagos';

  // Deterministic hash so refs don't jump on every render
  function deterministicRef(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
    return String(Math.abs(hash) % 9000 + 1000);
  }

  const steps = [
    { n: 1, label: 'Computed', done: true },
    { n: 2, label: 'Ready for review', done: true },
    { n: 3, label: 'Approve & Submit', done: isVatSubmitted },
    { n: 4, label: 'Confirmed by FIRS', done: false },
  ];

  const nextFilingMonthName = stats?.next_filing_date 
    ? new Date(stats.next_filing_date).toLocaleDateString('en-GB', { month: 'short' })
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 21).toLocaleDateString('en-GB', { month: 'short' });

  const lastFilingMonthName = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - (new Date().getDate() >= 10 ? 0 : 1)
  ).toLocaleDateString('en-GB', { month: 'long' });

  const formatPeriod = (startStr: string) => {
    const d = new Date(startStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getFilingStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'confirmed' || s === 'filed') return 'Confirmed';
    if (s === 'awaiting_approval' || s === 'pending') return 'Awaiting Approval';
    if (s === 'failed') return 'Failed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getFilingStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'confirmed' || s === 'filed') return 'bg-success text-white';
    if (s === 'awaiting_approval' || s === 'pending') return 'bg-orange-400 text-white';
    if (s === 'failed') return 'bg-red-500 text-white';
    return 'bg-secondary-40 text-secondary-10';
  };

  const filteredHistory = filingsList.filter((f) => {
    const type = f.tax_type.toUpperCase();
    if (activeFilingTab === 'All') return true;
    if (activeFilingTab === 'LIRS') return f.authority.toUpperCase() === 'LIRS';
    return type === activeFilingTab.toUpperCase();
  });

  const getVatBreakdown = () => {
    if (!data || !data.recent_transactions) return [];
    
    const categoriesMap: Record<string, { collected: number; txns: number }> = {};
    const targetType = vatTab === 'output' ? 'credit' : 'debit';
    
    data.recent_transactions.forEach(tx => {
      if (tx.type === targetType && tx.vat_amount && Number(tx.vat_amount) > 0) {
        const cat = tx.category ? (tx.category.charAt(0).toUpperCase() + tx.category.slice(1)) : (targetType === 'credit' ? 'Sales' : 'Expenses');
        if (!categoriesMap[cat]) {
          categoriesMap[cat] = { collected: 0, txns: 0 };
        }
        categoriesMap[cat].collected += Number(tx.vat_amount);
        categoriesMap[cat].txns += 1;
      }
    });
    
    const list = Object.entries(categoriesMap).map(([cat, info]) => ({
      category: cat,
      collected: info.collected,
      txns: info.txns
    }));
    
    if (list.length === 0) {
      if (vatTab === 'output') {
        list.push({
          category: 'Standard Goods & Services',
          collected: stats ? Number(stats.tax_reserve) : 0,
          txns: data.recent_transactions.filter(t => t.type === 'credit').length
        });
      } else {
        list.push({
          category: 'Purchases & Operations',
          collected: 0,
          txns: data.recent_transactions.filter(t => t.type === 'debit').length
        });
      }
    }
    
    return list;
  };

  const vatBreakdown = getVatBreakdown();

  // Sum Output VAT
  const outputVatFromTxns = data?.recent_transactions
    ? data.recent_transactions
        .filter(t => t.type === 'credit' && t.vat_amount && Number(t.vat_amount) > 0)
        .reduce((sum, t) => sum + Number(t.vat_amount), 0)
    : 0;
  const outputVatTotal = stats && Number(stats.tax_reserve) > 0 ? Number(stats.tax_reserve) : outputVatFromTxns;

  // Sum Input VAT
  const inputVatTotal = data?.recent_transactions
    ? data.recent_transactions
        .filter(t => t.type === 'debit' && t.vat_amount && Number(t.vat_amount) > 0)
        .reduce((sum, t) => sum + Number(t.vat_amount), 0)
    : 0;

  const netVatPayable = Math.max(0, outputVatTotal - inputVatTotal);

  const inputVatTxns = data?.recent_transactions
    ? data.recent_transactions.filter(t => t.type === 'debit' && t.vat_amount && Number(t.vat_amount) > 0).length
    : 0;

  const outputVatTxns = data?.recent_transactions
    ? data.recent_transactions.filter(t => t.type === 'credit' && t.vat_amount && Number(t.vat_amount) > 0).length
    : 0;

  // Total confirmed filings count — only count confirmed rows from real history
  const confirmedFilingCount = filingsList.filter(
    (f) => f.status.toLowerCase() === 'confirmed' || f.status.toLowerCase() === 'filed'
  ).length;

  const statCards = [
    { 
      label: 'Filed this year', 
      value: loading ? '—' : String(confirmedFilingCount), 
      sub: confirmedFilingCount > 0 ? 'All confirmed' : 'No filings recorded yet', 
      border: confirmedFilingCount > 0 ? 'border-success' : 'border-secondary-40' 
    },
    { 
      label: 'Next Deadline', 
      value: stats?.next_filing_date ? formatFilingDate(stats.next_filing_date) : '—', 
      sub: stats?.next_filing_date ? 'Filing obligation pending' : 'No upcoming filing', 
      border: stats?.next_filing_date ? 'border-danger' : 'border-secondary-40'
    },
    { 
      label: 'Total due this month', 
      value: stats ? formatNaira(Number(stats.tax_liabilities_due) + Number(stats.tax_reserve)) : '—', 
      sub: 'Active Obligations', 
      subClass: 'text-primary-30', 
      border: 'border-primary-30' 
    },
    { 
      label: 'Overdue', 
      value: stats?.tax_liabilities_status === 'Overdue' ? '1' : '0', 
      sub: stats?.tax_liabilities_status === 'Overdue' ? 'Requires immediate action' : 'All filings up to date', 
      border: stats?.tax_liabilities_status === 'Overdue' ? 'border-danger' : 'border-secondary-40' 
    },
  ];

  const obligations = [
    { 
      name: 'Value Added Tax (VAT)', 
      meta: `7.5% · Monthly · FIRS · Due ${stats?.next_filing_date ? formatFilingDate(stats.next_filing_date) : '21 June'}`, 
      amount: stats ? formatNaira(Number(stats.tax_liabilities_due)) : '—', 
      status: isVatSubmitted 
        ? 'Awaiting Confirmation' 
        : (stats?.tax_liabilities_due && Number(stats.tax_liabilities_due) > 0 ? 'Awaiting Approval' : 'Ready'), 
      statusClass: isVatSubmitted 
        ? 'bg-blue-400 text-white' 
        : (stats?.tax_liabilities_due && Number(stats.tax_liabilities_due) > 0 ? 'bg-orange-400 text-white' : 'bg-primary-20 text-primary-40') 
    },
    { 
      name: 'Withholding Tax (WHT)', 
      meta: `At source · Monthly · FIRS · Due 21 ${nextFilingMonthName}`, 
      amount: stats ? formatNaira(Number(stats.tax_reserve) * 0.067) : '—',
      status: stats?.tax_reserve && Number(stats.tax_reserve) > 0 ? 'Filing Ready' : 'Ready', 
      statusClass: 'bg-primary-20 text-primary-40' 
    },
    { 
      name: 'Company Income Tax (CIT)', 
      meta: `30% · Annual · Due Dec ${new Date().getFullYear()}`, 
      amount: revenue > 0 ? formatNaira(revenue * 0.05) : '₦0.00', 
      status: 'Accumulating', 
      statusClass: 'bg-primary-10 text-primary-30' 
    },
    { 
      name: `PAYE – ${state} State`, 
      meta: `Monthly · ${state === 'Lagos' ? 'Lagos IRS (LIRS)' : `${state} IRS`} · Filed 10 ${lastFilingMonthName}`, 
      amount: revenue > 0 ? formatNaira(revenue * 0.02) : '₦0.00', 
      status: 'Filed', 
      statusClass: 'bg-success/15 text-success' 
    },
  ];

  const flagTxns = data?.recent_transactions
    ? data.recent_transactions.map(tx => ({
        id: tx.id.substring(0, 8).toUpperCase(),
        date: new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        desc: tx.counterparty_name ?? tx.category ?? 'General Transaction',
        amount: formatNaira(Number(tx.amount))
      }))
    : [];

  // ── CSV Export ──────────────────────────────────────────────────────────────
  function handleExportCSV() {
    const rows = [
      ['Period', 'Authority', 'Type', 'Reference', 'Submitted', 'Amount Filed', 'Status'],
      ...filteredHistory.map(r => [
        formatPeriod(r.period_start),
        r.authority,
        r.tax_type,
        r.nrs_reference ?? '—',
        r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-GB') : '—',
        r.amount_filed,
        getFilingStatusLabel(r.status)
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taaxbro-filing-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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

      <main className='flex-1 p-4 sm:p-8 space-y-5 overflow-y-auto'>
        {/* Error banner */}
        {error && (
          <div className='px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className='bg-white rounded-xl border border-grey-10 p-5 animate-pulse'>
                  <div className='h-3 bg-grey-10 rounded w-24 mb-3' />
                  <div className='h-7 bg-grey-10 rounded w-32 mb-4' />
                  <div className='h-3 bg-grey-10 rounded w-20' />
                </div>
              ))
            : statCards.map((c) => (
                <div key={c.label} className={`bg-white rounded-xl border ${c.border} p-5 shadow-sm`}>
                  <p className='text-xs text-secondary-30 mb-2'>{c.label}</p>
                  <p className='text-2xl font-bold text-secondary-10 mb-2'>{c.value}</p>
                  <p className={`text-xs ${c.subClass ?? 'text-secondary-30'}`}>{c.sub}</p>
                </div>
              ))}
        </div>

        {/* VAT Return banner */}
        {stats && (
          <div className='bg-primary-50 border border-primary-10 rounded-xl p-6'>
            <h2 className='text-xl font-semibold text-secondary-10 mb-1'>
              {isVatSubmitted ? 'VAT Return submitted successfully' : 'VAT Return is ready for your review'}
            </h2>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-secondary-30 mb-5'>
              <span>Net VAT Payable: <strong className='text-secondary-10'>{formatNaira(netVatPayable)}</strong></span>
              <span className='hidden md:inline text-secondary-40'>|</span>
              <span>Output: {formatNaira(outputVatTotal)}</span>
              <span className='hidden md:inline text-secondary-40'>·</span>
              <span>Input: {formatNaira(inputVatTotal)}</span>
              <span className='hidden md:inline text-secondary-40'>|</span>
              <span className={isVatSubmitted ? 'text-success font-medium' : 'text-danger font-medium'}>
                {isVatSubmitted ? 'Awaiting FIRS Confirmation' : `Due ${stats.next_filing_date ? formatFilingDate(stats.next_filing_date) : '21st of next month'}`}
              </span>
            </div>
            <div className='flex flex-wrap items-center gap-y-3 gap-x-4 sm:gap-x-6'>
              {steps.map((s, i) => (
                <div key={s.n} className='flex items-center shrink-0'>
                  <div className='flex items-center gap-2'>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${s.done ? 'bg-primary-30 text-white' : 'bg-secondary-40 text-secondary-30'}`}>
                      {s.done ? <Icon icon='ph:check-bold' className='text-sm' /> : s.n}
                    </div>
                    <span className={`text-xs sm:text-sm ${s.done ? 'text-primary-30 font-medium' : 'text-secondary-30'}`}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`hidden lg:block h-px w-6 lg:w-12 mx-2 lg:mx-3 ${s.done ? 'bg-primary-30' : 'bg-secondary-40'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VAT Breakdown + Active Obligations */}
        <div className='grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5'>
          {/* VAT Breakdown */}
          <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-base font-semibold text-secondary-10'>VAT Breakdown</h2>
              <Link href='/books' className='text-sm text-primary-30 hover:underline flex items-center gap-1'>
                View Transactions <Icon icon='ph:arrow-right' />
              </Link>

            </div>

            {/* Input/Output tabs */}
            <div className='flex flex-wrap gap-4 sm:gap-6 border-b border-grey-10 mb-4'>
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
                  <span className='text-secondary-10'>{formatNaira(row.collected)}</span>
                  <span className='text-secondary-30'>{row.txns}</span>
                </div>
              ))}
              {[
                { label: 'Output Total', val: formatNaira(outputVatTotal), txns: outputVatTxns },
                { label: 'Input VAT Paid', val: formatNaira(inputVatTotal), txns: inputVatTxns },
              ].map((r) => (
                <div key={r.label} className='grid grid-cols-3 px-4 py-3 text-sm border-t border-grey-10 font-semibold text-secondary-10'>
                  <span>{r.label}</span>
                  <span>{r.val}</span>
                  <span className='font-normal text-secondary-30'>{r.txns}</span>
                </div>
              ))}
              <div className='grid grid-cols-3 px-4 py-3 border-t border-grey-10 bg-primary-50/50'>
                <span className='text-sm font-bold text-primary-30'>Net VAT Payable</span>
                <span className='text-sm font-bold text-secondary-10'>{formatNaira(netVatPayable)}</span>
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

            <button 
              onClick={() => setIsVatSubmitted(true)}
              disabled={isVatSubmitted}
              className={`w-full py-3 rounded-full text-white text-sm font-medium transition-colors shadow-sm ${isVatSubmitted ? 'bg-secondary-40 cursor-not-allowed' : 'bg-primary-30 hover:bg-primary-40'}`}
            >
              {isVatSubmitted ? 'Submitted' : 'Approve & Submit'}
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
                <div key={i} className='border border-grey-10 rounded-xl p-4 hover:border-primary-20 cursor-pointer transition-colors shadow-sm'>
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
            <Link href='/settings' className='w-full mt-4 py-3 block text-center rounded-full bg-primary-40 text-white text-sm font-medium hover:bg-primary-30 transition-colors shadow-sm'>
              Configure Obligations in Settings
            </Link>

          </div>
        </div>

        {/* Filing History */}
        <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
            <h2 className='text-base font-semibold text-secondary-10'>Filing History</h2>
            <button 
              onClick={handleExportCSV}
              className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
              Export <Icon icon='ph:download-simple' />
            </button>
          </div>

          <div className='flex flex-wrap items-center gap-2 px-6 py-3 border-b border-grey-10/60'>
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

          <div className='overflow-x-auto w-full'>
            <table className='w-full text-sm min-w-[700px]'>
              <thead>
                <tr className='bg-primary-40 text-white text-xs'>
                  {['Period', 'Authority', 'Reference', 'Submitted', 'Amount Filed', 'Status'].map((h) => (
                    <th key={h} className='text-left px-5 py-3 font-medium'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filingsLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-secondary-30">
                      <div className="flex items-center justify-center gap-2">
                        <Icon icon="ph:circle-notch" className="text-lg animate-spin text-primary-30" />
                        <span>Loading filings...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-secondary-30">
                      No filings recorded yet. Prepare your CSV, submit to FIRS/REV360, and enter the reference code to record.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((row, i) => (
                    <tr key={row.id ?? i} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                      <td className='px-5 py-3.5 text-secondary-10'>{formatPeriod(row.period_start)}</td>
                      <td className='px-5 py-3.5 text-secondary-10'>{row.authority} ({row.tax_type})</td>
                      <td className='px-5 py-3.5 text-secondary-30'>{row.nrs_reference ?? '—'}</td>
                      <td className='px-5 py-3.5 text-secondary-10'>
                        {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className='px-5 py-3.5 font-medium text-secondary-10'>{formatNaira(row.amount_filed)}</td>
                      <td className='px-5 py-3.5'>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getFilingStatusClass(row.status)}`}>
                          {getFilingStatusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className='flex items-center justify-between px-6 py-4 border-t border-grey-10/60'>
            <p className='text-xs text-secondary-30'>Showing {filteredHistory.length} of {filingsList.length}</p>
            <div className='flex items-center gap-1'>
              <button className='w-8 h-8 rounded-full bg-primary-30 text-white text-sm flex items-center justify-center transition-colors'>1</button>
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

      {showFlag && (
        <FlagIssueModal 
          onClose={() => setShowFlag(false)} 
          transactions={flagTxns}
          period={stats?.next_filing_date 
            ? new Date(stats.next_filing_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          }
          authority='FIRS'
        />
      )}
      {showEdit && (
        <EditVATModal 
          onClose={() => setShowEdit(false)} 
          initialRows={vatBreakdown.map(v => ({
            category: v.category,
            vat: v.collected,
            txns: v.txns
          }))}
          period={stats?.next_filing_date 
            ? new Date(stats.next_filing_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          }
        />
      )}
    </div>
  );
}
