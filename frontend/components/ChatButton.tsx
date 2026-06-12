'use client';

/**
 * Elon Web Chat Widget — v2.0
 *
 * Connected to the same Elon AI agent as WhatsApp.
 * Context-aware:
 *   • Guest (not logged in)  → general Nigerian tax Q&A, product info. No account actions.
 *   • Logged-in              → full Elon: invoices, clients, tax calendar, P&L, OCR, voice
 *
 * New capabilities for logged-in users:
 *   • 📎 Image/PDF upload  → OCR extraction → expense logging via Elon
 *   • 🎤 Voice input       → browser MediaRecorder → Whisper transcription
 *   • 🧠 Page context      → tells Elon which dashboard tab is open
 *   • ✨ Markdown rendering → bold, bullets, line breaks
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

type Sender = 'user' | 'bot';
type MsgType = 'text' | 'ocr-preview' | 'voice-transcript';

interface Message {
  id: string;
  from: Sender;
  text: string;
  type?: MsgType;
  timestamp?: Date;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function callElonAuthenticated(
  message: string,
  conversationId?: string,
  dashboardPage?: string,
): Promise<{ answer: string; conversation_id: string; mode: string }> {
  const res = await fetch(`${BASE}/api/v1/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId, dashboard_page: dashboardPage }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function callElonGuest(
  message: string,
  conversationId?: string,
): Promise<{ answer: string; conversation_id: string; mode: string }> {
  const res = await fetch(`${BASE}/api/v1/ai/chat/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function uploadOCR(
  file: File,
  conversationId?: string,
): Promise<{ answer: string; conversation_id: string; extracted_text?: string; amount_detected?: string }> {
  const fd = new FormData();
  fd.append('file', file);
  if (conversationId) fd.append('conversation_id', conversationId);
  const res = await fetch(`${BASE}/api/v1/ai/chat/ocr`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function transcribeVoice(
  blob: Blob,
  conversationId?: string,
): Promise<{ transcript: string; conversation_id: string }> {
  const fd = new FormData();
  fd.append('audio', blob, 'recording.webm');
  if (conversationId) fd.append('conversation_id', conversationId);
  const res = await fetch(`${BASE}/api/v1/ai/chat/voice`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `${res.status}`);
  }
  return res.json();
}

// ── Suggested questions ───────────────────────────────────────────────────────

const GUEST_SUGGESTIONS = [
  'What is VAT in Nigeria?',
  'How does PAYE work?',
  'What is TIN and how do I get one?',
  'How does Taaxbro work?',
];

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  '/overview':  ['What\'s my tax position this month?', 'Show my overdue invoices', 'Financial report', 'Show my tax calendar'],
  '/invoices':  ['Create an invoice for Acme Ltd, ₦50,000', 'Show unpaid invoices', 'Remind Acme to pay', 'Invoice #INV-0001'],
  '/tax':       ['Show my tax calendar', 'When is my VAT due?', 'What\'s my PAYE this month?', 'How do I file CIT?'],
  '/pay':       ['How do I record a payment?', 'Who owes me money?', 'Show my payment history'],
  '/books':     ['Show my clients', 'Add a new client', 'Financial report for this month', 'Show my receipts'],
  '/settings':  ['How do I update my TIN?', 'How do I connect my bank?', 'How do I add my team?'],
};

function getSuggestions(pathname: string, isLoggedIn: boolean): string[] {
  if (!isLoggedIn) return GUEST_SUGGESTIONS;
  // Match by prefix
  for (const [prefix, qs] of Object.entries(PAGE_SUGGESTIONS)) {
    if (pathname.startsWith(prefix)) return qs;
  }
  return ['Create an invoice', 'Show tax calendar', 'Financial report', 'Show clients'];
}

function getPageName(pathname: string): string | undefined {
  const map: Record<string, string> = {
    '/overview': 'overview', '/invoices': 'invoices', '/tax': 'tax',
    '/pay': 'pay', '/books': 'books', '/settings': 'settings',
  };
  for (const [prefix, name] of Object.entries(map)) {
    if (pathname.startsWith(prefix)) return name;
  }
  return undefined;
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold: *text* or **text**
    const parts = line.split(/(\*{1,2}[^*]+\*{1,2})/g);
    const rendered = parts.map((part, j) => {
      if (/^\*{1,2}[^*]+\*{1,2}$/.test(part)) {
        return <strong key={j}>{part.replace(/\*/g, '')}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    // Bullet points
    const isBullet = line.startsWith('• ') || line.startsWith('- ');
    const content = isBullet ? line.slice(2) : line;
    const contentParts = content.split(/(\*{1,2}[^*]+\*{1,2})/g).map((p, j) => {
      if (/^\*{1,2}[^*]+\*{1,2}$/.test(p)) return <strong key={j}>{p.replace(/\*/g, '')}</strong>;
      return <span key={j}>{p}</span>;
    });

    return (
      <span key={i}>
        {isBullet ? (
          <span className='block pl-3 relative before:content-["•"] before:absolute before:left-0 before:text-primary-30'>
            {contentParts}
          </span>
        ) : (
          rendered
        )}
        {i < lines.length - 1 && !isBullet && <br />}
      </span>
    );
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

