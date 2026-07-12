'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PaymentHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'supporter') {
      router.push('/login');
      return;
    }
  }, [user, loading, router]);

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
        <h1 className="text-2xl font-bold text-white">Payment History</h1>
        <p className="text-gray-400 mt-1">View your credit purchase history</p>
      </div>

      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
        <div className="px-5 py-12 text-center text-gray-500">
          <p className="text-lg">Payment history will appear here</p>
          <p className="text-sm mt-1">Connect a payment method to see your transaction history</p>
        </div>
      </div>
    </div>
  );
}
