'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import { HiOutlineBell, HiOutlineCheck } from 'react-icons/hi';

interface Notification {
  _id: string;
  message: string;
  toEmail: string;
  fromEmail: string;
  actionRoute: string;
  read: boolean;
  createdAt: string;
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const diff = now.getTime() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await notificationsApi.list();
        if (!cancelled) setNotifications(data.notifications || []);
      } catch {
        // silently fail
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleBellClick = () => {
    setOpen((prev) => !prev);
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await notificationsApi.markRead(n._id);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)),
        );
      } catch {
        // silently fail
      }
    }
    setOpen(false);
    router.push(n.actionRoute);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((n) => notificationsApi.markRead(n._id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  };

  const getNotificationColor = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('approved')) return 'bg-emerald-500';
    if (lower.includes('rejected')) return 'bg-red-500';
    if (lower.includes('contributed')) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c1c24] transition-colors"
        aria-label="Notifications"
      >
        <HiOutlineBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] min-h-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[420px] bg-[#16161e] border border-[#2a2a35] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a35]">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <HiOutlineCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[360px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <HiOutlineBell size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#1c1c24] transition-colors border-b border-[#2a2a35]/50 last:border-b-0"
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      n.read ? 'bg-transparent' : getNotificationColor(n.message)
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        n.read ? 'text-gray-400' : 'text-gray-200'
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
