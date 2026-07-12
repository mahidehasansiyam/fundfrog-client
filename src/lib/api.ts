async function request(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(endpoint, { ...options, headers, credentials: 'include' });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

const api = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body: unknown) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: unknown) =>
    request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};

export const campaignsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/api/campaigns${qs}`);
  },
  get: (id: string) => api.get(`/api/campaigns/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/campaigns', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/campaigns/${id}`, data),
  remove: (id: string) => api.delete(`/api/campaigns/${id}`),
};

export const creatorApi = {
  stats: () => api.get('/api/creator/stats'),
  pendingContributions: () => api.get('/api/creator/pending-contributions'),
  approveContribution: (id: string) => api.patch(`/api/contributions/${id}/approve`, {}),
  rejectContribution: (id: string) => api.patch(`/api/contributions/${id}/reject`, {}),
};

export const supporterApi = {
  stats: () => api.get('/api/supporter/stats'),
  approvedContributions: () => api.get('/api/supporter/approved-contributions'),
  createContribution: (campaignId: string, amount: number) =>
    api.post('/api/contributions', { campaignId, amount }),
  myContributions: (page = 1, limit = 10) =>
    api.get(`/api/contributions?page=${page}&limit=${limit}`),
};

export const adminApi = {
  stats: () => api.get('/api/admin/stats'),
  pendingCampaigns: () => api.get('/api/admin/pending-campaigns'),
  approveCampaign: (id: string) => api.patch(`/api/campaigns/${id}/approve`, {}),
  rejectCampaign: (id: string) => api.patch(`/api/campaigns/${id}/reject`, {}),
  pendingWithdrawals: () => api.get('/api/admin/pending-withdrawals'),
  approveWithdrawal: (id: string) => api.patch(`/api/withdrawals/${id}/approve`, {}),
  users: () => api.get('/api/users'),
  updateUserRole: (id: string, role: string) => api.patch(`/api/users/${id}`, { role }),
  deleteUser: (id: string) => api.delete(`/api/users/${id}`),
  deleteCampaign: (id: string) => api.delete(`/api/campaigns/${id}/admin`),
  reports: () => api.get('/api/reports'),
  submitReport: (campaignId: string, campaignTitle: string, reason: string) =>
    api.post('/api/reports', { campaignId, campaignTitle, reason }),
  suspendCampaign: (id: string) => api.delete(`/api/campaigns/${id}/suspend`),
};

export default api;
