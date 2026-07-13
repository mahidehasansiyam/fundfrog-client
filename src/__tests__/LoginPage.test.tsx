import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const { mockSocialSignIn } = vi.hoisted(() => ({
  mockSocialSignIn: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
    signIn: {
      email: vi.fn(),
      social: mockSocialSignIn,
    },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));

// Now import the component after mocks are set up
import LoginPage from '@/app/(auth)/login/page';

describe('LoginPage — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email input, password input, and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should render a Google sign-in button', () => {
    render(<LoginPage />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).not.toBeDisabled();
  });

  it('should show a link to the register page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: /create one/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should display an error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password.'));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });
  });

  it('should call login with email and password on form submit and redirect', async () => {
    const mockPush = vi.fn();
    // Override the router mock for this test
    vi.mocked((await import('next/navigation')) as Record<string, unknown>).useRouter = () => ({ push: mockPush });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'correctpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'correctpass');
    });
  });

  it('should disable submit button when loading', async () => {
    // Make login never resolve to keep loading=true
    mockLogin.mockImplementation(() => new Promise(() => {}));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should call authClient.signIn.social with google provider when Google button is clicked', async () => {
    mockSocialSignIn.mockResolvedValue({ data: null, error: null });

    render(<LoginPage />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    expect(googleButton).not.toBeDisabled();

    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSocialSignIn).toHaveBeenCalledWith({ provider: 'google', callbackURL: '/' });
    });
  });
});
