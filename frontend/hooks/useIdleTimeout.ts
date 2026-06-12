'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimeoutProps {
  onWarning: () => void;
  onTimeout: () => void;
  warningTimeMs?: number; // e.g. 13 mins
  timeoutTimeMs?: number;  // e.g. 15 mins
  isActive?: boolean;
}

export function useIdleTimeout({
  onWarning,
  onTimeout,
  warningTimeMs = 13 * 60 * 1000,
  timeoutTimeMs = 15 * 60 * 1000,
  isActive = true,
}: UseIdleTimeoutProps) {
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onWarningRef.current = onWarning;
    onTimeoutRef.current = onTimeout;
  }, [onWarning, onTimeout]);

  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

    if (!isActive) return;

    warningTimerRef.current = setTimeout(() => {
      onWarningRef.current();
    }, warningTimeMs);

    timeoutTimerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutTimeMs);
  }, [isActive, warningTimeMs, timeoutTimeMs]);

  useEffect(() => {
    if (!isActive) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimers();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetTimers();

    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive, resetTimers]);

  return { reset: resetTimers };
}
