'use client';

import { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { dashboard, type WebNotification } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await dashboard.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch immediately when opening the dropdown
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.read_at) return; // Prevent duplicate calls

    try {
      await dashboard.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await dashboard.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleNotificationClick = async (e: React.MouseEvent, n: WebNotification) => {
    // If the click is on the mark-read checkmark button specifically, don't trigger this card click
    if ((e.target as HTMLElement).closest('.mark-read-btn')) {
      return;
    }

    e.preventDefault();

    // Mark as read first and wait for the API call to complete to prevent race condition / cancel
    if (!n.read_at) {
      await handleMarkAsRead(n.id);
    }

    if (n.action_url) {
      setIsOpen(false);
      router.push(n.action_url);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className='relative' ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className='w-9 h-9 flex items-center justify-center rounded-full border border-grey-10 hover:bg-primary-50 transition-colors shrink-0 relative'
      >
        <Icon icon='ph:bell' className='text-lg text-secondary-10' />
        {unreadCount > 0 && (
          <span className='absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white animate-pulse' />
        )}
      </button>

      {isOpen && (
        <div className='absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-grey-10 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col'>
          <div className='flex items-center justify-between px-4 py-3 border-b border-grey-10 bg-primary-50/10'>
            <span className='text-sm font-semibold text-secondary-10'>Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className='text-xs text-primary-30 hover:underline font-medium'
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className='flex border-b border-grey-10 text-xs font-semibold bg-grey-10/5'>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${activeTab === 'unread' ? 'border-primary-30 text-primary-30 bg-primary-50/10' : 'border-transparent text-secondary-30 hover:text-secondary-10'}`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${activeTab === 'all' ? 'border-primary-30 text-primary-30 bg-primary-50/10' : 'border-transparent text-secondary-30 hover:text-secondary-10'}`}
            >
              All ({notifications.length})
            </button>
          </div>

          <div className='max-h-72 overflow-y-auto divide-y divide-grey-10/40'>
            {(() => {
              const displayed = activeTab === 'unread' ? notifications.filter((n) => !n.read_at) : notifications;
              if (displayed.length === 0) {
                return (
                  <div className='p-8 text-center text-xs text-secondary-30'>
                    <Icon icon='ph:bell-slash' className='text-xl mx-auto mb-2 text-secondary-40' />
                    {activeTab === 'unread' ? 'No unread notifications.' : 'All caught up! No notifications.'}
                  </div>
                );
              }

              return displayed.map((n) => (
                <div 
                  key={n.id} 
                  onClick={(e) => handleNotificationClick(e, n)}
                  className={`p-4 flex gap-2.5 transition-all duration-200 cursor-pointer select-none transform hover:scale-[1.005] active:scale-[0.995] ${!n.read_at ? 'bg-primary-50/20 hover:bg-primary-50/40' : 'hover:bg-primary-50/10'}`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${!n.read_at ? 'bg-primary-30' : 'bg-transparent'}`} />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-2 mb-0.5'>
                      <p className={`text-xs truncate ${!n.read_at ? 'font-semibold text-secondary-10' : 'font-medium text-secondary-20'}`}>
                        {n.title}
                      </p>
                      <div className='flex items-center gap-1.5 shrink-0'>
                        <span className='text-[10px] text-secondary-30'>
                          {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        {!n.read_at && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(n.id);
                            }}
                            className='mark-read-btn p-1 rounded-full text-secondary-30 hover:text-success hover:bg-success/10 transition-colors shrink-0'
                            title='Mark as read'
                          >
                            <Icon icon='ph:check-bold' className='text-xs' />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className='text-xs text-secondary-30 leading-normal line-clamp-2'>{n.body}</p>
                    {n.action_url && (
                      <span 
                        className='text-[10px] text-primary-30 font-semibold hover:underline flex items-center gap-0.5 mt-1 cursor-pointer'
                      >
                        Resolve <Icon icon='ph:arrow-right-bold' />
                      </span>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
