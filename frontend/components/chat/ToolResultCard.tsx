import { Icon } from '@iconify/react';

// Local type — compatible with ai v3 ToolInvocation shape
type ToolInvocation =
  | { state: 'partial-call'; toolCallId: string; toolName: string; args: unknown }
  | { state: 'call'; toolCallId: string; toolName: string; args: unknown }
  | { state: 'result'; toolCallId: string; toolName: string; args: unknown; result: unknown };

function formatNaira(value: number): string {
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function ToolResultCard({ invocation }: { invocation: ToolInvocation }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { toolName, state } = invocation;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const args = (invocation as any).args;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (invocation as any).result;

  if (state === 'partial-call' || state === 'call') {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-grey-10 bg-white text-secondary-30 text-xs shadow-sm mt-2 animate-pulse">
        <Icon icon="ph:circle-notch-bold" className="animate-spin text-primary-30 text-sm" />
        <span>Running tool: {toolName.replace(/_/g, ' ')}...</span>
      </div>
    );
  }


  if (state === 'result') {
    if (result?.error) {
      return (
        <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs shadow-sm mt-2">
          <Icon icon="ph:warning-circle-fill" className="text-red-500 text-sm shrink-0 mt-0.5" />
          <span>Error: {result.error}</span>
        </div>
      );
    }

    switch (toolName) {
      case 'create_invoice':
        return (
          <div className="border border-green-500 bg-green-50/20 rounded-xl p-4 mt-2 space-y-2 text-sm shadow-sm">
            <div className="flex items-center justify-between text-green-700 font-semibold">
              <span className="flex items-center gap-1.5"><Icon icon="ph:file-check" /> Invoice Created</span>
              <span className="text-xs bg-green-500 text-white px-2.5 py-0.5 rounded-full font-normal">Unpaid</span>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs text-secondary-20">
              <span>Invoice Ref:</span>
              <strong className="text-right text-secondary-10">{result.invoice_number}</strong>
              <span>Client Name:</span>
              <span className="text-right font-medium text-secondary-10">{result.client_name}</span>
              <span>Amount:</span>
              <strong className="text-right text-secondary-10 font-bold">{formatNaira(result.total_amount)}</strong>
              <span>Due Date:</span>
              <span className="text-right text-secondary-10 font-medium">
                {new Date(result.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        );

      case 'log_expense':
        return (
          <div className="border border-blue-500 bg-blue-50/20 rounded-xl p-4 mt-2 space-y-2 text-sm shadow-sm">
            <div className="flex items-center justify-between text-blue-700 font-semibold">
              <span className="flex items-center gap-1.5"><Icon icon="ph:receipt-bold" /> Expense Logged</span>
              <span className="text-xs bg-blue-500 text-white px-2.5 py-0.5 rounded-full font-normal capitalize">{result.category}</span>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs text-secondary-20">
              <span>Amount:</span>
              <strong className="text-right text-secondary-10 font-bold">{formatNaira(result.amount)}</strong>
              <span>Vendor:</span>
              <span className="text-right text-secondary-10 font-medium">{result.vendor_name || '—'}</span>
              <span>Date:</span>
              <span className="text-right text-secondary-10 font-medium">
                {new Date(result.expense_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span>Description:</span>
              <span className="text-right text-secondary-30 italic">{result.description || '—'}</span>
            </div>
          </div>
        );

      case 'list_invoices':
        const invoices = Array.isArray(result) ? result : [];
        return (
          <div className="border border-grey-10 bg-white rounded-xl p-3 mt-2 shadow-sm">
            <p className="text-xs font-semibold text-secondary-10 mb-2 flex items-center gap-1.5">
              <Icon icon="ph:list-dashes" className="text-sm text-primary-30" />
              Recent Invoices ({invoices.length})
            </p>
            {invoices.length === 0 ? (
              <p className="text-xs text-secondary-30 py-4 text-center">No invoices recorded</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {invoices.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="flex justify-between items-center bg-[#fafafa] rounded-lg p-2 border border-grey-10/40 text-xs">
                    <div>
                      <strong className="text-secondary-10">{inv.invoice_number}</strong>
                      <p className="text-[10px] text-secondary-30 mt-0.5">{inv.client_name} · Due {new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="text-right">
                      <strong className="text-secondary-10">{formatNaira(inv.total_amount)}</strong>
                      <p className={`text-[10px] mt-0.5 font-medium ${inv.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>{inv.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'get_financial_summary':
        const stats = result?.stats;
        if (!stats) return null;
        return (
          <div className="border border-primary-20 bg-primary-50/20 rounded-xl p-4 mt-2 space-y-3 text-sm shadow-sm">
            <p className="text-xs font-bold text-primary-30 flex items-center gap-1.5">
              <Icon icon="ph:chart-pie-slice-fill" className="text-sm" />
              Financial Summary
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white rounded-lg p-2.5 border border-grey-10/40 shadow-xs">
                <span className="text-[10px] text-secondary-30 block">Revenue</span>
                <strong className="text-secondary-10 text-sm mt-0.5 block">{formatNaira(stats.revenue_current_month)}</strong>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-grey-10/40 shadow-xs">
                <span className="text-[10px] text-secondary-30 block">Expenses</span>
                <strong className="text-secondary-10 text-sm mt-0.5 block">{formatNaira(stats.expenses_current_month)}</strong>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-grey-10/40 shadow-xs">
                <span className="text-[10px] text-secondary-30 block">Tax Reserve</span>
                <strong className="text-[#8b7cf8] text-sm mt-0.5 block">{formatNaira(stats.tax_reserve)}</strong>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-grey-10/40 shadow-xs">
                <span className="text-[10px] text-secondary-30 block">Outstanding Invoices</span>
                <strong className="text-orange-500 text-sm mt-0.5 block">{formatNaira(stats.outstanding_invoices_amount)}</strong>
              </div>
            </div>
          </div>
        );

      case 'get_tax_calendar':
        if (!result) return null;
        return (
          <div className="border border-orange-200 bg-orange-50/15 rounded-xl p-4 mt-2 space-y-2.5 text-sm shadow-sm">
            <p className="text-xs font-bold text-orange-600 flex items-center gap-1.5">
              <Icon icon="ph:calendar-check-fill" className="text-sm" />
              Filing Deadline Details
            </p>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs text-secondary-20">
              <span>Next Deadline:</span>
              <strong className="text-right text-secondary-10">
                {result.next_filing_date 
                  ? new Date(result.next_filing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'No upcoming deadline'}
              </strong>
              <span>Liabilities Due:</span>
              <strong className="text-right text-secondary-10">{formatNaira(result.tax_liabilities_due || 0)}</strong>
              <span>Tax Reserve (Est):</span>
              <strong className="text-right text-[#8b7cf8]">{formatNaira(result.tax_reserve || 0)}</strong>
              <span>Filing Status:</span>
              <span className={`text-right font-semibold ${result.tax_liabilities_status === 'Overdue' ? 'text-red-500' : 'text-green-600'}`}>
                {result.tax_liabilities_status || 'On Track'}
              </span>
            </div>
          </div>
        );

      case 'navigate_to':
        return (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-grey-0/5 border border-grey-10/60 rounded-xl text-xs mt-2 text-secondary-20">
            <Icon icon="ph:compass-fill" className="text-[#3b82f6]" />
            <span>Successfully navigated user to the <strong>{args.page}</strong> page.</span>
          </div>
        );

      case 'open_modal':
        return (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-grey-0/5 border border-grey-10/60 rounded-xl text-xs mt-2 text-secondary-20">
            <Icon icon="ph:app-window-fill" className="text-[#10b981]" />
            <span>Opened the <strong>{args.modal}</strong> dialog.</span>
          </div>
        );

      default:
        return null;
    }
  }

  return null;
}
