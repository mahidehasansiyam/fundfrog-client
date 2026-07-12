'use client';

import { useEffect, useState } from 'react';
import { campaignsApi, adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Campaign {
  _id: string;
  title: string;
  category: string;
  creatorEmail: string;
  creatorName: string;
  amountRaised: number;
  fundingGoal: number;
  status: string;
  createdAt: string;
}

export default function ManageCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    campaignsApi.list(params)
      .then((res) => setCampaigns(res.campaigns))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign? Approved supporters will be refunded.')) return;
    try {
      await adminApi.deleteCampaign(id);
      toast.success('Campaign deleted');
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await campaignsApi.list(params);
      setCampaigns(res.campaigns);
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
      suspended: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Manage Campaigns</h1>
          <p className="text-gray-500 text-sm">View and remove any campaign</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#12121a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3a]">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Campaign</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Creator</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Raised</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Created</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c._id} className="border-b border-[#1a1a28] hover:bg-[#0f0f18]">
                <td className="py-3 px-4">
                  <span className="text-white">{c.title}</span>
                  <span className="text-gray-600 text-xs ml-2">{c.category}</span>
                </td>
                <td className="py-3 px-4 text-gray-400">{c.creatorName || c.creatorEmail}</td>
                <td className="py-3 px-4 text-white">
                  {c.amountRaised.toLocaleString()} / {c.fundingGoal.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${statusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
