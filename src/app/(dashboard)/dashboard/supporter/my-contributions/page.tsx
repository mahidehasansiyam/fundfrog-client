'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supporterApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Contribution {
  _id: string;
  campaignTitle: string;
  campaignId: string;
  amount: number;
  date: string;
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function MyContributionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'supporter') {
      router.push('/login');
      return;
    }
    supporterApi.myContributions(page, limit).then((res) => {
      setContributions(res.contributions || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    }).catch(() => {
      toast.error('Failed to load contributions');
    }).finally(() => {
      setFetching(false);
    });
  }, [user, loading, page, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">My Contributions</h1>
        <p className="text-gray-400 mt-1">Track all your campaign contributions</p>
      </div>

      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
        {fetching ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
          </div>
        ) : contributions.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">
            No contributions yet. Start by exploring campaigns!
          </div>
        ) : (
          <>
            <div className="responsive-table overflow-x-auto">
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
                  {contributions.map((c) => (
                    <tr key={c._id} className="border-b border-[#2a2a35] last:border-0 hover:bg-[#1c1c24]">
                      <td data-label="Campaign" className="px-5 py-3 text-white">{c.campaignTitle}</td>
                      <td data-label="Amount" className="px-5 py-3 text-emerald-400 font-medium">{c.amount}</td>
                      <td data-label="Date" className="px-5 py-3 text-gray-400">
                        {new Date(c.date).toLocaleDateString()}
                      </td>
                      <td data-label="Status" className="px-5 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[c.status] || ''}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a2a35]">
              <span className="text-sm text-gray-400">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1c1c24] text-gray-400 border border-[#2a2a35] hover:text-white disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1c1c24] text-gray-400 border border-[#2a2a35] hover:text-white disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
