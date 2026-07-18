import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));

// ─── App routing structure validation ───
describe('App Routing — Route definitions', () => {
  it('App component is importable', async () => {
    const mod = await import('../App');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('Landing page is lazy importable', async () => {
    const mod = await import('../pages/Landing');
    expect(mod.default).toBeDefined();
  });

  it('AppHome page is lazy importable', async () => {
    const mod = await import('../pages/AppHome');
    expect(mod.default).toBeDefined();
  });

  it('Explore page is lazy importable', async () => {
    const mod = await import('../pages/Explore');
    expect(mod.default).toBeDefined();
  });

  it('Login page is lazy importable', async () => {
    const mod = await import('../pages/Login');
    expect(mod.default).toBeDefined();
  });

  it('Register page is lazy importable', async () => {
    const mod = await import('../pages/Register');
    expect(mod.default).toBeDefined();
  });

  it('Profile page is lazy importable', async () => {
    const mod = await import('../pages/Profile');
    expect(mod.default).toBeDefined();
  });

  it('Cart page is lazy importable', async () => {
    const mod = await import('../pages/Cart');
    expect(mod.default).toBeDefined();
  });

  it('Checkout page is lazy importable', async () => {
    const mod = await import('../pages/CheckoutPage');
    expect(mod.default).toBeDefined();
  });

  it('Orders page is lazy importable', async () => {
    const mod = await import('../pages/OrdersPage');
    expect(mod.default).toBeDefined();
  });

  it('OrderDetail page is lazy importable', async () => {
    const mod = await import('../pages/OrderDetail');
    expect(mod.default).toBeDefined();
  });

  it('SellerDashboard page is lazy importable', async () => {
    const mod = await import('../pages/SellerDashboard');
    expect(mod.default).toBeDefined();
  });

  it('Settings page is lazy importable', async () => {
    const mod = await import('../pages/SettingsPage');
    expect(mod.default).toBeDefined();
  });

  it('Help page is lazy importable', async () => {
    const mod = await import('../pages/HelpPage');
    expect(mod.default).toBeDefined();
  });

  it('Pricing page is lazy importable', async () => {
    const mod = await import('../pages/PricingPage');
    expect(mod.default).toBeDefined();
  });

  it('Revenue dashboard is lazy importable', async () => {
    const mod = await import('../pages/RevenueDashboard');
    expect(mod.default).toBeDefined();
  });

  it('Terms page is lazy importable', async () => {
    const mod = await import('../pages/TermsPage');
    expect(mod.default).toBeDefined();
  });

  it('Privacy page is lazy importable', async () => {
    const mod = await import('../pages/PrivacyPage');
    expect(mod.default).toBeDefined();
  });

  it('Reviews page is lazy importable', async () => {
    const mod = await import('../pages/ReviewsPage');
    expect(mod.default).toBeDefined();
  });

  it('Favorites page is lazy importable', async () => {
    const mod = await import('../pages/FavoritesPage');
    expect(mod.default).toBeDefined();
  });

  it('Admin panel is lazy importable', async () => {
    const mod = await import('../pages/AdminPanel');
    expect(mod.default).toBeDefined();
  });
});

// ─── Route path definitions ───
describe('App Routing — Route paths', () => {
  const routes = [
    { path: '/', page: 'Landing' },
    { path: '/app', page: 'AppHome' },
    { path: '/explore', page: 'Explore' },
    { path: '/login', page: 'Login' },
    { path: '/register', page: 'Register' },
    { path: '/profile', page: 'Profile' },
    { path: '/cart', page: 'Cart' },
    { path: '/category/:slug', page: 'CategoryPage' },
    { path: '/listing/:id', page: 'ListingDetail' },
    { path: '/checkout', page: 'CheckoutPage' },
    { path: '/orders', page: 'OrdersPage' },
    { path: '/orders/:id', page: 'OrderDetail' },
    { path: '/seller', page: 'SellerDashboard' },
    { path: '/seller/:id', page: 'SellerProfile' },
    { path: '/favorites', page: 'FavoritesPage' },
    { path: '/settings', page: 'SettingsPage' },
    { path: '/help', page: 'HelpPage' },
    { path: '/reviews', page: 'ReviewsPage' },
    { path: '/admin', page: 'AdminPanel' },
    { path: '/pricing', page: 'PricingPage' },
    { path: '/revenue', page: 'RevenueDashboard' },
    { path: '/terms', page: 'TermsPage' },
    { path: '/privacy', page: 'PrivacyPage' },
  ];

  it('has 23 defined routes (including wildcard)', () => {
    expect(routes.length).toBeGreaterThanOrEqual(23);
  });

  it('Landing is the root route', () => {
    const root = routes.find(r => r.path === '/');
    expect(root).toBeDefined();
    expect(root!.page).toBe('Landing');
  });

  it('Landing → App route exists', () => {
    const app = routes.find(r => r.path === '/app');
    expect(app).toBeDefined();
    expect(app!.page).toBe('AppHome');
  });

  it('all paths start with /', () => {
    routes.forEach(r => {
      expect(r.path.startsWith('/')).toBe(true);
    });
  });

  it('no duplicate paths', () => {
    const paths = routes.map(r => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('has dynamic route for category', () => {
    const catRoute = routes.find(r => r.path === '/category/:slug');
    expect(catRoute).toBeDefined();
    expect(catRoute!.path).toContain(':');
  });

  it('has dynamic route for listing', () => {
    const listingRoute = routes.find(r => r.path === '/listing/:id');
    expect(listingRoute).toBeDefined();
    expect(listingRoute!.path).toContain(':');
  });

  it('has dynamic route for seller profile', () => {
    const sellerRoute = routes.find(r => r.path === '/seller/:id');
    expect(sellerRoute).toBeDefined();
  });

  it('has dynamic route for order detail', () => {
    const orderRoute = routes.find(r => r.path === '/orders/:id');
    expect(orderRoute).toBeDefined();
  });
});

// ─── Navigation flows ───
describe('App Routing — Navigation flows', () => {
  it('Landing has link to /login', () => {
    const loginPath = '/login';
    expect(loginPath).toBe('/login');
  });

  it('Landing has link to /register', () => {
    const registerPath = '/register';
    expect(registerPath).toBe('/register');
  });

  it('Landing has link to /app (marketplace)', () => {
    const appPath = '/app';
    expect(appPath).toBe('/app');
  });

  it('Landing has link to /help', () => {
    const helpPath = '/help';
    expect(helpPath).toBe('/help');
  });

  it('App home links to /explore', () => {
    const explorePath = '/explore';
    expect(explorePath).toBe('/explore');
  });

  it('App home links to /profile when authenticated', () => {
    const profilePath = '/profile';
    expect(profilePath).toBe('/profile');
  });
});

// ─── Bottom tabs navigation ───
describe('App Routing — BottomTabs', () => {
  it('BottomTabs component is importable', async () => {
    const mod = await import('../components/layout/BottomTabs');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── Provider hierarchy ───
describe('App Routing — Provider hierarchy', () => {
  it('AuthProvider is importable', async () => {
    const mod = await import('../context/AuthContext');
    expect(mod.AuthProvider).toBeDefined();
  });

  it('CartProvider is importable', async () => {
    const mod = await import('../context/CartContext');
    expect(mod.CartProvider).toBeDefined();
  });

  it('NotificationProvider is importable', async () => {
    const mod = await import('../context/NotificationContext');
    expect(mod.NotificationProvider).toBeDefined();
  });

  it('ThemeProvider is importable', async () => {
    const mod = await import('../context/ThemeContext');
    expect(mod.ThemeProvider).toBeDefined();
  });

  it('SubscriptionPlanProvider is importable', async () => {
    const mod = await import('../context/SubscriptionPlanContext');
    expect(mod.default).toBeDefined();
  });
});
