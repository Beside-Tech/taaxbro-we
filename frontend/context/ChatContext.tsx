'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  prefilledMessage: string;
  setPrefilledMessage: (msg: string) => void;
  triggerOpen: (msg?: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefilledMessage, setPrefilledMessage] = useState('');

  const triggerOpen = (msg?: string) => {
    if (msg) {
      setPrefilledMessage(msg);
    }
    setOpen(true);
  };

  return (
    <ChatContext.Provider value={{ open, setOpen, prefilledMessage, setPrefilledMessage, triggerOpen }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
