'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import AddAccountModal from '@/components/dashboard/pay/AddAccountModal';
import PaymentLinkModal from '@/components/dashboard/pay/PaymentLinkModal';

const statCards = [
  {
    label: 'Total Received',
    value: '₦4.82M',
    footer: {
      text: '18% vs April',
      icon: 'ph:trend-up',
      className: 'text-success',
    },
    border: 'border-success',
    value_color: 'text-success',
  },
  {
    label: 'Total Sent',
    value: '₦4.00M',
    footer: {
      text: '18% vs April',
      icon: 'ph:trend-down',
      className: 'text-danger',
    },
    border: 'border-danger',
    value_color: 'text-danger',
  },
  {
    label: 'Net Flow',
    value: '₦820K',
    footer: {
      text: '2 Unmatched Transactions',
      icon: 'ph:warning',
      className: 'text-orange-500',
    },
    border: 'border-primary-30',
    value_color: 'text-primary-30',
  },
];

const connectedAccounts = [
  {
    bank: 'GT Bank',
    type: 'Current',
    last4: '4523',
    status: 'synced',
    statusText: 'Synced 4 mins ago',
  },
  {
    bank: 'Moniepoint MFB',
    type: 'Current',
    last4: '1564',
    status: 'syncing',
    statusText: 'Syncing',
  },
  {
    bank: 'Zenith Bank',
    type: 'Current',
    last4: '1032',
    status: 'error',
    statusText: 'Error Syncing - Reconnect',
  },
];

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'inbound', label: 'Inbound (45)' },
  { id: 'outbound', label: 'Outbound' },
  { id: 'unmatched', label: 'Unmatched (2)' },
  { id: 'tax', label: 'Tax Payment (16)' },
];

const transactions = [
  {
    date: '26-07-2026',
    time: '9:14am',
    source: 'GT Bank',
    recipient: 'Eximps & Cloves',
    amount: '+₦276,214',
    invoice: 'INV-0041',
    invoiceClass: 'bg-success text-white',
    action: 'View',
  },
  {
    date: '26-07-2026',
    time: '9:14am',
    source: 'Moniepoint',
    recipient: 'Anthropic',
    amount: '-₦30,214.44',
    invoice: 'Not Recorded',
    invoiceClass: 'bg-danger text-white',
    action: 'Record',
  },
  {
    date: '26-07-2026',
    time: '9:14am',
    source: 'GT Bank',
    recipient: 'Amazon AWS',
    amount: '-₦27,114.09',
    invoice: 'VAT Filing - April',
    invoiceClass: 'bg-orange-400 text-white',
    action: 'View',
  },
  {
    date: '26-07-2026',
    time: '9:14am',
    source: 'GT Bank',
    recipient: 'Abuja Electric Disco',
    amount: '-₦9,500.20',
    invoice: 'Tax remittance',
    invoiceClass: 'bg-orange-400 text-white',
    action: 'View',
  },
  {
    date: '26-07-2026',
    time: '9:14am',
    source: 'Amazon AWS',
    recipient: 'Amazon AWS',
    amount: '+₦276,214',
    invoice: 'Tax remittance',
    invoiceClass: 'bg-orange-400 text-white',
    action: 'View',
  },
  {
    date: '26-07-2026',
    time: '9:14am',
    source: 'Amazon AWS',
    recipient: 'Amazon AWS',
    amount: '+₦276,214',
    invoice: 'Tax remittance',
    invoiceClass: 'bg-orange-400 text-white',
    action: 'View',
  },
  {
    date: '26-07-2026',
    time: '9:14am',
    source: 'Amazon AWS',
    recipient: 'Amazon AWS',
    amount: '+₦276,214',
    invoice: 'Tax remittance',
    invoiceClass: 'bg-orange-400 text-white',
    action: 'View',
  },
];

const statusConfig = {
  synced: { icon: 'ph:circle-fill', color: 'text-success', label: 'Synced' },
  syncing: {
    icon: 'ph:arrows-clockwise',
    color: 'text-primary-30',
    label: 'Syncing',
  },
  error: { icon: 'ph:warning', color: 'text-orange-500', label: 'Error' },
};

