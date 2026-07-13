'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Withdrawal {
  _id: string;
  creatorEmail: string;
  creatorName: string;
  withdrawalCredit: number;
  withdrawalAmount: number;
  paymentSystem: string;
  accountNumber: string;
  date: string;
  status: string;
}

export default function WithdrawalRequestsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.pendingWithdrawals()
      .then((res) => setWithdrawals(res.withdrawals))
      .catch(() => toast.error('Failed to load withdrawal requests'))
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    adminApi.pendingWithdrawals()
      .then((res) => setWithdrawals(res.withdrawals))
      .catch(() => toast.error('Failed to load withdrawal requests'))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveWithdrawal(id);
      toast.success('Withdrawal approved');
      refresh();
    } catch {
      toast.error('Failed to approve withdrawal');
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
      <h1 className="text-2xl font-bold text-white mb-1">Withdrawal Requests</h1>
      <p className="text-gray-500 text-sm mb-6">Approve pending withdrawal requests from creators</p>

      {withdrawals.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No pending withdrawal requests</p>
        </div>
      ) : (
        <div className="responsive-table overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Creator</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Credits</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Payment</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Account</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w._id} className="border-b border-[#1a1a28] hover:bg-[#0f0f18]">
                  <td data-label="Creator" className="py-3 px-4">
                    <p className="text-white">{w.creatorName}</p>
                    <p className="text-gray-500 text-xs">{w.creatorEmail}</p>
                  </td>
                  <td data-label="Credits" className="py-3 px-4 text-white">{w.withdrawalCredit.toLocaleString()}</td>
                  <td data-label="Amount" className="py-3 px-4 text-emerald-400">${w.withdrawalAmount.toFixed(2)}</td>
                  <td data-label="Payment" className="py-3 px-4 text-gray-300 capitalize">{w.paymentSystem}</td>
                  <td data-label="Account" className="py-3 px-4 text-gray-300 font-mono text-xs">{w.accountNumber}</td>
                  <td data-label="Date" className="py-3 px-4 text-gray-500">{new Date(w.date).toLocaleDateString()}</td>
                  <td data-label="Action" className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleApprove(w._id)}
                      className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
