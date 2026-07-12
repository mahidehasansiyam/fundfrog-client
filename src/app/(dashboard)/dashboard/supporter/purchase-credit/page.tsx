'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const creditPackages = [
  { credits: 100, price: 10, popular: false },
  { credits: 300, price: 25, popular: true },
  { credits: 800, price: 60, popular: false },
  { credits: 1500, price: 110, popular: false },
];

export default function PurchaseCreditPage() {
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
        <h1 className="text-2xl font-bold text-white">Purchase Credits</h1>
        <p className="text-gray-400 mt-1">Buy credit packages to support campaigns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {creditPackages.map((pkg) => (
          <div
            key={pkg.credits}
            className={`rounded-xl border p-5 bg-[#16161e] relative transition-all hover:border-emerald-500/50 ${
              pkg.popular ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-[#2a2a35]'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Best Value
              </span>
            )}
            <div className="text-center space-y-3 pt-2">
              <p className="text-3xl font-bold text-white">{pkg.credits}</p>
              <p className="text-sm text-gray-400">Credits</p>
              <div className="h-px bg-[#2a2a35]" />
              <p className="text-2xl font-bold text-emerald-400">${pkg.price}</p>
              <p className="text-xs text-gray-500">
                ${(pkg.price / pkg.credits).toFixed(2)} per credit
              </p>
              <button
                disabled
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#1c1c24] text-gray-500 border border-[#2a2a35] cursor-not-allowed"
                title="Coming soon"
              >
                Coming Soon
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] p-5">
        <p className="text-sm text-gray-400">
          💳 Credit card payments powered by Stripe. Your credits are available immediately after purchase.
          Minimum purchase: 100 credits ($10).
        </p>
      </div>
    </div>
  );
}
