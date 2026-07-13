import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

// Mock @react-oauth/google
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: vi.fn(() => () => {}),
}));

// Mock AuthContext
const mockRegister = vi.fn();
const mockGoogleLogin = vi.fn();
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    googleLogin: mockGoogleLogin,
    register: mockRegister,
    logout: vi.fn(),
  }),
}));

import RegisterPage from '@/app/(auth)/register/page';

describe('RegisterPage — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render registration form with all required fields', () => {
    render(<RegisterPage />);

    // All spec fields: name, email, password, role, photo URL
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    // Photo URL field (optional)
    const photoInput = screen.getByPlaceholderText('https://example.com/photo.jpg');
    expect(photoInput).toBeInTheDocument();

    // Submit button
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should render a Google sign-up button', () => {
    render(<RegisterPage />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).not.toBeDisabled();
  });

  it('should show a link to the login page', () => {
    render(<RegisterPage />);

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should display role selector with supporter (50 credits) and creator (20 credits)', () => {
    render(<RegisterPage />);

    // Both role options should be present
    expect(screen.getByText('Supporter')).toBeInTheDocument();
    expect(screen.getByText('Creator')).toBeInTheDocument();

    // Credit info should be visible
    expect(screen.getByText('50 free credits')).toBeInTheDocument();
    expect(screen.getByText('20 free credits')).toBeInTheDocument();

    // Supporter should be the default selected role
    const supporterButton = screen.getByText('Supporter').closest('button');
    expect(supporterButton).toHaveClass('border-primary');
  });

  it('should display an error message when registration fails', async () => {
    mockRegister.mockRejectedValue(new Error('Email already registered.'));

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already registered.')).toBeInTheDocument();
    });
  });

  it('should call register with form data on submit and redirect', async () => {
    const mockPush = vi.fn();
    vi.mocked((await import('next/navigation')) as Record<string, unknown>).useRouter = () => ({ push: mockPush });

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'New User',
        'new@example.com',
        'securepass',
        'supporter', // default role
        undefined,   // no photo URL provided
      );
    });
  });

  it('should allow switching between supporter and creator roles', () => {
    render(<RegisterPage />);

    const creatorButton = screen.getByText('Creator').closest('button')!;
    fireEvent.click(creatorButton);

    // Creator should now have the selected styling
    expect(creatorButton).toHaveClass('border-primary');

    const supporterButton = screen.getByText('Supporter').closest('button')!;
    expect(supporterButton).not.toHaveClass('border-primary');
  });
});
