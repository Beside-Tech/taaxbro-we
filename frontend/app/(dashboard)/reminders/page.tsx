'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import { useAuth } from '@/context/AuthContext';
import {
  reminders,
  invoices,
  integrations,
  type ReminderResponse,
  type ClientResponse,
  type InvoiceResponse,
  type ReminderCreatePayload,
  type WhatsAppSettings,
} from '@/lib/api';

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function formatDate(iso: string): { date: string; time: string; full: string } {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return {
    date: dateStr,
    time: timeStr,
    full: `${dateStr} at ${timeStr}`,
  };
}

function getRelativeTime(iso: string): string {
  const future = new Date(iso);
  const now = new Date();
  const diffMs = future.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMins) < 1) {
    return 'just now';
  }

  if (diffMs > 0) {
    // Future
    if (diffMins < 60) return `in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `in ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'tomorrow';
    return `in ${diffDays} days`;
  } else {
    // Past
    const absMins = Math.abs(diffMins);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);

    if (absMins < 60) return `${absMins} min${absMins > 1 ? 's' : ''} ago`;
    if (absHours < 24) return `${absHours} hr${absHours > 1 ? 's' : ''} ago`;
    if (absDays === 1) return 'yesterday';
    return `${absDays} days ago`;
  }
}

export default function RemindersPage() {
  const { user } = useAuth();
  const [remindersList, setRemindersList] = useState<ReminderResponse[]>([]);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'active' | 'delivered' | 'cancelled'>('active');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [reminderType, setReminderType] = useState<'self' | 'client'>('self');
  const [reminderText, setReminderText] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [deliveryChannel, setDeliveryChannel] = useState<'whatsapp' | 'email' | 'both'>('whatsapp');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  // Actions Loading State
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Fetch Reminders & Select Helpers
  const fetchData = async () => {
    try {
      setError(null);
      const res = await reminders.list();
      setRemindersList(res);
      
      if (user?.business_id) {
        const [clientsRes, invoicesRes] = await Promise.all([
          invoices.listClients(user.business_id),
          invoices.list(user.business_id),
        ]);
        setClients(clientsRes);
        setAllInvoices(invoicesRes);
      }
    } catch (err: any) {
      console.error('Failed to load reminders data:', err);
      setError(err.message ?? 'Failed to load reminders dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Pre-fill fields when selecting type or client
  useEffect(() => {
    if (reminderType === 'self') {
      setRecipientEmail(user?.email ?? '');
      setSelectedClientId('');
      setSelectedInvoiceId('');
    } else {
      setRecipientEmail('');
    }
  }, [reminderType, user]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedInvoiceId('');
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient && selectedClient.email) {
      setRecipientEmail(selectedClient.email);
    } else {
      setRecipientEmail('');
    }
  };

  // Filter invoices by client name
  const getFilteredInvoices = () => {
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) return [];
    return allInvoices.filter(
      (inv) => inv.client_name === selectedClient.name && inv.status !== 'paid'
    );
  };

  const filteredInvoices = getFilteredInvoices();

  // Handle reminder creation
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderText.trim()) {
      setModalError('Please enter a reminder description.');
      return;
    }
    if (!dateStr || !timeStr) {
      setModalError('Please select both date and time.');
      return;
    }
    if (reminderType === 'client' && !selectedClientId) {
      setModalError('Please select a client.');
      return;
    }
    if ((deliveryChannel === 'email' || deliveryChannel === 'both') && !recipientEmail.trim()) {
      setModalError('Email address is required for email delivery.');
      return;
    }

    try {
      setModalError(null);
      setModalLoading(true);

      // Parse date and time in Africa/Lagos (UTC+1) timezone
      const formattedDtStr = `${dateStr}T${timeStr}:00+01:00`;
      const remindAtIso = new Date(formattedDtStr).toISOString();

      // Validate future datetime
      if (new Date(remindAtIso).getTime() <= Date.now()) {
        setModalError('Scheduled time must be in the future.');
        setModalLoading(false);
        return;
      }

      const payload: ReminderCreatePayload = {
        reminder_text: reminderText.trim(),
        remind_at: remindAtIso,
        delivery_channel: deliveryChannel,
        reminder_type: reminderType,
        recipient_email: recipientEmail.trim() || null,
        client_id: selectedClientId || null,
        invoice_id: selectedInvoiceId || null,
      };

      await reminders.create(payload);

      // Reset Form
      setReminderText('');
      setSelectedClientId('');
      setSelectedInvoiceId('');
      setDeliveryChannel('whatsapp');
      setRecipientEmail('');
      setDateStr('');
      setTimeStr('');
      setIsModalOpen(false);

      // Refresh list
      fetchData();
    } catch (err: any) {
      setModalError(err.message ?? 'Failed to create reminder.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Cancellation
  const handleCancelReminder = async (id: string) => {
    try {
      setActioningId(id);
      await reminders.cancel(id);
      fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Failed to cancel reminder.');
    } finally {
      setActioningId(null);
    }
  };

  // Handle Deletion
  const handleDeleteReminder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder permanently?')) return;
    try {
      setActioningId(id);
      await reminders.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete reminder.');
    } finally {
      setActioningId(null);
    }
  };

  // Metrics calculation
  const totalActive = remindersList.filter(r => !r.sent_at && !r.cancelled).length;
  const totalDelivered = remindersList.filter(r => r.sent_at !== null).length;
  const totalCancelled = remindersList.filter(r => r.cancelled).length;
  const totalClientNudges = remindersList.filter(r => r.reminder_type === 'client').length;

  // Tabs Filtering
  const getFilteredReminders = () => {
    switch (activeTab) {
      case 'delivered':
        return remindersList.filter(r => r.sent_at !== null);
      case 'cancelled':
        return remindersList.filter(r => r.cancelled);
      case 'active':
      default:
        return remindersList.filter(r => !r.sent_at && !r.cancelled);
    }
  };

  const displayedReminders = getFilteredReminders();

  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full'>
          <div>
            <h1 className='text-2xl font-bold text-secondary-10'>Reminders & Nudges</h1>
            <p className='text-sm text-secondary-30 mt-1'>
              Schedule personal tasks or configure client payment alerts via WhatsApp and Email.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className='bg-primary-40 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary-30 hover:scale-[1.02] active:scale-[0.98] transition shadow-md flex items-center gap-2 self-start sm:self-auto shrink-0'
          >
            <Icon icon='ph:plus-bold' className='text-base' />
            Set a Reminder
          </button>
        </div>
      </TopBar>

      <main className='flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto'>
        {/* Error Notification banner */}
        {error && (
          <div className='px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2 animate-fade-in'>
            <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
            {error}
          </div>
        )}

        {/* Metrics Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className='bg-white rounded-2xl border border-grey-10 p-5 animate-pulse h-28' />
            ))
          ) : (
            <>
              {/* Active */}
              <div className='bg-gradient-to-br from-indigo-50/60 to-blue-50/60 border border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-300'>
                <div className='flex justify-between items-start'>
                  <p className='text-xs font-semibold text-indigo-700/80 uppercase tracking-wider'>Active Alerts</p>
                  <div className='w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center'>
                    <Icon icon='solar:bell-bing-bold-duotone' className='text-xl' />
                  </div>
                </div>
                <p className='text-3xl font-extrabold text-indigo-900 mt-2'>{totalActive}</p>
                <p className='text-[10px] text-indigo-700/60 mt-1'>Scheduled for dispatch</p>
              </div>

              {/* Delivered */}
              <div className='bg-gradient-to-br from-emerald-50/60 to-green-50/60 border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-300'>
                <div className='flex justify-between items-start'>
                  <p className='text-xs font-semibold text-emerald-700/80 uppercase tracking-wider'>Delivered</p>
                  <div className='w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center'>
                    <Icon icon='ph:check-circle-bold' className='text-xl' />
                  </div>
                </div>
                <p className='text-3xl font-extrabold text-emerald-900 mt-2'>{totalDelivered}</p>
                <p className='text-[10px] text-emerald-700/60 mt-1'>Sent to recipients</p>
              </div>

              {/* Client Nudges */}
              <div className='bg-gradient-to-br from-purple-50/60 to-fuchsia-50/60 border border-purple-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-300'>
                <div className='flex justify-between items-start'>
                  <p className='text-xs font-semibold text-purple-700/80 uppercase tracking-wider'>Client Nudges</p>
                  <div className='w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center'>
                    <Icon icon='ph:users-three-bold' className='text-xl' />
                  </div>
                </div>
                <p className='text-3xl font-extrabold text-purple-900 mt-2'>{totalClientNudges}</p>
                <p className='text-[10px] text-purple-700/60 mt-1'>Payment follow-ups</p>
              </div>

              {/* Cancelled */}
              <div className='bg-gradient-to-br from-slate-50/60 to-grey-0/60 border border-grey-10 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-300'>
                <div className='flex justify-between items-start'>
                  <p className='text-xs font-semibold text-secondary-30 uppercase tracking-wider'>Cancelled</p>
                  <div className='w-8 h-8 rounded-xl bg-secondary-40/10 text-secondary-20 flex items-center justify-center'>
                    <Icon icon='ph:x-circle-bold' className='text-xl' />
                  </div>
                </div>
                <p className='text-3xl font-extrabold text-secondary-10 mt-2'>{totalCancelled}</p>
                <p className='text-[10px] text-secondary-30 mt-1'>Deactivated alerts</p>
              </div>
            </>
          )}
        </div>

        {/* Reminders List Section */}
        <div className='bg-white rounded-2xl border border-grey-10/80 overflow-hidden shadow-sm'>
          {/* Tabs header */}
          <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
            <div className='flex gap-2 p-1 bg-grey-0 rounded-xl border border-grey-10/40'>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'active'
                    ? 'bg-white text-secondary-10 shadow-sm'
                    : 'text-secondary-30 hover:text-secondary-10'
                }`}
              >
                Active ({totalActive})
              </button>
              <button
                onClick={() => setActiveTab('delivered')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'delivered'
                    ? 'bg-white text-secondary-10 shadow-sm'
                    : 'text-secondary-30 hover:text-secondary-10'
                }`}
              >
                Delivered ({totalDelivered})
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'cancelled'
                    ? 'bg-white text-secondary-10 shadow-sm'
                    : 'text-secondary-30 hover:text-secondary-10'
                }`}
              >
                Cancelled ({totalCancelled})
              </button>
            </div>
          </div>

          {/* List Content */}
          {loading ? (
            <div className='p-6 space-y-4 animate-pulse'>
              {[0, 1, 2].map((i) => (
                <div key={i} className='flex flex-col gap-2 border-b border-grey-10 pb-4'>
                  <div className='h-4 bg-grey-10 rounded w-24' />
                  <div className='h-6 bg-grey-10 rounded w-3/4' />
                  <div className='h-4 bg-grey-10 rounded w-1/3' />
                </div>
              ))}
            </div>
          ) : displayedReminders.length === 0 ? (
            /* Empty State */
            <div className='flex flex-col items-center justify-center py-20 text-secondary-30 gap-3'>
              <div className='w-16 h-16 rounded-full bg-grey-0 border border-grey-10 flex items-center justify-center text-secondary-20'>
                <Icon icon='solar:bell-bing-broken' className='text-3xl' />
              </div>
              <p className='text-sm font-bold text-secondary-10'>No reminders found</p>
              <p className='text-xs text-secondary-30 max-w-sm text-center'>
                {activeTab === 'active'
                  ? 'You don\'t have any active reminders. Create one to get started!'
                  : activeTab === 'delivered'
                  ? 'Reminders that have successfully delivered will appear here.'
                  : 'Cancelled reminders are kept here for your record.'}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className='mt-2 px-5 py-2 rounded-full bg-primary-30 text-white text-xs font-semibold hover:bg-primary-40 transition-all shadow-sm'
                >
                  Create a Reminder
                </button>
              )}
            </div>
          ) : (
            /* Cards Grid */
            <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
              {displayedReminders.map((rem) => {
                const formatted = formatDate(rem.remind_at);
                const relTime = getRelativeTime(rem.remind_at);
                const isPersonal = rem.reminder_type === 'self';

                return (
                  <div
                    key={rem.id}
                    className='relative bg-white border border-grey-10 hover:border-primary-40/30 rounded-2xl p-5 transition duration-300 shadow-sm flex flex-col justify-between group overflow-hidden'
                  >
                    {/* Top line badges */}
                    <div className='flex items-center justify-between mb-3.5'>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isPersonal
                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                            : 'bg-purple-50 text-purple-600 border-purple-200'
                        }`}
                      >
                        {isPersonal ? 'For Myself' : 'Client Nudge'}
                      </span>

                      {/* Delivery channels */}
                      <div className='flex gap-1.5'>
                        {(rem.delivery_channel === 'whatsapp' || rem.delivery_channel === 'both') && (
                          <span className='bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold'>
                            <Icon icon='ph:whatsapp-logo' className='text-xs' />
                            WhatsApp
                          </span>
                        )}
                        {(rem.delivery_channel === 'email' || rem.delivery_channel === 'both') && (
                          <span className='bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold'>
                            <Icon icon='ph:envelope-simple' className='text-xs' />
                            Email
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className='space-y-2 mb-4'>
                      <p className='text-sm font-semibold text-secondary-10 leading-snug break-words'>
                        {rem.reminder_text}
                      </p>
                      
                      {/* Client Nudge Context */}
                      {!isPersonal && (
                        <div className='bg-grey-0 rounded-xl p-2.5 border border-grey-10/50 flex flex-col gap-1 text-[11px] text-secondary-20'>
                          <span className='flex items-center gap-1.5'>
                            <Icon icon='ph:user-bold' className='text-secondary-30' />
                            <strong className='text-secondary-10'>Client:</strong> {rem.client_name ?? 'Unknown'}
                          </span>
                          {rem.invoice_number && (
                            <span className='flex items-center gap-1.5'>
                              <Icon icon='ph:file-text-bold' className='text-secondary-30' />
                              <strong className='text-secondary-10'>Invoice:</strong> #{rem.invoice_number}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Recipient email info */}
                      {rem.recipient_email && (deliveryChannel === 'email' || rem.delivery_channel === 'both') && (
                        <p className='text-[11px] text-secondary-30 flex items-center gap-1'>
                          <Icon icon='ph:paper-plane' className='text-xs' />
                          Recipient: {rem.recipient_email}
                        </p>
                      )}
                    </div>

                    {/* Bottom Status / Actions */}
                    <div className='flex items-center justify-between border-t border-grey-10/40 pt-3 mt-auto'>
                      {/* Scheduled Time info */}
                      <div className='flex flex-col'>
                        <span className='text-[10px] font-bold text-secondary-30 uppercase tracking-wider'>
                          {rem.sent_at ? 'Sent at' : 'Scheduled for'}
                        </span>
                        <span className='text-xs text-secondary-10 font-semibold mt-0.5'>
                          {rem.sent_at ? formatDate(rem.sent_at).full : formatted.full}
                        </span>
                        {!rem.sent_at && !rem.cancelled && (
                          <span className='text-[10px] text-primary-30 font-medium mt-0.5 flex items-center gap-1'>
                            <Icon icon='ph:clock-bold' className='text-xs' />
                            {relTime}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className='flex items-center gap-2'>
                        {/* Cancel button for active alerts */}
                        {!rem.sent_at && !rem.cancelled && (
                          <button
                            disabled={actioningId === rem.id}
                            onClick={() => handleCancelReminder(rem.id)}
                            className='text-xs text-secondary-20 hover:text-danger hover:bg-red-50 border border-grey-10 hover:border-red-200 font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 disabled:opacity-40'
                          >
                            {actioningId === rem.id ? (
                              <Icon icon='ph:circle-notch' className='animate-spin' />
                            ) : (
                              <Icon icon='ph:x-bold' />
                            )}
                            Cancel
                          </button>
                        )}

                        {/* Delete button */}
                        {(rem.sent_at || rem.cancelled) && (
                          <button
                            disabled={actioningId === rem.id}
                            onClick={() => handleDeleteReminder(rem.id)}
                            className='text-xs text-secondary-30 hover:text-danger hover:bg-red-50 font-semibold p-2 rounded-full transition-colors disabled:opacity-40'
                            title='Delete reminder permanently'
                          >
                            {actioningId === rem.id ? (
                              <Icon icon='ph:circle-notch' className='animate-spin text-base' />
                            ) : (
                              <Icon icon='ph:trash-bold' className='text-base' />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* CREATE REMINDER MODAL */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-10/40 backdrop-blur-sm animate-fade-in'>
          <div className='bg-white rounded-3xl border border-grey-10 shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 md:p-8 animate-scale-up overflow-hidden'>
            {/* Modal Header */}
            <div className='flex items-center justify-between pb-4 border-b border-grey-10/60 shrink-0'>
              <div className='flex items-center gap-2.5'>
                <div className='w-9 h-9 rounded-lg bg-primary-50 text-primary-30 flex items-center justify-center'>
                  <Icon icon='solar:bell-bing-bold-duotone' className='text-xl' />
                </div>
                <h2 className='text-xl font-bold text-secondary-10'>Set a Reminder</h2>
              </div>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-secondary-30 hover:text-secondary-10 transition p-1.5 hover:bg-grey-10/50 rounded-full'
              >
                <Icon icon='ph:x-bold' className='text-lg' />
              </button>
            </div>

            {/* Modal Error */}
            {modalError && (
              <div className='mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 shrink-0'>
                <Icon icon='ph:warning-circle' className='text-base shrink-0' />
                {modalError}
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateReminder} className='flex-1 overflow-y-auto py-5 pr-1 space-y-5'>
              {/* Category Segmented control */}
              <div className='flex flex-col gap-2'>
                <label className='text-xs font-bold text-secondary-30 uppercase tracking-wider'>Reminder Category</label>
                <div className='grid grid-cols-2 gap-2 bg-grey-0 border border-grey-10/85 p-1 rounded-2xl'>
                  <button
                    type='button'
                    onClick={() => setReminderType('self')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${
                      reminderType === 'self'
                        ? 'bg-white text-primary-40 shadow-sm border border-grey-10/20'
                        : 'text-secondary-30 hover:text-secondary-10'
                    }`}
                  >
                    <Icon icon='ph:user-bold' className='text-base' />
                    For Myself
                  </button>
                  <button
                    type='button'
                    onClick={() => setReminderType('client')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${
                      reminderType === 'client'
                        ? 'bg-white text-primary-40 shadow-sm border border-grey-10/20'
                        : 'text-secondary-30 hover:text-secondary-10'
                    }`}
                  >
                    <Icon icon='ph:users-three-bold' className='text-base' />
                    Client Nudge
                  </button>
                </div>
              </div>

              {/* Client Selection (Client Nudge only) */}
              {reminderType === 'client' && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-xs font-bold text-secondary-30 uppercase tracking-wider'>Select Client</label>
                    <select
                      required
                      value={selectedClientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className='w-full border border-grey-10 rounded-xl px-4 py-3 text-xs text-secondary-10 bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30 transition'
                    >
                      <option value=''>Choose client...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <label className='text-xs font-bold text-secondary-30 uppercase tracking-wider'>
                      Associate Invoice (Optional)
                    </label>
                    <select
                      value={selectedInvoiceId}
                      onChange={(e) => setSelectedInvoiceId(e.target.value)}
                      disabled={!selectedClientId}
                      className='w-full border border-grey-10 rounded-xl px-4 py-3 text-xs text-secondary-10 bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30 transition disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <option value=''>None</option>
                      {filteredInvoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          #{inv.invoice_number} (₦{inv.total_amount.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Description / Content text */}
              <div className='flex flex-col gap-2'>
                <label className='text-xs font-bold text-secondary-30 uppercase tracking-wider'>Reminder Message</label>
                <div className='relative'>
                  <textarea
                    required
                    maxLength={120}
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    placeholder={
                      reminderType === 'self'
                        ? 'e.g. Call the tax authorities regarding VAT filing'
                        : 'e.g. Friendly reminder: payment for Web Design invoice is outstanding'
                    }
                    className='w-full border border-grey-10 rounded-2xl px-4 py-3 text-xs text-secondary-10 bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30 transition h-20 resize-none pr-12'
                  />
                  <span className='absolute bottom-3 right-3 text-[10px] text-secondary-30 font-medium'>
                    {reminderText.length}/120
                  </span>
                </div>
              </div>

              {/* Delivery Channels selection */}
              <div className='flex flex-col gap-2'>
                <label className='text-xs font-bold text-secondary-30 uppercase tracking-wider'>Delivery Channels</label>
                <div className='grid grid-cols-3 gap-2'>
                  <button
                    type='button'
                    onClick={() => setDeliveryChannel('whatsapp')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition ${
                      deliveryChannel === 'whatsapp'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600 font-bold'
                        : 'border-grey-10 hover:border-primary-20 bg-white text-secondary-20'
                    }`}
                  >
                    <Icon icon='ph:whatsapp-logo' className='text-xl' />
                    <span className='text-[10px]'>WhatsApp Only</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setDeliveryChannel('email')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition ${
                      deliveryChannel === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold'
                        : 'border-grey-10 hover:border-primary-20 bg-white text-secondary-20'
                    }`}
                  >
                    <Icon icon='ph:envelope-simple' className='text-xl' />
                    <span className='text-[10px]'>Email Only</span>
                  </button>
                  <button
                    type='button'
                    onClick={() => setDeliveryChannel('both')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition ${
                      deliveryChannel === 'both'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-bold'
                        : 'border-grey-10 hover:border-primary-20 bg-white text-secondary-20'
                    }`}
                  >
                    <div className='flex gap-1'>
                      <Icon icon='ph:whatsapp-logo' className='text-lg' />
                      <Icon icon='ph:envelope-simple' className='text-lg' />
                    </div>
                    <span className='text-[10px]'>Both Channels</span>
                  </button>
                </div>
              </div>

              {/* Recipient Email (if Email or Both) */}
              {(deliveryChannel === 'email' || deliveryChannel === 'both') && (
                <div className='flex flex-col gap-2 animate-fade-in'>
                  <label className='text-xs font-bold text-secondary-30 uppercase tracking-wider'>Recipient Email</label>
                  <input
                    required
                    type='email'
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder='enter recipient email address'
                    className='w-full border border-grey-10 rounded-xl px-4 py-3 text-xs text-secondary-10 bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30 transition'
                  />
                </div>
              )}

              {/* Schedule Date & Time Pickers */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-2'>
                  <label className='text-xs font-bold text-secondary-30 uppercase tracking-wider'>Date (WAT)</label>
                  <div className='relative'>
                    <input
                      required
                      type='date'
                      value={dateStr}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDateStr(e.target.value)}
                      className='w-full border border-grey-10 rounded-xl px-4 py-3 text-xs text-secondary-10 bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30 transition'
                    />
                  </div>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='text-xs font-bold text-secondary-30 uppercase tracking-wider'>Time (Lagos Time)</label>
                  <div className='relative'>
                    <input
                      required
                      type='time'
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className='w-full border border-grey-10 rounded-xl px-4 py-3 text-xs text-secondary-10 bg-white focus:outline-none focus:ring-2 focus:ring-primary-30/40 focus:border-primary-30 transition'
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Action Buttons Footer */}
            <div className='flex items-center gap-3 pt-4 border-t border-grey-10/60 shrink-0'>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='flex-1 border border-grey-10 text-secondary-10 text-xs font-bold py-3 rounded-full hover:bg-grey-10/40 transition-colors'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleCreateReminder}
                disabled={modalLoading || !reminderText.trim() || !dateStr || !timeStr}
                className='flex-1 flex items-center justify-center gap-2 bg-primary-40 hover:bg-primary-30 text-white text-xs font-bold rounded-full py-3 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md'
              >
                {modalLoading ? (
                  <Icon icon='ph:circle-notch' className='animate-spin text-sm' />
                ) : (
                  'Schedule Reminder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
