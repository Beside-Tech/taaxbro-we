'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimeoutProps {
  onWarning: () => void;
  onTimeout: () => void;
  onActive?: () => void;
  warningTimeMs?: number; // default: 13 mins
  timeoutTimeMs?: number;  // default: 15 mins
  isActive?: boolean;
}

const STORAGE_KEY = 'taaxbro_last_activity';

export function useIdleTimeout({
  onWarning,
  onTimeout,
  onActive,
  warningTimeMs = 13 * 60 * 1000,
  timeoutTimeMs = 15 * 60 * 1000,
  isActive = true,
}: UseIdleTimeoutProps) {
  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);
  const onActiveRef = useRef(onActive);
  const lastWriteRef = useRef<number>(0);

  useEffect(() => {
    onWarningRef.current = onWarning;
    onTimeoutRef.current = onTimeout;
    onActiveRef.current = onActive;
  }, [onWarning, onTimeout, onActive]);

  // Record user activity both locally and to localStorage (throttled to 2 seconds)
  const updateActivity = useCallback(() => {
    if (!isActive) return;
    const now = Date.now();
    // Throttle writing to localStorage to prevent performance bottleneck
    if (now - lastWriteRef.current > 2000) {
      try {
        localStorage.setItem(STORAGE_KEY, now.toString());
        lastWriteRef.current = now;
      } catch (e) {
        // Handle localStorage quota or private mode issues silently
      }
      onActiveRef.current?.();
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Initialize the last activity timestamp if not present
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    } catch (e) {}

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      updateActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Run check interval every 5 seconds (failsafe even when tab is backgrounded)
    const interval = setInterval(() => {
      try {
        const lastActivityStr = localStorage.getItem(STORAGE_KEY);
        const lastActivity = lastActivityStr ? Number(lastActivityStr) : Date.now();
        const elapsed = Date.now() - lastActivity;

        if (elapsed >= timeoutTimeMs) {
          onTimeoutRef.current();
        } else if (elapsed >= warningTimeMs) {
          onWarningRef.current();
        } else {
          onActiveRef.current?.();
        }
      } catch (e) {}
    }, 5000);

    return () => {
      clearInterval(interval);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive, updateActivity, warningTimeMs, timeoutTimeMs]);

  // Manual reset function
  const reset = useCallback(() => {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
      lastWriteRef.current = now;
    } catch (e) {}
    onActiveRef.current?.();
  }, []);

  return { reset };
}

