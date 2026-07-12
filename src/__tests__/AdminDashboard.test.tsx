import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// ─── Mocks (vi.hoisted ensures variables are available in vi.mock factories) ──

const { mockAdminApi, mockCampaignsApi } = vi.hoisted(() => {
  const mockAdminApi = {
    stats: vi.fn(),
    pendingCampaigns: vi.fn(),
    approveCampaign: vi.fn(),
    rejectCampaign: vi.fn(),
    pendingWithdrawals: vi.fn(),
    approveWithdrawal: vi.fn(),
    users: vi.fn(),
    updateUserRole: vi.fn(),
    deleteUser: vi.fn(),
    deleteCampaign: vi.fn(),
    reports: vi.fn(),
    submitReport: vi.fn(),
    suspendCampaign: vi.fn(),
  };

  const mockCampaignsApi = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  return { mockAdminApi, mockCampaignsApi };
});

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
  adminApi: mockAdminApi,
  campaignsApi: mockCampaignsApi,
  creatorApi: {
    stats: vi.fn(),
    pendingContributions: vi.fn(),
    approveContribution: vi.fn(),
    rejectContribution: vi.fn(),
  },
  supporterApi: {
    stats: vi.fn(),
    approvedContributions: vi.fn(),
    createContribution: vi.fn(),
    myContributions: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const mockToast = { success: vi.fn(), error: vi.fn() };
  return {
    default: mockToast,
    Toaster: () => null,
  };
});

// ─── Imports (must be after mocks) ──────────────────────────────────────
import AdminDashboardPage from '@/app/(dashboard)/dashboard/admin/page';
import CampaignApprovalsPage from '@/app/(dashboard)/dashboard/admin/campaign-approvals/page';
import WithdrawalRequestsPage from '@/app/(dashboard)/dashboard/admin/withdrawal-requests/page';
import ManageUsersPage from '@/app/(dashboard)/dashboard/admin/manage-users/page';
import ManageCampaignsPage from '@/app/(dashboard)/dashboard/admin/manage-campaigns/page';
import ReportsPage from '@/app/(dashboard)/dashboard/admin/reports/page';

// ─── Test data factories ────────────────────────────────────────────────

function makeStats(overrides = {}) {
  return {
    totalSupporters: 15,
    totalCreators: 8,
    totalCredits: 4200,
    totalPayments: 0,
    ...overrides,
  };
}

function makeCampaign(overrides = {}) {
  return {
    _id: 'camp-' + Math.random().toString(36).slice(2, 8),
    title: 'Test Campaign',
    category: 'Education',
    fundingGoal: 5000,
    minimumContribution: 10,
    deadline: '2025-12-31T00:00:00.000Z',
    creatorEmail: 'creator@test.com',
    creatorName: 'Creator User',
    amountRaised: 1200,
    status: 'pending',
    createdAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeWithdrawal(overrides = {}) {
  return {
    _id: 'wd-' + Math.random().toString(36).slice(2, 8),
    creatorEmail: 'creator@test.com',
    creatorName: 'Creator User',
    withdrawalCredit: 200,
    withdrawalAmount: 10.00,
    paymentSystem: 'bkash',
    accountNumber: '01XXXXXXXXX',
    date: '2025-06-15T00:00:00.000Z',
    status: 'pending',
    ...overrides,
  };
}

function makeUser(overrides = {}) {
  return {
    id: 'user-' + Math.random().toString(36).slice(2, 8),
    name: 'Test User',
    email: 'user@test.com',
    photoURL: '',
    role: 'supporter',
    credits: 100,
    createdAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  };
}

function makeReport(overrides = {}) {
  return {
    _id: 'rep-' + Math.random().toString(36).slice(2, 8),
    reporterEmail: 'reporter@test.com',
    campaignTitle: 'Reported Campaign',
    campaignId: 'camp-123',
    reason: 'Suspicious activity',
    date: '2025-07-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── Admin Dashboard Page ───────────────────────────────────────────────
describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner on mount', () => {
    mockAdminApi.stats.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AdminDashboardPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render stats cards after successful fetch', async () => {
    mockAdminApi.stats.mockResolvedValue({ stats: makeStats() });
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Supporters')).toBeInTheDocument();
    expect(screen.getByText('Creators')).toBeInTheDocument();
    expect(screen.getByText('Total Credits')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('4,200')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render zero values in stats cards', async () => {
    mockAdminApi.stats.mockResolvedValue({
      stats: makeStats({ totalSupporters: 0, totalCreators: 0, totalCredits: 0, totalPayments: 0 }),
    });
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Supporters')).toBeInTheDocument();
    });

    expect(screen.getAllByText('0')).toHaveLength(4);
  });

  it('should display error message on API failure', async () => {
    mockAdminApi.stats.mockRejectedValue(new Error('Failed to fetch stats'));
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch stats')).toBeInTheDocument();
    });
  });

  it('should call adminApi.stats on mount', async () => {
    mockAdminApi.stats.mockResolvedValue({ stats: makeStats() });
    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(mockAdminApi.stats).toHaveBeenCalledOnce();
    });
  });
});

