'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import {
  HiOutlineChartBar,
  HiOutlineGlobe,
  HiOutlineHeart,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
} from 'react-icons/hi';
import { Toaster } from 'react-hot-toast';

const navItems = [
  { href: '/dashboard/supporter', label: 'Dashboard', icon: HiOutlineChartBar },
  { href: '/dashboard/supporter/explore', label: 'Explore', icon: HiOutlineGlobe },
  { href: '/dashboard/supporter/my-contributions', label: 'My Contributions', icon: HiOutlineHeart },
  { href: '/dashboard/supporter/purchase-credit', label: 'Purchase Credit', icon: HiOutlineCreditCard },
  { href: '/dashboard/supporter/payment-history', label: 'Payment History', icon: HiOutlineClock },
];

export default function SupporterDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f0f13] flex">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1c1c24', color: '#f0f0f5', border: '1px solid #2a2a35' },
        }}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#16161e] border-r border-[#2a2a35]
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 h-16 border-b border-[#2a2a35]">
            <Link href="/dashboard/supporter" className="flex items-center gap-2">
              <span className="text-emerald-400 text-xl">🐸</span>
              <span className="font-bold text-lg text-white">FundFrog</span>
            </Link>
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineX size={24} />
            </button>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-[#1c1c24]'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#2a2a35]">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.credits ?? 0} credits</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <HiOutlineLogout size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#16161e] border-b border-[#2a2a35] flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <HiOutlineMenu size={24} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm text-gray-400 hidden sm:block">
              {user?.email}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold lg:hidden">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
