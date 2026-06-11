'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import TopBar from '@/components/dashboard/TopBar';
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

interface TabProps {
  data: DashboardData | null;
  loading: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BooksTabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = ['Overview', 'Invoices', 'Expenses', 'Reports'];
  return (
    <div className='flex gap-8 border-b border-grey-10'>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${active === t ? 'border-primary-30 text-primary-30' : 'border-transparent text-secondary-30 hover:text-secondary-10'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ data, loading }: TabProps) {
  const [alertDismissed, setAlertDismissed] = useState(false);

  const stats = data?.stats;
  const recentTransactions = data?.recent_transactions ?? [];

  const totalReceived = stats?.revenue_current_month ?? 0;
  const totalSent = recentTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalReceived - totalSent;

  const statCards = [
    { 
      label: 'Revenue (Current)', 
      value: formatNaira(totalReceived), 
      footer: { 
        text: stats?.revenue_change_pct != null ? `${Math.abs(stats.revenue_change_pct)}% vs last month` : '18% vs April', 
        icon: stats?.revenue_change_pct != null && stats.revenue_change_pct >= 0 ? 'ph:trend-up' : 'ph:trend-down', 
        cls: stats?.revenue_change_pct != null && stats.revenue_change_pct >= 0 ? 'text-success' : 'text-danger' 
      }, 
      border: 'border-success' 
    },
    { 
      label: 'Expenses (Current)', 
      value: formatNaira(totalSent), 
      footer: { text: '6% vs April', icon: 'ph:trend-up', cls: 'text-danger' }, 
      border: 'border-danger' 
    },
    { 
      label: 'Net Profit', 
      value: formatNaira(netFlow), 
      footer: { text: 'Calculated this month', cls: 'text-success' }, 
      border: 'border-primary-30' 
    },
    { 
      label: 'Outstanding', 
      value: stats ? formatNaira(stats.outstanding_invoices_amount) : '—', 
      footer: { 
        text: stats ? `${stats.outstanding_invoices_unpaid} Unpaid | ${stats.outstanding_invoices_overdue} Overdue` : '0 Unpaid', 
        cls: 'text-orange-500' 
      }, 
      border: 'border-orange-400' 
    },
  ];

  const chartData = [
    { month: 'Jan', Revenue: 61.84, Expenses: 14.29 },
    { month: 'Feb', Revenue: 21.4, Expenses: 45.65 },
    { month: 'Mar', Revenue: 53.27, Expenses: 47.66 },
    { month: 'Apr', Revenue: 95.99, Expenses: 60.29 },
    { month: 'May', Revenue: totalReceived / 1000, Expenses: totalSent / 1000 },
  ];

  const creditTransactions = recentTransactions.filter((tx) => tx.type === 'credit');

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-secondary-10'>Books Summary</h2>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-secondary-30'>Month</label>
          <div className='relative'>
            <select className='border border-grey-10 rounded-lg px-3 py-1.5 text-sm text-secondary-10 outline-none appearance-none pr-7'>
              <option>Current</option>
            </select>
            <Icon icon='ph:caret-down' className='absolute right-2 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-sm' />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-4 gap-4'>
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
                {c.footer.icon
                  ? <p className={`text-xs flex items-center gap-1 ${c.footer.cls}`}><Icon icon={c.footer.icon} />{c.footer.text}</p>
                  : <p className={`text-xs ${c.footer.cls}`}>{c.footer.text}</p>}
              </div>
            ))}
      </div>

      <div className='grid grid-cols-[1fr_1fr] gap-5'>
        {/* P&L Snapshot */}
        <div className='bg-white rounded-xl border border-grey-10/60 p-6 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-semibold text-secondary-10'>P&amp;L Snapshot</h3>
            <button className='text-sm text-primary-30 hover:underline flex items-center gap-1'>Full Report <Icon icon='ph:arrow-right' /></button>
          </div>
          <div className='border border-grey-10 rounded-xl overflow-hidden text-sm'>
            <div className='bg-primary-50 px-4 py-2.5 font-semibold text-secondary-10'>Revenue</div>
            <div className='flex justify-between px-4 py-2.5'>
              <span className='text-secondary-10'>Operating Revenue</span>
              <span className='text-success font-medium'>{formatNaira(totalReceived)}</span>
            </div>
            <div className='bg-primary-50 px-4 py-2.5 font-semibold text-secondary-10 border-t border-grey-10'>Expenses</div>
            <div className='flex justify-between px-4 py-2.5 border-t border-grey-10'>
              <span className='text-secondary-10'>Operating Expenses</span>
              <span className='text-danger font-medium'>-{formatNaira(totalSent)}</span>
            </div>
            <div className='flex justify-between px-4 py-3 bg-primary-40 text-white font-semibold border-t border-grey-10'>
              <span>Net Tax Reserved</span>
              <span>{stats ? formatNaira(stats.tax_reserve) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className='bg-white rounded-xl border border-grey-10/60 p-6 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-semibold text-secondary-10'>Inbound Receipts</h3>
            <button className='text-sm text-primary-30 hover:underline flex items-center gap-1'>View All <Icon icon='ph:arrow-right' /></button>
          </div>

          {!alertDismissed && (
            <div className='bg-primary-50 border border-primary-10 rounded-xl p-3 mb-4'>
              <p className='text-xs text-secondary-10 mb-2'>
                <strong>Conversational OCR</strong> is active. You can upload receipts via WhatsApp to scan them automatically.
              </p>
              <div className='flex gap-2'>
                <button onClick={() => setAlertDismissed(true)} className='bg-primary-30 text-white text-xs px-3 py-1.5 rounded-full hover:bg-primary-40 transition-colors'>Got it</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className='space-y-2 animate-pulse'>
              {[0, 1, 2].map((i) => <div key={i} className='h-8 bg-grey-10 rounded' />)}
            </div>
          ) : creditTransactions.length === 0 ? (
            <div className='text-center py-8 text-xs text-secondary-30'>No inbound receipts yet</div>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-primary-40 text-white text-xs'>
                  <th className='text-left px-4 py-2.5 font-medium'>Source / Client</th>
                  <th className='text-left px-4 py-2.5 font-medium'>Amount</th>
                  <th className='text-left px-4 py-2.5 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {creditTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                    <td className='px-4 py-2.5 text-secondary-10'>{tx.counterparty_name ?? tx.bank_name ?? '—'}</td>
                    <td className='px-4 py-2.5 text-success font-medium'>+{formatNaira(tx.amount)}</td>
                    <td className='px-4 py-2.5'>
                      <span className='text-xs bg-success text-white px-2.5 py-1 rounded-full font-medium'>Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className='bg-white rounded-xl border border-grey-10/60 p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-5'>
          <h3 className='text-base font-semibold text-secondary-10'>Revenue vs Expenses (NGN in Thousands)</h3>
        </div>
        <ResponsiveContainer width='100%' height={280}>
          <BarChart data={chartData} barGap={4} barCategoryGap='35%'>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e5e5e5' />
            <XAxis dataKey='month' axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#989797' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#989797' }} tickFormatter={(v) => `₦${v}k`} />
            <Tooltip formatter={(v) => [v != null ? `₦${parseFloat(v.toString()).toFixed(1)}k` : '—']} />
            <Legend iconType='square' iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            <Bar dataKey='Revenue' fill='#8b7cf8' radius={[4, 4, 0, 0]} />
            <Bar dataKey='Expenses' fill='#f4a4a4' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────

function InvoicesTab({ data, loading }: TabProps) {
  const [search, setSearch] = useState('');

  const recentTransactions = data?.recent_transactions ?? [];
  const creditTransactions = recentTransactions.filter((tx) => tx.type === 'credit');

  const filteredInvoices = creditTransactions.filter((tx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (tx.counterparty_name?.toLowerCase().includes(q) ?? false) ||
      (tx.bank_name?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className='space-y-4'>
      <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden shadow-sm'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
          <h2 className='text-base font-semibold text-secondary-10'>Invoices</h2>
          <div className='flex gap-2'>
            <button className='flex items-center gap-1.5 bg-primary-30 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-primary-40 transition-colors shadow-sm'>
              New Invoice <Icon icon='ph:file-plus' />
            </button>
            <button className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
              Export <Icon icon='ph:download-simple' />
            </button>
          </div>
        </div>

        <div className='px-6 py-3 border-b border-grey-10/60'>
          <div className='relative'>
            <Icon icon='ph:magnifying-glass' className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-30' />
            <input
              type='text' placeholder='Search by Client Name' value={search} onChange={(e) => setSearch(e.target.value)}
              className='w-full border border-grey-10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
            />
          </div>
        </div>

        {loading ? (
          <div className='p-6 space-y-3 animate-pulse'>
            {[0, 1, 2].map((i) => <div key={i} className='h-8 bg-grey-10 rounded' />)}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className='text-center py-12 text-sm text-secondary-30'>No invoices found</div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-primary-40 text-white text-xs'>
                <th className='text-left px-5 py-3 font-medium'>Invoice ID</th>
                <th className='text-left px-4 py-3 font-medium'><span className='flex items-center gap-1.5'><Icon icon='ph:calendar-check' />Issued</span></th>
                <th className='text-left px-4 py-3 font-medium'><span className='flex items-center gap-1.5'><Icon icon='ph:user' />Client</span></th>
                <th className='text-left px-4 py-3 font-medium'><span className='flex items-center gap-1.5'><Icon icon='ph:currency-circle-dollar' />Amount</span></th>
                <th className='text-left px-4 py-3 font-medium'>Status</th>
                <th className='text-left px-4 py-3 font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((tx) => {
                const { date: d } = formatDate(tx.transaction_date);
                return (
                  <tr key={tx.id} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                    <td className='px-5 py-3.5 text-secondary-10 font-medium'>INV-{tx.id.substring(0, 4).toUpperCase()}</td>
                    <td className='px-4 py-3.5 text-secondary-30'>{d}</td>
                    <td className='px-4 py-3.5 text-secondary-10'>{tx.counterparty_name ?? tx.bank_name ?? '—'}</td>
                    <td className='px-4 py-3.5 text-secondary-10 font-semibold'>{formatNaira(tx.amount)}</td>
                    <td className='px-4 py-3.5'>
                      <span className='text-xs bg-success text-white px-2.5 py-1 rounded-full font-medium'>Paid</span>
                    </td>
                    <td className='px-4 py-3.5'>
                      <button className='flex items-center gap-1 text-primary-30 text-sm font-medium hover:underline'>
                        <Icon icon='ph:eye-circle' /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className='flex items-center justify-between px-6 py-4 border-t border-grey-10/60'>
          <p className='text-xs text-secondary-30'>Showing {filteredInvoices.length} of {filteredInvoices.length}</p>
          <div className='flex items-center gap-1'>
            <button className='w-8 h-8 rounded-full bg-primary-30 text-white text-sm flex items-center justify-center transition-colors'>1</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

function ExpensesTab({ data, loading }: TabProps) {
  const recentTransactions = data?.recent_transactions ?? [];
  const debitTransactions = recentTransactions.filter((tx) => tx.type === 'debit');

  const categoryIcons: Record<string, string> = {
    utility: 'ph:lightning',
    software: 'ph:robot',
    office: 'ph:storefront',
    travel: 'ph:airplane',
  };

  return (
    <div className='grid grid-cols-[1fr_360px] gap-5 items-start'>
      <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden shadow-sm'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
          <h2 className='text-base font-semibold text-secondary-10'>Expenses</h2>
          <div className='flex gap-2'>
            <button className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
              Filter <Icon icon='ph:sliders-horizontal' />
            </button>
            <button className='flex items-center gap-1.5 bg-primary-30 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-primary-40 transition-colors shadow-sm'>
              <Icon icon='ph:scan' /> Scan Receipt
            </button>
          </div>
        </div>

        {loading ? (
          <div className='p-6 space-y-3 animate-pulse'>
            {[0, 1, 2].map((i) => <div key={i} className='h-12 bg-grey-10 rounded' />)}
          </div>
        ) : debitTransactions.length === 0 ? (
          <div className='text-center py-12 text-sm text-secondary-30'>No recorded expenses found</div>
        ) : (
          <div className='divide-y divide-grey-10/60'>
            {debitTransactions.map((exp) => {
              const { date: d } = formatDate(exp.transaction_date);
              const cat = exp.category?.toLowerCase() || 'office';
              const icon = categoryIcons[cat] ?? 'ph:shopping-bag';

              return (
                <div key={exp.id} className='flex items-center gap-4 px-6 py-4 hover:bg-primary-50/30 transition-colors'>
                  <div className='w-10 h-10 rounded-xl border border-grey-10 flex items-center justify-center shrink-0'>
                    <Icon icon={icon} className='text-xl text-secondary-10' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-secondary-10'>{exp.counterparty_name ?? exp.bank_name ?? 'Expense'}</p>
                    <p className='text-xs text-secondary-30 mt-0.5'>{d} | {exp.category ?? 'Uncategorized'}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-semibold text-danger'>-{formatNaira(exp.amount)}</p>
                    <p className='text-xs text-primary-30 mt-0.5'>
                      {exp.vat_amount != null ? `VAT: ${formatNaira(exp.vat_amount)}` : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className='flex justify-between items-center px-6 py-4 bg-primary-40 text-white font-semibold text-sm'>
          <span>Total Input VAT Claimable</span>
          <span>
            {formatNaira(
              debitTransactions.reduce((sum, tx) => sum + (tx.vat_amount ?? 0), 0)
            )}
          </span>
        </div>
      </div>

      {/* Scan Receipt panel */}
      <div className='bg-white rounded-xl border border-grey-10/60 p-6 shadow-sm'>
        <h3 className='text-base font-semibold text-secondary-10 text-center mb-6'>Scan Receipt</h3>
        <p className='text-sm text-secondary-30 text-center mb-4'>Drop document here</p>
        <div className='border-2 border-dashed border-grey-10 rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary-20 transition-colors cursor-pointer'>
          <Icon icon='ph:upload-simple' className='text-3xl text-secondary-30' />
          <p className='text-sm text-secondary-30 text-center'>Drop a file or click to upload</p>
          <p className='text-xs text-secondary-40'>(PNG, PDF, JPEG. Max 5mb)</p>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab({ data, loading }: TabProps) {
  const recentTransactions = data?.recent_transactions ?? [];
  const stats = data?.stats;

  const totalReceived = stats?.revenue_current_month ?? 0;
  const totalSent = recentTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalReceived - totalSent;

  const plReports = [
    { 
      section: 'Revenue', 
      rows: [
        { label: 'Operating Revenue', amount: formatNaira(totalReceived), positive: true },
      ], 
      total: { label: 'Total Revenue', amount: formatNaira(totalReceived), positive: true } 
    },
    { 
      section: 'Cost of Goods sold / Expenses', 
      rows: [
        { label: 'Operating Expenses', amount: `-${formatNaira(totalSent)}`, positive: false },
      ], 
      total: { label: 'Gross Profit', amount: formatNaira(netFlow), positive: true } 
    },
  ];

  return (
    <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden shadow-sm'>
      <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
        <h2 className='text-base font-semibold text-secondary-10'>Profit &amp; Loss Snapshot</h2>
        <div className='flex gap-2'>
          <button className='flex items-center gap-1.5 border border-grey-10 rounded-lg px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
            Export <Icon icon='ph:download-simple' />
          </button>
        </div>
      </div>

      {loading ? (
        <div className='p-6 space-y-3 animate-pulse'>
          {[0, 1, 2].map((i) => <div key={i} className='h-10 bg-grey-10 rounded' />)}
        </div>
      ) : (
        <>
          {plReports.map((section) => (
            <div key={section.section}>
              <div className='bg-primary-30 text-white px-6 py-3 text-sm font-semibold'>{section.section}</div>
              {section.rows.map((r, i) => (
                <div key={i} className='flex justify-between px-6 py-3.5 border-t border-grey-10/60 text-sm'>
                  <span className='text-secondary-10'>{r.label}</span>
                  <span className={r.positive ? 'text-success font-medium' : 'text-danger font-medium'}>{r.amount}</span>
                </div>
              ))}
              <div className='flex justify-between px-6 py-4 border-t border-grey-10 text-sm font-bold text-secondary-10'>
                <span>{section.total.label}</span>
                <span className={section.total.positive ? 'text-success' : 'text-danger'}>{section.total.amount}</span>
              </div>
            </div>
          ))}

          <div className='flex justify-between px-6 py-4 bg-primary-40 text-white font-semibold text-sm'>
            <span>Net Profit</span>
            <span>{formatNaira(netFlow)}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BooksPage() {
  const [activeTab, setActiveTab] = useState('Overview');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboard
      .get()
      .then(setData)
      .catch((e) => setError(e.message ?? 'Failed to load books data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <div>
          <h1 className='text-2xl font-bold text-secondary-10'>Taaxbro Books</h1>
          <p className='text-sm text-secondary-30 mt-0.5'>Invoices, expenses, receipts and reports</p>
        </div>
      </TopBar>

      <main className='flex-1 p-8 space-y-5 overflow-y-auto'>
        {/* Error banner */}
        {error && (
          <div className='px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
            {error}
          </div>
        )}

        <BooksTabs active={activeTab} onChange={setActiveTab} />
        {activeTab === 'Overview' && <OverviewTab data={data} loading={loading} />}
        {activeTab === 'Invoices' && <InvoicesTab data={data} loading={loading} />}
        {activeTab === 'Expenses' && <ExpensesTab data={data} loading={loading} />}
        {activeTab === 'Reports' && <ReportsTab data={data} loading={loading} />}
      </main>
    </div>
  );
}
