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

// Mock react-hot-toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastLoading = vi.fn();
vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    loading: (...args: unknown[]) => mockToastLoading(...args),
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

// Mock paymentsApi — will be reconfigured per test
const mockCreateCheckout = vi.fn();

vi.mock('@/lib/api', () => ({
  paymentsApi: {
    createCheckout: (...args: unknown[]) => mockCreateCheckout(...args),
  },
}));

// Mock window.location.assign
const mockLocationAssign = vi.fn();
Object.defineProperty(window, 'location', {
  value: { assign: mockLocationAssign },
  writable: true,
});

// ---------------------------------------------------------------------------
// Import the component after mocks are set up
// ---------------------------------------------------------------------------
import PurchaseCreditPage from '@/app/(dashboard)/dashboard/supporter/purchase-credit/page';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------
const defaultSupporterUser = {
  name: 'Test Supporter',
  email: 'supporter@example.com',
  role: 'supporter' as const,
  credits: 50,
};

const creditPackages = [
  { credits: 100, price: 10, popular: false, label: 'Buy $10' },
  { credits: 300, price: 25, popular: true, label: 'Buy $25' },
  { credits: 800, price: 60, popular: false, label: 'Buy $60' },
  { credits: 1500, price: 110, popular: false, label: 'Buy $110' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PurchaseCreditPage — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockLocationAssign.mockClear();
    // Reset to default supporter state
    mockAuthState = {
      user: { ...defaultSupporterUser },
      loading: false,
    };
  });

  // -----------------------------------------------------------------------
  // Auth guard tests
  // -----------------------------------------------------------------------
  it('should show loading spinner while auth context is loading', () => {
    mockAuthState = { user: null, loading: true };

    render(<PurchaseCreditPage />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should redirect to /login when user is null after loading', async () => {
    mockAuthState = { user: null, loading: false };

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should redirect to /login when user role is not supporter', async () => {
    mockAuthState = {
      user: { name: 'Test Creator', email: 'creator@example.com', role: 'creator', credits: 20 },
      loading: false,
    };

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should redirect to /login when user role is admin', async () => {
    mockAuthState = {
      user: { name: 'Admin', email: 'admin@example.com', role: 'admin', credits: 0 },
      loading: false,
    };

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  // -----------------------------------------------------------------------
  // Page header
  // -----------------------------------------------------------------------
  it('should render the page title and subtitle', async () => {
    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Buy credit packages to support campaigns'),
    ).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Credit package cards rendering
  // -----------------------------------------------------------------------
  it('should render all 4 credit package cards with correct credit amounts', async () => {
    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    for (const pkg of creditPackages) {
      expect(screen.getByText(pkg.credits.toString())).toBeInTheDocument();
    }
  });

  it('should render all 4 credit package cards with correct prices', async () => {
    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    for (const pkg of creditPackages) {
      expect(screen.getByText(`$${pkg.price}`)).toBeInTheDocument();
    }
  });

  it('should render per-credit cost for each package', async () => {
    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    // 100 credits: $10/100 = $0.10 per credit
    expect(screen.getByText('$0.10 per credit')).toBeInTheDocument();
    // Some packages may share the same per-credit cost due to rounding
    // Check that all 4 per-credit cost labels are rendered
    const perCreditLabels = screen.getAllByText(/per credit$/);
    expect(perCreditLabels).toHaveLength(4);
  });

  it('should render "Buy" buttons for all packages', async () => {
    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    for (const pkg of creditPackages) {
      expect(
        screen.getByRole('button', { name: pkg.label }),
      ).toBeInTheDocument();
    }
  });

  it('should show "Best Value" badge on the 300 credit package', async () => {
    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Best Value')).toBeInTheDocument();
    });
  });

  it('should render the Stripe credit card notice at the bottom', async () => {
    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Credit card payments powered by Stripe/),
    ).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Buy button click — success flow
  // -----------------------------------------------------------------------
  it('should call paymentsApi.createCheckout with correct credits when a buy button is clicked', async () => {
    mockCreateCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/test_123',
    });

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    // Click the "Buy $25" button (300 credits package)
    const buyButton = screen.getByRole('button', { name: 'Buy $25' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith(300);
    });
  });

  it('should redirect to Stripe Checkout URL on successful API response', async () => {
    const stripeUrl = 'https://checkout.stripe.com/c/pay/test_123';
    mockCreateCheckout.mockResolvedValue({ url: stripeUrl });

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $25' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith(300);
    });

    await waitFor(() => {
      expect(mockLocationAssign).toHaveBeenCalledWith(stripeUrl);
    });
  });

  it('should show a loading toast when redirecting to Stripe', async () => {
    mockCreateCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/test_123',
    });

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $25' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockToastLoading).toHaveBeenCalledWith(
        'Redirecting to Stripe...',
      );
    });
  });

  it('should call createCheckout with 100 credits when first package is clicked', async () => {
    mockCreateCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/100',
    });

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $10' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith(100);
    });
  });

  it('should call createCheckout with 800 credits when third package is clicked', async () => {
    mockCreateCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/800',
    });

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $60' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith(800);
    });
  });

  it('should call createCheckout with 1500 credits when fourth package is clicked', async () => {
    mockCreateCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/1500',
    });

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $110' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith(1500);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  it('should show error toast when API call fails', async () => {
    mockCreateCheckout.mockRejectedValue(new Error('Network error'));

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $25' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Network error');
    });
  });

  it('should show generic error toast when API fails with non-Error type', async () => {
    mockCreateCheckout.mockRejectedValue('Something went wrong');

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $25' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Purchase failed');
    });
  });

  it('should reset button state after API failure (not stuck on Processing...)', async () => {
    mockCreateCheckout.mockRejectedValue(new Error('Network error'));

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $25' });
    fireEvent.click(buyButton);

    // Wait for error to occur
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });

    // Button should be back to "Buy $25" (not "Processing...")
    expect(screen.getByRole('button', { name: 'Buy $25' })).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Processing state
  // -----------------------------------------------------------------------
  it('should show "Processing..." on the clicked button while request is in flight', async () => {
    // Make the API call hang (never resolves during test)
    mockCreateCheckout.mockReturnValue(new Promise(() => {}));

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    const buyButton = screen.getByRole('button', { name: 'Buy $25' });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith(300);
    });

    // Button text should now be "Processing..."
    expect(
      screen.getByRole('button', { name: 'Processing...' }),
    ).toBeInTheDocument();
  });

  it('should disable all buy buttons while any purchase is processing', async () => {
    mockCreateCheckout.mockReturnValue(new Promise(() => {}));

    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    // Click one button
    const buyButton25 = screen.getByRole('button', { name: 'Buy $25' });
    fireEvent.click(buyButton25);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith(300);
    });

    // All buttons should be disabled
    const allBuyButtons = screen.getAllByRole('button');
    for (const btn of allBuyButtons) {
      expect(btn).toBeDisabled();
    }
  });

  // -----------------------------------------------------------------------
  // Payment info section
  // -----------------------------------------------------------------------
  it('should show the minimum purchase information', async () => {
    render(<PurchaseCreditPage />);

    await waitFor(() => {
      expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Minimum purchase: 100 credits/),
    ).toBeInTheDocument();
  });
});
