'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supporterApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineHeart,
  HiOutlineClock,
  HiOutlineBadgeCheck,
} from 'react-icons/hi';

interface Stats {
  totalContributions: number;
  pendingCount: number;
  approvedAmount: number;
}

interface Contribution {
  _id: string;
  campaignTitle: string;
  campaignId: string;
  amount: number;
  date: string;
  status: string;
}

export default function SupporterDashboardHome() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [approved, setApproved] = useState<Contribution[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'supporter') {
      router.push('/');
      return;
    }
    supporterApi.stats().then((statsRes) => {
      setStats(statsRes.stats);
    }).catch(() => {
      toast.error('Failed to load dashboard data');
    }).finally(() => {
      setFetching(false);
    });
    supporterApi.approvedContributions().then((approvedRes) => {
      setApproved(approvedRes.contributions || []);
    }).catch(() => {});
  }, [user, loading, router]);

  const statCards = stats
    ? [
        { label: 'Total Contributions', value: stats.totalContributions, icon: HiOutlineHeart, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
        { label: 'Pending', value: stats.pendingCount, icon: HiOutlineClock, color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30' },
        { label: 'Approved Credits', value: `${stats.approvedAmount} credits`, icon: HiOutlineBadgeCheck, color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' },
      ]
    : [];

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Supporter Dashboard</h1>
        <p className="text-gray-400 mt-1">Track your contributions and explore campaigns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border bg-gradient-to-br ${card.color} p-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <Icon size={28} className="text-gray-500" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a35]">
          <h2 className="text-lg font-semibold text-white">Approved Contributions</h2>
        </div>
        {approved.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">
            No approved contributions yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a35] text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Campaign</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((c) => (
                  <tr key={c._id} className="border-b border-[#2a2a35] last:border-0 hover:bg-[#1c1c24]">
                    <td className="px-5 py-3 text-white">{c.campaignTitle}</td>
                    <td className="px-5 py-3 text-emerald-400 font-medium">{c.amount}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(c.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