export default function PayPage() {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showPaymentLink, setShowPaymentLink] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

      <main className='flex-1 p-8 space-y-5 overflow-y-auto'>
        {/* Stat cards */}
        <div className='grid grid-cols-3 gap-4'>
          {statCards.map((card) => (
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
          <div className='grid grid-cols-3 gap-4'>
            {connectedAccounts.map((acc) => {
              const sc = statusConfig[acc.status as keyof typeof statusConfig];
              return (
                <div
                  key={acc.last4}
                  className='border border-grey-10 rounded-xl p-4'>
                  <p className='text-sm font-semibold text-secondary-10 mb-1'>
                    {acc.bank}
                  </p>
                  <p className='text-xs text-secondary-30 mb-3'>
                    {acc.type} ****{acc.last4}
                  </p>
                  <p
                    className={`text-xs flex items-center gap-1.5 ${sc.color}`}>
                    <Icon
                      icon={sc.icon}
                      className={`text-sm ${acc.status === 'syncing' ? 'animate-spin' : ''}`}
                    />
                    {acc.statusText}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className='flex gap-3 mt-6'>
          <button
            onClick={() => setShowPaymentLink(true)}
            className='flex items-center gap-2 bg-primary-40 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary-40 transition-colors'>
            New Payment Link{' '}
            <Icon className='text-2xl' icon='material-symbols:link-rounded' />
          </button>
          <button className='flex items-center gap-2 bg-primary-40 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary-30 transition-colors'>
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
              <button className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
                Filter <Icon icon='ph:sliders-horizontal' />
              </button>
              <button className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
                Export <Icon icon='ph:download-simple' />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className='flex items-center gap-2 px-6 py-3 border-b border-grey-10/60'>
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
                    Invoice
                  </span>
                </th>
                <th className='text-left px-4 py-3 font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions
                .filter(
                  (tx) =>
                    !search ||
                    tx.source.toLowerCase().includes(search.toLowerCase()) ||
                    tx.recipient.toLowerCase().includes(search.toLowerCase()),
                )
                .map((tx, i) => (
                  <tr
                    key={i}
                    className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                    <td className='px-6 py-3.5 text-secondary-20'>
                      <div className='text-sm'>{tx.date}</div>
                      <div className='text-xs text-secondary-30'>{tx.time}</div>
                    </td>
                    <td className='px-4 py-3.5 text-sm text-secondary-20'>
                      {tx.source}
                    </td>
                    <td className='px-4 py-3.5 text-sm text-secondary-20'>
                      {tx.recipient}
                    </td>
                    <td
                      className={`px-4 py-3.5 text-sm font-medium ${tx.amount.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                      {tx.amount}
                    </td>
                    <td className='px-4 py-3.5'>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${tx.invoiceClass}`}>
                        {tx.invoice}
                      </span>
                    </td>
                    <td className='px-4 py-3.5'>
                      <button className='text-primary-30 text-sm font-medium hover:underline'>
                        {tx.action}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className='flex items-center justify-between px-6 py-4 border-t border-grey-10/60'>
            <p className='text-xs text-secondary-30'>Showing 7 out of 268</p>
            <div className='flex items-center gap-1'>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors ${
                    n === 1
                      ? 'bg-primary-30 text-white'
                      : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'
                  }`}>
                  {n}
                </button>
              ))}
              <span className='w-8 h-8 flex items-center justify-center text-secondary-30 text-sm'>
                ...
              </span>
              <button className='w-8 h-8 rounded-full border border-grey-10 text-sm text-secondary-10 flex items-center justify-center hover:bg-primary-50 transition-colors'>
                12
              </button>
              <button className='w-8 h-8 rounded-full border border-grey-10 text-secondary-10 flex items-center justify-center hover:bg-primary-50 transition-colors'>
                <Icon icon='ph:arrow-right' className='text-sm' />
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
    </div>
  );
}
