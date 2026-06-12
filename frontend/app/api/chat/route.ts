import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { messages, page, isLoggedIn } = await req.json();

  const cookies = req.headers.get('cookie') || '';
  let businessId: string | null = null;
  let businessName: string | null = null;

  if (isLoggedIn) {
    try {
      const profileRes = await fetch(`${BACKEND_URL}/api/v1/business/me`, {
        headers: { cookie: cookies },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        businessId = profile.business_id;
        businessName = profile.name;
      }
    } catch (err) {
      console.error('Failed to fetch business profile in chat route:', err);
    }
  }

  const systemPrompt = `You are Elon, the friendly, highly intelligent financial and tax AI assistant for Taaxbro.
You help Nigerian SMEs, startups, and freelancers manage their finances, bookkeeping, and tax compliance (including VAT, Withholding Tax WHT, PAYE, and Company Income Tax CIT).

Current UI context:
- User is currently viewing the '${page || 'overview'}' tab/page.
- Authentication State: ${isLoggedIn ? 'Logged In (Full Access)' : 'Guest Mode (Limited Access)'}
${businessName ? `- Active Business: ${businessName}` : ''}
${businessId ? `- Business ID: ${businessId}` : ''}

Instructions:
1. If the user is NOT logged in (Guest Mode), do not use any tools. Politely explain that they must register or log in to use features like invoice generation, expense tracking, and custom tax computation.
2. If the user IS logged in, you can run tools on their behalf to create invoices, log expenses, query lists, navigate tabs, or open modals.
3. Be professional, concise, and helpful. Use Nigerian financial terms and standard currencies (Naira, ₦) where appropriate.
4. When you execute a tool, describe what you are doing (e.g. "I'll create an invoice for Acme Ltd for ₦50,000 right now...").`;

  try {
  const result = await streamText({
    model: google('gemini-1.5-pro'),
    messages,
    system: systemPrompt,
    tools: {
      create_invoice: tool({
        description: 'Create a new invoice for a client with a specified amount.',
        parameters: z.object({
          client_name: z.string().describe('The name of the client to invoice'),
          amount: z.number().describe('The total invoice amount in NGN'),
          due_date: z.string().optional().describe('Optional due date in YYYY-MM-DD format'),
          notes: z.string().optional().describe('Optional description or notes for the invoice'),
        }),
        execute: async ({ client_name, amount, due_date, notes }) => {
          if (!businessId) {
            return { error: 'No active business ID found. Please set up your business profile.' };
          }
          const res = await fetch(`${BACKEND_URL}/api/v1/invoices?business_id=${businessId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookies },
            body: JSON.stringify({ client_name, total_amount: amount, due_date, notes }),
          });
          if (!res.ok) {
            const errDetail = await res.text();
            return { error: `Failed to create invoice: ${errDetail}` };
          }
          return res.json();
        },
      }),

      log_expense: tool({
        description: 'Log a new expense category with amount and vendor details.',
        parameters: z.object({
          category: z.string().describe('Expense category (e.g., utility, software, office, travel)'),
          amount: z.number().describe('Expense amount in NGN'),
          vendor_name: z.string().optional().describe('Name of the vendor'),
          expense_date: z.string().optional().describe('Optional expense date in YYYY-MM-DD format'),
          description: z.string().optional().describe('Optional description of the expense'),
          vat_amount: z.number().optional().describe('Optional VAT amount paid'),
        }),
        execute: async ({ category, amount, vendor_name, expense_date, description, vat_amount }) => {
          if (!businessId) {
            return { error: 'No active business ID found.' };
          }
          const res = await fetch(`${BACKEND_URL}/api/v1/expenses?business_id=${businessId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookies },
            body: JSON.stringify({ category, amount, vendor_name, expense_date, description, vat_amount }),
          });
          if (!res.ok) {
            const errDetail = await res.text();
            return { error: `Failed to log expense: ${errDetail}` };
          }
          return res.json();
        },
      }),

      list_invoices: tool({
        description: 'Retrieve a list of recent invoices for this business.',
        parameters: z.object({}),
        execute: async () => {
          if (!businessId) {
            return { error: 'No active business ID found.' };
          }
          const res = await fetch(`${BACKEND_URL}/api/v1/invoices?business_id=${businessId}`, {
            headers: { cookie: cookies },
          });
          if (!res.ok) {
            return { error: 'Failed to fetch invoices.' };
          }
          return res.json();
        },
      }),

      get_financial_summary: tool({
        description: 'Get a summary of the business stats, including revenue, expenses, and tax reserve.',
        parameters: z.object({}),
        execute: async () => {
          if (!businessId) {
            return { error: 'No active business ID found.' };
          }
          const res = await fetch(`${BACKEND_URL}/api/v1/dashboard`, {
            headers: { cookie: cookies },
          });
          if (!res.ok) {
            return { error: 'Failed to fetch financial summary.' };
          }
          return res.json();
        },
      }),

      get_tax_calendar: tool({
        description: 'Retrieve tax obligation dates and amounts due this month.',
        parameters: z.object({}),
        execute: async () => {
          if (!businessId) {
            return { error: 'No active business ID found.' };
          }
          const res = await fetch(`${BACKEND_URL}/api/v1/dashboard`, {
            headers: { cookie: cookies },
          });
          if (!res.ok) {
            return { error: 'Failed to fetch tax stats.' };
          }
          const data = await res.json();
          return {
            next_filing_date: data.stats?.next_filing_date,
            tax_liabilities_due: data.stats?.tax_liabilities_due,
            tax_liabilities_status: data.stats?.tax_liabilities_status,
            tax_reserve: data.stats?.tax_reserve,
          };
        },
      }),

      navigate_to: tool({
        description: 'Navigate the user to a specific page or tab in the dashboard.',
        parameters: z.object({
          page: z
            .enum(['overview', 'invoices', 'expenses', 'books', 'tax', 'pay', 'settings'])
            .describe('The target page or tab'),
        }),
        execute: async ({ page }) => {
          return { success: true, page };
        },
      }),

      open_modal: tool({
        description: 'Open a specific dialog or modal in the UI.',
        parameters: z.object({
          modal: z.string().describe('The name of the modal to open'),
        }),
        execute: async ({ modal }) => {
          return { success: true, modal };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
  } catch (err: unknown) {
    console.error('[chat/route] streamText error:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    // Return a plain-text error so the client can display it gracefully
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
