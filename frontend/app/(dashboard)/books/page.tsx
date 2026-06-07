'use client';

import { useState } from 'react';
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

// ─── Data ────────────────────────────────────────────────────────────────────

const statCards = [
  { label: 'Revenue (May)', value: '₦4.82M', footer: { text: '18% vs April', icon: 'ph:trend-up', cls: 'text-success' }, border: 'border-success' },
  { label: 'Expenses (May)', value: '₦362K', footer: { text: '6% vs April', icon: 'ph:trend-up', cls: 'text-danger' }, border: 'border-danger' },
  { label: 'Net Profit', value: '₦218K', footer: { text: '27% vs April', icon: 'ph:trend-up', cls: 'text-success' }, border: 'border-primary-30' },
  { label: 'Outstanding', value: '₦4.82M', footer: { text: '7 Unpaid | 2 Overdue', cls: 'text-orange-500' }, border: 'border-orange-400' },
];

const chartData = [
  { month: 'Jan', Revenue: 61.84, Expenses: 14.29 },
  { month: 'Feb', Revenue: 21.4, Expenses: 45.65 },
  { month: 'Mar', Revenue: 53.27, Expenses: 47.66 },
  { month: 'Apr', Revenue: 95.99, Expenses: 60.29 },
  { month: 'May', Revenue: 78.9, Expenses: 22.59 },
];

const plRevenue = [
  { label: 'Product Sales', amount: '₦112,500', positive: true },
  { label: 'Service Sales', amount: '₦112,500', positive: true },
  { label: 'Consulting', amount: '₦112,500', positive: true },
];
const plExpenses = [
  { label: 'Product Sales', amount: '-₦112,500', positive: false },
  { label: 'Product Sales', amount: '-₦112,500', positive: false },
  { label: 'Product Sales', amount: '-₦112,500', positive: false },
];

const recentInvoices = [
  { client: 'Product Sales', amount: '₦112,500', status: 'Paid' },
  { client: 'Product Sales', amount: '₦112,500', status: 'Paid' },
  { client: 'Product Sales', amount: '₦112,500', status: 'Paid' },
  { client: 'Product Sales', amount: '₦112,500', status: 'Paid' },
  { client: 'Product Sales', amount: '₦112,500', status: 'Paid' },
];

const invoiceTabs = ['All (45)', 'Draft (4)', 'Unpaid (2)', 'Paid (2)', 'Overdue (2)'];
const invoices = [
  { id: 'INV-0041', issued: '15 Jan', due: '15 July', client: 'Hanifa Logistics', amount: '₦276,214', status: 'Paid', statusCls: 'bg-success text-white' },
  { id: 'INV-0042', issued: '15 Jan', due: '15 April', client: 'Daniel Ochoja', amount: '₦30,214.44', status: 'Unpaid', statusCls: 'bg-danger text-white' },
  { id: 'INV-0043', issued: '15 Jan', due: '15 Jan', client: 'Horizon Lock', amount: '₦30,214.44', status: 'Overdue', statusCls: 'bg-orange-400 text-white' },
  { id: 'INV-0044', issued: '15 Feb', due: '15 Jan', client: 'David Saya', amount: '₦27,114.09', status: 'Overdue', statusCls: 'bg-orange-400 text-white' },
  { id: 'INV-0045', issued: '15 Mar', due: 'Abuja Jets', client: 'Abuja Jets', amount: '₦9,500.20', status: 'Draft', statusCls: 'bg-secondary-40 text-white' },
];

const expenseTabs = ['All (45)', 'Office (4)', 'Travel (2)', 'Tech (2)', 'Utilities (2)'];
const expenses = [
  { icon: 'ph:airplane', label: 'Flight Ticket', meta: '25 May | Office | Receipt Attached', amount: '-₦112,500', vat: 'VAT: ₦11,760' },
  { icon: 'ph:storefront', label: 'Shoprite - Office Supplies', meta: '18 May | Office | Scanned', amount: '-₦8,710', vat: 'VAT: ₦460.66' },
  { icon: 'ph:lightning', label: 'EKEDC Electricity bill', meta: '20 May | Utilities | Scanned', amount: '-₦18,500', vat: 'VAT: ₦2,110' },
  { icon: 'ph:robot', label: 'ChatGPT Subscription', meta: '01 May | Tech & Software', amount: '-₦40,500', vat: 'VAT: ₦3,060' },
];

