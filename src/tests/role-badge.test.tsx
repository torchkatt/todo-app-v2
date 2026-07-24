import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

describe('RoleBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer role', async () => {
    const RoleBadge = (await import('../components/ui/RoleBadge')).default;
    render(<MemoryRouter><RoleBadge role={UserRole.CUSTOMER} /></MemoryRouter>);
    expect(screen.getByText('role.customer')).toBeDefined();
  });

  it('renders seller role', async () => {
    const RoleBadge = (await import('../components/ui/RoleBadge')).default;
    render(<MemoryRouter><RoleBadge role={UserRole.SELLER} /></MemoryRouter>);
    expect(screen.getByText('role.seller')).toBeDefined();
  });

  it('is clickable when onSwitch provided', async () => {
    const onSwitch = vi.fn();
    const RoleBadge = (await import('../components/ui/RoleBadge')).default;
    render(<MemoryRouter><RoleBadge role={UserRole.CUSTOMER} onSwitch={onSwitch} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button'));
    expect(onSwitch).toHaveBeenCalled();
  });
});
