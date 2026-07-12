'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { campaignsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

interface Campaign {
  _id: string;
  title: string;
  category: string;
  fundingGoal: number;
  amountRaised: number;
  status: string;
  deadline: string;
  createdAt: string;
}

export default function MyCampaignsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'creator') {
      router.push('/');
      return;
    }
    campaignsApi.list({ creatorEmail: user.email })
      .then((res) => setCampaigns((res.campaigns || []) as Campaign[]))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setFetching(false));
  }, [user, loading, router]);

  async function reloadCampaigns() {
    setFetching(true);
    try {
      const res = await campaignsApi.list({ creatorEmail: user!.email });
      setCampaigns((res.campaigns || []) as Campaign[]);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this campaign? Approved supporters will be refunded.')) return;
    try {
      await campaignsApi.remove(id);
      toast.success('Campaign deleted');
      reloadCampaigns();
    } catch {
      toast.error('Failed to delete campaign');
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Campaigns</h1>
          <p className="text-gray-400 mt-1">Manage your campaigns</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/creator/add-campaign')}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] p-8 text-center">
          <p className="text-gray-400">No campaigns yet</p>
          <button
            onClick={() => router.push('/dashboard/creator/add-campaign')}
            className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            Create your first campaign
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a35] text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Title</th>
                  <th className="text-left px-5 py-3 font-medium">Category</th>
                  <th className="text-left px-5 py-3 font-medium">Goal</th>
                  <th className="text-left px-5 py-3 font-medium">Raised</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Deadline</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id} className="border-b border-[#2a2a35] last:border-0 hover:bg-[#1c1c24]">
                    <td className="px-5 py-3 text-white font-medium">{c.title}</td>
                    <td className="px-5 py-3 text-gray-400">{c.category}</td>
                    <td className="px-5 py-3 text-gray-300">{c.fundingGoal}</td>
                    <td className="px-5 py-3 text-emerald-400">{c.amountRaised}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(c.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/creator/add-campaign?edit=${c._id}`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-[#2a2a35] transition-colors"
                          title="Edit"
                        >
                          <HiOutlinePencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#2a2a35] transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
