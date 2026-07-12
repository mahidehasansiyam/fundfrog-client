'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Report {
  _id: string;
  reporterEmail: string;
  campaignTitle: string;
  campaignId: string;
  reason: string;
  date: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.reports()
      .then((res) => setReports(res.reports))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const handleSuspend = async (campaignId: string) => {
    if (!confirm('Suspend this campaign? It will no longer be visible to supporters.')) return;
    try {
      await adminApi.suspendCampaign(campaignId);
      toast.success('Campaign suspended');
    } catch {
      toast.error('Failed to suspend campaign');
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
      <h1 className="text-2xl font-bold text-white mb-1">Reports</h1>
      <p className="text-gray-500 text-sm mb-6">Review reported campaigns and take action</p>

      {reports.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No reports submitted</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{report.campaignTitle}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    Reported by <span className="text-gray-300">{report.reporterEmail}</span>
                  </p>
                  <div className="mt-3 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg p-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Reason</p>
                    <p className="text-gray-300 text-sm">{report.reason}</p>
                  </div>
                  <p className="text-gray-600 text-xs mt-2">
                    {new Date(report.date).toLocaleDateString()} &middot;{' '}
                    {new Date(report.date).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => handleSuspend(report.campaignId)}
                  className="px-4 py-2 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-sm font-medium hover:bg-violet-500/20 transition-colors shrink-0"
                >
                  Suspend Campaign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
