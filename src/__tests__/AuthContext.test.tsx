import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock the api module before importing AuthContext
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: Parameters<typeof mockApiGet>) => mockApiGet(...args),
    post: (...args: Parameters<typeof mockApiPost>) => mockApiPost(...args),
  },
}));

import { AuthProvider, useAuth } from '@/lib/AuthContext';

/**
 * Helper component that exposes auth context state for testing.
 */
function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user-value">{auth.user ? JSON.stringify(auth.user) : 'null'}</div>
      <div data-testid="loading-value">{String(auth.loading)}</div>
      <button data-testid="btn-login" onClick={() => auth.login('a@b.com', 'pass')}>
        Login
      </button>
      <button
        data-testid="btn-register"
        onClick={() => auth.register('Name', 'a@b.com', 'pass', 'supporter')}
      >
        Register
      </button>
      <button data-testid="btn-google" onClick={() => auth.googleLogin('google-token')}>
        Google Login
      </button>
      <button data-testid="btn-logout" onClick={() => auth.logout()}>
        Logout
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe('AuthContext — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide null user and loading=true on initial mount', () => {
    // Make GET /api/auth/me never resolve to keep loading=true
    mockApiGet.mockReturnValue(new Promise(() => {}));

    renderWithProvider();

    expect(screen.getByTestId('user-value').textContent).toBe('null');
    expect(screen.getByTestId('loading-value').textContent).toBe('true');
  });

  it('should call GET /api/auth/me on mount and set user when response has user', async () => {
    const mockUser = {
      id: '123',
      name: 'Session User',
      email: 'session@test.com',
      photoURL: '',
      role: 'supporter' as const,
      credits: 50,
    };

    mockApiGet.mockResolvedValue({ user: mockUser });

    renderWithProvider();

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/api/auth/me');
    });

    await waitFor(() => {
      const userText = screen.getByTestId('user-value').textContent;
      expect(userText).toContain('Session User');
      expect(userText).toContain('session@test.com');
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading-value').textContent).toBe('false');
    });
  });

  it('should set user via login function calling POST /api/auth/login', async () => {
    // Make GET /api/auth/me return no user (session restore not applicable)
    mockApiGet.mockRejectedValue(new Error('No session'));

    const mockUser = {
      id: '456',
      name: 'Login User',
      email: 'login@test.com',
      photoURL: '',
      role: 'creator' as const,
      credits: 20,
    };

    mockApiPost.mockResolvedValue({ user: mockUser });

    renderWithProvider();

    // Wait for initial loading to finish (GET /api/auth/me fails)
    await waitFor(() => {
      expect(screen.getByTestId('loading-value').textContent).toBe('false');
    });

    // Trigger login
    screen.getByTestId('btn-login').click();

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/auth/login', {
        email: 'a@b.com',
        password: 'pass',
      });
    });

    await waitFor(() => {
      const userText = screen.getByTestId('user-value').textContent;
      expect(userText).toContain('Login User');
    });
  });

  it('should set user via register function calling POST /api/auth/register', async () => {
    mockApiGet.mockRejectedValue(new Error('No session'));

    const mockUser = {
      id: '789',
      name: 'Register User',
      email: 'register@test.com',
      photoURL: 'http://pic.com/avatar.jpg',
      role: 'supporter' as const,
      credits: 50,
    };

    mockApiPost.mockResolvedValue({ user: mockUser });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading-value').textContent).toBe('false');
    });

    screen.getByTestId('btn-register').click();

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/auth/register', {
        name: 'Name',
        email: 'a@b.com',
        password: 'pass',
        role: 'supporter',
        photoURL: undefined,
      });
    });

    await waitFor(() => {
      const userText = screen.getByTestId('user-value').textContent;
      expect(userText).toContain('Register User');
    });
  });

  it('should set user via googleLogin function calling POST /api/auth/google', async () => {
    mockApiGet.mockRejectedValue(new Error('No session'));

    const mockUser = {
      id: '101',
      name: 'Google User',
      email: 'google@test.com',
      photoURL: 'http://pic.com/google.jpg',
      role: 'supporter' as const,
      credits: 50,
    };

    mockApiPost.mockResolvedValue({ user: mockUser });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading-value').textContent).toBe('false');
    });

    screen.getByTestId('btn-google').click();

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/auth/google', {
        access_token: 'google-token',
      });
    });

    await waitFor(() => {
      const userText = screen.getByTestId('user-value').textContent;
      expect(userText).toContain('Google User');
    });
  });

  it('should clear user via logout function calling POST /api/auth/logout', async () => {
    mockApiGet.mockRejectedValue(new Error('No session'));

    // First, simulate a logged-in user
    const mockUser = {
      id: '456',
      name: 'Login User',
      email: 'login@test.com',
      photoURL: '',
      role: 'creator' as const,
      credits: 20,
    };

    // Set up login to work
    mockApiPost.mockResolvedValueOnce({ user: mockUser });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading-value').textContent).toBe('false');
    });

    // Log in first
    screen.getByTestId('btn-login').click();

    await waitFor(() => {
      const userText = screen.getByTestId('user-value').textContent;
      expect(userText).toContain('Login User');
    });

    // Now set up logout to succeed
    mockApiPost.mockResolvedValueOnce({ message: 'Logged out successfully.' });

    // Logout
    screen.getByTestId('btn-logout').click();

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/auth/logout', {});
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-value').textContent).toBe('null');
    });
  });
});
