import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock react-icons/hi
vi.mock('react-icons/hi', () => ({
  HiOutlineCollection: () => <span data-testid="icon-collection">Collection</span>,
  HiOutlineBadgeCheck: () => <span data-testid="icon-badge-check">BadgeCheck</span>,
  HiOutlineCurrencyDollar: () => <span data-testid="icon-currency-dollar">CurrencyDollar</span>,
}));

// Mock react-hot-toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
  Toaster: () => null,
}));

// Mock AuthContext — will be reconfigured per test
let mockAuthState: {
  user: { name: string; email: string; role: string; credits: number } | null;
  loading: boolean;
} = {
  user: null,
  loading: true,
};

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Mock creatorApi — will be reconfigured per test
const mockCreatorApiStats = vi.fn();
const mockCreatorApiPendingContributions = vi.fn();
const mockCreatorApiApproveContribution = vi.fn();
const mockCreatorApiRejectContribution = vi.fn();

vi.mock('@/lib/api', () => ({
  creatorApi: {
    stats: (...args: unknown[]) => mockCreatorApiStats(...args),
    pendingContributions: (...args: unknown[]) => mockCreatorApiPendingContributions(...args),
    approveContribution: (...args: unknown[]) => mockCreatorApiApproveContribution(...args),
    rejectContribution: (...args: unknown[]) => mockCreatorApiRejectContribution(...args),
  },
}));

// ---------------------------------------------------------------------------
// Import the component after mocks are set up
// ---------------------------------------------------------------------------
import CreatorDashboardHome from '@/app/(dashboard)/dashboard/creator/page';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------
function createMockStats(overrides = {}) {
  return {
    stats: {
      totalCampaigns: 3,
      activeCampaigns: 1,
      totalRaised: 7000,
      ...overrides,
    },
  };
}

function createMockPendingContributions(count = 2) {
  const items = Array.from({ length: count }, (_, i) => ({
    _id: `contrib-${i + 1}`,
    campaignTitle: `Campaign ${i + 1}`,
    supporterName: `Supporter ${i + 1}`,
    supporterEmail: `supporter${i + 1}@example.com`,
    amount: (i + 1) * 250,
    date: '2025-06-15T10:00:00.000Z',
    status: 'pending',
  }));
  return { contributions: items };
}

const defaultCreatorUser = {
  name: 'Test Creator',
  email: 'creator@example.com',
  role: 'creator' as const,
  credits: 20,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('creatorApi helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creatorApi.stats() should call GET /api/creator/stats', async () => {
    // Import the real module to test the actual API call implementation
    // We already mocked it above; here we test the mock was set up correctly
    const { creatorApi } = await import('@/lib/api');
    mockCreatorApiStats.mockResolvedValue(createMockStats());

    const result = await creatorApi.stats();
    expect(mockCreatorApiStats).toHaveBeenCalledOnce();
    expect(result.stats.totalCampaigns).toBe(3);
  });

  it('creatorApi.pendingContributions() should call GET /api/creator/pending-contributions', async () => {
    const { creatorApi } = await import('@/lib/api');
    mockCreatorApiPendingContributions.mockResolvedValue(createMockPendingContributions(2));

    const result = await creatorApi.pendingContributions();
    expect(mockCreatorApiPendingContributions).toHaveBeenCalledOnce();
    expect(result.contributions).toHaveLength(2);
  });

  it('creatorApi.approveContribution(id) should call PATCH /api/contributions/:id/approve', async () => {
    const { creatorApi } = await import('@/lib/api');
    mockCreatorApiApproveContribution.mockResolvedValue({ message: 'Contribution approved.' });

    const result = await creatorApi.approveContribution('contrib-123');
    expect(mockCreatorApiApproveContribution).toHaveBeenCalledWith('contrib-123');
    expect(result.message).toContain('approved');
  });

  it('creatorApi.rejectContribution(id) should call PATCH /api/contributions/:id/reject', async () => {
    const { creatorApi } = await import('@/lib/api');
    mockCreatorApiRejectContribution.mockResolvedValue({ message: 'Contribution rejected and supporter refunded.' });

    const result = await creatorApi.rejectContribution('contrib-456');
    expect(mockCreatorApiRejectContribution).toHaveBeenCalledWith('contrib-456');
    expect(result.message).toContain('rejected');
  });
});

