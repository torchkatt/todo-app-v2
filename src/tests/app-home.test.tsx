import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('../i18n', () => ({ default: { t: (k: string) => k, language: 'en', changeLanguage: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }) }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', fullName: 'Test', role: 'CUSTOMER' }, isAuthenticated: true, loading: false }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));
vi.mock('../context/CartContext', () => ({
  useCart: () => ({ items: [], totalItems: 0 }),
  CartProvider: ({ children }: any) => <>{children}</>,
}));

// Mock Firestore getDocs for the featured query
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(async () => ({ docs: [], empty: true, size: 0 })),
  getDoc: vi.fn(),
  doc: vi.fn(),
  getCountFromServer: vi.fn(async () => ({ data: () => ({ count: 0 }) })),
  Timestamp: { now: () => new Date(), fromMillis: (n: number) => new Date(n) },
  serverTimestamp: () => new Date(),
}));

describe('AppHome', () => {
  it('renders without crashing', async () => {
    const AppHome = (await import('../pages/AppHome')).default;
    const { container } = render(<AppHome />, { wrapper });
    expect(container).toBeTruthy();
  });
});
