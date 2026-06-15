'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
import { dashboard, invoices, expenses, ai, type DashboardData, type InvoiceResponse, type ExpenseResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PaymentLinkModal from '@/components/dashboard/pay/PaymentLinkModal';
import ViewInvoiceModal from '@/components/dashboard/books/ViewInvoiceModal';
import CreateInvoiceModal from '@/components/dashboard/books/CreateInvoiceModal';
import EditInvoiceModal from '@/components/dashboard/books/EditInvoiceModal';
import LogPaymentModal from '@/components/dashboard/books/LogPaymentModal';
import ReviewScannedExpenseModal from '@/components/dashboard/books/ReviewScannedExpenseModal';
import CreateExpenseModal from '@/components/dashboard/books/CreateExpenseModal';

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
  onTabChange?: (tab: string) => void;
  customStart?: string;
  setCustomStart?: (v: string) => void;
  customEnd?: string;
  setCustomEnd?: (v: string) => void;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BooksTabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = ['Overview', 'Invoices', 'Expenses', 'Reports'];
  return (
    <div className='flex flex-wrap gap-4 sm:gap-8 border-b border-grey-10'>
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

function OverviewTab({ data, loading, onTabChange }: TabProps) {
  const [alertDismissed, setAlertDismissed] = useState(false);

  const stats = data?.stats;
  const recentTransactions = data?.recent_transactions ?? [];

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleString('en-US', { month: 'long' });

  const totalReceived = recentTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalSent = recentTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netFlow = totalReceived - totalSent;

  const statCards = [
    { 
      label: 'Revenue (Current)', 
      value: formatNaira(totalReceived), 
      footer: { 
        text: stats?.revenue_change_pct != null ? `${Math.abs(stats.revenue_change_pct)}% vs ${prevMonthName}` : `— vs ${prevMonthName}`, 
        icon: stats?.revenue_change_pct != null ? (stats.revenue_change_pct >= 0 ? 'ph:trend-up' : 'ph:trend-down') : undefined, 
        cls: stats?.revenue_change_pct != null ? (stats.revenue_change_pct >= 0 ? 'text-success' : 'text-danger') : 'text-secondary-30' 
      }, 
      border: 'border-success' 
    },
    { 
      label: 'Expenses (Current)', 
      value: formatNaira(totalSent), 
      footer: { 
        text: stats?.expenses_change_pct != null ? `${Math.abs(stats.expenses_change_pct)}% vs ${prevMonthName}` : `— vs ${prevMonthName}`, 
        icon: stats?.expenses_change_pct != null ? (stats.expenses_change_pct >= 0 ? 'ph:trend-up' : 'ph:trend-down') : undefined, 
        cls: stats?.expenses_change_pct != null ? (stats.expenses_change_pct >= 0 ? 'text-danger' : 'text-success') : 'text-secondary-30' 
      }, 
      border: 'border-danger' 
    },
    { 
      label: 'Net Profit', 
      value: formatNaira(netFlow), 
      footer: { text: `Calculated for ${currentMonthName}`, cls: 'text-success' }, 
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

  // Dynamic charts
  const generateChartData = () => {
    if (data?.history && data.history.length > 0) {
      return data.history.map((item) => ({
        month: item.month,
        Revenue: Number((item.revenue / 1000).toFixed(2)),
        Expenses: Number((item.expenses / 1000).toFixed(2)),
      }));
    }
    const list = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(d);
    }
    return list.map((m, index) => {
      const monthLabel = m.toLocaleString('en-US', { month: 'short' });
      if (index === 4) {
        return {
          month: monthLabel,
          Revenue: Number((totalReceived / 1000).toFixed(2)),
          Expenses: Number((totalSent / 1000).toFixed(2))
        };
      }
      if (index === 3) {
        return {
          month: monthLabel,
          Revenue: Number(((stats?.revenue_prev_month ?? 0) / 1000).toFixed(2)),
          Expenses: Number(((stats?.expenses_prev_month ?? 0) / 1000).toFixed(2))
        };
      }
      return {
        month: monthLabel,
        Revenue: 0,
        Expenses: 0
      };
    });
  };

  const chartData = generateChartData();
  const creditTransactions = recentTransactions.filter((tx) => tx.type === 'credit');

  return (
    <div className='space-y-5'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <h2 className='text-xl font-semibold text-secondary-10'>Books Summary</h2>
      </div>

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
                {c.footer.icon
                  ? <p className={`text-xs flex items-center gap-1 ${c.footer.cls}`}><Icon icon={c.footer.icon} />{c.footer.text}</p>
                  : <p className={`text-xs ${c.footer.cls}`}>{c.footer.text}</p>}
              </div>
            ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5'>
        {/* P&L Snapshot */}
        <div className='bg-white rounded-xl border border-grey-10/60 p-6 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-semibold text-secondary-10'>P&amp;L Snapshot</h3>
            <button
              onClick={() => onTabChange?.('Reports')}
              className='text-sm text-primary-30 hover:underline flex items-center gap-1'
            >
              Full Report <Icon icon='ph:arrow-right' />
            </button>
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
            <button
              onClick={() => onTabChange?.('Invoices')}
              className='text-sm text-primary-30 hover:underline flex items-center gap-1'
            >
              View All <Icon icon='ph:arrow-right' />
            </button>
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
            <div className='overflow-x-auto w-full'>
              <table className='w-full text-sm min-w-[400px]'>
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
            </div>
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

interface InvoicesTabProps {
  invoicesList: InvoiceResponse[];
  loading: boolean;
  onNewInvoice: () => void;
  onViewInvoice: (invoice: any) => void;
  onLogPayment: (invoice: any) => void;
}

function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-success text-white';
    case 'partial':
      return 'bg-amber-500 text-white';
    case 'overdue':
      return 'bg-danger text-white';
    case 'sent':
      return 'bg-blue-500 text-white';
    case 'draft':
      return 'bg-grey-30 text-secondary-10';
    default:
      return 'bg-grey-10 text-secondary-10';
  }
}

function InvoicesTab({ invoicesList, loading, onNewInvoice, onViewInvoice, onLogPayment }: InvoicesTabProps) {
  const [search, setSearch] = useState('');

  const filteredInvoices = invoicesList.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (inv.client_name?.toLowerCase().includes(q) ?? false) ||
      (inv.invoice_number?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleExport = () => {
    const headers = ['Invoice ID', 'Issued Date', 'Client', 'Amount', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      new Date(inv.created_at).toLocaleDateString('en-GB'),
      inv.client_name,
      inv.total_amount.toString(),
      inv.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='space-y-4'>
      <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden shadow-sm'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
          <h2 className='text-base font-semibold text-secondary-10'>Invoices</h2>
          <div className='flex gap-2'>
            <button
              onClick={onNewInvoice}
              className='flex items-center gap-1.5 bg-primary-30 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-primary-40 transition-colors shadow-sm'
            >
              New Invoice <Icon icon='ph:file-plus' />
            </button>
            <button
              onClick={handleExport}
              className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'
            >
              Export <Icon icon='ph:download-simple' />
            </button>
          </div>
        </div>

        <div className='px-6 py-3 border-b border-grey-10/60'>
          <div className='relative'>
            <Icon icon='ph:magnifying-glass' className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-30' />
            <input
              type='text' placeholder='Search by Client Name or Invoice #' value={search} onChange={(e) => setSearch(e.target.value)}
              className='w-full border border-grey-10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40 bg-white'
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
          <div className='overflow-x-auto w-full'>
            <table className='w-full text-sm min-w-[650px]'>
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
                {filteredInvoices.map((inv) => {
                  const { date: d } = formatDate(inv.created_at);
                  return (
                    <tr key={inv.id} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                      <td className='px-5 py-3.5 text-secondary-10 font-medium'>{inv.invoice_number}</td>
                      <td className='px-4 py-3.5 text-secondary-30'>{d}</td>
                      <td className='px-4 py-3.5 text-secondary-10'>{inv.client_name}</td>
                      <td className='px-4 py-3.5 text-secondary-10 font-semibold'>{formatNaira(inv.total_amount)}</td>
                      <td className='px-4 py-3.5'>
                        <span className={`text-xs text-white px-2.5 py-1 rounded-full font-medium capitalize ${getStatusClass(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className='px-4 py-3.5'>
                        <div className='flex items-center gap-3.5'>
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className='flex items-center gap-1 text-primary-30 text-sm font-medium hover:underline'
                          >
                            <Icon icon='ph:eye-circle' /> View
                          </button>
                          {inv.status.toLowerCase() !== 'paid' && (
                            <button
                              onClick={() => onLogPayment(inv)}
                              className='flex items-center gap-1 text-success text-sm font-medium hover:underline'
                            >
                              <Icon icon='ph:wallet' /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

interface ExpensesTabProps {
  expensesList: ExpenseResponse[];
  loading: boolean;
  businessId: string;
  onRefresh: () => void;
  onNewExpense: () => void;
}

function ExpensesTab({ expensesList, loading, businessId, onRefresh, onNewExpense }: ExpensesTabProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const scanPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredExpenses = expensesList.filter(exp => {
    if (selectedCategory === 'all') return true;
    return exp.category?.toLowerCase() === selectedCategory;
  });

  const categoryIcons: Record<string, string> = {
    utility: 'ph:lightning',
    software: 'ph:robot',
    office: 'ph:storefront',
    travel: 'ph:airplane',
    rent: 'ph:house-line',
    fuel: 'ph:gas-pump',
    legal: 'ph:scales',
    accounting: 'ph:calculator',
    groceries: 'ph:shopping-cart',
    equipment: 'ph:wrench',
  };

  const handleScanReceiptClick = () => {
    scanPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [scannedOcrData, setScannedOcrData] = useState<any | null>(null);

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await expenses.scanOCR(file, businessId);
      setScannedOcrData(res);
    } catch (err: any) {
      console.error(err);
      setScanResult(`Error processing receipt: ${err?.message || 'Unknown error'}`);
    } finally {
      setScanning(false);
    }
  };

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start'>
      <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden shadow-sm'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
          <h2 className='text-base font-semibold text-secondary-10'>Expenses</h2>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 border rounded-full px-4 py-2 text-sm transition-colors ${showFilters ? 'bg-primary-30 border-primary-30 text-white' : 'border-grey-10 text-secondary-10 hover:bg-primary-50'}`}
            >
              Filter <Icon icon='ph:sliders-horizontal' />
            </button>
            <button
              onClick={onNewExpense}
              className='flex items-center gap-1.5 bg-primary-30 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-primary-40 transition-colors shadow-sm'
            >
              Add Expense <Icon icon='ph:plus' />
            </button>
            <button
              onClick={handleScanReceiptClick}
              className='flex items-center gap-1.5 bg-primary-30 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-primary-40 transition-colors shadow-sm'
            >
              <Icon icon='ph:scan' /> Scan Receipt
            </button>
          </div>
        </div>

        {showFilters && (
          <div className='px-6 py-3 border-b border-grey-10/60 flex flex-wrap gap-2 animate-fade-in'>
            {['all', 'utility', 'software', 'office', 'travel', 'rent', 'fuel', 'legal', 'accounting', 'groceries', 'equipment'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full capitalize border transition-colors ${selectedCategory === cat ? 'bg-primary-40 border-primary-40 text-white' : 'border-grey-10 text-secondary-20 hover:bg-primary-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className='p-6 space-y-3 animate-pulse'>
            {[0, 1, 2].map((i) => <div key={i} className='h-12 bg-grey-10 rounded' />)}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className='text-center py-12 text-sm text-secondary-30'>No recorded expenses found</div>
        ) : (
          <div className='divide-y divide-grey-10/60'>
            {filteredExpenses.map((exp) => {
              const { date: d } = formatDate(exp.expense_date);
              const cat = exp.category?.toLowerCase() || 'office';
              const icon = categoryIcons[cat] ?? 'ph:shopping-bag';

              return (
                <div key={exp.id} className='flex items-start gap-4 px-6 py-4 hover:bg-primary-50/30 transition-colors'>
                  <div className='w-10 h-10 rounded-xl border border-grey-10 flex items-center justify-center shrink-0 mt-0.5'>
                    <Icon icon={icon} className='text-xl text-secondary-10' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='text-sm font-medium text-secondary-10 truncate'>{exp.vendor_name || 'Unknown Vendor'}</p>
                      
                      {exp.source === 'whatsapp' ? (
                        <span className='text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 border border-green-200/50'>
                          <Icon icon='ph:whatsapp-logo-fill' className='text-xs' /> WhatsApp
                        </span>
                      ) : (
                        <span className='text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 border border-blue-200/50'>
                          <Icon icon='ph:laptop' className='text-xs' /> Web
                        </span>
                      )}

                      {exp.wht_applicable && exp.wht_amount > 0 && (
                        <span className='text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold border border-purple-200/50'>
                          WHT withheld: {formatNaira(exp.wht_amount)}
                        </span>
                      )}
                    </div>

                    <p className='text-xs text-secondary-30 mt-0.5'>{d} | {exp.category || 'Uncategorized'}</p>
                    
                    {exp.description && (
                      <p className='text-xs text-secondary-20 mt-1 italic leading-relaxed'>"{exp.description}"</p>
                    )}

                    {exp.receipt_url && (
                      <a
                        href={exp.receipt_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 text-xs text-primary-30 hover:underline mt-2 font-medium bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-20/40 hover:bg-primary-50/80 transition-colors'
                      >
                        <Icon icon='ph:image' className='text-sm' /> View Scanned Receipt
                      </a>
                    )}
                  </div>
                  <div className='text-right shrink-0'>
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
              filteredExpenses.reduce((sum, exp) => sum + Number(exp.vat_amount ?? 0), 0)
            )}
          </span>
        </div>
      </div>

      {/* Scan Receipt panel */}
      <div ref={scanPanelRef} className='bg-white rounded-xl border border-grey-10/60 p-6 shadow-sm scroll-mt-6'>
        <h3 className='text-base font-semibold text-secondary-10 text-center mb-6'>Scan Receipt</h3>
        <p className='text-sm text-secondary-30 text-center mb-4'>Drop document here</p>
        
        <div
          onClick={handleContainerClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer ${
            isDragActive ? 'border-primary-30 bg-primary-50/20' : 'border-grey-10 hover:border-primary-20 bg-grey-0/10'
          }`}
        >
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            accept='image/*,application/pdf'
            className='hidden'
          />
          {scanning ? (
            <>
              <Icon icon='ph:circle-notch-bold' className='text-3xl text-primary-30 animate-spin' />
              <p className='text-sm text-secondary-20 text-center font-medium animate-pulse'>Uploading &amp; scanning...</p>
            </>
          ) : (
            <>
              <Icon icon='ph:upload-simple' className='text-3xl text-secondary-30' />
              <p className='text-sm text-secondary-30 text-center'>Drop a file or click to upload</p>
              <p className='text-xs text-secondary-40'>(PNG, PDF, JPEG. Max 5mb)</p>
            </>
          )}
        </div>

        {scanResult && (
          <div className='mt-4 p-3.5 bg-green-50 border border-green-200 text-xs text-success rounded-xl flex gap-2 animate-fade-in'>
            <Icon icon='ph:check-circle-fill' className='text-base shrink-0 mt-0.5 text-green-600' />
            <p className='leading-relaxed'>{scanResult}</p>
          </div>
        )}
      </div>

      {scannedOcrData && (
        <ReviewScannedExpenseModal
          ocrData={scannedOcrData}
          businessId={businessId}
          onClose={() => setScannedOcrData(null)}
          onSuccess={() => {
            setScannedOcrData(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

interface ReportsTabProps extends TabProps {
  expensesList: ExpenseResponse[];
  expensesLoading: boolean;
}

function ReportsTab({ data, loading, expensesList, expensesLoading }: ReportsTabProps) {
  const stats = data?.stats;

  // Calculate totalReceived from date-filtered transactions for accuracy across all periods
  const creditTransactions = (data?.recent_transactions ?? []).filter((tx) => tx.type === 'credit');
  const totalReceived = creditTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalSent = expensesList.reduce((sum, exp) => sum + Number(exp.amount ?? 0), 0);
  const totalVAT = expensesList.reduce((sum, exp) => sum + Number(exp.vat_amount ?? 0), 0);
  const netFlow = totalReceived - totalSent;

  const isLoadingReports = loading || expensesLoading;

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
        { label: 'Input VAT Claimable', amount: formatNaira(totalVAT), positive: true },
      ], 
      total: { label: 'Gross Profit', amount: formatNaira(netFlow), positive: netFlow >= 0 } 
    },
  ];

  const handleExportReport = () => {
    const rows = [
      ['Section', 'Category', 'Amount'],
      ['Revenue', 'Operating Revenue', totalReceived.toString()],
      ['Revenue', 'Total Revenue', totalReceived.toString()],
      ['Expenses', 'Operating Expenses', `-${totalSent}`],
      ['Expenses', 'Input VAT Claimable', totalVAT.toString()],
      ['Expenses', 'Gross Profit', netFlow.toString()],
      ['Summary', 'Net Profit', netFlow.toString()],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `profit_loss_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden shadow-sm'>
      <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
        <h2 className='text-base font-semibold text-secondary-10'>Profit &amp; Loss Snapshot</h2>
        <div className='flex gap-2'>
          <button
            onClick={handleExportReport}
            className='flex items-center gap-1.5 border border-grey-10 rounded-lg px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'
          >
            Export <Icon icon='ph:download-simple' />
          </button>
        </div>
      </div>

      {isLoadingReports ? (
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
                  <span className={r.positive ? 'text-success font-medium' : 'text-danger font-medium'}>
                    {r.amount}
                  </span>
                </div>
              ))}
              <div className='flex justify-between px-6 py-4 border-t border-grey-10 text-sm font-bold text-secondary-10'>
                <span>{section.total.label}</span>
                <span className={section.total.positive ? 'text-success' : 'text-danger'}>{section.total.amount}</span>
              </div>
            </div>
          ))}

          {expensesList.length > 0 && (
            <div>
              <div className='bg-secondary-10/5 px-6 py-3 text-sm font-semibold text-secondary-10 border-t border-grey-10'>Expense Breakdown ({expensesList.length} items)</div>
              {Array.from(new Set(expensesList.map(e => e.category || 'Uncategorized'))).slice(0, 6).map(cat => {
                const catTotal = expensesList.filter(e => (e.category || 'Uncategorized') === cat).reduce((s, e) => s + Number(e.amount || 0), 0);
                return (
                  <div key={cat} className='flex justify-between px-6 py-2.5 border-t border-grey-10/40 text-sm'>
                    <span className='text-secondary-30 capitalize'>{cat}</span>
                    <span className='text-danger font-medium'>-{formatNaira(catTotal)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className='flex justify-between px-6 py-4 bg-primary-40 text-white font-semibold text-sm'>
            <span>Net Profit</span>
            <span>{formatNaira(netFlow)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function getDateRange(selectedMonth: string, customStart: string, customEnd: string) {
  const now = new Date();
  if (selectedMonth === 'current') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];
    return { start, end };
  } else if (selectedMonth === 'custom') {
    return { start: customStart, end: customEnd };
  } else {
    const d = new Date(Date.parse(selectedMonth + " 1"));
    if (isNaN(d.getTime())) {
      return { start: '', end: '' };
    }
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start, end };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BooksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invoicesList, setInvoicesList] = useState<InvoiceResponse[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);

  const [expensesList, setExpensesList] = useState<ExpenseResponse[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesLoaded, setExpensesLoaded] = useState(false);

  const [showPaymentLink, setShowPaymentLink] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const dropdownOptions = useMemo(() => {
    const now = new Date();
    const options = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      options.push(label);
    }
    return options;
  }, []);

  const dateRange = useMemo(() => {
    return getDateRange(selectedMonth, customStart, customEnd);
  }, [selectedMonth, customStart, customEnd]);

  const filteredTransactions = useMemo(() => {
    const start = dateRange.start;
    const end = dateRange.end;
    if (!data?.recent_transactions) return [];
    if (!start || !end) return data.recent_transactions;
    return data.recent_transactions.filter((tx) => {
      const txDate = tx.transaction_date.split('T')[0];
      return txDate >= start && txDate <= end;
    });
  }, [data?.recent_transactions, dateRange]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      recent_transactions: filteredTransactions,
    };
  }, [data, filteredTransactions]);

  const filteredInvoices = useMemo(() => {
    const start = dateRange.start;
    const end = dateRange.end;
    if (!start || !end) return invoicesList;
    return invoicesList.filter((inv) => {
      const invDate = inv.created_at.split('T')[0];
      return invDate >= start && invDate <= end;
    });
  }, [invoicesList, dateRange]);

  const filteredExpenses = useMemo(() => {
    const start = dateRange.start;
    const end = dateRange.end;
    if (!start || !end) return expensesList;
    return expensesList.filter((exp) => {
      const expDate = exp.expense_date;
      return expDate >= start && expDate <= end;
    });
  }, [expensesList, dateRange]);

  const loadInvoices = (force = false) => {
    if (user?.business_id && (!invoicesLoaded || force)) {
      setInvoicesLoading(true);
      invoices
        .list(user.business_id)
        .then((list) => { setInvoicesList(list); setInvoicesLoaded(true); })
        .catch((e) => console.error('Failed to load invoices:', e))
        .finally(() => setInvoicesLoading(false));
    }
  };

  const loadExpenses = (force = false) => {
    if (user?.business_id && (!expensesLoaded || force)) {
      setExpensesLoading(true);
      expenses
        .list(user.business_id)
        .then((list) => { setExpensesList(list); setExpensesLoaded(true); })
        .catch((e) => console.error('Failed to load expenses:', e))
        .finally(() => setExpensesLoading(false));
    }
  };

  useEffect(() => {
    dashboard
      .get()
      .then(setData)
      .catch((e) => setError(e.message ?? 'Failed to load books data'))
      .finally(() => setLoading(false));
  }, []);

  // Load invoices and expenses eagerly once business_id is available,
  // so they're ready when the user switches tabs.
  useEffect(() => {
    if (user?.business_id) {
      loadInvoices();
      loadExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.business_id]);

  // Also reload when navigating to specific tabs (force-refresh for latest data)
  useEffect(() => {
    if (activeTab === 'Invoices') {
      loadInvoices(true);
    } else if (activeTab === 'Expenses' || activeTab === 'Reports') {
      loadExpenses(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <div>
          <h1 className='text-2xl font-bold text-secondary-10'>
            Taaxbro Books
          </h1>
          <p className='text-sm text-secondary-30 mt-0.5'>Invoices, expenses, receipts and reports</p>
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

        <BooksTabs active={activeTab} onChange={setActiveTab} />

        {/* Global Period Filter Bar */}
        <div className='bg-white rounded-xl border border-grey-10/60 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-primary-30/10 text-primary-30 flex items-center justify-center shrink-0 border border-primary-30/20'>
              <Icon icon='ph:calendar-blank' className='text-lg' />
            </div>
            <div>
              <p className='text-xs font-semibold text-secondary-20'>Accounting Period</p>
              <p className='text-[10px] text-secondary-30 mt-0.5 font-medium'>
                {dateRange.start && dateRange.end 
                  ? `${new Date(dateRange.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to ${new Date(dateRange.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'All time'}
              </p>
            </div>
          </div>
          
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs font-semibold text-secondary-30'>Period</label>
              <div className='relative'>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className='border border-grey-10 rounded-lg px-3 py-1.5 text-xs text-secondary-10 outline-none appearance-none pr-7 bg-white font-medium cursor-pointer hover:border-primary-30 transition-colors'
                >
                  {dropdownOptions.map((opt, idx) => (
                    <option key={opt} value={idx === 0 ? 'current' : opt}>
                      {idx === 0 ? `Current Month (${opt})` : opt}
                    </option>
                  ))}
                  <option value='custom'>Custom Range</option>
                </select>
                <Icon icon='ph:caret-down' className='absolute right-2 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-xs' />
              </div>
            </div>

            {selectedMonth === 'custom' && (
              <div className='flex items-center gap-2 animate-fade-in'>
                <input
                  type='date'
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className='border border-grey-10 rounded-lg px-3 py-1.5 text-xs text-secondary-10 outline-none focus:border-primary-30 transition-colors bg-white font-medium'
                />
                <span className='text-xs text-secondary-30'>to</span>
                <input
                  type='date'
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className='border border-grey-10 rounded-lg px-3 py-1.5 text-xs text-secondary-10 outline-none focus:border-primary-30 transition-colors bg-white font-medium'
                />
              </div>
            )}
          </div>
        </div>

        {activeTab === 'Overview' && (
          <OverviewTab
            data={filteredData}
            loading={loading}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'Invoices' && (
          <InvoicesTab
            invoicesList={filteredInvoices}
            loading={invoicesLoading}
            onNewInvoice={() => setShowCreateInvoice(true)}
            onViewInvoice={setSelectedInvoice}
            onLogPayment={setPaymentInvoice}
          />
        )}
        {activeTab === 'Expenses' && user?.business_id && (
          <ExpensesTab
            expensesList={filteredExpenses}
            loading={expensesLoading}
            businessId={user.business_id}
            onNewExpense={() => setShowCreateExpense(true)}
            onRefresh={() => {
              loadExpenses(true);
              dashboard
                .get()
                .then(setData)
                .catch((e) => setError(e.message ?? 'Failed to load books data'));
            }}
          />
        )}
        {activeTab === 'Reports' && (
          <ReportsTab
            data={filteredData}
            loading={loading}
            expensesList={filteredExpenses}
            expensesLoading={expensesLoading}
          />
        )}
      </main>

      {showPaymentLink && (
        <PaymentLinkModal onClose={() => setShowPaymentLink(false)} />
      )}

      {showCreateInvoice && (
        <CreateInvoiceModal
          onClose={() => setShowCreateInvoice(false)}
          onSuccess={() => {
            setShowCreateInvoice(false);
            loadInvoices(true);
          }}
        />
      )}

      {selectedInvoice && user?.business_id && (
        <ViewInvoiceModal
          invoice={selectedInvoice}
          businessId={user.business_id}
          onClose={() => setSelectedInvoice(null)}
          onEdit={(inv) => {
            setSelectedInvoice(null);
            setEditingInvoice(inv);
          }}
          onLogPayment={(inv) => {
            setSelectedInvoice(null);
            setPaymentInvoice(inv);
          }}
        />
      )}

      {editingInvoice && user?.business_id && (
        <EditInvoiceModal
          invoiceId={editingInvoice.id}
          businessId={user.business_id}
          onClose={() => setEditingInvoice(null)}
          onSuccess={() => {
            setEditingInvoice(null);
            loadInvoices(true);
            // Also refresh dashboard stats
            dashboard
              .get()
              .then(setData)
              .catch((e) => setError(e.message ?? 'Failed to load books data'));
          }}
        />
      )}

      {paymentInvoice && user?.business_id && (
        <LogPaymentModal
          invoice={paymentInvoice}
          businessId={user.business_id}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => {
            setPaymentInvoice(null);
            loadInvoices(true);
            // Also refresh dashboard stats
            dashboard
              .get()
              .then(setData)
              .catch((e) => setError(e.message ?? 'Failed to load books data'));
          }}
        />
      )}

      {showCreateExpense && user?.business_id && (
        <CreateExpenseModal
          businessId={user.business_id}
          onClose={() => setShowCreateExpense(false)}
          onSuccess={() => {
            setShowCreateExpense(false);
            loadExpenses(true);
            // Refresh stats
            dashboard
              .get()
              .then(setData)
              .catch((e) => setError(e.message ?? 'Failed to load books data'));
          }}
        />
      )}
    </div>
  );
}