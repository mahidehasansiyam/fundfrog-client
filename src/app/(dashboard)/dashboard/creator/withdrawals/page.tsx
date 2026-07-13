'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { withdrawalsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiOutlineInformationCircle } from 'react-icons/hi';

interface Withdrawal {
  _id: string;
  withdrawalCredit: number;
  withdrawalAmount: number;
  paymentSystem: string;
  accountNumber: string;
  date: string;
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function WithdrawalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [credits, setCredits] = useState('');
  const [paymentSystem, setPaymentSystem] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'creator') {
      router.push('/');
      return;
    }
    withdrawalsApi.history().then((res) => {
      setHistory(res.withdrawals || []);
    }).catch(() => {
      toast.error('Failed to load withdrawal history');
    }).finally(() => {
      setFetching(false);
    });
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!credits || !paymentSystem || !accountNumber) {
      toast.error('All fields are required');
      return;
    }
    const numCredits = Number(credits);
    if (numCredits < 200) {
      toast.error('Minimum withdrawal is 200 credits');
      return;
    }
    if (user && numCredits > user.credits) {
      toast.error('Insufficient credits');
      return;
    }
    setSubmitting(true);
    try {
      await withdrawalsApi.create({ credits: numCredits, paymentSystem, accountNumber });
      toast.success('Withdrawal request submitted');
      setCredits('');
      setPaymentSystem('');
      setAccountNumber('');
      const res = await withdrawalsApi.history();
      setHistory(res.withdrawals || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit withdrawal';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const dollarAmount = credits ? `$${(Number(credits) / 20).toFixed(2)}` : '$0.00';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'creator') {
    router.push('/');
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
        <p className="text-gray-400 mt-1">Request a withdrawal or view your history</p>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <HiOutlineInformationCircle size={20} className="text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm text-gray-300">
          <p className="font-medium text-amber-400">Withdrawal Rules</p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-gray-400">
            <li>Minimum withdrawal: <strong className="text-white">200 credits</strong> ($10)</li>
            <li>Withdrawal rate: <strong className="text-white">20 credits = $1</strong></li>
            <li>Withdrawals are processed manually by admins</li>
            <li>Your balance: <strong className="text-white">{user.credits} credits</strong></li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[#2a2a35] bg-[#16161e] p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Request Withdrawal</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Credits to Withdraw</label>
              <input
                type="number"
                placeholder="200 minimum"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">You will receive</label>
              <input
                type="text"
                value={dollarAmount}
                disabled
                className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Payment System</label>
              <select
                value={paymentSystem}
                onChange={(e) => setPaymentSystem(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              >
                <option value="">Select</option>
                <option value="bkash">BKash</option>
                <option value="nagad">Nagad</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Account Number</label>
              <input
                type="text"
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a35]">
          <h2 className="text-lg font-semibold text-white">Withdrawal History</h2>
        </div>
        {fetching ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">
            No withdrawal history yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a35] text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Credits</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">System</th>
                  <th className="text-left px-5 py-3 font-medium">Account</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((w) => (
                  <tr key={w._id} className="border-b border-[#2a2a35] last:border-0 hover:bg-[#1c1c24]">
                    <td className="px-5 py-3 text-white">{w.withdrawalCredit}</td>
                    <td className="px-5 py-3 text-gray-300">${w.withdrawalAmount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-400 capitalize">{w.paymentSystem}</td>
                    <td className="px-5 py-3 text-gray-400">{w.accountNumber}</td>
                    <td className="px-5 py-3 text-gray-400">{new Date(w.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[w.status] || ''}`}>
                        {w.status}
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
