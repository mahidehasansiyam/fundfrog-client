import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
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
  HiOutlineHeart: () => <span data-testid="icon-heart">Heart</span>,
  HiOutlineClock: () => <span data-testid="icon-clock">Clock</span>,
  HiOutlineBadgeCheck: () => <span data-testid="icon-badge-check">BadgeCheck</span>,
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

// Mock supporterApi — will be reconfigured per test
const mockSupporterApiStats = vi.fn();
const mockSupporterApiApprovedContributions = vi.fn();

vi.mock('@/lib/api', () => ({
  supporterApi: {
    stats: (...args: unknown[]) => mockSupporterApiStats(...args),
    approvedContributions: (...args: unknown[]) => mockSupporterApiApprovedContributions(...args),
  },
}));

// ---------------------------------------------------------------------------
// Import the component after mocks are set up
// ---------------------------------------------------------------------------
import SupporterDashboardHome from '@/app/(dashboard)/dashboard/supporter/page';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------
function createMockStats(overrides = {}) {
  return {
    stats: {
      totalContributions: 8,
      pendingCount: 2,
      approvedAmount: 600,
      ...overrides,
    },
  };
}

function createMockApprovedContributions(count = 2) {
  const items = Array.from({ length: count }, (_, i) => ({
    _id: `contrib-${i + 1}`,
    campaignTitle: `Campaign ${i + 1}`,
    campaignId: `campaign-${i + 1}`,
    amount: (i + 1) * 300,
    date: '2025-06-15T10:00:00.000Z',
    status: 'approved',
  }));
  return { contributions: items };
}

const defaultSupporterUser = {
  name: 'Test Supporter',
  email: 'supporter@example.com',
  role: 'supporter' as const,
  credits: 500,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SupporterDashboard page — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    // Reset to default supporter state
    mockAuthState = {
      user: { ...defaultSupporterUser },
      loading: false,
    };
    // Default API resolves
    mockSupporterApiStats.mockResolvedValue(createMockStats());
    mockSupporterApiApprovedContributions.mockResolvedValue(createMockApprovedContributions(2));
  });

  // -----------------------------------------------------------------------
  // Auth guard tests
  // -----------------------------------------------------------------------
  it('should show loading spinner while auth context is loading', () => {
    mockAuthState = { user: null, loading: true };

    render(<SupporterDashboardHome />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should redirect to /login when user is null after loading', async () => {
    mockAuthState = { user: null, loading: false };

    render(<SupporterDashboardHome />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should redirect to / when user role is not supporter', async () => {
    mockAuthState = {
      user: { name: 'Creator', email: 'creator@test.com', role: 'creator', credits: 20 },
      loading: false,
    };

    render(<SupporterDashboardHome />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  it('should show loading spinner while fetching dashboard data', async () => {
    // Make the API calls never resolve to keep fetching=true
    mockSupporterApiStats.mockReturnValue(new Promise(() => {}));

    render(<SupporterDashboardHome />);

    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Stats cards rendering
  // -----------------------------------------------------------------------
  it('should render stats cards when API returns stats data', async () => {
    mockSupporterApiStats.mockResolvedValue(createMockStats({
      totalContributions: 10,
      pendingCount: 3,
      approvedAmount: 1500,
    }));
    mockSupporterApiApprovedContributions.mockResolvedValue(createMockApprovedContributions(2));

    render(<SupporterDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Total Contributions')).toBeInTheDocument();
    });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Approved Credits')).toBeInTheDocument();
    expect(screen.getByText('1500 credits')).toBeInTheDocument();
  });

  it('should render stats cards with zero values when no contributions exist', async () => {
    mockSupporterApiStats.mockResolvedValue(createMockStats({
      totalContributions: 0,
      pendingCount: 0,
      approvedAmount: 0,
    }));
    mockSupporterApiApprovedContributions.mockResolvedValue({ contributions: [] });

    render(<SupporterDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Total Contributions')).toBeInTheDocument();
    });

    // Check for zero values
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('0 credits')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Approved contributions table
  // -----------------------------------------------------------------------
  it('should render approved contributions table with contribution data', async () => {
    const mockContributions = createMockApprovedContributions(2);
    mockSupporterApiApprovedContributions.mockResolvedValue(mockContributions);

    render(<SupporterDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Approved Contributions')).toBeInTheDocument();
    });

    // Table headers
    expect(screen.getByText('Campaign')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Campaign data
    expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Campaign 2')).toBeInTheDocument();

    // Amount values (300 and 600)
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();

    // Status badges show "approved"
    const approvedBadges = screen.getAllByText('approved');
    expect(approvedBadges).toHaveLength(2);
  });

  it('should show "No approved contributions yet" when the list is empty', async () => {
    mockSupporterApiApprovedContributions.mockResolvedValue({ contributions: [] });

    render(<SupporterDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('No approved contributions yet')).toBeInTheDocument();
    });

    // No table should be rendered
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Error toast on API failure
  // -----------------------------------------------------------------------
  it('should show error toast when stats API call fails', async () => {
    mockSupporterApiStats.mockRejectedValue(new Error('Network error'));
    mockSupporterApiApprovedContributions.mockResolvedValue(createMockApprovedContributions(1));

    render(<SupporterDashboardHome />);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Failed to load dashboard data');
    });
  });

  it('should not crash when approved contributions API call fails', async () => {
    mockSupporterApiStats.mockResolvedValue(createMockStats());
    mockSupporterApiApprovedContributions.mockRejectedValue(new Error('Network error'));

    render(<SupporterDashboardHome />);

    // The dashboard should still render stats and not crash
    await waitFor(() => {
      expect(screen.getByText('Total Contributions')).toBeInTheDocument();
    });

    // Should show no approved contributions
    expect(screen.getByText('No approved contributions yet')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Page header
  // -----------------------------------------------------------------------
  it('should render the page title and subtitle', async () => {
    render(<SupporterDashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Supporter Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Track your contributions and explore campaigns')).toBeInTheDocument();
  });
});
