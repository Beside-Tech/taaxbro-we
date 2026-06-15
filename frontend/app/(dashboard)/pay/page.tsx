'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import AddAccountModal from '@/components/dashboard/pay/AddAccountModal';
import PaymentLinkModal from '@/components/dashboard/pay/PaymentLinkModal';
import TransferModal from '@/components/dashboard/pay/TransferModal';
import ViewTransactionModal from '@/components/dashboard/pay/ViewTransactionModal';

import { dashboard, integrations, type DashboardData } from '@/lib/api';

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

export default function PayPage() {
  const { user } = useAuth();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showPaymentLink, setShowPaymentLink] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);


  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [prevMonthName, setPrevMonthName] = useState('last month');

  useEffect(() => {
    dashboard
      .get()
      .then(setData)
      .catch((e) => setError(e.message ?? 'Failed to load dashboard data'))
      .finally(() => setLoading(false));

    if (user?.business_id) {
      setAccountsLoading(true);
      integrations
        .getBankAccounts(user.business_id)
        .then(setAccounts)
        .catch((e) => console.error('Failed to load accounts:', e))
        .finally(() => setAccountsLoading(false));
    }

    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setPrevMonthName(d.toLocaleString('en-US', { month: 'long' }));
  }, [user]);

  const handleDisconnect = async (accountId: string) => {
    if (!user?.business_id) return;
    if (!confirm('Are you sure you want to disconnect this bank account? All associated transactions will be unlinked.')) return;
    
    try {
      await integrations.disconnectBankAccount(user.business_id, accountId);
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      window.location.reload();
    } catch (err: any) {
      alert(err.message ?? 'Failed to disconnect account');
    }
  };

  const stats = data?.stats;
  const recentTransactions = data?.recent_transactions ?? [];

  // Calculate sent/received from stats or recent txs
  const totalReceived = stats?.revenue_current_month ?? 0;
  const totalSent = recentTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netFlow = totalReceived - totalSent;

  const statCards = [
    {
      label: 'Total Received',
      value: formatNaira(totalReceived),
      footer: {
        text: stats?.revenue_change_pct != null 
          ? `${Math.abs(stats.revenue_change_pct)}% vs ${prevMonthName}`
          : `—% vs ${prevMonthName}`,
        icon: stats?.revenue_change_pct != null 
          ? (stats.revenue_change_pct >= 0 ? 'ph:trend-up' : 'ph:trend-down') 
          : 'ph:minus',
        className: stats?.revenue_change_pct != null 
          ? (stats.revenue_change_pct >= 0 ? 'text-success' : 'text-danger') 
          : 'text-secondary-30',
      },
      border: 'border-success',
      value_color: 'text-success',
    },
    {
      label: 'Total Sent',
      value: formatNaira(totalSent),
      footer: {
        text: stats?.expenses_change_pct != null 
          ? `${Math.abs(stats.expenses_change_pct)}% vs ${prevMonthName}`
          : `—% vs ${prevMonthName}`,
        icon: stats?.expenses_change_pct != null 
          ? (stats.expenses_change_pct >= 0 ? 'ph:trend-up' : 'ph:trend-down') 
          : 'ph:minus',
        className: stats?.expenses_change_pct != null 
          ? (stats.expenses_change_pct >= 0 ? 'text-danger' : 'text-success') 
          : 'text-secondary-30',
      },
      border: 'border-danger',
      value_color: 'text-danger',
    },
    {
      label: 'Net Flow',
      value: formatNaira(netFlow),
      footer: {
        text: 'No Unmatched Transactions',
        icon: 'ph:check-circle',
        className: 'text-success',
      },
      border: 'border-primary-30',
      value_color: 'text-primary-30',
    },
  ];


  const tabs = [
    { id: 'all', label: `All (${recentTransactions.length})` },
    { id: 'inbound', label: `Inbound (${recentTransactions.filter(t => t.type === 'credit').length})` },
    { id: 'outbound', label: `Outbound (${recentTransactions.filter(t => t.type === 'debit').length})` },
    { id: 'unmatched', label: 'Unmatched (0)' },
    { id: 'tax', label: 'Tax Payment (0)' },
  ];

  const filteredTransactions = recentTransactions.filter((tx) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchesSource = tx.bank_name?.toLowerCase().includes(q) ?? false;
      const matchesRecipient = tx.counterparty_name?.toLowerCase().includes(q) ?? false;
      if (!matchesSource && !matchesRecipient) return false;
    }

    // Tab filter
    if (activeTab === 'inbound') {
      if (tx.type !== 'credit') return false;
    } else if (activeTab === 'outbound') {
      if (tx.type !== 'debit') return false;
    } else if (activeTab === 'unmatched' || activeTab === 'tax') {
      return false; // Placeholders
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (tx.category?.toLowerCase() !== selectedCategory) return false;
    }

    return true;
  });

  const handleExport = () => {
    const headers = ['Date', 'Type', 'Source', 'Sender/Recipient', 'Amount', 'Category'];
    const rows = filteredTransactions.map(tx => {
      const { date: d, time: t } = formatDate(tx.transaction_date);
      const isCredit = tx.type === 'credit';
      return [
        `${d} ${t}`,
        tx.type === 'credit' ? 'Credit' : 'Debit',
        tx.bank_name ?? '—',
        tx.counterparty_name ?? '—',
        `${isCredit ? '+' : '-'}${tx.amount}`,
        tx.category ?? 'Uncategorized'
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <div>
          <h1 className='text-2xl font-medium text-secondary-10'>
            Taaxbro Pay
          </h1>
          <p className='text-sm text-secondary-10 mt-0.5'>
            All money movements - Inbound, outbound and payment links
          </p>
        </div>
      </TopBar>

      <main className='flex-1 p-4 sm:p-8 space-y-5 overflow-y-auto'>
        {/* Error alert */}
        {error && (
          <div className='px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} className='bg-white rounded-xl border border-t-4 border-grey-10 p-5 animate-pulse'>
                  <div className='h-3 bg-grey-10 rounded w-24 mb-3' />
                  <div className='h-7 bg-grey-10 rounded w-32 mb-4' />
                  <div className='h-3 bg-grey-10 rounded w-20' />
                </div>
              ))
            : statCards.map((card) => (
                <div
                  key={card.label}
                  className={`bg-white rounded-xl border border-t-4  ${card.border} p-5`}>
                  <p className=' text-secondary-20 font-light mb-2'>{card.label}</p>
                  <p className={`text-2xl font-medium ${card.value_color} mb-3`}>
                    {card.value}
                  </p>
                  <p
                    className={`text-sm font-medium flex items-center gap-1 ${card.footer.className}`}>
                    <Icon icon={card.footer.icon} />
                    {card.footer.text}
                  </p>
                </div>
              ))}
        </div>

        {/* Connected Accounts */}
        <div className='bg-white rounded-xl border border-secondary-40 px-6 py-4 mt-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl text-secondary-10'>Connected Accounts</h2>
            <button
              onClick={() => setShowAddAccount(true)}
              className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 hover:border-primary-20 transition-colors'>
              Add Account <Icon icon='ph:plus' />
            </button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {accountsLoading ? (
              [0, 1].map((i) => (
                <div key={i} className='border border-grey-10 rounded-xl p-4 animate-pulse'>
                  <div className='h-4 bg-grey-10 rounded w-24 mb-3' />
                  <div className='h-3 bg-grey-10 rounded w-32' />
                </div>
              ))
            ) : accounts.length === 0 ? (
              <div className='col-span-3 text-center py-6 border border-dashed border-grey-10 rounded-xl bg-grey-10/10'>
                <p className='text-sm text-secondary-30'>No connected bank accounts found.</p>
                <button 
                  onClick={() => setShowAddAccount(true)}
                  className='text-sm text-primary-30 hover:underline mt-1 font-medium'
                >
                  Link your first account now
                </button>
              </div>
            ) : (
              accounts.map((acc) => (
                <div key={acc.id} className='border border-grey-10 rounded-xl p-4 relative group hover:border-primary-20 transition-colors shadow-sm'>
                  <button 
                    onClick={() => handleDisconnect(acc.id)}
                    className='absolute top-3 right-3 text-secondary-30 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50'
                    title="Disconnect Account"
                  >
                    <Icon icon="ph:trash" className="text-base" />
                  </button>
                  <p className='text-sm font-semibold text-secondary-10 mb-1'>
                    {acc.bank_name}
                  </p>
                  <p className='text-xs text-secondary-30 mb-3'>
                    {acc.account_type || 'Savings'} ****{(acc.account_number ?? '').slice(-4)}
                  </p>
                  <p className='text-xs flex items-center gap-1.5 text-success font-medium'>
                    <Icon icon='ph:circle-fill' className='text-[8px]' />
                    Connected via {acc.provider || 'Mono'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className='flex flex-wrap gap-3 mt-6'>
          <button
            onClick={() => setShowPaymentLink(true)}
            className='flex items-center gap-2 bg-primary-40 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary-30 transition-colors shadow-sm'>
            New Payment Link{' '}
            <Icon className='text-2xl' icon='material-symbols:link-rounded' />
          </button>
          <button
            onClick={() => setShowTransfer(true)}
            className='flex items-center gap-2 bg-primary-40 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary-30 transition-colors shadow-sm'
          >
            Make a Transfer{' '}
            <Icon className='text-2xl' icon='hugeicons:money-send-01' />
          </button>

        </div>

        {/* Transactions */}
        <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
            <h2 className='text-base font-semibold text-secondary-10'>
              Transactions
            </h2>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setShowCategoryFilters(v => !v)}
                className={`flex items-center gap-1.5 border rounded-full px-4 py-2 text-sm transition-colors ${showCategoryFilters ? 'bg-primary-30 border-primary-30 text-white' : 'border-grey-10 text-secondary-10 hover:bg-primary-50'}`}
              >
                Filter <Icon icon='ph:sliders-horizontal' />
              </button>
              <button
                onClick={handleExport}
                className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'
              >
                Export <Icon icon='ph:download-simple' />
              </button>
            </div>
          </div>

          {showCategoryFilters && (
            <div className='px-6 py-3 border-b border-grey-10/60 flex flex-wrap gap-2 animate-fade-in'>
              {['all', 'utility', 'software', 'office', 'travel', 'tax_payment'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full capitalize border transition-colors ${selectedCategory === cat ? 'bg-primary-40 border-primary-40 text-white' : 'border-grey-10 text-secondary-20 hover:bg-primary-50'}`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className='flex flex-wrap items-center gap-2 px-6 py-3 border-b border-grey-10/60'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-30 text-white font-medium'
                    : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className='px-6 py-3 border-b border-grey-10/60'>
            <div className='relative'>
              <Icon
                icon='ph:magnifying-glass'
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-30'
              />
              <input
                type='text'
                placeholder='Search by name, source, recipient'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full border border-grey-10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className='p-6 space-y-3 animate-pulse'>
              {[0, 1, 2].map((i) => (
                <div key={i} className='flex gap-4'>
                  <div className='h-4 bg-grey-10 rounded w-24' />
                  <div className='h-4 bg-grey-10 rounded w-16' />
                  <div className='h-4 bg-grey-10 rounded w-32' />
                  <div className='h-4 bg-grey-10 rounded w-20' />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16 text-secondary-30'>
              <Icon icon='ph:receipt' className='text-4xl mb-3' />
              <p className='text-sm'>No transactions found</p>
            </div>
          ) : (
            <div className='overflow-x-auto w-full'>
              <table className='w-full text-sm min-w-[750px]'>
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
                        <Icon icon='ph:git-branch' />
                        Source
                      </span>
                    </th>
                    <th className='text-left px-4 py-3 font-medium'>
                      <span className='flex items-center gap-1.5'>
                        <Icon icon='ph:user' />
                        Sender/Recipient
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
                        Category
                      </span>
                    </th>
                    <th className='text-left px-4 py-3 font-medium'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const { date: d, time: t } = formatDate(tx.transaction_date);
                    const isCredit = tx.type === 'credit';
                    return (
                      <tr
                        key={tx.id}
                        className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                        <td className='px-6 py-3.5 text-secondary-20'>
                          <div className='text-sm'>{d}</div>
                          <div className='text-xs text-secondary-30'>{t}</div>
                        </td>
                        <td className='px-4 py-3.5 text-sm text-secondary-20'>
                          {tx.bank_name ?? '—'}
                        </td>
                        <td className='px-4 py-3.5 text-sm text-secondary-20'>
                          {tx.counterparty_name ?? '—'}
                        </td>
                        <td
                          className={`px-4 py-3.5 text-sm font-medium ${isCredit ? 'text-success' : 'text-danger'}`}>
                          {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
                        </td>
                        <td className='px-4 py-3.5'>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${isCredit ? 'bg-success text-white' : 'bg-danger/10 text-danger'}`}>
                            {tx.category ?? 'Uncategorized'}
                          </span>
                        </td>
                         <td className='px-4 py-3.5'>
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className='text-primary-30 text-sm font-medium hover:underline'
                          >
                            View
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className='flex items-center justify-between px-6 py-4 border-t border-grey-10/60'>
            <p className='text-xs text-secondary-30'>
              Showing {filteredTransactions.length} of {filteredTransactions.length}
            </p>
            <div className='flex items-center gap-1'>
              <button className='w-8 h-8 rounded-full bg-primary-30 text-white text-sm flex items-center justify-center transition-colors'>
                1
              </button>
            </div>
            <div className='flex items-center gap-2 text-xs text-secondary-30'>
              Rows:
              <div className='relative'>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className='border border-grey-10 rounded-lg px-2 py-1 text-xs text-secondary-10 outline-none appearance-none pr-5'>
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <Icon
                  icon='ph:caret-down'
                  className='absolute right-1 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-xs'
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAddAccount && (
        <AddAccountModal onClose={() => setShowAddAccount(false)} />
      )}
      {showPaymentLink && (
        <PaymentLinkModal onClose={() => setShowPaymentLink(false)} />
      )}
      {showTransfer && (
        <TransferModal onClose={() => setShowTransfer(false)} />
      )}
      {selectedTx && (
        <ViewTransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      )}


    </div>
  );
}
