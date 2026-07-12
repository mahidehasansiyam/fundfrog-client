'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { HiOutlineInformationCircle } from 'react-icons/hi';

const withdrawalHistory = [
  { id: '1', credits: 500, amount: '$25.00', system: 'BKash', account: '****1234', date: '2025-06-15', status: 'approved' },
  { id: '2', credits: 200, amount: '$10.00', system: 'Nagad', account: '****5678', date: '2025-06-01', status: 'pending' },
];

export default function WithdrawalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

      {/* Info card */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <HiOutlineInformationCircle size={20} className="text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm text-gray-300">
          <p className="font-medium text-amber-400">Withdrawal Rules</p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-gray-400">
            <li>Minimum withdrawal: <strong className="text-white">200 credits</strong> ($10)</li>
            <li>Withdrawal rate: <strong className="text-white">20 credits = $1</strong></li>
            <li>Withdrawals are processed manually by admins</li>
          </ul>
        </div>
      </div>

      {/* Withdrawal form — mock for now, wired in step 07 */}
      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Request Withdrawal</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Credits to Withdraw</label>
              <input
                type="number"
                placeholder="200 minimum"
                className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">You will receive</label>
              <input
                type="text"
                placeholder="$0.00"
                disabled
                className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Payment System</label>
              <select className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white focus:outline-none focus:border-emerald-500/50 transition-colors">
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
                className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>
          <button
            disabled
            className="px-6 py-2.5 rounded-lg bg-emerald-500/50 text-white font-medium text-sm cursor-not-allowed"
            title="Coming in a future update"
          >
            Submit Request
          </button>
          <p className="text-xs text-gray-500">Withdrawal requests are not yet wired — coming in a future update.</p>
        </div>
      </div>

      {/* History table */}
      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a35]">
          <h2 className="text-lg font-semibold text-white">Withdrawal History</h2>
        </div>
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
              {withdrawalHistory.map((w) => (
                <tr key={w.id} className="border-b border-[#2a2a35] last:border-0 hover:bg-[#1c1c24]">
                  <td className="px-5 py-3 text-white">{w.credits}</td>
                  <td className="px-5 py-3 text-gray-300">{w.amount}</td>
                  <td className="px-5 py-3 text-gray-400">{w.system}</td>
                  <td className="px-5 py-3 text-gray-400">{w.account}</td>
                  <td className="px-5 py-3 text-gray-400">{w.date}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      w.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
