'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { creatorApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineCollection,
  HiOutlineBadgeCheck,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
}

interface Contribution {
  _id: string;
  campaignTitle: string;
  supporterName: string;
  supporterEmail: string;
  amount: number;
  date: string;
  status: string;
}

export default function CreatorDashboardHome() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<Contribution[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'creator') {
      router.push('/');
      return;
    }
    loadData();
  }, [user, loading, router]);

  async function loadData() {
    setFetching(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        creatorApi.stats(),
        creatorApi.pendingContributions(),
      ]);
      setStats(statsRes.stats);
      setPending(pendingRes.contributions || []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setFetching(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await creatorApi.approveContribution(id);
      toast.success('Contribution approved');
      loadData();
    } catch {
      toast.error('Failed to approve contribution');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    try {
      await creatorApi.rejectContribution(id);
      toast.success('Contribution rejected');
      loadData();
    } catch {
      toast.error('Failed to reject contribution');
    } finally {
      setActionLoading(null);
    }
  }

  const statCards = stats
    ? [
        { label: 'Total Campaigns', value: stats.totalCampaigns, icon: HiOutlineCollection, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
        { label: 'Active Campaigns', value: stats.activeCampaigns, icon: HiOutlineBadgeCheck, color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' },
        { label: 'Total Raised', value: `${stats.totalRaised} credits`, icon: HiOutlineCurrencyDollar, color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30' },
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
        <p className="text-gray-400 mt-1">Manage your campaigns and contributions</p>
      </div>

      {/* Stats cards */}
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

      {/* Pending contributions */}
      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a35]">
          <h2 className="text-lg font-semibold text-white">Pending Contributions</h2>
        </div>
        {pending.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">
            No pending contributions
          </div>
        ) : (
          <div className="responsive-table overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a35] text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Supporter</th>
                  <th className="text-left px-5 py-3 font-medium">Campaign</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((c) => (
                  <tr key={c._id} className="border-b border-[#2a2a35] last:border-0 hover:bg-[#1c1c24]">
                    <td data-label="Supporter" className="px-5 py-3 text-white">{c.supporterName}</td>
                    <td data-label="Campaign" className="px-5 py-3 text-gray-300">{c.campaignTitle}</td>
                    <td data-label="Amount" className="px-5 py-3 text-emerald-400 font-medium">{c.amount}</td>
                    <td data-label="Date" className="px-5 py-3 text-gray-400">
                      {new Date(c.date).toLocaleDateString()}
                    </td>
                    <td data-label="Actions" className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(c._id)}
                          disabled={actionLoading === c._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(c._id)}
                          disabled={actionLoading === c._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
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
