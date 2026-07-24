import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { UserRole } from '../types';

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockSwitchRole = vi.fn();
const mockUseAuth = vi.fn();
const mockUseNavigate = vi.fn();
const mockUseTranslation = vi.fn(() => ({ t: (k: string) => k, i18n: { language: 'en' } }));

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

describe('RoleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing for single-role user', async () => {
    mockUseAuth.mockReturnValue({
      user: { roles: [UserRole.CUSTOMER], primaryRole: UserRole.CUSTOMER },
      switchRole: mockSwitchRole,
    });
    const RoleSwitcher = (await import('../components/ui/RoleSwitcher')).default;
    const { container } = render(<BrowserRouter><RoleSwitcher /></BrowserRouter>);
    expect(container.innerHTML).toBe('');
  });

  it('renders switcher for multi-role user', async () => {
    mockUseAuth.mockReturnValue({
      user: { roles: [UserRole.CUSTOMER, UserRole.SELLER], primaryRole: UserRole.CUSTOMER },
      switchRole: mockSwitchRole,
    });
    const RoleSwitcher = (await import('../components/ui/RoleSwitcher')).default;
    render(<BrowserRouter><RoleSwitcher /></BrowserRouter>);
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('calls switchRole on click', async () => {
    mockUseAuth.mockReturnValue({
      user: { roles: [UserRole.CUSTOMER, UserRole.SELLER], primaryRole: UserRole.CUSTOMER },
      switchRole: mockSwitchRole,
    });
    const RoleSwitcher = (await import('../components/ui/RoleSwitcher')).default;
    render(<BrowserRouter><RoleSwitcher /></BrowserRouter>);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSwitchRole).toHaveBeenCalledWith(UserRole.SELLER);
  });
});
