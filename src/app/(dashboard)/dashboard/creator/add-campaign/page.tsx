'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { campaignsApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

const categories = [
  'Technology',
  'Arts & Culture',
  'Community',
  'Education',
  'Environment',
  'Health & Wellness',
  'Social Impact',
  'Other',
];

function AddCampaignForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [submitting, setSubmitting] = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(!!editId);
  const [form, setForm] = useState({
    title: '',
    story: '',
    category: '',
    fundingGoal: '',
    minimumContribution: '',
    deadline: '',
    rewardInfo: '',
    imageURL: '',
  });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'creator') {
      router.push('/');
      return;
    }
    if (editId) {
      campaignsApi.get(editId)
        .then((res) => {
          const c = res.campaign;
          setForm({
            title: c.title || '',
            story: c.story || '',
            category: c.category || '',
            fundingGoal: String(c.fundingGoal || ''),
            minimumContribution: String(c.minimumContribution || ''),
            deadline: c.deadline ? c.deadline.slice(0, 10) : '',
            rewardInfo: c.rewardInfo || '',
            imageURL: c.imageURL || '',
          });
        })
        .catch(() => toast.error('Failed to load campaign'))
        .finally(() => setLoadingCampaign(false));
    }
  }, [user, loading, router, editId]);

  if (loading || loadingCampaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'creator') {
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.story || !form.category || !form.fundingGoal || !form.minimumContribution || !form.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && editId) {
        await campaignsApi.update(editId, {
          title: form.title,
          story: form.story,
          rewardInfo: form.rewardInfo,
        });
        toast.success('Campaign updated');
      } else {
        await campaignsApi.create({
          title: form.title,
          story: form.story,
          category: form.category,
          fundingGoal: Number(form.fundingGoal),
          minimumContribution: Number(form.minimumContribution),
          deadline: form.deadline,
          rewardInfo: form.rewardInfo,
          imageURL: form.imageURL,
        });
        toast.success('Campaign created! Pending admin approval.');
      }
      router.push('/dashboard/creator/my-campaigns');
    } catch {
      toast.error(isEditing ? 'Failed to update campaign' : 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">{isEditing ? 'Edit Campaign' : 'Add Campaign'}</h1>
        <p className="text-gray-400 mt-1">
          {isEditing ? 'Update your campaign details' : 'Create a new crowdfunding campaign'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Campaign Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Give your campaign a compelling title"
            className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Story <span className="text-red-400">*</span>
          </label>
          <textarea
            name="story"
            value={form.story}
            onChange={handleChange}
            rows={5}
            placeholder="Tell your story — why does this campaign matter?"
            className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
          />
        </div>

        {!isEditing && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Funding Goal (credits) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="fundingGoal"
                  value={form.fundingGoal}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 1000"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Minimum Contribution <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="minimumContribution"
                  value={form.minimumContribution}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 10"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Deadline <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Image URL (optional)
              </label>
              <input
                type="url"
                name="imageURL"
                value={form.imageURL}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Reward Info (optional)
          </label>
          <textarea
            name="rewardInfo"
            value={form.rewardInfo}
            onChange={handleChange}
            rows={3}
            placeholder="What will supporters receive?"
            className="w-full px-4 py-2.5 rounded-lg bg-[#1c1c24] border border-[#2a2a35] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Campaign' : 'Create Campaign'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/creator/my-campaigns')}
            className="px-6 py-2.5 rounded-lg border border-[#2a2a35] text-gray-300 font-medium text-sm hover:bg-[#1c1c24] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddCampaignPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    }>
      <AddCampaignForm />
    </Suspense>
  );
}
