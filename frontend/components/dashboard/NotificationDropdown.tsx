'use client';

import { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { dashboard, type WebNotification } from '@/lib/api';
import Link from 'next/link';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
      const unread = notifications.filter((n) => !n.read_at);
      await Promise.all(unread.map((n) => dashboard.markNotificationRead(n.id)));
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
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
          <div className='max-h-72 overflow-y-auto divide-y divide-grey-10/40'>
            {notifications.length === 0 ? (
              <div className='p-8 text-center text-xs text-secondary-30'>
                <Icon icon='ph:bell-slash' className='text-xl mx-auto mb-2 text-secondary-40' />
                All caught up! No notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`p-4 flex gap-2.5 transition-colors cursor-pointer select-none ${!n.read_at ? 'bg-primary-50/20 hover:bg-primary-50/40' : 'hover:bg-primary-50/10'}`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${!n.read_at ? 'bg-primary-30' : 'bg-transparent'}`} />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-2 mb-0.5'>
                      <p className={`text-xs truncate ${!n.read_at ? 'font-semibold text-secondary-10' : 'font-medium text-secondary-20'}`}>
                        {n.title}
                      </p>
                      <span className='text-[10px] text-secondary-30 shrink-0'>
                        {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className='text-xs text-secondary-30 leading-normal line-clamp-2'>{n.body}</p>
                    {n.action_url && (
                      <Link 
                        href={n.action_url}
                        className='text-[10px] text-primary-30 font-semibold hover:underline flex items-center gap-0.5 mt-1'
                      >
                        Resolve <Icon icon='ph:arrow-right-bold' />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
