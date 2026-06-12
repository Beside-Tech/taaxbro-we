// =============================================================================
// FILE:     route.ts
// REPO:     taaxbro-we-main
// PLACE AT: frontend/app/api/chat/route.ts
// ACTION:   Replace existing file entirely
// =============================================================================

/**
 * /app/api/chat/route.ts
 *
 * Proxy to the Taaxbro backend at /api/v1/ai/chat.
 *
 * The Vercel AI SDK approach (streamText → gemini-1.5-pro) was removed because:
 *   1. gemini-1.5-pro is deprecated → "something went wrong" errors in prod
 *   2. It bypassed the real Elon agent (elon_agent.py) and all its tools
 *   3. Tools were duplicated in Next.js but not wired to the actual DB/Redis
 *
 * Now the frontend is a thin proxy: it passes the user message + page context
 * to the backend, gets back { answer, sources, conversation_id, mode }, and
 * returns a plain JSON response the ChatButton component reads directly.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, page, isLoggedIn, conversationId } = body;

    // Extract the latest user message
    const lastUserMsg = [...(messages ?? [])].reverse().find(
      (m: { role: string }) => m.role === 'user',
    );
    if (!lastUserMsg) {
      return NextResponse.json({ error: 'No user message provided.' }, { status: 400 });
    }

    // Forward the auth cookie so the backend can identify the logged-in user
    const cookies = req.headers.get('cookie') || '';

    const payload = {
      message: lastUserMsg.content,
      conversation_id: conversationId ?? null,
      dashboard_page: page ?? null,
    };

    const backendRes = await fetch(`${BACKEND_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth cookie so backend can validate session
        ...(cookies ? { cookie: cookies } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text().catch(() => 'Unknown error');
      console.error('[chat/route] Backend error:', backendRes.status, errText);
      return NextResponse.json(
        { error: `Backend returned ${backendRes.status}.` },
        { status: backendRes.status },
      );
    }

    const data = await backendRes.json();

    // Return in a shape the ChatButton expects:
    // { answer, conversation_id, mode, sources? }
    return NextResponse.json({
      answer: data.answer ?? '',
      conversation_id: data.conversation_id ?? null,
      mode: data.mode ?? (isLoggedIn ? 'authenticated' : 'guest'),
      sources: data.sources ?? [],
    });
  } catch (err: unknown) {
    console.error('[chat/route] Unexpected error:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}