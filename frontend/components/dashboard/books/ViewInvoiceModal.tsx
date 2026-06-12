'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { integrations } from '@/lib/api';

interface ViewInvoiceModalProps {
  invoice: any;
  businessId: string;
  onClose: () => void;
}

function formatNaira(value: number): string {
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function ViewInvoiceModal({ invoice, businessId, onClose }: ViewInvoiceModalProps) {
  const [waSettings, setWaSettings] = useState<any>(null);
  const [waLoading, setWaLoading] = useState(true);
  
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mapped fields supporting both Transaction and Invoice shapes
  const clientName = invoice.client_name ?? invoice.counterparty_name ?? invoice.bank_name ?? 'there';
  const amount = invoice.total_amount ?? invoice.amount ?? 0;
  const dateStr = invoice.created_at ?? invoice.transaction_date ?? new Date().toISOString();
  const displayStatus = invoice.status ?? 'Paid';
  const invoiceNum = invoice.invoice_number ?? `INV-${invoice.id.substring(0, 4).toUpperCase()}`;

  useEffect(() => {
    if (!businessId) return;
    setWaLoading(true);
    integrations.getWhatsAppSettings(businessId)
      .then(setWaSettings)
      .catch((err) => console.error('Failed to load WhatsApp settings:', err))
      .finally(() => setWaLoading(false));

    // Prefill phone and message
    const initialPhone = invoice.client_phone ?? invoice.counterparty_phone ?? '';
    setPhone(initialPhone);
    
    const initialMsg = `Hello ${clientName},\n\n` +
      `Here is invoice ${invoiceNum}.\n` +
      `Amount: ${formatNaira(amount)}\n\n` +
      `Thank you for your business!`;
    setMessage(initialMsg);
  }, [invoice, businessId, clientName, invoiceNum, amount]);

  const handleSend = async () => {
    if (!phone.trim()) {
      setErrorMsg('Please enter a valid WhatsApp phone number.');
      return;
    }
    setSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await integrations.sendInvoiceViaWhatsApp(businessId, invoice.id, {
        client_phone: phone.trim(),
        message: message.trim()
      });
      setSuccessMsg('Invoice sent successfully via WhatsApp!');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to send invoice. Please verify the WhatsApp configuration in Settings.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-xl relative max-h-[90vh] overflow-y-auto shadow-xl border border-grey-10'>
        <button
          onClick={onClose}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>
 
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-12 h-12 rounded-xl bg-primary-50 text-primary-30 flex items-center justify-center shrink-0'>
            <Icon icon='ph:file-text' className='text-2xl' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-secondary-10'>{invoiceNum}</h2>
            <p className='text-xs text-secondary-30 mt-0.5'>Receipt / Invoice details</p>
          </div>
        </div>

        <div className='border border-grey-10 rounded-xl overflow-hidden mb-6 bg-grey-0/20 text-sm'>
          {[
            { label: 'Client / Counterparty', value: clientName },
            { label: 'Amount', value: formatNaira(amount), valCls: 'font-semibold text-secondary-10' },
            { label: 'Date Issued', value: new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Category', value: invoice.category ?? 'Services' },
            { label: 'Payment Status', value: displayStatus.toUpperCase(), valCls: `${displayStatus.toLowerCase() === 'paid' ? 'text-success' : displayStatus.toLowerCase() === 'unpaid' ? 'text-amber-500' : 'text-danger'} font-medium` }
          ].map((item, idx) => (
            <div
              key={item.label}
              className={`flex justify-between px-4 py-3 ${idx > 0 ? 'border-t border-grey-10' : ''}`}
            >
              <span className='text-secondary-30'>{item.label}</span>
              <span className={item.valCls ?? 'text-secondary-10'}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* WhatsApp Sending Section */}
        <div className='border-t border-grey-10 pt-6 mt-6'>
          <h3 className='text-sm font-semibold text-secondary-10 mb-3 flex items-center gap-1.5'>
            <Icon icon='ph:whatsapp-logo' className='text-success text-lg' />
            Send via WhatsApp
          </h3>

          {waLoading ? (
            <div className='py-4 text-center text-xs text-secondary-30 animate-pulse'>
              Loading WhatsApp Integration status...
            </div>
          ) : !waSettings || !waSettings.enabled ? (
            <div className='p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 mb-4'>
              <p className='font-bold flex items-center gap-1 mb-1'>
                <Icon icon='ph:warning-circle-bold' /> WhatsApp Integration Not Enabled
              </p>
              <p>
                To send invoices directly to clients via WhatsApp, please enable and verify the WhatsApp Bot in your Settings first.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1.5'>
                  Client's WhatsApp Number
                </label>
                <div className='relative'>
                  <input
                    type='tel'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder='e.g. +234 803 123 4567'
                    className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                  />
                </div>
              </div>

              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1.5'>
                  Personalized Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white resize-none'
                />
              </div>

              {errorMsg && (
                <div className='p-3 bg-red-50 border border-red-200 text-xs text-danger rounded-xl flex items-center gap-1.5'>
                  <Icon icon='ph:warning-circle' className='text-base shrink-0' />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className='p-3 bg-green-50 border border-green-200 text-xs text-success rounded-xl flex items-center gap-1.5'>
                  <Icon icon='ph:check-circle' className='text-base shrink-0' />
                  {successMsg}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending}
                className='w-full py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-20/50 shadow-sm'
              >
                {sending ? 'Sending...' : 'Send Invoice PDF'} <Icon icon='ph:paper-plane-tilt-bold' />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