// ─── Campaign Approvals Page ────────────────────────────────────────────
describe('CampaignApprovalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner on mount', () => {
    mockAdminApi.pendingCampaigns.mockReturnValue(new Promise(() => {}));
    render(<CampaignApprovalsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show empty state when no pending campaigns', async () => {
    mockAdminApi.pendingCampaigns.mockResolvedValue({ campaigns: [] });
    render(<CampaignApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('No pending campaigns to review')).toBeInTheDocument();
    });
  });

  it('should render pending campaigns with approve/reject buttons', async () => {
    const campaigns = [
      makeCampaign({ _id: 'c1', title: 'Campaign One', creatorName: 'Alice', fundingGoal: 3000, minimumContribution: 5, category: 'Tech', deadline: '2025-12-31T00:00:00.000Z' }),
      makeCampaign({ _id: 'c2', title: 'Campaign Two', creatorName: 'Bob', fundingGoal: 5000, minimumContribution: 10, category: 'Health', deadline: '2026-01-15T00:00:00.000Z' }),
    ];
    mockAdminApi.pendingCampaigns.mockResolvedValue({ campaigns });

    render(<CampaignApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Campaign One')).toBeInTheDocument();
    });

    expect(screen.getByText('Campaign Two')).toBeInTheDocument();
    // Creator names are inside mixed text nodes, use substring match
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();

    // Should have approve and reject buttons for each campaign
    const approveButtons = screen.getAllByText('Approve');
    const rejectButtons = screen.getAllByText('Reject');
    expect(approveButtons).toHaveLength(2);
    expect(rejectButtons).toHaveLength(2);
  });

  it('should call approveCampaign and refresh on Approve click', async () => {
    const campaigns = [makeCampaign({ _id: 'c-approve' })];
    mockAdminApi.pendingCampaigns.mockResolvedValue({ campaigns });
    mockAdminApi.approveCampaign.mockResolvedValue({ campaign: { ...campaigns[0], status: 'approved' } });

    render(<CampaignApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Approve'));

    await waitFor(() => {
      expect(mockAdminApi.approveCampaign).toHaveBeenCalledWith('c-approve');
    });

    // Should toast success
    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('Campaign approved');
    });
  });

  it('should call rejectCampaign and refresh on Reject click', async () => {
    const campaigns = [makeCampaign({ _id: 'c-reject' })];
    mockAdminApi.pendingCampaigns.mockResolvedValue({ campaigns });
    mockAdminApi.rejectCampaign.mockResolvedValue({ campaign: { ...campaigns[0], status: 'rejected' } });

    render(<CampaignApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reject'));

    await waitFor(() => {
      expect(mockAdminApi.rejectCampaign).toHaveBeenCalledWith('c-reject');
    });
  });

  it('should show error toast when approve fails', async () => {
    const campaigns = [makeCampaign({ _id: 'c-fail' })];
    mockAdminApi.pendingCampaigns.mockResolvedValue({ campaigns });
    mockAdminApi.approveCampaign.mockRejectedValue(new Error('Server error'));

    render(<CampaignApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Approve'));

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Failed to approve campaign');
    });
  });
});

// ─── Withdrawal Requests Page ───────────────────────────────────────────
describe('WithdrawalRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner on mount', () => {
    mockAdminApi.pendingWithdrawals.mockReturnValue(new Promise(() => {}));
    render(<WithdrawalRequestsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show empty state when no pending withdrawals', async () => {
    mockAdminApi.pendingWithdrawals.mockResolvedValue({ withdrawals: [] });
    render(<WithdrawalRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('No pending withdrawal requests')).toBeInTheDocument();
    });
  });

  it('should render withdrawals in a table', async () => {
    const withdrawals = [
      makeWithdrawal({ _id: 'w1', creatorName: 'Alice', withdrawalCredit: 200, withdrawalAmount: 10.00, paymentSystem: 'bkash', accountNumber: '01XXXXXXXXX' }),
      makeWithdrawal({ _id: 'w2', creatorName: 'Bob', withdrawalCredit: 500, withdrawalAmount: 25.00, paymentSystem: 'nagad', accountNumber: '02YYYYYYYYY' }),
    ];
    mockAdminApi.pendingWithdrawals.mockResolvedValue({ withdrawals });

    render(<WithdrawalRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('bkash')).toBeInTheDocument();
    expect(screen.getByText('nagad')).toBeInTheDocument();

    // Should have approve buttons for each withdrawal
    const approveButtons = screen.getAllByText('Approve');
    expect(approveButtons).toHaveLength(2);
  });

  it('should call approveWithdrawal on Approve click and refresh', async () => {
    const withdrawals = [makeWithdrawal({ _id: 'w-approve' })];
    mockAdminApi.pendingWithdrawals.mockResolvedValue({ withdrawals });
    mockAdminApi.approveWithdrawal.mockResolvedValue({ withdrawal: { ...withdrawals[0], status: 'approved' } });

    render(<WithdrawalRequestsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Approve')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Approve')[0]);

    await waitFor(() => {
      expect(mockAdminApi.approveWithdrawal).toHaveBeenCalledWith('w-approve');
    });

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('Withdrawal approved');
    });
  });

  it('should show error toast when approve fails', async () => {
    const withdrawals = [makeWithdrawal({ _id: 'w-fail' })];
    mockAdminApi.pendingWithdrawals.mockResolvedValue({ withdrawals });
    mockAdminApi.approveWithdrawal.mockRejectedValue(new Error('Server error'));

    render(<WithdrawalRequestsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Approve')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Approve')[0]);

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Failed to approve withdrawal');
    });
  });
});

