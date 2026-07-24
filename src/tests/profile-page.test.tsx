import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('../i18n', () => ({ default: { t: (k: string) => k, language: 'en', changeLanguage: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }) }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', fullName: 'Test User', email: 'test@test.com', primaryRole: 'CUSTOMER', roles: ['CUSTOMER'], isGuest: false, isVerified: true, impact: { points: 100, level: 'HERO', totalSpent: 50000, totalTransactions: 5, streak: { current: 3, best: 7, multiplier: 1, lastTransactionDate: '' } } },
    isAuthenticated: true, loading: false, logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('../context/NotificationContext', () => ({
  useNotifications: () => ({ unreadCount: 0, notifications: [] }),
  NotificationProvider: ({ children }: any) => <>{children}</>,
}));

// Mock Firestore getDocs
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), query: vi.fn(), where: vi.fn(),
  orderBy: vi.fn(), limit: vi.fn(),
  getDocs: vi.fn(async () => ({ docs: [], empty: true, size: 0 })),
  getDoc: vi.fn(), doc: vi.fn(),
  serverTimestamp: () => new Date(),
}));

describe('Profile', () => {
  it('renders user name', async () => {
    const Profile = (await import('../pages/Profile')).default;
    render(<MemoryRouter><Profile /></MemoryRouter>);
    expect(screen.getByText('Test User')).toBeDefined();
  });

  it('renders profile title', async () => {
    const Profile = (await import('../pages/Profile')).default;
    render(<MemoryRouter><Profile /></MemoryRouter>);
    expect(screen.getByText('profile.title')).toBeDefined();
  });
});