function mkId() { return Math.random().toString(36).slice(2); }

export default function ChatButton() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isLoggedIn = !!user;
  const dashboardPage = getPageName(pathname);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // ── Initial greeting based on auth status ─────────────────────────────────
  useEffect(() => {
    const greeting: Message = isLoggedIn
      ? {
          id: mkId(),
          from: 'bot',
          text: `Hi${user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! I'm Elon, your Taaxbro assistant. I can create invoices, log expenses, check your tax calendar, and more. What would you like to do?`,
          timestamp: new Date(),
        }
      : {
          id: mkId(),
          from: 'bot',
          text: "Hi! I'm Elon, Taaxbro's AI assistant. I can answer Nigerian tax questions and show you how Taaxbro works. Sign up to create invoices, log expenses, and auto-file taxes.",
          timestamp: new Date(),
        };
    setMessages([greeting]);
    setConversationId(undefined);
  }, [isLoggedIn, user?.full_name]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open]);

  // ── Reset greeting on new page ────────────────────────────────────────────
  useEffect(() => {
    if (open && isLoggedIn && dashboardPage) {
      // Update greeting subtly (don't reset conversation, just useful context)
    }
  }, [pathname]);

  // ── Send text message ─────────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setInput('');
    setVoiceError('');

    const userMsg: Message = { id: mkId(), from: 'user', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    try {
      let res;
      if (isLoggedIn) {
        res = await callElonAuthenticated(trimmed, conversationId, dashboardPage);
      } else {
        res = await callElonGuest(trimmed, conversationId);
      }
      if (res.conversation_id) setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { id: mkId(), from: 'bot', text: res.answer, timestamp: new Date() },
      ]);
    } catch (err: unknown) {
      // Offline fallback
      const fallback = isLoggedIn
        ? "I couldn't reach the server right now. Please try again in a moment."
        : "I'm temporarily offline. Try: VAT is 7.5% in Nigeria, PAYE is deducted monthly, and CIT is 30% for large companies.";
      setMessages((prev) => [...prev, { id: mkId(), from: 'bot', text: fallback, timestamp: new Date() }]);
    } finally {
      setTyping(false);
    }
  }, [typing, isLoggedIn, conversationId, dashboardPage]);

  // ── OCR / file upload ─────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isLoggedIn) return;
    e.target.value = '';

    const previewMsg: Message = {
      id: mkId(), from: 'user',
      text: `📎 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`,
      type: 'ocr-preview',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, previewMsg]);
    setTyping(true);

    try {
      const res = await uploadOCR(file, conversationId);
      if (res.conversation_id) setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { id: mkId(), from: 'bot', text: res.answer, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: mkId(), from: 'bot', text: "I couldn't read that file. Please try a clearer image or PDF.", timestamp: new Date() },
      ]);
    } finally {
      setTyping(false);
    }
  }, [isLoggedIn, conversationId]);

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!isLoggedIn || recording) return;
    setVoiceError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setTyping(true);
        try {
          const res = await transcribeVoice(blob, conversationId);
          if (res.conversation_id) setConversationId(res.conversation_id);
          // Put the transcript in the input so user can review before sending
          setInput(res.transcript);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Voice unavailable';
          setVoiceError(msg.includes('503') ? 'Voice transcription is offline — please type.' : msg);
        } finally {
          setTyping(false);
          setRecording(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setVoiceError('Microphone access denied.');
    }
  }, [isLoggedIn, recording, conversationId]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // ── Suggestions ───────────────────────────────────────────────────────────
  const suggestions = getSuggestions(pathname, isLoggedIn);
  const showSuggestions = messages.length <= 1 && !typing;

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-20 md:bottom-24 right-4 md:right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-grey-10/60 bg-white overflow-hidden transition-all duration-300 ease-out ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
        style={{ width: '380px', maxWidth: 'calc(100vw - 2rem)', maxHeight: '78vh' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-3 bg-[#1a1a2e] text-white shrink-0'>
          <div className='flex items-center gap-2.5'>
            <div className='relative'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-primary-40 to-primary-20 flex items-center justify-center text-sm font-bold'>E</div>
              <div className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1a1a2e]' />
            </div>
            <div>
              <p className='text-sm font-semibold leading-none'>Elon</p>
              <p className='text-[10px] text-white/50 mt-0.5 leading-none'>
                {isLoggedIn ? `${dashboardPage ? dashboardPage.charAt(0).toUpperCase() + dashboardPage.slice(1) + ' · ' : ''}Full access` : 'General mode · Sign in for full access'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-1'>
            <button
              onClick={() => { setMessages([]); setConversationId(undefined); }}
              title='Clear chat'
              className='p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white'
            >
              <Icon icon='ph:trash' className='text-sm' />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label='Close chat'
              className='p-1.5 rounded-lg hover:bg-white/10 transition'
            >
              <Icon icon='ph:x' className='text-sm' />
            </button>
          </div>
        </div>

        {/* Mode banner for guests */}
        {!isLoggedIn && (
          <div className='px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2'>
            <Icon icon='ph:info' className='text-amber-600 shrink-0 text-sm' />
            <p className='text-[11px] text-amber-700 leading-tight'>
              General tax Q&A only.{' '}
              <a href='/signup' className='underline font-medium'>Sign up free</a>{' '}
              to create invoices, log expenses & auto-file taxes.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 min-h-0 bg-[#fafafa]'>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.from === 'bot' && (
                <div className='w-6 h-6 rounded-full bg-gradient-to-br from-primary-40 to-primary-20 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mr-2 mt-1'>
                  E
                </div>
              )}
              <div
                className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.from === 'user'
                    ? 'bg-[#1a1a2e] text-white rounded-br-sm'
                    : 'bg-white text-secondary-10 rounded-bl-sm border border-grey-10/50'
                } ${msg.type === 'ocr-preview' ? 'bg-primary-50 border border-primary-10 text-primary-20' : ''}`}
              >
                {msg.from === 'bot' ? renderMarkdown(msg.text) : msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className='flex justify-start items-end gap-2'>
              <div className='w-6 h-6 rounded-full bg-gradient-to-br from-primary-40 to-primary-20 flex items-center justify-center text-[10px] font-bold text-white shrink-0'>E</div>
              <div className='bg-white border border-grey-10/50 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center'>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className='w-1.5 h-1.5 rounded-full bg-secondary-30/50 animate-bounce'
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {showSuggestions && (
            <div className='flex flex-col gap-1.5 mt-1'>
              <p className='text-[11px] text-secondary-30 font-medium px-1'>Try asking:</p>
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className='text-left text-xs px-3.5 py-2 rounded-xl border border-grey-10 bg-white text-secondary-10 hover:border-primary-30/60 hover:bg-primary-50 transition-colors'
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Voice error */}
        {voiceError && (
          <div className='px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 flex items-center gap-1.5'>
            <Icon icon='ph:warning-circle' className='shrink-0' />
            {voiceError}
          </div>
        )}

        {/* Input bar */}
        <div className='flex items-center gap-2 px-3 py-2.5 border-t border-grey-10 bg-white shrink-0'>
          {/* OCR upload — logged-in only */}
          {isLoggedIn && (
            <>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*,application/pdf'
                className='hidden'
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title='Upload receipt or document'
                disabled={typing}
                className='p-1.5 rounded-lg text-secondary-30 hover:text-primary-30 hover:bg-primary-50 transition disabled:opacity-40'
              >
                <Icon icon='ph:paperclip' className='text-base' />
              </button>
            </>
          )}

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={isLoggedIn ? 'Create invoice, ask about taxes…' : 'Ask about Nigerian tax…'}
            className='flex-1 text-sm bg-transparent outline-none text-secondary-10 placeholder:text-secondary-40 py-1'
            disabled={typing || recording}
          />

          {/* Voice input — logged-in only */}
          {isLoggedIn && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              title={recording ? 'Release to transcribe' : 'Hold to record'}
              disabled={typing}
              className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                recording
                  ? 'text-red-500 bg-red-50 animate-pulse'
                  : 'text-secondary-30 hover:text-primary-30 hover:bg-primary-50'
              }`}
            >
              <Icon icon={recording ? 'ph:stop-circle-fill' : 'ph:microphone'} className='text-base' />
            </button>
          )}

          <button
            onClick={() => send(input)}
            disabled={!input.trim() || typing}
            className='p-1.5 rounded-lg text-secondary-30 hover:text-primary-30 hover:bg-primary-50 transition disabled:opacity-30'
            aria-label='Send'
          >
            <Icon icon='ph:paper-plane-tilt-fill' className='text-base' />
          </button>
        </div>
      </div>

      {/* ── FAB Button ────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close Elon assistant' : 'Open Elon assistant'}
        className='fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-[#1a1a2e] to-primary-30 text-white hover:scale-105 hover:shadow-2xl border-2 border-white/20'
      >
        <Icon
          icon={open ? 'ph:x-bold' : 'ph:chats-teardrop-fill'}
          className='text-xl transition-all duration-200'
        />
        {/* Notification dot if guest — encourage sign-up */}
        {!isLoggedIn && !open && (
          <span className='absolute top-0.5 right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white' />
        )}
      </button>
    </>
  );
}
