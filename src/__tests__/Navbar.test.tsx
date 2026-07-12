import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: any;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock react-icons
vi.mock('react-icons/hi', () => ({
  HiMenu: () => <span data-testid="icon-menu">Menu</span>,
  HiX: () => <span data-testid="icon-x">X</span>,
  HiLogout: () => <span data-testid="icon-logout">LogoutIcon</span>,
}));

// We'll test with different auth states by varying the mock
let mockAuthState: {
  user: { name: string; email: string } | null;
  logout: ReturnType<typeof vi.fn>;
} = {
  user: null,
  logout: vi.fn(),
};

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

import Navbar from '@/components/Navbar';

describe('Navbar — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      logout: vi.fn(),
    };
  });

  it('should show Login and Register links when user is null (logged out)', () => {
    render(<Navbar />);

    const loginLink = screen.getByRole('link', { name: /login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');

    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should show user name and Logout button when user is logged in', () => {
    mockAuthState = {
      user: { name: 'John Doe', email: 'john@example.com' },
      logout: vi.fn(),
    };

    render(<Navbar />);

    // User name should be displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Logout button should be present
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('should NOT show Login/Register links when user is logged in', () => {
    mockAuthState = {
      user: { name: 'Jane Doe', email: 'jane@example.com' },
      logout: vi.fn(),
    };

    render(<Navbar />);

    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
  });

  it('should NOT show user name or Logout when user is null', () => {
    render(<Navbar />);

    expect(screen.queryByText(/John|Jane|Logout/)).not.toBeInTheDocument();
  });
});
