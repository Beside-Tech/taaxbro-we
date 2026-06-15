'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useChatContext } from '@/context/ChatContext';
import { tax } from '@/lib/api';

interface Props {
  onClose: () => void;
  onSubmit: (reference: string, amount: number) => Promise<void>;
  computedAmount: number;
  taxType: string;
  period: string;
  authority: string;
  grossOutput?: number;
  grossInput?: number;
  breakdownData?: any;
  periodStart?: string;
  periodEnd?: string;
}

function formatNaira(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function downloadCSV(filename: string, headers: string[], rows: any[][]) {
  const content = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(r => r.map(v => {
      const val = v === null || v === undefined ? '' : String(v);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecordFilingModal({
  onClose,
  onSubmit,
  computedAmount,
  taxType,
  period,
  authority,
  grossOutput = 0,
  grossInput = 0,
  breakdownData,
  periodStart,
  periodEnd,
}: Props) {
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(computedAmount.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'form'>('guide');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { setOpen, setPrefilledMessage } = useChatContext();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError('Receipt Reference / NRS number is required');
      return;
    }
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(reference, parsedAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record filing');
    } finally {
      setLoading(false);
    }
  };

  // CSV Exporters
  // CSV Backup Exporters (Local Fallbacks)
  const handleDownloadVatSalesBackup = () => {
    if (!breakdownData || !breakdownData.output_vat) return;
    const headers = ["Customer Name", "Customer TIN", "Invoice Date", "Invoice Number", "Description", "Gross Amount", "VAT Rate", "VAT Amount"];
    const rows = breakdownData.output_vat.map((inv: any) => [
      inv.client_name || "Unknown Customer",
      inv.client_tin || inv.tin || "",
      inv.issue_date ? inv.issue_date.substring(0, 10) : "",
      inv.invoice_number || "",
      inv.description || "Sales",
      inv.subtotal || inv.amount || 0,
      "7.5%",
      inv.vat_total || inv.vat_amount || 0
    ]);
    downloadCSV(`FIRS_VAT_Sales_Schedule_${period.replace(/ /g, "_")}.csv`, headers, rows);
  };

  const handleDownloadVatPurchasesBackup = () => {
    if (!breakdownData || !breakdownData.input_vat) return;
    const headers = ["Supplier Name", "Supplier TIN", "Invoice Date", "Invoice Number", "Description", "Gross Amount", "VAT Paid"];
    const rows = breakdownData.input_vat.map((exp: any) => [
      exp.vendor_name || "Unknown Supplier",
      exp.vendor_tin || exp.tin || "",
      exp.expense_date ? exp.expense_date.substring(0, 10) : "",
      exp.invoice_number || exp.receipt_number || "",
      exp.description || exp.category || "Expenses",
      exp.amount || 0,
      exp.vat_amount || 0
    ]);
    downloadCSV(`FIRS_VAT_Purchase_Schedule_${period.replace(/ /g, "_")}.csv`, headers, rows);
  };

  const handleDownloadPayeScheduleBackup = () => {
    if (!breakdownData || !breakdownData.payments) return;
    const headers = ["Taxpayer ID", "Staff Name", "BVN", "Gross Income", "PAYE", "Phone Number", "Email"];
    const rows = breakdownData.payments.map((p: any) => [
      "",
      p.employee_name || "",
      "",
      p.gross_salary || 0,
      p.paye_deducted || 0,
      "",
      ""
    ]);
    const isLirs = authority.toUpperCase() === 'LIRS' || authority.toLowerCase().includes('lagos');
    const filenamePrefix = isLirs ? 'LIRS' : authority.replace(/[^a-zA-Z0-9]/g, '_');
    downloadCSV(`${filenamePrefix}_PAYE_Remittance_Schedule_${period.replace(/ /g, "_")}.csv`, headers, rows);
  };

  const handleDownloadWhtScheduleBackup = () => {
    if (!breakdownData) return;
    const headers = ["Vendor Name", "Vendor TIN", "Service Category", "Invoice Date", "Invoice Number", "Gross Amount", "WHT Rate (%)", "WHT Amount"];
    const bills = breakdownData.wht_bills || [];
    const expenses = breakdownData.wht_expenses || [];
    
    const rows = [
      ...bills.map((b: any) => [
        b.vendor_name || "",
        b.vendor_tin || "",
        b.wht_category || "Services",
        b.date ? b.date.substring(0, 10) : "",
        b.bill_number || "",
        b.subtotal || b.amount || 0,
        b.wht_rate || 5,
        b.wht_amount || 0
      ]),
      ...expenses.map((e: any) => [
        e.vendor_name || "",
        e.vendor_tin || "",
        e.category || "Services",
        e.date ? e.date.substring(0, 10) : "",
        "",
        e.amount || 0,
        e.wht_rate || 5,
        e.wht_amount || 0
      ])
    ];
    downloadCSV(`FIRS_WHT_Schedule_${period.replace(/ /g, "_")}.csv`, headers, rows);
  };

  const downloadBackendExport = async (exportType: string, filename: string) => {
    try {
      setLoading(true);
      setError(null);
      const start = periodStart ? periodStart.split('T')[0] : undefined;
      const end = periodEnd ? periodEnd.split('T')[0] : undefined;
      
      const blob = await tax.downloadExport(exportType, start, end);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.warn("Failed to download backend export, falling back to client-side CSV generation:", err);
      // Run local CSV download as a fallback
      if (exportType === 'vat-sales-csv') handleDownloadVatSalesBackup();
      else if (exportType === 'vat-purchase-csv') handleDownloadVatPurchasesBackup();
      else if (exportType === 'paye-csv') handleDownloadPayeScheduleBackup();
      else if (exportType === 'wht-csv') handleDownloadWhtScheduleBackup();
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVatSales = () => {
    downloadBackendExport('vat-sales-csv', `FIRS_VAT_Sales_Schedule_${period.replace(/ /g, "_")}.csv`);
  };

  const handleDownloadVatPurchases = () => {
    downloadBackendExport('vat-purchase-csv', `FIRS_VAT_Purchase_Schedule_${period.replace(/ /g, "_")}.csv`);
  };

  const handleDownloadPayeSchedule = () => {
    const isLirs = authority.toUpperCase() === 'LIRS' || authority.toLowerCase().includes('lagos');
    const filenamePrefix = isLirs ? 'LIRS' : authority.replace(/[^a-zA-Z0-9]/g, '_');
    downloadBackendExport('paye-csv', `${filenamePrefix}_PAYE_Remittance_Schedule_${period.replace(/ /g, "_")}.csv`);
  };

  const handleDownloadWhtSchedule = () => {
    downloadBackendExport('wht-csv', `FIRS_WHT_Schedule_${period.replace(/ /g, "_")}.csv`);
  };

  const typeLower = taxType.toLowerCase();
  const isLirs = authority.toUpperCase() === 'LIRS' || authority.toLowerCase().includes('lagos');
  
  const portalUrl = typeLower === 'vat' || typeLower === 'wht' || typeLower === 'cit'
    ? 'https://taxpromax.firs.gov.ng'
    : (isLirs ? 'https://etax.lirs.net' : '');
  
  const portalName = typeLower === 'vat' || typeLower === 'wht' || typeLower === 'cit'
    ? 'FIRS TaxPro Max'
    : (isLirs ? 'LIRS eTax' : `${authority} Portal`);

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn'>
      <div className='bg-white rounded-2xl p-6 md:p-8 w-full max-w-4xl relative max-h-[92vh] overflow-hidden shadow-xl border border-grey-10/40 flex flex-col'>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className='absolute top-6 right-6 text-secondary-30 hover:text-secondary-10 transition-colors disabled:opacity-50 z-10'
        >
          <Icon icon='ph:x' className='text-xl' />
        </button>

        {/* Header */}
        <div className="shrink-0 mb-5">
          <h2 className='text-xl md:text-2xl font-bold text-secondary-10'>Guided Tax Filing</h2>
          <p className='text-xs md:text-sm text-secondary-30 mt-0.5 uppercase font-semibold tracking-wider text-primary-30'>
            {taxType} Return | {period} | {authority}
          </p>
        </div>

        {error && (
          <div className='mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 shrink-0'>
            <Icon icon='ph:warning-circle' className='text-base shrink-0' />
            {error}
          </div>
        )}

        {/* Tab Toggle for Mobile */}
        <div className="flex border-b border-grey-10 mb-5 lg:hidden shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'guide' ? 'border-primary-30 text-primary-30' : 'border-transparent text-secondary-30'}`}
          >
            Filing Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'form' ? 'border-primary-30 text-primary-30' : 'border-transparent text-secondary-30'}`}
          >
            Record Reference
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 min-h-0 flex-1 overflow-hidden">
          
          {/* LEFT PANEL: FILING GUIDE */}
          <div className={`${activeTab === 'guide' ? 'flex' : 'hidden'} lg:flex flex-col border-b lg:border-b-0 lg:border-r border-grey-10/60 pb-6 lg:pb-0 lg:pr-10 overflow-y-auto pr-2`}>
            <h3 className="text-sm font-semibold text-secondary-10 mb-3 flex items-center gap-1.5">
              <Icon icon="ph:map-trifold" className="text-primary-30 text-lg" />
              Portal Steps for {portalName}
            </h3>

            <div className="space-y-4 text-xs md:text-sm text-secondary-20 flex-1">
              
              {/* Step 1: Portal Link */}
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary-10 mb-1">Open Tax Portal</p>
                  {portalUrl ? (
                    <>
                      <a 
                        href={portalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 text-primary-30 hover:underline font-semibold"
                      >
                        Open {portalName} Portal
                        <Icon icon="ph:arrow-square-out" className="text-sm" />
                      </a>
                      <p className="text-[11px] text-secondary-30 mt-1">Log in using your registered business credentials.</p>
                    </>
                  ) : (
                    <div className="bg-primary-50/50 border border-primary-20/20 rounded-xl p-3 flex flex-col gap-2">
                      <p className="text-xs text-secondary-20 leading-relaxed">
                        Nigerian state internal revenue portals vary. Since your business is under <strong>{authority}</strong>, click below to ask Elon for the direct login link.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPrefilledMessage(`What is the official portal URL to file monthly PAYE tax returns for ${authority}?`);
                          setOpen(true);
                        }}
                        className="self-start inline-flex items-center gap-1.5 bg-primary-30 hover:bg-primary-40 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm transition-colors"
                      >
                        <Icon icon="ph:chats-bold" className="text-sm" />
                        Ask Elon for Portal Link
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Navigate */}
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-secondary-10 mb-1">Locate the Tax Obligation</p>
                  {typeLower === 'paye' ? (
                    isLirs ? (
                      <p className="text-secondary-20">Click on <strong>"FILE RETURNS"</strong> on your eTax dashboard menu.</p>
                    ) : (
                      <p className="text-secondary-20">Navigate to the monthly returns filing or payroll upload section on the <strong>{authority}</strong> portal.</p>
                    )
                  ) : (
                    <p className="text-secondary-20">Navigate to the <strong>"Taxes Due"</strong> tab and select <strong>{taxType}</strong>.</p>
                  )}
                  <p className="text-[11px] text-secondary-30 mt-1">Find the assessment period for <strong>{period}</strong> and click <strong>"Process"</strong> or initiate the new upload assessment.</p>
                </div>
              </div>

              {/* Step 3: Copy Values & Download Schedules */}
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                <div className="space-y-3 flex-1 min-w-0">
                  <p className="font-semibold text-secondary-10">Download Schedule & Declare Values</p>
                  <p className="text-xs text-secondary-30">Copy these figures exactly as computed by Taaxbro to declare on the portal:</p>
                  
                  {/* Clipboard copyable values */}
                  <div className="space-y-2 bg-[#FAF8FF] p-3 rounded-xl border border-primary-10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-secondary-30">Net Liability:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-secondary-10 text-sm font-semibold">{formatNaira(computedAmount)}</strong>
                        <button 
                          onClick={() => handleCopy(computedAmount.toString(), 'liability')}
                          className="p-1 hover:bg-white rounded border border-grey-10 text-secondary-30 hover:text-primary-30 transition-colors"
                          title="Copy amount"
                        >
                          <Icon icon={copiedField === 'liability' ? 'ph:check-bold' : 'ph:copy'} className="text-xs" />
                        </button>
                      </div>
                    </div>

                    {typeLower === 'vat' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary-30">Output VAT (Sales):</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-secondary-10 text-xs font-semibold">{formatNaira(grossOutput)}</strong>
                            <button 
                              onClick={() => handleCopy(grossOutput.toString(), 'output')}
                              className="p-1 hover:bg-white rounded border border-grey-10 text-secondary-30 hover:text-primary-30 transition-colors"
                              title="Copy output VAT"
                            >
                              <Icon icon={copiedField === 'output' ? 'ph:check-bold' : 'ph:copy'} className="text-[10px]" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary-30">Input VAT Paid:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-secondary-10 text-xs font-semibold">{formatNaira(grossInput)}</strong>
                            <button 
                              onClick={() => handleCopy(grossInput.toString(), 'input')}
                              className="p-1 hover:bg-white rounded border border-grey-10 text-secondary-30 hover:text-primary-30 transition-colors"
                              title="Copy input VAT"
                            >
                              <Icon icon={copiedField === 'input' ? 'ph:check-bold' : 'ph:copy'} className="text-[10px]" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {typeLower === 'wht' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary-30">Gross Transactions:</span>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-secondary-10 text-xs font-semibold">{formatNaira(grossOutput)}</strong>
                          <button 
                            onClick={() => handleCopy(grossOutput.toString(), 'gross')}
                            className="p-1 hover:bg-white rounded border border-grey-10 text-secondary-30 hover:text-primary-30 transition-colors"
                            title="Copy gross amount"
                          >
                            <Icon icon={copiedField === 'gross' ? 'ph:check-bold' : 'ph:copy'} className="text-[10px]" />
                          </button>
                        </div>
                      </div>
                    )}

                    {typeLower === 'cit' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary-30">Annual Revenue:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-secondary-10 text-xs font-semibold">{formatNaira(grossOutput)}</strong>
                            <button 
                              onClick={() => handleCopy(grossOutput.toString(), 'rev')}
                              className="p-1 hover:bg-white rounded border border-grey-10 text-secondary-30 hover:text-primary-30 transition-colors"
                              title="Copy revenue"
                            >
                              <Icon icon={copiedField === 'rev' ? 'ph:check-bold' : 'ph:copy'} className="text-[10px]" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary-30">Operating Costs:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-secondary-10 text-xs font-semibold">{formatNaira(grossInput)}</strong>
                            <button 
                              onClick={() => handleCopy(grossInput.toString(), 'costs')}
                              className="p-1 hover:bg-white rounded border border-grey-10 text-secondary-30 hover:text-primary-30 transition-colors"
                              title="Copy costs"
                            >
                              <Icon icon={copiedField === 'costs' ? 'ph:check-bold' : 'ph:copy'} className="text-[10px]" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Template download actions */}
                  {breakdownData ? (
                    <div className="pt-1">
                      <p className="text-xs text-secondary-30 mb-2 font-medium">Download pre-populated official schedules:</p>
                      
                      {typeLower === 'vat' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadVatSales}
                            className="flex items-center gap-1.5 text-xs bg-primary-50 hover:bg-primary-10 text-primary-30 border border-primary-20/30 px-3 py-1.5 rounded-lg font-semibold shadow-sm transition-colors"
                          >
                            <Icon icon="ph:download-simple" />
                            Sales Schedule (CSV)
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadVatPurchases}
                            className="flex items-center gap-1.5 text-xs bg-primary-50 hover:bg-primary-10 text-primary-30 border border-primary-20/30 px-3 py-1.5 rounded-lg font-semibold shadow-sm transition-colors"
                          >
                            <Icon icon="ph:download-simple" />
                            Purchases Schedule (CSV)
                          </button>
                        </div>
                      )}

                      {typeLower === 'paye' && (
                        <button
                          type="button"
                          onClick={handleDownloadPayeSchedule}
                          className="flex items-center gap-1.5 text-xs bg-primary-50 hover:bg-primary-10 text-primary-30 border border-primary-20/30 px-3 py-1.5 rounded-lg font-semibold shadow-sm transition-colors"
                        >
                          <Icon icon="ph:download-simple" />
                          {isLirs ? 'LIRS PAYE Remittance CSV' : `${authority} PAYE Remittance CSV`}
                        </button>
                      )}

                      {typeLower === 'wht' && (
                        <button
                          type="button"
                          onClick={handleDownloadWhtSchedule}
                          className="flex items-center gap-1.5 text-xs bg-primary-50 hover:bg-primary-10 text-primary-30 border border-primary-20/30 px-3 py-1.5 rounded-lg font-semibold shadow-sm transition-colors"
                        >
                          <Icon icon="ph:download-simple" />
                          FIRS WHT Schedule CSV
                        </button>
                      )}

                      {typeLower === 'cit' && (
                        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg p-2.5 font-medium leading-relaxed">
                          💡 CIT filing requires entering detailed P&L schedules directly into the TaxPro Max form online. Reference the figures under CIT details on your tax page.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-secondary-30 italic">Detailed transactions loading...</p>
                  )}
                </div>
              </div>

              {/* Step 4: Pay & Record */}
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                <div>
                  <p className="font-semibold text-secondary-10 mb-1">Confirm and Paste Receipt</p>
                  <p className="text-secondary-20">
                    Submit your return on the tax portal, pay the generated bill reference, and retrieve the receipt reference number.
                  </p>
                  <p className="text-[11px] text-secondary-30 mt-1">Paste the reference on the right panel form to update status in Taaxbro.</p>
                </div>
              </div>

            </div>

            {/* Ask Elon Help Box */}
            <div className="mt-5 p-4 bg-primary-50/40 rounded-xl border border-primary-10/60 flex flex-col gap-2 shrink-0">
              <p className="text-xs text-secondary-20 font-semibold flex items-center gap-1">
                <Icon icon="ph:cpu" className="text-primary-30 text-base" /> Need Help?
              </p>
              <p className="text-[11px] text-secondary-30 leading-relaxed">
                {typeLower === 'paye' && !isLirs 
                  ? `Each Nigerian state internal revenue service has its own portal or filing requirements. Ask Elon to find the exact portal and steps for ${authority}.`
                  : `Elon can walk you through the ${authority} portal in real-time.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  const msg = typeLower === 'paye' && !isLirs
                    ? `I am filing PAYE for my business located in a state under ${authority} for the period ${period}. My liability is ${formatNaira(computedAmount)}. What is the official portal link for ${authority} and how do I upload my payroll schedule CSV there?`
                    : `How do I file my ${taxType} return on the ${authority} portal for ${period}? My liability is ${formatNaira(computedAmount)}.`;
                  setPrefilledMessage(msg);
                  setOpen(true);
                }}
                className="w-full py-2 bg-primary-30 hover:bg-primary-40 text-white text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Icon icon="ph:chats-bold" className="text-sm" /> Ask Elon for Help
              </button>
            </div>

          </div>

          {/* RIGHT PANEL: MANUAL REFERENCE FORM */}
          <div className={`${activeTab === 'form' ? 'flex' : 'hidden'} lg:flex flex-col justify-between overflow-y-auto pr-2`}>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-secondary-10 mb-4 flex items-center gap-1.5">
                  <Icon icon="ph:receipt" className="text-primary-30 text-lg" />
                  Enter Payment / Receipt Details
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className='block text-sm font-semibold text-secondary-10 mb-1.5'>
                      Filing Amount (₦)
                    </label>
                    <input
                      type='number'
                      step='0.01'
                      min='0'
                      value={amount}
                      disabled={loading}
                      onChange={(e) => setAmount(e.target.value)}
                      className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors disabled:bg-grey-10/20 text-secondary-10 font-semibold'
                      placeholder='0.00'
                    />
                    <p className='text-xs text-secondary-40 mt-1.5'>
                      Pre-filled with computed liability. Use 0.00 for Nil Returns (exempt operations).
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-secondary-10 mb-1.5'>
                      Receipt Reference / NRS Number
                    </label>
                    <input
                      type='text'
                      value={reference}
                      disabled={loading}
                      onChange={(e) => setReference(e.target.value)}
                      className='w-full border border-grey-10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors disabled:opacity-50 text-secondary-10 font-semibold'
                      placeholder='e.g. NRS-202606-987654'
                      required
                    />
                    <p className='text-xs text-secondary-40 mt-1.5'>
                      Enter the official RRR payment code or NRS assessment receipt reference received from {authority}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4 border-t border-grey-10/40 mt-6 shrink-0'>
                <button
                  type='button'
                  onClick={onClose}
                  disabled={loading}
                  className='flex-1 py-3 rounded-full border border-grey-10 text-sm font-semibold text-secondary-10 hover:bg-primary-50 transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='flex-[2] py-3 rounded-full bg-primary-30 text-white text-sm font-semibold hover:bg-primary-40 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-30/50 disabled:cursor-not-allowed shadow-md'
                >
                  {loading ? (
                    <>
                      <Icon icon='line-md:loading-twotone-loop' className='text-lg' />
                      Recording...
                    </>
                  ) : (
                    'Confirm Filing'
                  )}
                </button>
              </div>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
