'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

const payments = [
  { id: '1', type: 'Credit Purchase', amount: 300, paid: '$25.00', date: '2025-06-10', method: 'Stripe' },
  { id: '2', type: 'Withdrawal', amount: -200, paid: '$10.00', date: '2025-06-01', method: 'BKash' },
  { id: '3', type: 'Registration Bonus', amount: 20, paid: 'Free', date: '2025-05-20', method: '-' },
];

export default function PaymentHistoryPage() {
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
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payment History</h1>
        <p className="text-gray-400 mt-1">Track your earnings and purchases</p>
      </div>

      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a35] text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Credits</th>
                <th className="text-left px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Method</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[#2a2a35] last:border-0 hover:bg-[#1c1c24]">
                  <td className="px-5 py-3 text-white">{p.type}</td>
                  <td className={`px-5 py-3 font-medium ${p.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.amount > 0 ? '+' : ''}{p.amount}
                  </td>
                  <td className="px-5 py-3 text-gray-300">{p.paid}</td>
                  <td className="px-5 py-3 text-gray-400">{p.method}</td>
                  <td className="px-5 py-3 text-gray-400">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-[#2a2a35]">
          <p className="text-xs text-gray-500">Payment history is currently showing sample data — will be wired in a future update.</p>
        </div>
      </div>
    </div>
  );
}
