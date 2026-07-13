import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sessionRef, mockSignInEmail, mockSignUpEmail, mockSignOut } = vi.hoisted(() => {
  const sessionRef = { current: { data: null, isPending: true } as { data: Record<string, unknown> | null; isPending: boolean } };
  return {
    sessionRef,
    mockSignInEmail: vi.fn(),
    mockSignUpEmail: vi.fn(),
    mockSignOut: vi.fn(),
  };
});

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => sessionRef.current),
    signIn: { email: mockSignInEmail },
    signUp: { email: mockSignUpEmail },
    signOut: mockSignOut,
  },
}));

import { AuthProvider, useAuth } from '@/lib/AuthContext';

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
    sessionRef.current = { data: null, isPending: true };
  });

  it('should provide null user and loading=true on initial mount', () => {
    renderWithProvider();

    expect(screen.getByTestId('user-value').textContent).toBe('null');
    expect(screen.getByTestId('loading-value').textContent).toBe('true');
  });

  it('should derive user from useSession when session is available', () => {
    sessionRef.current = {
      data: {
        user: {
          id: '123',
          name: 'Session User',
          email: 'session@test.com',
          image: 'http://pic.com/avatar.jpg',
          role: 'supporter',
          credits: 50,
          photoURL: 'http://pic.com/avatar.jpg',
        },
      },
      isPending: false,
    };

    renderWithProvider();

    const userText = screen.getByTestId('user-value').textContent;
    expect(userText).toContain('Session User');
    expect(userText).toContain('session@test.com');
    expect(screen.getByTestId('loading-value').textContent).toBe('false');
  });

  it('should set loading=false when isPending is false with no user', () => {
    sessionRef.current = { data: null, isPending: false };

    renderWithProvider();

    expect(screen.getByTestId('loading-value').textContent).toBe('false');
    expect(screen.getByTestId('user-value').textContent).toBe('null');
  });

  it('should call signIn.email with correct args on login', async () => {
    sessionRef.current = { data: null, isPending: false };
    mockSignInEmail.mockResolvedValue({ data: null, error: null });

    renderWithProvider();

    screen.getByTestId('btn-login').click();

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' });
    });
  });



  it('should call signUp.email with correct args on register', async () => {
    sessionRef.current = { data: null, isPending: false };
    mockSignUpEmail.mockResolvedValue({ data: null, error: null });

    renderWithProvider();

    screen.getByTestId('btn-register').click();

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: 'Name',
        email: 'a@b.com',
        password: 'pass',
        role: 'supporter',
        image: undefined,
      });
    });
  });

  it('should call signOut on logout', async () => {
    sessionRef.current = {
      data: {
        user: {
          id: '456',
          name: 'Login User',
          email: 'login@test.com',
          image: '',
          role: 'creator',
          credits: 20,
          photoURL: '',
        },
      },
      isPending: false,
    };

    mockSignOut.mockResolvedValue({});

    renderWithProvider();

    expect(screen.getByTestId('user-value').textContent).toContain('Login User');

    screen.getByTestId('btn-logout').click();

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
