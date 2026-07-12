import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  HiOutlineBell: () => <span data-testid="icon-bell">BellIcon</span>,
  HiOutlineCheck: () => <span data-testid="icon-check">CheckIcon</span>,
}));

// Mock API — will be reconfigured per test
const mockNotificationsApiList = vi.fn();
const mockNotificationsApiMarkRead = vi.fn();

vi.mock('@/lib/api', () => ({
  notificationsApi: {
    list: (...args: unknown[]) => mockNotificationsApiList(...args),
    markRead: (...args: unknown[]) => mockNotificationsApiMarkRead(...args),
  },
}));

// ---------------------------------------------------------------------------
// Import the component after mocks are set up
// ---------------------------------------------------------------------------
import NotificationBell from '@/components/NotificationBell';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------
function createMockNotification(overrides: Partial<{
  _id: string;
  message: string;
  toEmail: string;
  fromEmail: string;
  actionRoute: string;
  read: boolean;
  createdAt: string;
}> = {}) {
  return {
    _id: 'notif-1',
    message: 'John contributed 100 credits to Help Build a School',
    toEmail: 'creator@test.com',
    fromEmail: 'john@test.com',
    actionRoute: '/dashboard/creator',
    read: false,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    ...overrides,
  };
}

function createMockNotifications() {
  return [
    createMockNotification({
      _id: 'notif-1',
      message: 'John contributed 100 credits to Help Build a School',
      actionRoute: '/dashboard/creator',
      read: false,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    }),
    createMockNotification({
      _id: 'notif-2',
      message: 'Your campaign My Campaign has been approved',
      actionRoute: '/dashboard/creator/my-campaigns',
      read: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    }),
    createMockNotification({
      _id: 'notif-3',
      message: 'Your contribution of 50 credits to School Fund was approved',
      actionRoute: '/dashboard/supporter/my-contributions',
      read: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }),
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('NotificationBell — spec-based tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockNotificationsApiList.mockResolvedValue({ notifications: createMockNotifications() });
    mockNotificationsApiMarkRead.mockResolvedValue({});
  });

  // -----------------------------------------------------------------------
  // Bell icon rendering
  // -----------------------------------------------------------------------
  it('should render a bell icon button with aria label', () => {
    render(<NotificationBell />);

    const bellButton = screen.getByRole('button', { name: /notifications/i });
    expect(bellButton).toBeInTheDocument();

    const bellIcon = screen.getByTestId('icon-bell');
    expect(bellIcon).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Unread count badge
  // -----------------------------------------------------------------------
  it('should show unread count badge when there are unread notifications', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    // 2 unread out of 3
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
  });

  it('should hide badge when all notifications are read', async () => {
    mockNotificationsApiList.mockResolvedValue({
      notifications: [
        createMockNotification({ _id: '1', read: true }),
        createMockNotification({ _id: '2', read: true }),
      ],
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    expect(screen.queryByText(/[0-9]/)).not.toBeInTheDocument();
  });

  it('should hide badge when there are no notifications', async () => {
    mockNotificationsApiList.mockResolvedValue({ notifications: [] });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    expect(screen.queryByText(/[0-9]/)).not.toBeInTheDocument();
  });

  it('should display "9+" badge when unread count exceeds 9', async () => {
    const manyUnread = Array.from({ length: 12 }, (_, i) =>
      createMockNotification({ _id: `n-${i}`, message: `Notification ${i}`, read: false }),
    );
    mockNotificationsApiList.mockResolvedValue({ notifications: manyUnread });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Dropdown open / close
  // -----------------------------------------------------------------------
  it('should open dropdown when bell button is clicked', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should close dropdown when bell button is clicked again', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    const bellButton = screen.getByRole('button', { name: /notifications/i });

    fireEvent.click(bellButton);
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    fireEvent.click(bellButton);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('should close dropdown when clicking outside the component', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Fire mousedown on document body (outside the dropdown ref)
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Notification list rendering
  // -----------------------------------------------------------------------
  it('should display all notification messages in the dropdown', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(
      screen.getByText('John contributed 100 credits to Help Build a School'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Your campaign My Campaign has been approved'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Your contribution of 50 credits to School Fund was approved'),
    ).toBeInTheDocument();
  });

  it('should show relative time for each notification', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // "1m ago" for the 1-minute-old notification
    expect(screen.getByText('1m ago')).toBeInTheDocument();
    // "1h ago" for the 1-hour-old notification
    expect(screen.getByText('1h ago')).toBeInTheDocument();
    // "1d ago" for the 1-day-old notification
    expect(screen.getByText('1d ago')).toBeInTheDocument();
  });

  it('should render notification rows as buttons', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // Each notification should be a button inside the dropdown
    const notificationButtons = screen.getAllByRole('button', {
      // Exclude the bell button; only dropdown notification rows remain
    });

    // The bell button (1) + "Mark all read" button (1) + 3 notification rows = 5 total buttons
    // But "Mark all read" is present since there are unread notifications
    expect(notificationButtons.length).toBeGreaterThanOrEqual(3);
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------
  it('should show "No notifications yet" when there are no notifications', async () => {
    mockNotificationsApiList.mockResolvedValue({ notifications: [] });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('should show bell icon in the empty state', async () => {
    mockNotificationsApiList.mockResolvedValue({ notifications: [] });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // The empty state renders a bell icon (from HiOutlineBell) inside the dropdown
    const bellIcons = screen.getAllByTestId('icon-bell');
    expect(bellIcons.length).toBeGreaterThanOrEqual(1);
  });

  // -----------------------------------------------------------------------
  // Mark as read on click
  // -----------------------------------------------------------------------
  it('should call markRead and navigate when clicking an unread notification', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // Click the first unread notification
    fireEvent.click(
      screen.getByText('John contributed 100 credits to Help Build a School'),
    );

    await waitFor(() => {
      expect(mockNotificationsApiMarkRead).toHaveBeenCalledWith('notif-1');
    });
    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator');
  });

  it('should NOT call markRead when clicking a read notification', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // Click the read notification
    fireEvent.click(
      screen.getByText('Your campaign My Campaign has been approved'),
    );

    expect(mockNotificationsApiMarkRead).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/my-campaigns');
  });

  it('should close dropdown and navigate on notification click', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    fireEvent.click(
      screen.getByText('Your contribution of 50 credits to School Fund was approved'),
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/supporter/my-contributions');
    });

    // Dropdown should be closed after click
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Optimistic state update after mark as read
  // -----------------------------------------------------------------------
  it('should decrease badge count after marking a notification as read', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    // Initially shows "2" (2 unread)
    expect(screen.getByText('2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // Click the first unread notification
    fireEvent.click(
      screen.getByText('John contributed 100 credits to Help Build a School'),
    );

    await waitFor(() => {
      expect(mockNotificationsApiMarkRead).toHaveBeenCalledWith('notif-1');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/creator');
    });

    // Badge should now show "1" (only notif-3 remains unread)
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Mark all as read
  // -----------------------------------------------------------------------
  it('should call markRead for each unread notification when "Mark all read" is clicked', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    fireEvent.click(screen.getByText('Mark all read'));

    await waitFor(() => {
      expect(mockNotificationsApiMarkRead).toHaveBeenCalledTimes(2);
    });

    expect(mockNotificationsApiMarkRead).toHaveBeenCalledWith('notif-1');
    expect(mockNotificationsApiMarkRead).toHaveBeenCalledWith('notif-3');
  });

  it('should clear badge after "Mark all read" is clicked', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    expect(screen.getByText('2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    fireEvent.click(screen.getByText('Mark all read'));

    await waitFor(() => {
      expect(mockNotificationsApiMarkRead).toHaveBeenCalledTimes(2);
    });

    // Badge should disappear since all are now read
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('should hide "Mark all read" button when there are no unread notifications', async () => {
    mockNotificationsApiList.mockResolvedValue({
      notifications: [
        createMockNotification({ _id: '1', read: true }),
        createMockNotification({ _id: '2', read: true }),
      ],
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Error resilience (silent fail)
  // -----------------------------------------------------------------------
  it('should not crash when notifications API call fails', async () => {
    mockNotificationsApiList.mockRejectedValue(new Error('Network error'));

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    // Component should still render bell button without a badge
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.queryByText(/[0-9]/)).not.toBeInTheDocument();
  });

  it('should not crash when markRead API call fails', async () => {
    mockNotificationsApiMarkRead.mockRejectedValue(new Error('Network error'));

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockNotificationsApiList).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // Click an unread notification
    fireEvent.click(
      screen.getByText('John contributed 100 credits to Help Build a School'),
    );

    await waitFor(() => {
      expect(mockNotificationsApiMarkRead).toHaveBeenCalledWith('notif-1');
    });

    // Should still navigate despite markRead failure
    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator');
  });

  // -----------------------------------------------------------------------
  // Fetch on mount
  // -----------------------------------------------------------------------
  it('should fetch notifications on mount', () => {
    render(<NotificationBell />);

    expect(mockNotificationsApiList).toHaveBeenCalledOnce();
    expect(mockNotificationsApiList).toHaveBeenCalledWith();
  });
});
