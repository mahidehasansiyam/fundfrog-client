'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import {
  HiOutlineUsers,
  HiOutlineLightBulb,
  HiOutlineCreditCard,
  HiOutlineCash,
} from 'react-icons/hi';

interface AdminStats {
  totalSupporters: number;
  totalCreators: number;
  totalCredits: number;
  totalPayments: number;
}

const statCards = [
  { key: 'totalSupporters' as const, label: 'Supporters', icon: HiOutlineUsers, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { key: 'totalCreators' as const, label: 'Creators', icon: HiOutlineLightBulb, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { key: 'totalCredits' as const, label: 'Total Credits', icon: HiOutlineCreditCard, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'totalPayments' as const, label: 'Payments', icon: HiOutlineCash, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats()
      .then((res) => setStats(res.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Platform overview and moderation tools</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats ? stats[card.key] : 0;
          return (
            <div
              key={card.key}
              className={`rounded-xl border p-5 ${card.color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium opacity-80">{card.label}</span>
                <Icon size={22} />
              </div>
              <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
