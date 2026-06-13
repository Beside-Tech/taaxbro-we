'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { integrations, invoices, business, type BusinessProfile } from '@/lib/api';

interface ViewInvoiceModalProps {
  invoice: any;
  businessId: string;
  onClose: () => void;
  onEdit?: (invoice: any) => void;
}

function formatNaira(value: number): string {
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function ViewInvoiceModal({ invoice, businessId, onClose, onEdit }: ViewInvoiceModalProps) {
  const [waSettings, setWaSettings] = useState<any>(null);
  const [waLoading, setWaLoading] = useState(true);
  
  const [activeSendTab, setActiveSendTab] = useState<'whatsapp' | 'email'>('whatsapp');
  
  // WhatsApp States
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [waSuccessMsg, setWaSuccessMsg] = useState<string | null>(null);
  const [waErrorMsg, setWaErrorMsg] = useState<string | null>(null);

  // Email States
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);

  // Business Profile details for email branding
  const [bizProfile, setBizProfile] = useState<BusinessProfile | null>(null);

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

    // Fetch business profile for default email subject branding
    business.getProfile()
      .then(setBizProfile)
      .catch((err) => console.error('Failed to load business profile:', err));

    // Fetch full details of the invoice if it's a real invoice to get email
    if (invoiceNum.startsWith('INV-')) {
      invoices.get(businessId, invoice.id)
        .then((fullInv) => {
          if (fullInv.client_email) {
            setEmail(fullInv.client_email);
          }
        })
        .catch((err) => console.error('Failed to fetch invoice details:', err));
    }

    // Prefill phone and message
    const initialPhone = invoice.client_phone ?? invoice.counterparty_phone ?? '';
    setPhone(initialPhone);
    
    const initialMsg = `Hello ${clientName},\n\n` +
      `Here is invoice ${invoiceNum}.\n` +
      `Amount: ${formatNaira(amount)}\n\n` +
      `Thank you for your business!`;
    setMessage(initialMsg);
  }, [invoice, businessId, clientName, invoiceNum, amount]);

  // Set default email values once business/client info details load
  useEffect(() => {
    const bizName = bizProfile?.name || 'our business';
    setSubject(`Invoice #${invoiceNum} from ${bizName}`);

    const formattedDate = new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const bodyText = `Dear ${clientName},\n\n` +
      `Please find attached invoice #${invoiceNum} for services rendered.\n\n` +
      `Invoice Summary:\n` +
      `• Invoice Number: #${invoiceNum}\n` +
      `• Amount Due: ${formatNaira(amount)}\n` +
      `• Due Date: ${formattedDate}\n\n` +
      `You can find the detailed PDF invoice attached to this email. Please review the payment instructions in the attachment.\n\n` +
      `Thank you for your business.\n\n` +
      `Best regards,\n` +
      `${bizName}`;
    setEmailBody(bodyText);
  }, [bizProfile, clientName, invoiceNum, amount, dateStr]);

  const handleSendWhatsApp = async () => {
    if (!phone.trim()) {
      setWaErrorMsg('Please enter a valid WhatsApp phone number.');
      return;
    }
    setSendingWa(true);
    setWaErrorMsg(null);
    setWaSuccessMsg(null);

    try {
      await integrations.sendInvoiceViaWhatsApp(businessId, invoice.id, {
        client_phone: phone.trim(),
        message: message.trim()
      });
      setWaSuccessMsg('Invoice sent successfully via WhatsApp!');
    } catch (err: any) {
      setWaErrorMsg(err.message ?? 'Failed to send invoice via WhatsApp.');
    } finally {
      setSendingWa(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailErrorMsg('Please enter a valid client email address.');
      return;
    }
    if (!subject.trim()) {
      setEmailErrorMsg('Please enter an email subject.');
      return;
    }
    if (!emailBody.trim()) {
      setEmailErrorMsg('Please enter the email body.');
      return;
    }

    setSendingEmail(true);
    setEmailErrorMsg(null);
    setEmailSuccessMsg(null);

    try {
      await invoices.sendViaEmail(businessId, invoice.id, {
        client_email: email.trim(),
        subject: subject.trim(),
        body: emailBody
      });
      setEmailSuccessMsg('Invoice email sent successfully with PDF attached!');
    } catch (err: any) {
      setEmailErrorMsg(err.message ?? 'Failed to send invoice via email. Ensure the PDF is generated.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl p-8 w-full max-w-xl relative max-h-[90vh] overflow-y-auto shadow-xl border border-grey-10'>
        
        {/* Top actions */}
        <div className='absolute top-6 right-6 flex items-center gap-2'>
          {invoiceNum.startsWith('INV-') && onEdit && (
            <button
              onClick={() => onEdit(invoice)}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-20 text-primary-30 hover:bg-primary-50 transition-colors text-xs font-semibold'
            >
              <Icon icon='ph:pencil-simple-line' />
              Edit Invoice
            </button>
          )}
          <button
            onClick={onClose}
            className='text-secondary-30 hover:text-secondary-10 transition-colors p-1.5'
          >
            <Icon icon='ph:x' className='text-xl' />
          </button>
        </div>
 
        <div className='flex items-center gap-3 mb-6 pr-28'>
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

        {/* Tabbed Distribution Section */}
        <div className='border-t border-grey-10 pt-6 mt-6'>
          <div className='flex border-b border-grey-10 mb-4'>
            <button
              onClick={() => setActiveSendTab('whatsapp')}
              className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeSendTab === 'whatsapp' ? 'border-success text-success' : 'border-transparent text-secondary-30 hover:text-secondary-10'}`}
            >
              <Icon icon='ph:whatsapp-logo-bold' className='text-lg' />
              Send via WhatsApp
            </button>
            <button
              onClick={() => setActiveSendTab('email')}
              className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeSendTab === 'email' ? 'border-primary-30 text-primary-30' : 'border-transparent text-secondary-30 hover:text-secondary-10'}`}
            >
              <Icon icon='ph:envelope-simple-bold' className='text-lg' />
              Send via Email
            </button>
          </div>

          {activeSendTab === 'whatsapp' ? (
            /* WhatsApp Tab */
            <div>
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
                    <input
                      type='tel'
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder='e.g. +234 803 123 4567'
                      className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                    />
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

                  {waErrorMsg && (
                    <div className='p-3 bg-red-50 border border-red-200 text-xs text-danger rounded-xl flex items-center gap-1.5 animate-fade-in'>
                      <Icon icon='ph:warning-circle' className='text-base shrink-0' />
                      {waErrorMsg}
                    </div>
                  )}

                  {waSuccessMsg && (
                    <div className='p-3 bg-green-50 border border-green-200 text-xs text-success rounded-xl flex items-center gap-1.5 animate-fade-in'>
                      <Icon icon='ph:check-circle' className='text-base shrink-0' />
                      {waSuccessMsg}
                    </div>
                  )}

                  <button
                    onClick={handleSendWhatsApp}
                    disabled={sendingWa}
                    className='w-full py-3 rounded-full bg-success text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:bg-success/50 shadow-sm font-semibold'
                  >
                    {sendingWa ? 'Sending...' : 'Send Invoice via WhatsApp'} <Icon icon='ph:paper-plane-tilt-bold' />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Email Tab */
            <div className='space-y-4'>
              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1.5'>
                  Recipient Email Address
                </label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='e.g. client@example.com'
                  className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1.5'>
                  Subject
                </label>
                <input
                  type='text'
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder='Email Subject'
                  className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-secondary-20 mb-1.5'>
                  Email Body Summary
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                  className='w-full border border-grey-10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-30 transition-colors bg-white resize-none text-xs leading-relaxed'
                />
                <p className='text-[10px] text-secondary-30 mt-1 italic'>
                  * The ReportLab-generated detailed invoice PDF will be attached to this email.
                </p>
              </div>

              {emailErrorMsg && (
                <div className='p-3 bg-red-50 border border-red-200 text-xs text-danger rounded-xl flex items-center gap-1.5 animate-fade-in'>
                  <Icon icon='ph:warning-circle' className='text-base shrink-0' />
                  {emailErrorMsg}
                </div>
              )}

              {emailSuccessMsg && (
                <div className='p-3 bg-green-50 border border-green-200 text-xs text-success rounded-xl flex items-center gap-1.5 animate-fade-in'>
                  <Icon icon='ph:check-circle' className='text-base shrink-0' />
                  {emailSuccessMsg}
                </div>
              )}

              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className='w-full py-3 rounded-full bg-primary-30 text-white text-sm font-medium hover:bg-primary-40 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-20/50 shadow-sm font-semibold'
              >
                {sendingEmail ? 'Sending...' : 'Send Branded Email'} <Icon icon='ph:paper-plane-tilt-bold' />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
