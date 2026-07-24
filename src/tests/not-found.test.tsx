import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('../i18n', () => ({ default: { t: (k: string) => k, language: 'en', changeLanguage: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }) }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', fullName: 'Test', email: 'test@test.com' }, isAuthenticated: true, loading: false }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));
vi.mock('../context/CartContext', () => ({
  useCart: () => ({ items: [], totalItems: 0 }),
  CartProvider: ({ children }: any) => <>{children}</>,
}));

describe('NotFoundPage', () => {
  it('renders 404 heading', async () => {
    const NotFoundPage = (await import('../pages/NotFoundPage')).default;
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('notFound.title')).toBeDefined();
  });

  it('has go-home button', async () => {
    const NotFoundPage = (await import('../pages/NotFoundPage')).default;
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('notFound.goHome')).toBeDefined();
  });

  it('has back button', async () => {
    const NotFoundPage = (await import('../pages/NotFoundPage')).default;
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('common.back')).toBeDefined();
  });
});
