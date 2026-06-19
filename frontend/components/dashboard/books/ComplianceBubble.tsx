'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { dashboard, WebNotification } from '@/lib/api';

interface ComplianceBubbleProps {
  businessId: string;
  recordId: string;
  recordType: 'expense' | 'invoice';
  onDismiss: () => void;
}

const POLL_INTERVALS = [5000, 10000, 20000, 40000, 60000];
const MAX_TOTAL_ATTEMPTS = 12; // ~5 minutes total

export default function ComplianceBubble({
  businessId,
  recordId,
  recordType,
  onDismiss,
}: ComplianceBubbleProps) {
  const [alerts, setAlerts] = useState<WebNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(false);

  const pollAttemptRef = useRef(0);
  const saveTimeRef = useRef(new Date());

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;
      try {
        const notifications = await dashboard.getNotifications();
        const matches = notifications.filter((n) => {
          const typeMatch = n.type === 'compliance_alert';
          const entityTypeMatch = n.entity_type?.toLowerCase() === recordType.toLowerCase();
          const entityIdMatch = n.entity_id === recordId;
          const isNew = new Date(n.created_at) >= saveTimeRef.current;
          return typeMatch && entityTypeMatch && entityIdMatch && isNew;
        });

        if (matches.length > 0) {
          setAlerts(matches);
          setVisible(true);
          // Stop polling
          return;
        }
      } catch (err) {
        console.error('Error polling compliance alerts:', err);
      }

      pollAttemptRef.current += 1;
      if (pollAttemptRef.current < MAX_TOTAL_ATTEMPTS && isActive) {
        const nextInterval = POLL_INTERVALS[Math.min(pollAttemptRef.current, POLL_INTERVALS.length - 1)];
        timeoutId = setTimeout(poll, nextInterval);
      }
    };

    // Start polling after a short delay to allow Celery worker to process
    timeoutId = setTimeout(poll, 2000);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [businessId, recordId, recordType]);

  if (alerts.length === 0 || !visible) return null;

  const currentAlert = alerts[currentIndex];
  const actionRequired = currentAlert.body || '';

  return (
    <>
      {/* Floating Card Bubble */}
      <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-grey-10 p-5 transform transition-all duration-300 translate-y-0 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-grey-10/40 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-30/10 text-primary-30 flex items-center justify-center">
              <Icon icon="ph:robot-bold" className="text-sm animate-pulse" />
            </div>
            <span className="text-xs font-bold text-secondary-10">Elon · Compliance Check</span>
          </div>
          <div className="flex items-center gap-1.5">
            {alerts.length > 1 && (
              <span className="text-[10px] text-secondary-30 font-semibold bg-grey-50 px-2 py-0.5 rounded-full">
                {currentIndex + 1} of {alerts.length}
              </span>
            )}
            <button
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
              className="text-secondary-30 hover:text-secondary-10"
            >
              <Icon icon="ph:x" className="text-base" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Icon icon="ph:warning-circle-fill" className="text-orange-500 text-lg shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-secondary-10 leading-tight">
                {currentAlert.title}
              </h4>
              <p className="text-[11px] text-secondary-20 line-clamp-2 mt-1 leading-normal">
                {actionRequired}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-grey-10/40 mt-3">
            <div className="flex gap-1.5">
              {alerts.length > 1 && (
                <>
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                    className="p-1 rounded bg-grey-50 hover:bg-grey-100 disabled:opacity-40"
                  >
                    <Icon icon="ph:caret-left-bold" className="text-xs" />
                  </button>
                  <button
                    disabled={currentIndex === alerts.length - 1}
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="p-1 rounded bg-grey-50 hover:bg-grey-100 disabled:opacity-40"
                  >
                    <Icon icon="ph:caret-right-bold" className="text-xs" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setVisible(false);
                  onDismiss();
                }}
                className="px-3 py-1.5 text-[11px] font-semibold text-secondary-20 hover:bg-grey-50 rounded-lg transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-3.5 py-1.5 text-[11px] font-bold bg-primary-30 text-white hover:bg-primary-30/90 rounded-lg shadow-sm transition-all"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md relative shadow-2xl border border-grey-10">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-secondary-30 hover:text-secondary-10"
            >
              <Icon icon="ph:x" className="text-lg" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm border border-orange-200">
                <Icon icon="ph:warning-bold" className="text-xl animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-secondary-10">{currentAlert.title}</h3>
                <p className="text-[10px] text-secondary-30">Tax Compliance Report</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-orange-50/50 border border-orange-100 text-xs text-orange-900 rounded-xl leading-relaxed whitespace-pre-line">
                {currentAlert.body}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-grey-10/40">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-grey-10 rounded-full hover:bg-grey-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
