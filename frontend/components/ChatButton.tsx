'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

type Message = { from: 'user' | 'bot'; text: string };

const INITIAL_MESSAGES: Message[] = [
  { from: 'bot', text: "Hi! I'm the Taaxbro assistant. How can I help you today?" },
];

const SUGGESTED = [
  'How do payment links work?',
  'What banks are supported?',
  'How does VAT filing work?',
  'How do I get started?',
];

function getBotResponse(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('payment link')) {
    return 'Payment links let you create a shareable link in seconds. Send it via WhatsApp, email, or SMS — and when a customer pays, it\'s automatically recorded in your books.';
  }
  if (t.includes('bank') || t.includes('supported')) {
    return 'We support GTBank, Access Bank, Zenith Bank, UBA, First Bank, and major fintechs like Opay, Kuda, and PalmPay. More banks are added regularly.';
  }
  if (t.includes('vat') || t.includes('tax') || t.includes('firs') || t.includes('filing')) {
    return 'Taaxbro computes your VAT position from real transaction data, then lets you review and submit directly to FIRS in one click. Confirmation is instant.';
  }
  if (t.includes('start') || t.includes('sign up') || t.includes('account')) {
    return 'Getting started is free! Connect your bank and Taaxbro pulls in your full transaction history automatically — no manual data entry.';
  }
  if (t.includes('price') || t.includes('cost') || t.includes('plan') || t.includes('pricing')) {
    return 'Check our Pricing page for the latest plans. We have options for solo owners and teams, and you can start with a free trial.';
  }
  if (t.includes('secure') || t.includes('safe') || t.includes('data') || t.includes('privacy')) {
    return 'Your data is encrypted at rest and in transit using AES-256 encryption. We\'re SOC 2 compliant and never share your data with third parties.';
  }
  if (t.includes('invoice') || t.includes('invoicing')) {
    return 'Create, send, and track professional invoices in seconds. They\'re auto-recorded the moment a client pays — no manual bookkeeping needed.';
  }
  return "Thanks for reaching out! For detailed help, email us at support@taaxbro.com or reach us on X @taaxbro. We typically respond within a few hours.";
}

export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setInput('');
    setMessages((prev) => [...prev, { from: 'user', text: trimmed }]);
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'bot', text: getBotResponse(trimmed) }]);
      setTyping(false);
    }, 800);
  }

  return (
    <>
      <div
        className={`fixed bottom-20 md:bottom-24 right-4 md:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl border border-grey-10 dark:border-white/10 bg-white dark:bg-[#1c1c1c] overflow-hidden transition-all duration-300 ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ maxHeight: '70vh' }}>
        <div className='flex items-center justify-between px-4 py-3 bg-dark dark:bg-[#0d0d0d] text-white shrink-0'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-green-400' />
            <span className='text-sm font-medium'>Taaxbro Assistant</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label='Close chat'
            className='hover:opacity-70 transition-opacity'>
            <Icon icon='mdi:close' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0'>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.from === 'user'
                    ? 'bg-dark dark:bg-primary-40 text-white rounded-br-sm'
                    : 'bg-grey-10 dark:bg-white/10 text-dark dark:text-white rounded-bl-sm'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className='flex justify-start'>
              <div className='bg-grey-10 dark:bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center'>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className='w-1.5 h-1.5 rounded-full bg-dark/40 dark:bg-white/40 animate-bounce'
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {messages.length === 1 && !typing && (
            <div className='flex flex-col gap-2 mt-1'>
              <p className='text-xs text-dark/50 dark:text-white/50'>Suggested questions</p>
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className='text-left text-xs px-3 py-2 rounded-xl border border-grey-10 dark:border-white/10 text-dark dark:text-white hover:bg-grey-10/60 dark:hover:bg-white/5 transition-colors cursor-pointer'>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className='flex items-center gap-2 p-3 border-t border-grey-10 dark:border-white/10 shrink-0'>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
            placeholder='Ask a question...'
            className='flex-1 text-sm bg-transparent outline-none dark:text-white placeholder:text-dark/40 dark:placeholder:text-white/40'
          />
          <button
            onClick={() => send(input)}
            className='text-dark dark:text-white hover:text-primary-30 transition-colors p-1 cursor-pointer'
            aria-label='Send message'>
            <Icon icon='mdi:send-outline' className='text-lg' />
          </button>
        </div>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat assistant'}
        className='fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 bg-dark dark:bg-white text-white dark:text-dark border-2 border-white/70 dark:border-dark/20 rounded-full flex items-center justify-center shadow-xl hover:bg-primary-40 dark:hover:bg-primary-10 transition-all duration-200 cursor-pointer'>
        <Icon
          icon={open ? 'mdi:close' : 'mdi:chat-processing-outline'}
          className='text-2xl'
        />
      </button>
    </>
  );
}
