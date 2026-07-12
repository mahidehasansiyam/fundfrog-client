import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock next/navigation
const mockPush = vi.fn();
const mockParams = { id: 'campaign-123' };
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}));

// Mock react-icons/hi
vi.mock('react-icons/hi', () => ({
  HiOutlineCurrencyDollar: () => <span data-testid="icon-currency-dollar">CurrencyDollar</span>,
  HiOutlineUser: () => <span data-testid="icon-user">User</span>,
  HiOutlineCalendar: () => <span data-testid="icon-calendar">Calendar</span>,
  HiOutlineTag: () => <span data-testid="icon-tag">Tag</span>,
  HiOutlineArrowLeft: () => <span data-testid="icon-arrow-left">ArrowLeft</span>,
  HiOutlineInformationCircle: () => <span data-testid="icon-info">Info</span>,
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
  loading: false,
};

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Mock API — will be reconfigured per test
const mockCampaignsApiGet = vi.fn();
const mockSupporterApiCreateContribution = vi.fn();

vi.mock('@/lib/api', () => ({
  campaignsApi: {
    get: (...args: unknown[]) => mockCampaignsApiGet(...args),
    list: vi.fn(),
  },
  supporterApi: {
    createContribution: (...args: unknown[]) => mockSupporterApiCreateContribution(...args),
  },
}));

// ---------------------------------------------------------------------------
// Import the component after mocks are set up
// ---------------------------------------------------------------------------
import CampaignDetailPage from '@/app/campaigns/[id]/page';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------
function createMockCampaign(overrides = {}) {
  return {
    campaign: {
      _id: 'campaign-123',
      title: 'Help Build a School',
      story: 'We are raising funds to build a school in rural area.',
      category: 'education',
      fundingGoal: 50000,
      amountRaised: 15000,
      minimumContribution: 10,
      deadline: '2026-12-31T23:59:59.000Z',
      imageURL: 'https://example.com/image.jpg',
      creatorName: 'John Doe',
      creatorEmail: 'john@example.com',
      rewardInfo: 'All contributors will get a thank you note.',
      status: 'approved',
      ...overrides,
    },
  };
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
describe('CampaignDetailPage — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    // Reset to default state
    mockAuthState = {
      user: { ...defaultSupporterUser },
      loading: false,
    };
    mockCampaignsApiGet.mockResolvedValue(createMockCampaign());
    mockSupporterApiCreateContribution.mockResolvedValue({ message: 'Contribution created.' });
  });

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  it('should show loading spinner while fetching campaign', () => {
    mockCampaignsApiGet.mockReturnValue(new Promise(() => {}));

    render(<CampaignDetailPage />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 404 handling
  // -----------------------------------------------------------------------
  it('should show error toast and redirect to home when campaign is not found', async () => {
    mockCampaignsApiGet.mockRejectedValue(new Error('Campaign not found'));

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Campaign not found');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  // -----------------------------------------------------------------------
  // Campaign info rendering
  // -----------------------------------------------------------------------
  it('should render campaign title and story', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Help Build a School')).toBeInTheDocument();
    });

    expect(screen.getByText(/We are raising funds to build a school in rural area/)).toBeInTheDocument();
  });

  it('should render campaign category badge', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('education')).toBeInTheDocument();
    });
  });

  it('should render funding progress bar with correct percentage', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('30%')).toBeInTheDocument(); // 15000/50000 = 30%
    });

    // Raised amount display
    expect(screen.getByText('15000 / 50000')).toBeInTheDocument();
  });

  it('should render creator info', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/by John Doe/)).toBeInTheDocument();
    });
  });

  it('should render deadline', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Deadline:/)).toBeInTheDocument();
    });
  });

  it('should render minimum contribution info', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Min: 10 credits')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Reward info
  // -----------------------------------------------------------------------
  it('should render reward info section when campaign has rewardInfo', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Reward Info')).toBeInTheDocument();
    });

    expect(screen.getByText('All contributors will get a thank you note.')).toBeInTheDocument();
  });

  it('should not render reward info section when campaign has no rewardInfo', async () => {
    mockCampaignsApiGet.mockResolvedValue(createMockCampaign({ rewardInfo: '' }));

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Help Build a School')).toBeInTheDocument();
    });

    expect(screen.queryByText('Reward Info')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Back link
  // -----------------------------------------------------------------------
  it('should render "Back to campaigns" link', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      const backLink = screen.getByText('Back to campaigns');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard/supporter/explore');
    });
  });

  // -----------------------------------------------------------------------
  // Contribution form — renders when active and approved
  // -----------------------------------------------------------------------
  it('should render contribution form for active approved campaign', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    // Amount input
    const amountInput = screen.getByPlaceholderText('Min 10');
    expect(amountInput).toBeInTheDocument();
    expect(amountInput).toHaveAttribute('type', 'number');
    expect(amountInput).toHaveAttribute('min', '10');

    // Contribute button
    const contributeButton = screen.getByRole('button', { name: /contribute/i });
    expect(contributeButton).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Contribution form — hidden states
  // -----------------------------------------------------------------------
  it('should not show contribution form when campaign is expired', async () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    mockCampaignsApiGet.mockResolvedValue(createMockCampaign({ deadline: pastDate.toISOString() }));

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Help Build a School')).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: /contribute/i })).not.toBeInTheDocument();
    expect(screen.getByText('This campaign has ended')).toBeInTheDocument();
  });

  it('should not show contribution form when campaign status is not approved', async () => {
    mockCampaignsApiGet.mockResolvedValue(createMockCampaign({ status: 'pending' }));

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Help Build a School')).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: /contribute/i })).not.toBeInTheDocument();
    expect(screen.getByText('Campaign is not currently accepting contributions')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Contribution form — auth guards
  // -----------------------------------------------------------------------
  it('should show login prompt when user is not logged in', async () => {
    mockAuthState = { user: null, loading: false };

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Help Build a School')).toBeInTheDocument();
    });

    // Should show login link in the form area
    const loginLink = screen.getByText('login');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should show error toast and redirect to login when unauthenticated user tries to contribute', async () => {
    mockAuthState = { user: null, loading: false };

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Min 10');
    fireEvent.change(amountInput, { target: { value: '50' } });

    const contributeButton = screen.getByRole('button', { name: /contribute 50 credits/i });
    fireEvent.click(contributeButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Please login to contribute');
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(mockSupporterApiCreateContribution).not.toHaveBeenCalled();
  });

  it('should show error toast when user role is not supporter', async () => {
    mockAuthState = {
      user: { name: 'Creator', email: 'creator@test.com', role: 'creator', credits: 20 },
      loading: false,
    };

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Min 10');
    fireEvent.change(amountInput, { target: { value: '50' } });

    const contributeButton = screen.getByRole('button', { name: /contribute 50 credits/i });
    fireEvent.click(contributeButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Only supporters can contribute');
    });

    expect(mockSupporterApiCreateContribution).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Minimum contribution validation
  // -----------------------------------------------------------------------
  it('should show error toast when contribution amount is below minimum', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Min 10') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '5' } });

    // Submit the form directly
    const form = amountInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Minimum contribution is 10 credits');
    });

    expect(mockSupporterApiCreateContribution).not.toHaveBeenCalled();
  });

  it('should show error toast when contribution amount is empty', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    // Submit the form with empty amount
    const amountInput = screen.getByPlaceholderText('Min 10') as HTMLInputElement;
    const form = amountInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Minimum contribution is 10 credits');
    });

    expect(mockSupporterApiCreateContribution).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Successful contribution submission
  // -----------------------------------------------------------------------
  it('should call createContribution and show success toast on valid submission', async () => {
    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Min 10') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '100' } });

    // Submit the form directly
    const form = amountInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSupporterApiCreateContribution).toHaveBeenCalledWith('campaign-123', 100);
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Contribution submitted! Awaiting creator approval.');
    });

    // Amount input should be cleared after successful submission
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Min 10') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  it('should show submitting state while contribution is being processed', async () => {
    // Make the API call never resolve to keep submitting=true
    mockSupporterApiCreateContribution.mockReturnValue(new Promise(() => {}));

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Min 10');
    fireEvent.change(amountInput, { target: { value: '100' } });

    const contributeButton = screen.getByRole('button', { name: /contribute 100 credits/i });
    fireEvent.click(contributeButton);

    // Button should show "Submitting..." and be disabled
    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    expect(contributeButton).toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Contribution submission error
  // -----------------------------------------------------------------------
  it('should show error toast when contribution submission fails', async () => {
    mockSupporterApiCreateContribution.mockRejectedValue(new Error('Insufficient credits'));

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Min 10');
    fireEvent.change(amountInput, { target: { value: '100' } });

    const contributeButton = screen.getByRole('button', { name: /contribute 100 credits/i });
    fireEvent.click(contributeButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Insufficient credits');
    });

    // Button should be re-enabled after error
    expect(contributeButton).not.toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Contribution form — submit disabled while submitting
  // -----------------------------------------------------------------------
  it('should disable contribute button while submission is in progress', async () => {
    mockSupporterApiCreateContribution.mockReturnValue(new Promise(() => {}));

    render(<CampaignDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /contribute/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Min 10');
    fireEvent.change(amountInput, { target: { value: '200' } });

    const contributeButton = screen.getByRole('button', { name: /contribute 200 credits/i });
    fireEvent.click(contributeButton);

    await waitFor(() => {
      expect(contributeButton).toBeDisabled();
    });
  });
});
