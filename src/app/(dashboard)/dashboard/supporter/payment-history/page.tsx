'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { paymentsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Payment {
  _id: string;
  creditsPurchased: number;
  amountPaid: number;
  date: string;
  stripeSessionId: string;
}

export default function PaymentHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'supporter') {
      router.push('/login');
      return;
    }
    paymentsApi.history().then((res) => {
      setPayments(res.payments || []);
    }).catch(() => {
      toast.error('Failed to load payment history');
    }).finally(() => {
      setFetching(false);
    });
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Payment History</h1>
        <p className="text-gray-400 mt-1">View your credit purchase history</p>
      </div>

      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
        {payments.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500">
            <p className="text-lg">No payment history yet</p>
            <p className="text-sm mt-1">Purchase credits to see your transaction history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a35] text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Credits</th>
                  <th className="text-left px-5 py-3 font-medium">Amount Paid</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-[#2a2a35] last:border-0 hover:bg-[#1c1c24]">
                    <td className="px-5 py-3 text-emerald-400 font-medium">+{p.creditsPurchased}</td>
                    <td className="px-5 py-3 text-white">${((p.amountPaid || 0) / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-400">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs font-mono">{p.stripeSessionId?.slice(0, 16)}...</td>
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
