'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Campaign {
  _id: string;
  title: string;
  category: string;
  fundingGoal: number;
  minimumContribution: number;
  deadline: string;
  creatorEmail: string;
  creatorName: string;
  createdAt: string;
  status: string;
}

export default function CampaignApprovalsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.pendingCampaigns()
      .then((res) => setCampaigns(res.campaigns))
      .catch(() => toast.error('Failed to load pending campaigns'))
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    adminApi.pendingCampaigns()
      .then((res) => setCampaigns(res.campaigns))
      .catch(() => toast.error('Failed to load pending campaigns'))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveCampaign(id);
      toast.success('Campaign approved');
      refresh();
    } catch {
      toast.error('Failed to approve campaign');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminApi.rejectCampaign(id);
      toast.success('Campaign rejected');
      refresh();
    } catch {
      toast.error('Failed to reject campaign');
    }
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
      <h1 className="text-2xl font-bold text-white mb-1">Campaign Approvals</h1>
      <p className="text-gray-500 text-sm mb-6">Review and moderate pending campaigns</p>

      {campaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No pending campaigns to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg truncate">{campaign.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    by {campaign.creatorName} &middot; {campaign.creatorEmail}
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
                    <span className="text-gray-400">
                      Goal: <strong className="text-white">{campaign.fundingGoal.toLocaleString()} credits</strong>
                    </span>
                    <span className="text-gray-400">
                      Min: <strong className="text-white">{campaign.minimumContribution} credits</strong>
                    </span>
                    <span className="text-gray-400">
                      Category: <strong className="text-white">{campaign.category}</strong>
                    </span>
                    <span className="text-gray-400">
                      Deadline: <strong className="text-white">{new Date(campaign.deadline).toLocaleDateString()}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(campaign._id)}
                    className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(campaign._id)}
                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
