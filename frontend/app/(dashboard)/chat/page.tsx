'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import TopBar from '@/components/dashboard/TopBar';
import { tax, type ComplianceAnomalyResponse } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// ── API Helpers ─────────────────────────────────────────────────────────────
async function chatViaProxy(
  message: string,
  conversationId?: string | null,
  dashboardPage?: string | null,
): Promise<{ answer: string; conversation_id: string; mode: string; sources: unknown[] }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: conversationId ?? null,
      dashboard_page: dashboardPage ?? null,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Chat failed (${res.status})`);
  }
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

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const isBullet = line.startsWith('• ') || line.startsWith('- ');
    const content = isBullet ? line.slice(2) : line;

    const parseContent = (contentStr: string) => {
      const mdLinkRegex = /(\[[^\]]+\]\(https?:\/\/[^\s()<>[\]]+\))/g;
      const parts = contentStr.split(mdLinkRegex);

      return parts.map((part, j) => {
        const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s()<>[\]]+)\)$/);
        if (match) {
          const anchorText = match[1];
          const url = match[2];
          
          const textParts = anchorText.split(/(\*{1,2}[^*]+\*{1,2})/g).map((p, k) => {
            if (/^\*{1,2}[^*]+\*{1,2}$/.test(p)) {
              return <strong key={k}>{p.replace(/\*/g, '')}</strong>;
            }
            return p;
          });

          return (
            <a
              key={j}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-30 underline hover:text-primary-40 break-all font-medium inline-flex items-center gap-0.5"
            >
              {textParts}
              <Icon icon="ph:arrow-square-out" className="text-[11px] shrink-0" />
            </a>
          );
        }

        const rawUrlRegex = /(https?:\/\/[^\s()<>[\]]+?(?=[.,;:!?]?(?:\s|$)))/g;
        const subParts = part.split(rawUrlRegex);

        return subParts.map((subPart, k) => {
          if (/^https?:\/\//.test(subPart)) {
            return (
              <a
                key={`${j}-${k}`}
                href={subPart}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-30 underline hover:text-primary-40 break-all font-medium inline-flex items-center gap-0.5"
              >
                {subPart}
                <Icon icon="ph:arrow-square-out" className="text-[11px] shrink-0" />
              </a>
            );
          }

          const boldParts = subPart.split(/(\*{1,2}[^*]+\*{1,2})/g);
          return boldParts.map((boldPart, l) => {
            if (/^\*{1,2}[^*]+\*{1,2}$/.test(boldPart)) {
              return <strong key={`${j}-${k}-${l}`}>{boldPart.replace(/\*/g, '')}</strong>;
            }
            return <span key={`${j}-${k}-${l}`}>{boldPart}</span>;
          });
        });
      });
    };

    const contentParts = parseContent(content);

    return (
      <span key={i}>
        {isBullet ? (
          <span className='block pl-3 relative before:content-["•"] before:absolute before:left-0 before:text-primary-30'>
            {contentParts}
          </span>
        ) : (
          contentParts
        )}
        {i < lines.length - 1 && !isBullet && <br />}
      </span>
    );
  });
}

function mkId() {
  return Math.random().toString(36).slice(2);
}

// ── SUGGESTED QUESTIONS ──────────────────────────────────────────────────────
const CHAT_SUGGESTIONS = [
  'What is the threshold for VAT exemptions in Nigeria?',
  'How do I file CIT for a small enterprise?',
  'How can I fix a VAT exemption compliance anomaly?',
  'Explain WHT requirements for contract services.',
];

// ── ChatContent Component (inside Suspense) ──────────────────────────────────
function ChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isLoggedIn = !!user;

  const anomalyId = searchParams.get('anomalyId');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [uploadingOcr, setUploadingOcr] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [contextAnomaly, setContextAnomaly] = useState<ComplianceAnomalyResponse | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // ── Fetch context if anomalyId query exists ──────────────────────────────────
  useEffect(() => {
    if (anomalyId && isLoggedIn && user?.business_id) {
      setLoadingContext(true);
      tax.getComplianceAnomalies(user.business_id)
        .then((anomalies) => {
          const found = anomalies.find((a) => a.id === anomalyId);
          if (found) {
            setContextAnomaly(found);
            // Auto-trigger the first query context
            const initialPrompt = `Hi Elon, I want to discuss the compliance anomaly: "${found.title}". Description: "${found.description}". Required action: "${found.action_required}". How can I resolve this under Nigerian tax law?`;
            sendMessage(initialPrompt);
          }
        })
        .catch((err) => {
          console.error('Failed to load anomaly context:', err);
        })
        .finally(() => {
          setLoadingContext(false);
        });
    }
  }, [anomalyId, isLoggedIn, user?.business_id]);

  // ── Send Message ────────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: mkId(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await chatViaProxy(
        text,
        conversationId,
        'tax', // default to tax dashboard context
      );

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      let answer = data.answer || 'No response received.';

      // Strip ACTION tags from chatbot responses and handle front-end events
      const actionRegex = /ACTION:(navigate|show|tab|download):([a-z0-9\-\/]+)/gi;
      const actions: Array<{ type: string; target: string }> = [];
      let match;
      while ((match = actionRegex.exec(answer)) !== null) {
        actions.push({ type: match[1].toLowerCase(), target: match[2].toLowerCase() });
      }
      answer = answer.replace(/ACTION:(navigate|show|tab|download):[a-z0-9\-\/]+/gi, '').trim();

      setMessages((prev) => [
        ...prev,
        { id: mkId(), role: 'assistant', content: answer },
      ]);

      if (actions.length > 0) {
        setTimeout(() => {
          for (const action of actions) {
            if (action.type === 'navigate') {
              const route = action.target.startsWith('/') ? action.target : `/${action.target}`;
              router.push(route);
            } else if (action.type === 'show') {
              window.dispatchEvent(new CustomEvent('elon-action', { detail: { show: action.target } }));
            } else if (action.type === 'tab') {
              window.dispatchEvent(new CustomEvent('elon-action', { detail: { tab: action.target } }));
            } else if (action.type === 'download') {
              const today = new Date();
              const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
              const end = today.toISOString().split('T')[0];
              const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
              const downloadUrl = `${baseUrl}/api/v1/ai/export/${action.target}?start=${start}&end=${end}`;
              window.open(downloadUrl, '_blank', 'noopener');
              window.dispatchEvent(new CustomEvent('elon-action', { detail: { download: action.target } }));
            }
          }
        }, 600);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const errorText = msg.includes('model output')
        ? 'I had a hiccup generating a response. Could you rephrase or try again?'
        : 'Sorry, something went wrong. Please try again in a moment.';
      setMessages((prev) => [...prev, { id: mkId(), role: 'assistant', content: errorText }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (q: string) => {
    sendMessage(q);
  };

  // ── Greeting based on auth status ──────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0 && !anomalyId && !loadingContext) {
      const greetingText = isLoggedIn
        ? `Hi${user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! I'm Elon, your tax expert AI. I have full context on your business's bookings, expenses, invoices, and compliance logs. What compliance question can I resolve for you today?`
        : "Hi! I'm Elon, Taaxbro's AI compliance expert. I can guide you through Nigerian tax guidelines. Please sign in to link your personal business records.";
      
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: greetingText,
        },
      ]);
    }
  }, [isLoggedIn, user?.full_name, messages.length, anomalyId, loadingContext]);

  // ── Auto Scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, isLoading, uploadingOcr]);

  // ── Document OCR upload ─────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isLoggedIn) return;
    e.target.value = '';

    setUploadingOcr(true);
    setVoiceError('');

    setMessages((prev: Message[]) => [
      ...prev,
      {
        id: mkId(),
        role: 'user',
        content: `📎 Uploaded document: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`,
      },
    ]);

    try {
      const res = await uploadOCR(file);
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: mkId(),
          role: 'assistant',
          content: res.answer,
        },
      ]);
    } catch {
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: mkId(),
          role: 'assistant',
          content: "I couldn't read that file. Please try a clearer image or PDF.",
        },
      ]);
    } finally {
      setUploadingOcr(false);
    }
  }, [isLoggedIn]);

  // ── Voice Recording ────────────────────────────────────────────────────────
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
        setUploadingOcr(true);
        try {
          const res = await transcribeVoice(blob);
          setInput(res.transcript);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Voice unavailable';
          setVoiceError(msg.includes('503') ? 'Voice transcription is offline — please type.' : msg);
        } finally {
          setUploadingOcr(false);
          setRecording(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setVoiceError('Microphone access denied.');
    }
  }, [isLoggedIn, recording]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-4rem)] lg:h-screen bg-[#fcfcfc]">
      <TopBar>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-40 to-primary-20 flex items-center justify-center text-white font-bold text-base shadow-sm">
            E
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary-10 leading-tight">Chat with Elon</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-secondary-30">Elon is online · Ready to help</p>
            </div>
          </div>
        </div>
      </TopBar>

      {/* Main chat layout */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#fafafa] relative">
        {/* Context Loading Overlay */}
        {(loadingContext || (anomalyId && messages.length === 0)) && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Icon icon="ph:circle-notch" className="animate-spin text-3xl text-primary-30" />
            <p className="text-sm text-secondary-20 font-semibold">Loading context details...</p>
          </div>
        )}

        {/* Anomaly context indicator banner */}
        {contextAnomaly && (
          <div className="px-6 py-3 bg-primary-50/50 border-b border-primary-20/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-50 border border-primary-10 flex items-center justify-center text-primary-30">
                <Icon icon="ph:warning-circle-bold" className="text-lg" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-secondary-10">Contextual Audit Discussion</p>
                <p className="text-secondary-30 mt-0.5 font-medium truncate max-w-md">
                  Analyzing anomaly: <span className="font-semibold text-primary-30">{contextAnomaly.title}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setContextAnomaly(null)}
              className="text-[10px] font-bold text-secondary-30 hover:text-secondary-10 bg-white px-2 py-1 border border-grey-10 rounded-lg shadow-sm transition-colors"
            >
              Clear Context
            </button>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-40 to-primary-20 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                    E
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-[#1a1a2e] text-white border-secondary-10 rounded-tr-none'
                      : 'bg-white text-secondary-10 border-grey-10/40 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {(isLoading || uploadingOcr) && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-40 to-primary-20 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                  E
                </div>
                <div className="bg-white border border-grey-10/40 px-4 py-3.5 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-secondary-30/50 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Suggestions (Only if chat hasn't started) */}
            {messages.length <= 1 && !isLoading && !uploadingOcr && (
              <div className="pt-4 space-y-2">
                <p className="text-xs font-bold text-secondary-30 px-1">Suggested Compliance Topics:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CHAT_SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestionClick(q)}
                      className="text-left text-xs px-4 py-3 rounded-xl border border-grey-10 bg-white text-secondary-10 hover:border-primary-30/50 hover:bg-primary-50/50 transition-all font-medium shadow-sm hover:scale-[1.01]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-grey-10/60 py-4 px-6 shrink-0">
          <div className="max-w-3xl mx-auto">
            {voiceError && (
              <div className="mb-3 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-1.5">
                <Icon icon="ph:warning-circle" className="shrink-0" />
                {voiceError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
              {isLoggedIn && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload tax document or receipt"
                    disabled={isLoading || uploadingOcr}
                    className="p-3 rounded-xl border border-grey-10 text-secondary-30 hover:text-primary-30 hover:border-primary-30/40 hover:bg-primary-50 transition-all disabled:opacity-40"
                  >
                    <Icon icon="ph:paperclip" className="text-lg" />
                  </button>
                </>
              )}

              <div className="flex-1 relative flex items-center bg-grey-0 border border-grey-10 rounded-xl px-4 focus-within:border-primary-30 focus-within:bg-white transition-all">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isLoggedIn ? "Ask Elon a tax question or instruction..." : "Type your Nigerian tax compliance question..."}
                  className="w-full text-sm bg-transparent outline-none text-secondary-10 placeholder:text-secondary-40 py-3.5 pr-10"
                  disabled={isLoading || recording || uploadingOcr}
                />
                
                {isLoggedIn && (
                  <button
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    title={recording ? 'Release to transcribe' : 'Hold to record voice query'}
                    disabled={isLoading || uploadingOcr}
                    className={`absolute right-3 p-1.5 rounded-lg transition-all ${
                      recording
                        ? 'text-red-500 bg-red-50 animate-pulse'
                        : 'text-secondary-30 hover:text-primary-30'
                    }`}
                  >
                    <Icon icon={recording ? 'ph:stop-circle-fill' : 'ph:microphone'} className="text-base" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading || uploadingOcr}
                className="bg-primary-40 hover:bg-primary-30 disabled:bg-grey-10 disabled:text-secondary-40 text-white font-semibold text-sm px-5 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <span>Send</span>
                <Icon icon="ph:paper-plane-tilt-fill" className="text-sm" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Export ────────────────────────────────────────────────────────
export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 h-screen items-center justify-center bg-grey-0">
          <Icon icon="ph:circle-notch" className="animate-spin text-4xl text-primary-30" />
          <p className="text-sm text-secondary-30 mt-3 font-medium">Initializing chat hub...</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