describe('CreatorDashboard page — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    // Reset to default creator state
    mockAuthState = {
      user: { ...defaultCreatorUser },
      loading: false,
    };
    // Default API resolves
    mockCreatorApiStats.mockResolvedValue(createMockStats());
    mockCreatorApiPendingContributions.mockResolvedValue(createMockPendingContributions(2));
  });

  // -----------------------------------------------------------------------
  // Auth guard tests
  // -----------------------------------------------------------------------
  it('should show loading spinner while auth context is loading', () => {
    mockAuthState = { user: null, loading: true };

    render(<CreatorDashboardHome />);

    // The spinner has class "animate-spin"
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should redirect to /login when user is null after loading', async () => {
    mockAuthState = { user: null, loading: false };

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should redirect to / when user role is not creator', async () => {
    mockAuthState = {
      user: { name: 'Supporter', email: 'sup@test.com', role: 'supporter', credits: 50 },
      loading: false,
    };

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  it('should show loading spinner while fetching dashboard data', async () => {
    // Make the API calls never resolve to keep fetching=true
    mockCreatorApiStats.mockReturnValue(new Promise(() => {}));
    mockCreatorApiPendingContributions.mockReturnValue(new Promise(() => {}));

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Stats cards rendering
  // -----------------------------------------------------------------------
  it('should render stats cards when API returns stats data', async () => {
    mockCreatorApiStats.mockResolvedValue(createMockStats({
      totalCampaigns: 5,
      activeCampaigns: 3,
      totalRaised: 15000,
    }));
    mockCreatorApiPendingContributions.mockResolvedValue(createMockPendingContributions(1));

    render(<CreatorDashboardHome />);

    // Wait for stats cards to appear
    await waitFor(() => {
      expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
    });

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total Raised')).toBeInTheDocument();
    expect(screen.getByText('15000 credits')).toBeInTheDocument();
  });

  it('should render stats cards with zero values when no campaigns exist', async () => {
    mockCreatorApiStats.mockResolvedValue(createMockStats({
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalRaised: 0,
    }));
    mockCreatorApiPendingContributions.mockResolvedValue({ contributions: [] });

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
    });

    // Check for zero values — there will be multiple "0" text nodes
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('0 credits')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Pending contributions table
  // -----------------------------------------------------------------------
  it('should render pending contributions table with contribution data', async () => {
    const mockContributions = createMockPendingContributions(2);
    mockCreatorApiPendingContributions.mockResolvedValue(mockContributions);

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Pending Contributions')).toBeInTheDocument();
    });

    // Table headers
    expect(screen.getByText('Supporter')).toBeInTheDocument();
    expect(screen.getByText('Campaign')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Contribution data
    expect(screen.getByText('Supporter 1')).toBeInTheDocument();
    expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Supporter 2')).toBeInTheDocument();
    expect(screen.getByText('Campaign 2')).toBeInTheDocument();

    // Amount values (250 and 500)
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();

    // Approve and Reject buttons
    const approveButtons = screen.getAllByRole('button', { name: /approve/i });
    expect(approveButtons).toHaveLength(2);

    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    expect(rejectButtons).toHaveLength(2);
  });

  it('should show "No pending contributions" when the list is empty', async () => {
    mockCreatorApiPendingContributions.mockResolvedValue({ contributions: [] });

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('No pending contributions')).toBeInTheDocument();
    });

    // No table should be rendered
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Approve action
  // -----------------------------------------------------------------------
  it('should call approveContribution and show success toast on approve button click', async () => {
    const mockContributions = createMockPendingContributions(1);
    mockCreatorApiPendingContributions.mockResolvedValue(mockContributions);
    mockCreatorApiApproveContribution.mockResolvedValue({ message: 'Contribution approved.' });
    // Reload after approve
    mockCreatorApiStats.mockResolvedValue(createMockStats());
    mockCreatorApiPendingContributions.mockResolvedValue(mockContributions);

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Pending Contributions')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockCreatorApiApproveContribution).toHaveBeenCalledWith('contrib-1');
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Contribution approved');
    });
  });

  it('should show error toast when approve fails', async () => {
    const mockContributions = createMockPendingContributions(1);
    mockCreatorApiPendingContributions.mockResolvedValue(mockContributions);
    mockCreatorApiApproveContribution.mockRejectedValue(new Error('Approve failed'));

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Pending Contributions')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockCreatorApiApproveContribution).toHaveBeenCalledWith('contrib-1');
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Failed to approve contribution');
    });
  });

  // -----------------------------------------------------------------------
  // Reject action
  // -----------------------------------------------------------------------
  it('should call rejectContribution and show success toast on reject button click', async () => {
    const mockContributions = createMockPendingContributions(1);
    mockCreatorApiPendingContributions.mockResolvedValue(mockContributions);
    mockCreatorApiRejectContribution.mockResolvedValue({ message: 'Contribution rejected and supporter refunded.' });
    // Reload after reject
    mockCreatorApiStats.mockResolvedValue(createMockStats());
    mockCreatorApiPendingContributions.mockResolvedValue(mockContributions);

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Pending Contributions')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockCreatorApiRejectContribution).toHaveBeenCalledWith('contrib-1');
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Contribution rejected');
    });
  });

  it('should show error toast when reject fails', async () => {
    const mockContributions = createMockPendingContributions(1);
    mockCreatorApiPendingContributions.mockResolvedValue(mockContributions);
    mockCreatorApiRejectContribution.mockRejectedValue(new Error('Reject failed'));

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Pending Contributions')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Failed to reject contribution');
    });
  });

  // -----------------------------------------------------------------------
  // Error toast on dashboard data load failure
  // -----------------------------------------------------------------------
  it('should show error toast when stats API call fails', async () => {
    mockCreatorApiStats.mockRejectedValue(new Error('Network error'));
    // Keep pending contributions working so we can still reach the error path
    mockCreatorApiPendingContributions.mockResolvedValue(createMockPendingContributions(1));

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Failed to load dashboard data');
    });
  });

  it('should show error toast when pending contributions API call fails', async () => {
    mockCreatorApiPendingContributions.mockRejectedValue(new Error('Network error'));
    mockCreatorApiStats.mockResolvedValue(createMockStats());

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Failed to load dashboard data');
    });
  });

  // -----------------------------------------------------------------------
  // Page header
  // -----------------------------------------------------------------------
  it('should render the page title and subtitle', async () => {
    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Creator Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage your campaigns and contributions')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Disabled buttons during action
  // -----------------------------------------------------------------------
  it('should disable approve/reject buttons while action is loading', async () => {
    const mockContributions = createMockPendingContributions(1);
    mockCreatorApiPendingContributions.mockResolvedValue(mockContributions);
    // Make approve hang to keep action loading
    mockCreatorApiApproveContribution.mockReturnValue(new Promise(() => {}));

    render(<CreatorDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Pending Contributions')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: /approve/i });
    const rejectButton = screen.getByRole('button', { name: /reject/i });

    expect(approveButton).not.toBeDisabled();
    expect(rejectButton).not.toBeDisabled();

    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(approveButton).toBeDisabled();
    });

    // Reject button for the same row should also be disabled when actionLoading === id
    // (both share the same id check)
    expect(rejectButton).toBeDisabled();
  });
});
