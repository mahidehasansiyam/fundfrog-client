'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { campaignsApi, supporterApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineArrowLeft,
  HiOutlineInformationCircle,
} from 'react-icons/hi';

interface Campaign {
  _id: string;
  title: string;
  story: string;
  category: string;
  fundingGoal: number;
  amountRaised: number;
  minimumContribution: number;
  deadline: string;
  imageURL: string;
  creatorName: string;
  creatorEmail: string;
  rewardInfo: string;
  status: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [fetching, setFetching] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    campaignsApi.get(params.id as string).then((res) => {
      setCampaign(res.campaign);
    }).catch(() => {
      toast.error('Campaign not found');
      router.push('/');
    }).finally(() => {
      setFetching(false);
    });
  }, [params.id, router]);

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to contribute');
      router.push('/login');
      return;
    }
    if (user.role !== 'supporter') {
      toast.error('Only supporters can contribute');
      return;
    }
    if (!campaign) return;

    const contributionAmount = Number(amount);
    if (!contributionAmount || contributionAmount < campaign.minimumContribution) {
      toast.error(`Minimum contribution is ${campaign.minimumContribution} credits`);
      return;
    }

    setSubmitting(true);
    try {
      await supporterApi.createContribution(campaign._id, contributionAmount);
      toast.success('Contribution submitted! Awaiting creator approval.');
      setAmount('');
      refreshUser();
      campaignsApi.get(params.id as string).then((res) => {
        setCampaign(res.campaign);
      }).catch(() => {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit contribution';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!campaign) return null;

  const progress = Math.min(Math.round((campaign.amountRaised / campaign.fundingGoal) * 100), 100);
  const isExpired = new Date(campaign.deadline) < new Date();

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
        <Link
          href="/dashboard/supporter/explore"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <HiOutlineArrowLeft size={18} />
          Back to campaigns
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden">
              <div className="h-56 bg-gradient-to-br from-[#1c1c24] to-[#16161e] flex items-center justify-center">
                {campaign.imageURL ? (
                  <img src={campaign.imageURL} alt={campaign.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl opacity-20">🚀</span>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {campaign.category}
                  </span>
                  {isExpired && (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                      Expired
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white">{campaign.title}</h1>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{campaign.story}</p>
                {campaign.rewardInfo && (
                  <div className="rounded-lg bg-[#1c1c24] border border-[#2a2a35] p-4">
                    <div className="flex items-start gap-3">
                      <HiOutlineInformationCircle size={20} className="text-emerald-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">Reward Info</p>
                        <p className="text-sm text-gray-400 mt-1">{campaign.rewardInfo}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] p-5 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-emerald-400 font-medium">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#0f0f13] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Raised</span>
                <span className="text-lg font-bold text-white">{campaign.amountRaised} / {campaign.fundingGoal}</span>
              </div>

              <div className="h-px bg-[#2a2a35]" />

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <HiOutlineUser size={16} />
                  <span>by {campaign.creatorName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <HiOutlineCalendar size={16} />
                  <span>Deadline: {new Date(campaign.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <HiOutlineTag size={16} />
                  <span>Min: {campaign.minimumContribution} credits</span>
                </div>
              </div>
            </div>

            {!isExpired && campaign.status === 'approved' && (
              <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] p-5">
                <h3 className="font-semibold text-white mb-4">Contribute</h3>
                <form onSubmit={handleContribute} className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Amount (credits)</label>
                    <div className="relative">
                      <HiOutlineCurrencyDollar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={campaign.minimumContribution}
                        placeholder={`Min ${campaign.minimumContribution}`}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0f0f13] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Submitting...' : `Contribute ${amount ? `${amount} Credits` : ''}`}
                  </button>
                  {!user && (
                    <p className="text-xs text-gray-500 text-center">
                      Please <Link href="/login" className="text-emerald-400 hover:underline">login</Link> to contribute
                    </p>
                  )}
                </form>
              </div>
            )}

            {(isExpired || campaign.status !== 'approved') && (
              <div className="rounded-xl border border-[#2a2a35] bg-[#16161e] p-5">
                <p className="text-sm text-gray-400 text-center">
                  {isExpired ? 'This campaign has ended' : 'Campaign is not currently accepting contributions'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
