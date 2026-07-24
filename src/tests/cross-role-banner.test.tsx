import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserRole } from '../types';

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockDismissBanner = vi.fn();
const mockSwitchRole = vi.fn();
const mockUseNotifications = vi.fn();
const mockUseAuth = vi.fn();
const mockUseNavigate = vi.fn();
const mockUseTranslation = vi.fn(() => ({ t: (k: string) => k, i18n: { language: 'en' } }));

vi.mock('../context/NotificationContext', () => ({
  useNotifications: () => mockUseNotifications(),
  NotificationProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockUseNavigate };
});

describe('CrossRoleBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no cross-role notifications', async () => {
    mockUseNotifications.mockReturnValue({ crossRoleCount: 0 });
    mockUseAuth.mockReturnValue({
      user: { roles: [UserRole.CUSTOMER, UserRole.SELLER], primaryRole: UserRole.CUSTOMER },
      switchRole: mockSwitchRole,
    });
    const CrossRoleBanner = (await import('../components/ui/CrossRoleBanner')).default;
    const { container } = render(<BrowserRouter><CrossRoleBanner /></BrowserRouter>);
    expect(container.innerHTML).toBe('');
  });

  it('renders when there are cross-role notifications', async () => {
    mockUseNotifications.mockReturnValue({ crossRoleCount: 2, dismissBanner: mockDismissBanner });
    mockUseAuth.mockReturnValue({
      user: { roles: [UserRole.CUSTOMER, UserRole.SELLER], primaryRole: UserRole.CUSTOMER },
      switchRole: mockSwitchRole,
    });
    const CrossRoleBanner = (await import('../components/ui/CrossRoleBanner')).default;
    render(<BrowserRouter><CrossRoleBanner /></BrowserRouter>);
    expect(screen.getByText(/2/)).toBeDefined();
  });

  it('calls switchRole on click', async () => {
    mockUseNotifications.mockReturnValue({ crossRoleCount: 1, dismissBanner: mockDismissBanner });
    mockUseAuth.mockReturnValue({
      user: { roles: [UserRole.CUSTOMER, UserRole.SELLER], primaryRole: UserRole.CUSTOMER },
      switchRole: mockSwitchRole,
    });
    const CrossRoleBanner = (await import('../components/ui/CrossRoleBanner')).default;
    render(<BrowserRouter><CrossRoleBanner /></BrowserRouter>);
    const buttons = screen.getAllByRole('button');
    // First button should be the switch button
    fireEvent.click(buttons[0]);
    expect(mockSwitchRole).toHaveBeenCalledWith(UserRole.SELLER);
  });
});
