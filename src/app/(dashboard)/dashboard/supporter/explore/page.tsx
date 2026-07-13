'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { campaignsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
}

const categoryColors: Record<string, string> = {
  Technology: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Education: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Health & Wellness': 'bg-green-500/10 text-green-400 border-green-500/30',
  Community: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Arts & Culture': 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  Environment: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Social Impact': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  Other: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export default function ExplorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  function loadCampaigns() {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (category) params.category = category;
    campaignsApi.list(params).then((res) => {
      setCampaigns(res.campaigns || []);
    }).catch(() => {
      toast.error('Failed to load campaigns');
    }).finally(() => {
      setFetching(false);
    });
  }

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'supporter') {
      router.push('/login');
      return;
    }
    loadCampaigns();
  }, [user, loading, router, search, category]);

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
        <h1 className="text-2xl font-bold text-white">Explore Campaigns</h1>
        <p className="text-gray-400 mt-1">Discover and support campaigns that inspire you</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg bg-[#16161e] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-[#16161e] border border-[#2a2a35] text-gray-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="">All Categories</option>
          <option value="Technology">Technology</option>
          <option value="Arts & Culture">Arts & Culture</option>
          <option value="Community">Community</option>
          <option value="Education">Education</option>
          <option value="Environment">Environment</option>
          <option value="Health & Wellness">Health & Wellness</option>
          <option value="Social Impact">Social Impact</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No campaigns found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((campaign) => {
            const progress = Math.min(
              Math.round((campaign.amountRaised / campaign.fundingGoal) * 100),
              100,
            );
            const catColor = categoryColors[campaign.category] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
            const isExpired = new Date(campaign.deadline) < new Date();

            return (
              <div
                key={campaign._id}
                className="rounded-xl border border-[#2a2a35] bg-[#16161e] overflow-hidden hover:border-emerald-500/30 transition-colors group"
              >
                <div className="h-40 bg-gradient-to-br from-[#1c1c24] to-[#16161e] flex items-center justify-center overflow-hidden">
                  {campaign.imageURL ? (
                    <img
                      src={campaign.imageURL}
                      alt={campaign.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-5xl opacity-20">📦</span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${catColor}`}>
                      {campaign.category}
                    </span>
                    {isExpired && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                        Expired
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{campaign.story}</p>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{progress}% funded</span>
                      <span className="text-emerald-400 font-medium">{campaign.amountRaised} / {campaign.fundingGoal}</span>
                    </div>
                    <div className="w-full h-2 bg-[#0f0f13] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-500">by {campaign.creatorName}</span>
                    <Link
                      href={`/campaigns/${campaign._id}`}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
