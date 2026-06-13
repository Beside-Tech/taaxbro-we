// =============================================================================
// FILE:     route.ts
// REPO:     taaxbro-web-main
// PLACE AT: frontend/app/api/chat/route.ts
//
// WHY THIS FILE EXISTS:
//   The frontend (app.taaxbro.com) and the backend may live on different domains
//   (e.g. Railway URL). This Next.js server-side route receives the chat request
//   from the browser (same origin → cookie is always present), extracts the
//   access_token / refresh_token cookies from the incoming request, and forwards
//   them in a server-to-server call to the backend.
//
// ENHANCEMENTS (Web Elon parity with WhatsApp Elon):
//   - Passes rich action_context so Elon knows he can trigger frontend actions
//   - Passes structured page context (tab, route) for context-aware responses
//   - Returns structured action hints the frontend can act on
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Give the backend up to 30s to respond (Elon can be slow on cold start)
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse the incoming JSON body ─────────────────────────────────────
    const body = await req.json();
    const { message, conversation_id, dashboard_page } = body as {
      message?: string;
      conversation_id?: string | null;
      dashboard_page?: string | null;
    };

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
    }

    // ── 2. Forward ALL cookies from the browser request ─────────────────────
    const cookieHeader = req.headers.get('cookie') || '';

    // ── 3. Build enriched context for Elon ──────────────────────────────────
    // Tell Elon what page the user is on and what actions are available on web.
    const webActionContext = dashboard_page
      ? `[Web Dashboard Context: user is on the "${dashboard_page}" page. Available web actions: navigate to pages (overview/books/pay/tax/settings), show modals (new invoice, new expense, payment link), open tabs within the current page. When the user asks to create an invoice or log an expense, include action hints in your response like "ACTION:navigate:books" or "ACTION:show:new-invoice" so the frontend can act immediately.]`
      : '[Web Dashboard Context: user is on a dashboard page. Guide them to the right section as needed.]';

    const enrichedMessage = `${webActionContext}\n\n${message}`;

    // ── 4. Proxy to backend ──────────────────────────────────────────────────
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({
        message: enrichedMessage,
        conversation_id: conversation_id ?? null,
        dashboard_page: dashboard_page ?? null,
      }),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text().catch(() => 'Unknown error');
      console.error('[chat/route] Backend error:', backendRes.status, errText);
      return NextResponse.json(
        { error: `Backend returned ${backendRes.status}.` },
        { status: backendRes.status },
      );
    }

    // ── 5. Return the backend response verbatim ──────────────────────────────
    const data = await backendRes.json() as {
      answer?: string;
      conversation_id?: string;
      mode?: string;
      sources?: unknown[];
    };

    return NextResponse.json({
      answer: data.answer ?? '',
      conversation_id: data.conversation_id ?? null,
      mode: data.mode ?? 'guest',
      sources: data.sources ?? [],
    });

  } catch (err: unknown) {
    console.error('[chat/route] Unexpected error:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}