// ─── Manage Users Page ───────────────────────────────────────────────────
describe('ManageUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner on mount', () => {
    mockAdminApi.users.mockReturnValue(new Promise(() => {}));
    render(<ManageUsersPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render users in a table', async () => {
    const users = [
      makeUser({ id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'supporter', credits: 100 }),
      makeUser({ id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'creator', credits: 250 }),
      makeUser({ id: 'u3', name: 'Carol', email: 'carol@test.com', role: 'admin', credits: 500 }),
    ];
    mockAdminApi.users.mockResolvedValue({ users });

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
    expect(screen.getByText('carol@test.com')).toBeInTheDocument();

    // Should have delete buttons for each user
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(3);

    // Should have role dropdowns
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3);
  });

  it('should call updateUserRole when role dropdown changes', async () => {
    const users = [makeUser({ id: 'u-role', name: 'Test', email: 'test@test.com', role: 'supporter' })];
    mockAdminApi.users.mockResolvedValue({ users });
    mockAdminApi.updateUserRole.mockResolvedValue({ user: { ...users[0], role: 'creator' } });

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // Change role from supporter to creator
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'creator' } });

    await waitFor(() => {
      expect(mockAdminApi.updateUserRole).toHaveBeenCalledWith('u-role', 'creator');
    });

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('User role updated');
    });
  });

  it('should call deleteUser on Delete click after confirm', async () => {
    const users = [makeUser({ id: 'u-del', name: 'Delete Me', email: 'delete@test.com', role: 'supporter' })];
    mockAdminApi.users.mockResolvedValue({ users });
    mockAdminApi.deleteUser.mockResolvedValue({ message: 'User deleted' });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockAdminApi.deleteUser).toHaveBeenCalledWith('u-del');
    });

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('User deleted');
    });
  });

  it('should NOT delete if confirm is cancelled', async () => {
    const users = [makeUser({ id: 'u-cancel', name: 'Keep Me', email: 'keep@test.com', role: 'supporter' })];
    mockAdminApi.users.mockResolvedValue({ users });

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    // Confirm should have been called, but deleteUser should NOT have been called
    expect(window.confirm).toHaveBeenCalled();
    expect(mockAdminApi.deleteUser).not.toHaveBeenCalled();
  });

  it('should show error toast when updateUserRole fails', async () => {
    const users = [makeUser({ id: 'u-err', name: 'Error User', email: 'err@test.com', role: 'supporter' })];
    mockAdminApi.users.mockResolvedValue({ users });
    mockAdminApi.updateUserRole.mockRejectedValue(new Error('Server error'));

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'creator' } });

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Failed to update role');
    });
  });
});