const plReports = [
  { section: 'Revenue', rows: [
    { label: 'Product Sales', amount: '₦112,500', positive: true },
    { label: 'Service Fee', amount: '₦112,500', positive: true },
    { label: 'Consulting Income', amount: '₦112,500', positive: true },
  ], total: { label: 'Total Revenue', amount: '₦112,500', positive: true } },
  { section: 'Cost of Goods sold', rows: [
    { label: 'Direct Materials', amount: '-₦112,500', positive: false },
    { label: 'Direct Labour', amount: '-₦112,500', positive: false },
    { label: 'Product Sales', amount: '-₦112,500', positive: false },
  ], total: { label: 'Gross Profit', amount: '₦112,500', positive: true } },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function OverviewTab() {
  const [alertDismissed, setAlertDismissed] = useState(false);

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-secondary-10'>Books Summary</h2>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-secondary-30'>Month</label>
          <div className='relative'>
            <select className='border border-grey-10 rounded-lg px-3 py-1.5 text-sm text-secondary-10 outline-none appearance-none pr-7'>
              <option>May</option><option>April</option><option>March</option>
            </select>
            <Icon icon='ph:caret-down' className='absolute right-2 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-sm' />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-4 gap-4'>
        {statCards.map((c) => (
          <div key={c.label} className={`bg-white rounded-xl border ${c.border} p-5`}>
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
        <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-semibold text-secondary-10'>P&amp;L Snapshot (May)</h3>
            <button className='text-sm text-primary-30 hover:underline flex items-center gap-1'>Full Report <Icon icon='ph:arrow-right' /></button>
          </div>
          <div className='border border-grey-10 rounded-xl overflow-hidden text-sm'>
            <div className='bg-primary-50 px-4 py-2.5 font-semibold text-secondary-10'>Revenue</div>
            {plRevenue.map((r, i) => (
              <div key={i} className='flex justify-between px-4 py-2.5 border-t border-grey-10'>
                <span className='text-secondary-10'>{r.label}</span>
                <span className='text-success font-medium'>{r.amount}</span>
              </div>
            ))}
            <div className='bg-primary-50 px-4 py-2.5 font-semibold text-secondary-10 border-t border-grey-10'>Expenses</div>
            {plExpenses.map((r, i) => (
              <div key={i} className='flex justify-between px-4 py-2.5 border-t border-grey-10'>
                <span className='text-secondary-10'>{r.label}</span>
                <span className='text-danger font-medium'>{r.amount}</span>
              </div>
            ))}
            <div className='flex justify-between px-4 py-3 bg-primary-40 text-white font-semibold border-t border-grey-10'>
              <span>Net VAT Payable</span>
              <span>₦2,457,300</span>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-semibold text-secondary-10'>Recent Invoices</h3>
            <button className='text-sm text-primary-30 hover:underline flex items-center gap-1'>View All <Icon icon='ph:arrow-right' /></button>
          </div>

          {!alertDismissed && (
            <div className='bg-primary-50 border border-primary-10 rounded-xl p-3 mb-4'>
              <p className='text-xs text-secondary-10 mb-2'>
                <strong>INV-0563 | Chidi Ekanem</strong> - ₦45,300 detected. Mark as paid?
              </p>
              <div className='flex gap-2'>
                <button onClick={() => setAlertDismissed(true)} className='bg-primary-30 text-white text-xs px-3 py-1.5 rounded-full hover:bg-primary-40 transition-colors'>Confirm</button>
                <button onClick={() => setAlertDismissed(true)} className='border border-grey-10 text-secondary-10 text-xs px-3 py-1.5 rounded-full hover:bg-primary-50 transition-colors'>Dismiss</button>
              </div>
            </div>
          )}

          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-primary-40 text-white text-xs'>
                <th className='text-left px-4 py-2.5 font-medium'>Client</th>
                <th className='text-left px-4 py-2.5 font-medium'>Amount</th>
                <th className='text-left px-4 py-2.5 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv, i) => (
                <tr key={i} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                  <td className='px-4 py-2.5 text-secondary-10'>{inv.client}</td>
                  <td className='px-4 py-2.5 text-success font-medium'>{inv.amount}</td>
                  <td className='px-4 py-2.5'>
                    <span className='text-xs bg-success text-white px-2.5 py-1 rounded-full font-medium'>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
        <div className='flex items-center justify-between mb-5'>
          <h3 className='text-base font-semibold text-secondary-10'>Revenue vs Expenses</h3>
          <div className='relative'>
            <select className='border border-grey-10 rounded-lg px-3 py-1.5 text-sm text-secondary-10 outline-none appearance-none pr-7'>
              <option>2026</option><option>2025</option>
            </select>
            <Icon icon='ph:caret-down' className='absolute right-2 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-sm' />
          </div>
        </div>
        <ResponsiveContainer width='100%' height={280}>
          <BarChart data={chartData} barGap={4} barCategoryGap='35%'>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e5e5e5' />
            <XAxis dataKey='month' axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#989797' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#989797' }} tickFormatter={(v) => `₦${v}k`} />
            <Tooltip formatter={(v) => [`₦${v}k`]} />
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

function InvoicesTab() {
  const [alertState, setAlertState] = useState<'pending' | 'confirmed' | null>('pending');
  const [activeTab, setActiveTab] = useState('All (45)');
  const [search, setSearch] = useState('');

  return (
    <div className='space-y-4'>
      {alertState === 'pending' && (
        <div className='bg-primary-50 border border-primary-10 rounded-xl p-4 flex items-center justify-between'>
          <p className='text-sm text-secondary-10'>
            Payment detected matching <strong className='text-primary-30'>INV-0039 · Eximps &amp; Cloves for ₦580,000</strong>. Mark as paid?
          </p>
          <div className='flex gap-2 shrink-0'>
            <button onClick={() => setAlertState('confirmed')} className='bg-primary-30 text-white text-sm px-4 py-2 rounded-full hover:bg-primary-40 transition-colors'>Confirm</button>
            <button onClick={() => setAlertState(null)} className='border border-grey-10 text-secondary-10 text-sm px-4 py-2 rounded-full hover:bg-primary-50 transition-colors'>Dismiss</button>
          </div>
        </div>
      )}

      {alertState === 'confirmed' && (
        <div className='border border-success rounded-xl p-5 flex flex-col items-center gap-2'>
          <div className='w-9 h-9 rounded-full bg-success flex items-center justify-center'>
            <Icon icon='ph:check-bold' className='text-white text-base' />
          </div>
          <p className='text-sm font-semibold text-success'>INV-0039 · Eximps &amp; Cloves for ₦580,000 Confirmed</p>
          <button onClick={() => setAlertState(null)} className='bg-primary-30 text-white text-sm px-5 py-2 rounded-full hover:bg-primary-40 transition-colors mt-1'>Dismiss</button>
        </div>
      )}

      <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
          <h2 className='text-base font-semibold text-secondary-10'>Invoices</h2>
          <div className='flex gap-2'>
            <button className='flex items-center gap-1.5 bg-primary-30 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-primary-40 transition-colors'>
              New Invoice <Icon icon='ph:file-plus' />
            </button>
            <button className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
              Export <Icon icon='ph:download-simple' />
            </button>
          </div>
        </div>

        <div className='flex gap-2 px-6 py-3 border-b border-grey-10/60'>
          {invoiceTabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${activeTab === t ? 'bg-primary-30 text-white font-medium' : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'}`}
            >
              {t}
            </button>
          ))}
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

        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-primary-40 text-white text-xs'>
              <th className='text-left px-5 py-3 font-medium'>Invoice</th>
              <th className='text-left px-4 py-3 font-medium'><span className='flex items-center gap-1.5'><Icon icon='ph:calendar-check' />Issued</span></th>
              <th className='text-left px-4 py-3 font-medium'><span className='flex items-center gap-1.5'><Icon icon='ph:calendar-x' />Due</span></th>
              <th className='text-left px-4 py-3 font-medium'><span className='flex items-center gap-1.5'><Icon icon='ph:user' />Client</span></th>
              <th className='text-left px-4 py-3 font-medium'><span className='flex items-center gap-1.5'><Icon icon='ph:currency-circle-dollar' />Amount</span></th>
              <th className='text-left px-4 py-3 font-medium'>Status</th>
              <th className='text-left px-4 py-3 font-medium'>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.filter((inv) => !search || inv.client.toLowerCase().includes(search.toLowerCase())).map((inv, i) => (
              <tr key={i} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                <td className='px-5 py-3.5 text-secondary-10 font-medium'>{inv.id}</td>
                <td className='px-4 py-3.5 text-secondary-30'>{inv.issued}</td>
                <td className='px-4 py-3.5 text-secondary-30'>{inv.due}</td>
                <td className='px-4 py-3.5 text-secondary-10'>{inv.client}</td>
                <td className='px-4 py-3.5 text-secondary-10 font-semibold'>{inv.amount}</td>
                <td className='px-4 py-3.5'>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${inv.statusCls}`}>{inv.status}</span>
                </td>
                <td className='px-4 py-3.5'>
                  <button className='flex items-center gap-1 text-primary-30 text-sm font-medium hover:underline'>
                    <Icon icon='ph:eye-circle' /> View
                  </button>
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
              <select defaultValue='5' className='border border-grey-10 rounded-lg px-2 py-1 text-xs text-secondary-10 outline-none appearance-none pr-5'>
                <option>5</option><option>10</option><option>20</option>
              </select>
              <Icon icon='ph:caret-down' className='absolute right-1 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-xs' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

function ExpensesTab() {
  const [activeTab, setActiveTab] = useState('All (45)');

  return (
    <div className='grid grid-cols-[1fr_360px] gap-5 items-start'>
      <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
          <h2 className='text-base font-semibold text-secondary-10'>Expenses - May 2026</h2>
          <div className='flex gap-2'>
            <button className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
              Filter <Icon icon='ph:sliders-horizontal' />
            </button>
            <button className='flex items-center gap-1.5 bg-primary-30 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-primary-40 transition-colors'>
              <Icon icon='ph:scan' /> Scan Receipt
            </button>
          </div>
        </div>

        <div className='flex gap-2 px-6 py-3 border-b border-grey-10/60'>
          {expenseTabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${activeTab === t ? 'bg-primary-30 text-white font-medium' : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className='divide-y divide-grey-10/60'>
          {expenses.map((exp, i) => (
            <div key={i} className='flex items-center gap-4 px-6 py-4 hover:bg-primary-50/30 transition-colors'>
              <div className='w-10 h-10 rounded-xl border border-grey-10 flex items-center justify-center shrink-0'>
                <Icon icon={exp.icon} className='text-xl text-secondary-10' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-medium text-secondary-10'>{exp.label}</p>
                <p className='text-xs text-secondary-30 mt-0.5'>{exp.meta}</p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-semibold text-danger'>{exp.amount}</p>
                <p className='text-xs text-primary-30 mt-0.5'>{exp.vat}</p>
              </div>
            </div>
          ))}
        </div>

        <div className='flex justify-between items-center px-6 py-4 bg-primary-40 text-white font-semibold text-sm'>
          <span>Total Input VAT Claimable</span>
          <span>₦17,340</span>
        </div>
      </div>

      {/* Scan Receipt panel */}
      <div className='bg-white rounded-xl border border-grey-10/60 p-6'>
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

function ReportsTab() {
  return (
    <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
      <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
        <h2 className='text-base font-semibold text-secondary-10'>Profit &amp; Loss Snapshot (May)</h2>
        <div className='flex gap-2'>
          <div className='relative'>
            <select className='border border-grey-10 rounded-lg px-3 py-2 text-sm text-secondary-10 outline-none appearance-none pr-8'>
              <option>May 2026</option><option>April 2026</option>
            </select>
            <Icon icon='ph:caret-down' className='absolute right-2 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-sm' />
          </div>
          <button className='flex items-center gap-1.5 border border-grey-10 rounded-lg px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
            Export <Icon icon='ph:download-simple' />
          </button>
        </div>
      </div>

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
        <span>Net Profit - May 2026</span>
        <span>₦2,457,300</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BooksPage() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <div>
          <h1 className='text-2xl font-bold text-secondary-10'>Taaxbro Books</h1>
          <p className='text-sm text-secondary-30 mt-0.5'>Invoices, expenses, receipts and reports</p>
        </div>
      </TopBar>

      <main className='flex-1 p-8 space-y-5 overflow-y-auto'>
        <BooksTabs active={activeTab} onChange={setActiveTab} />
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Invoices' && <InvoicesTab />}
        {activeTab === 'Expenses' && <ExpensesTab />}
        {activeTab === 'Reports' && <ReportsTab />}
      </main>
    </div>
  );
}
