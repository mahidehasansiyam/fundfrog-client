import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

// Mock @react-oauth/google
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: vi.fn((config) => {
    // Store the config for test access
    (globalThis as Record<string, unknown>).__googleLoginConfig = config;
    return () => {}; // Returning a function (the callback trigger)
  }),
}));

// Mock AuthContext
const mockLogin = vi.fn();
const mockGoogleLogin = vi.fn();
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    googleLogin: mockGoogleLogin,
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Now import the component after mocks are set up
import LoginPage from '@/app/(auth)/login/page';

describe('LoginPage — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as Record<string, unknown>).__googleLoginConfig = null;
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
});