// ─── Manage Campaigns Page ──────────────────────────────────────────────
describe('ManageCampaignsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner on mount', () => {
    mockCampaignsApi.list.mockReturnValue(new Promise(() => {}));
    render(<ManageCampaignsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render campaigns in a table with status filter', async () => {
    const campaigns = [
      makeCampaign({ _id: 'c1', title: 'Campaign Alpha', creatorName: 'Alice', amountRaised: 500, fundingGoal: 2000, status: 'approved' }),
      makeCampaign({ _id: 'c2', title: 'Campaign Beta', creatorName: 'Bob', amountRaised: 0, fundingGoal: 1000, status: 'pending' }),
    ];
    mockCampaignsApi.list.mockResolvedValue({ campaigns });

    render(<ManageCampaignsPage />);

    await waitFor(() => {
      expect(screen.getByText('Manage Campaigns')).toBeInTheDocument();
    });

    expect(screen.getByText('Campaign Alpha')).toBeInTheDocument();
    expect(screen.getByText('Campaign Beta')).toBeInTheDocument();

    // Should have status filter dropdown
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Should have delete buttons
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(2);
  });

  it('should call campaignsApi.list with status filter when filter changes', async () => {
    mockCampaignsApi.list.mockResolvedValue({ campaigns: [] });

    render(<ManageCampaignsPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // Change filter to "pending"
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pending' } });

    await waitFor(() => {
      expect(mockCampaignsApi.list).toHaveBeenCalledWith({ status: 'pending' });
    });
  });

  it('should call campaignsApi.list with no filter by default', async () => {
    mockCampaignsApi.list.mockResolvedValue({ campaigns: [] });
    render(<ManageCampaignsPage />);

    await waitFor(() => {
      expect(mockCampaignsApi.list).toHaveBeenCalledWith({});
    });
  });

  it('should call deleteCampaign on Delete click after confirm', async () => {
    const campaigns = [makeCampaign({ _id: 'c-del', title: 'Delete Campaign', status: 'pending' })];
    mockCampaignsApi.list.mockResolvedValueOnce({ campaigns });
    mockAdminApi.deleteCampaign.mockResolvedValue({ message: 'Campaign deleted' });
    // After delete, list is called again to refresh
    mockCampaignsApi.list.mockResolvedValueOnce({ campaigns: [] });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ManageCampaignsPage />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockAdminApi.deleteCampaign).toHaveBeenCalledWith('c-del');
    });

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('Campaign deleted');
    });
  });

  it('should NOT delete if confirm is cancelled', async () => {
    const campaigns = [makeCampaign({ _id: 'c-cancel', title: 'Keep Campaign' })];
    mockCampaignsApi.list.mockResolvedValue({ campaigns });

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ManageCampaignsPage />);

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockAdminApi.deleteCampaign).not.toHaveBeenCalled();
  });
});

// ─── Reports Page ────────────────────────────────────────────────────────
describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner on mount', () => {
    mockAdminApi.reports.mockReturnValue(new Promise(() => {}));
    render(<ReportsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show empty state when no reports', async () => {
    mockAdminApi.reports.mockResolvedValue({ reports: [] });
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('No reports submitted')).toBeInTheDocument();
    });
  });

  it('should render reports with suspend button', async () => {
    const reports = [
      makeReport({ _id: 'r1', campaignTitle: 'Scam Campaign', reporterEmail: 'whistle@test.com', reason: 'This is fraudulent content' }),
      makeReport({ _id: 'r2', campaignTitle: 'Spam Campaign', reporterEmail: 'report@test.com', reason: 'Repeated spam' }),
    ];
    mockAdminApi.reports.mockResolvedValue({ reports });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Scam Campaign')).toBeInTheDocument();
    });

    expect(screen.getByText('Spam Campaign')).toBeInTheDocument();
    expect(screen.getByText('whistle@test.com')).toBeInTheDocument();
    expect(screen.getByText('report@test.com')).toBeInTheDocument();
    expect(screen.getByText('This is fraudulent content')).toBeInTheDocument();
    expect(screen.getByText('Repeated spam')).toBeInTheDocument();

    // Should have suspend button for each report
    const suspendButtons = screen.getAllByText('Suspend Campaign');
    expect(suspendButtons).toHaveLength(2);
  });

  it('should call suspendCampaign on Suspend click after confirm', async () => {
    const reports = [makeReport({ _id: 'r-sus', campaignId: 'camp-sus', campaignTitle: 'To Suspend' })];
    mockAdminApi.reports.mockResolvedValue({ reports });
    mockAdminApi.suspendCampaign.mockResolvedValue({ campaign: { _id: 'camp-sus', status: 'suspended' } });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Suspend Campaign')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Suspend Campaign'));

    await waitFor(() => {
      expect(mockAdminApi.suspendCampaign).toHaveBeenCalledWith('camp-sus');
    });

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('Campaign suspended');
    });
  });

  it('should NOT suspend if confirm is cancelled', async () => {
    const reports = [makeReport({ _id: 'r-no', campaignId: 'camp-no', campaignTitle: 'Keep Active' })];
    mockAdminApi.reports.mockResolvedValue({ reports });

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Suspend Campaign')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Suspend Campaign'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockAdminApi.suspendCampaign).not.toHaveBeenCalled();
  });

  it('should show error toast when suspend fails', async () => {
    const reports = [makeReport({ _id: 'r-err', campaignId: 'camp-err', campaignTitle: 'Fail Suspend' })];
    mockAdminApi.reports.mockResolvedValue({ reports });
    mockAdminApi.suspendCampaign.mockRejectedValue(new Error('Server error'));

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Suspend Campaign')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Suspend Campaign'));

    const toastMock = (await import('react-hot-toast')).default;
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Failed to suspend campaign');
    });
  });
});
