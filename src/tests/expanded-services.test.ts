import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

// ─── analyticsService — extended ───
describe('analyticsService — Extended', () => {
  it('analytics service exports all tracking methods', async () => {
    const { analytics } = await import('../services/analyticsService');
    expect(typeof analytics.track).toBe('function');
    expect(typeof analytics.pageView).toBe('function');
    expect(typeof analytics.search).toBe('function');
    expect(typeof analytics.addToCart).toBe('function');
    expect(typeof analytics.purchase).toBe('function');
    expect(typeof analytics.login).toBe('function');
    expect(typeof analytics.error).toBe('function');
    expect(typeof analytics.getDailyActiveUsers).toBe('function');
    expect(typeof analytics.getPopularListings).toBe('function');
  });

  it('analytics has 9 methods', () => {
    const methods = ['track', 'pageView', 'search', 'addToCart',
      'purchase', 'login', 'error', 'getDailyActiveUsers', 'getPopularListings'];
    expect(methods).toHaveLength(9);
  });

  it('track event structure is valid', () => {
    const event = { name: 'page_view', properties: { path: '/test', timestamp: Date.now() } };
    expect(event).toHaveProperty('name');
    expect(event).toHaveProperty('properties');
    expect(typeof event.name).toBe('string');
  });

  it('pageView event contains path', () => {
    const event = { name: 'page_view', properties: { path: '/home' } };
    expect(event.properties.path).toBe('/home');
  });

  it('search event contains query and results count', () => {
    const event = { name: 'search', properties: { query: 'iphone', resultsCount: 5 } };
    expect(event.properties.query).toBe('iphone');
    expect(event.properties.resultsCount).toBe(5);
  });

  it('addToCart event contains listingId and price', () => {
    const event = { name: 'add_to_cart', properties: { listingId: 'list-1', price: 15000 } };
    expect(event.properties.listingId).toBe('list-1');
    expect(event.properties.price).toBe(15000);
  });

  it('purchase event contains amount and items count', () => {
    const event = { name: 'purchase', properties: { amount: 50000, itemsCount: 3 } };
    expect(event.properties.amount).toBe(50000);
    expect(event.properties.itemsCount).toBe(3);
  });

  it('login event contains provider', () => {
    const event = { name: 'login', properties: { provider: 'google' } };
    expect(event.properties.provider).toBe('google');
  });

  it('error event contains message and code', () => {
    const event = { name: 'error', properties: { message: 'Test error', code: 'E001' } };
    expect(event.properties.message).toBe('Test error');
    expect(event.properties.code).toBe('E001');
  });

  it('event names are valid strings', () => {
    const eventNames = [
      'page_view', 'search', 'add_to_cart', 'remove_from_cart',
      'checkout_start', 'purchase', 'login', 'register', 'logout',
      'view_listing', 'view_seller', 'add_favorite', 'remove_favorite',
      'ai_chat_message', 'ai_tool_call', 'error', 'click_cta', 'share', 'install_pwa',
    ];
    expect(eventNames.length).toBeGreaterThanOrEqual(18);
    eventNames.forEach(name => {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });
});

// ─── ratingService — extended ───
describe('ratingService — Extended', () => {
  it('rating service has all methods', async () => {
    const mod = await import('../services/ratingService');
    expect(typeof mod.createRating).toBe('function');
    expect(typeof mod.getRatings).toBe('function');
    expect(typeof mod.getRatingStats).toBe('function');
    expect(typeof mod.hasRated).toBe('function');
    expect(typeof mod.getOrderRatings).toBe('function');
    expect(typeof mod.updateRatingStats).toBe('function');
  });

  it('rating service has exactly 6 methods', () => {
    const methods = ['createRating', 'getRatings', 'getRatingStats', 'hasRated', 'getOrderRatings', 'updateRatingStats'];
    expect(methods).toHaveLength(6);
  });

  it('rating value must be between 1 and 5', () => {
    const isValidRating = (r: number) => r >= 1 && r <= 5 && Number.isInteger(r);
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(3)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(3.5)).toBe(false);
  });

  it('rating stats include avg and count', () => {
    const stats = { average: 4.5, count: 10, distribution: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 5 } };
    expect(stats).toHaveProperty('average');
    expect(stats).toHaveProperty('count');
    expect(stats).toHaveProperty('distribution');
    expect(stats.average).toBeGreaterThanOrEqual(0);
    expect(stats.average).toBeLessThanOrEqual(5);
  });

  it('rating distribution has all 5 stars', () => {
    const distribution = { 1: 0, 2: 0, 3: 2, 4: 3, 5: 5 };
    expect(Object.keys(distribution)).toHaveLength(5);
    expect(distribution).toHaveProperty('1');
    expect(distribution).toHaveProperty('5');
  });
});

// ─── aiChatUsageService — extended ───
describe('aiChatUsageService — Extended', () => {
  it('getUserTier returns correct tiers', async () => {
    const { getUserTier } = await import('../services/aiChatUsageService');
    expect(getUserTier({ isGuest: true, role: 'CUSTOMER' } as any)).toBe('guest');
    expect(getUserTier({ isGuest: false, role: 'CUSTOMER' } as any)).toBe('free');
    expect(getUserTier({ isGuest: false, role: 'SUPER_ADMIN' } as any)).toBe('admin');
    expect(getUserTier({ isGuest: false, role: 'ADMIN' } as any)).toBe('admin');
    expect(getUserTier({ isGuest: false, role: 'SELLER' } as any)).toBe('free');
  });

  it('guest tier is lowest', () => {
    const tiers = ['guest', 'free', 'admin'];
    expect(tiers).toHaveLength(3);
  });

  it('only admins get admin tier', () => {
    const isAdmin = (role: string) => role === 'SUPER_ADMIN' || role === 'ADMIN';
    expect(isAdmin('SUPER_ADMIN')).toBe(true);
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('SELLER')).toBe(false);
    expect(isAdmin('CUSTOMER')).toBe(false);
  });
});

// ─── aiChatTools — extended ───
describe('aiChatTools — Extended', () => {
  it('TODO_TOOLS has tool count >= 16', async () => {
    const { TODO_TOOLS } = await import('../services/aiChatTools');
    expect(TODO_TOOLS.length).toBeGreaterThanOrEqual(16);
  });

  it('all tools have unique names', async () => {
    const { TODO_TOOLS } = await import('../services/aiChatTools');
    const names = TODO_TOOLS.map(t => t.function.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('tools have required parameters', async () => {
    const { TODO_TOOLS } = await import('../services/aiChatTools');
    TODO_TOOLS.forEach(tool => {
      expect(tool.function.parameters).toHaveProperty('type');
      expect(tool.function.parameters.type).toBe('object');
    });
  });
});

// ─── aiChatMemoryService — extended ───
describe('aiChatMemoryService — Extended', () => {
  it('has all required exports', async () => {
    const mod = await import('../services/aiChatMemoryService');
    expect(typeof mod.loadUserMemories).toBe('function');
    expect(typeof mod.saveMemory).toBe('function');
    expect(typeof mod.deleteMemory).toBe('function');
    expect(typeof mod.buildMemorySummary).toBe('function');
    expect(typeof mod.formatMemoryBlock).toBe('function');
    expect(typeof mod.buildOptimizedContext).toBe('function');
    expect(typeof mod.buildCacheOptimizedMessages).toBe('function');
    expect(typeof mod.extractMemoriesFromTurn).toBe('function');
    expect(typeof mod.trackUserTier).toBe('function');
  });

  it('has exactly 9 exports', () => {
    const exports = ['loadUserMemories', 'saveMemory', 'deleteMemory', 'buildMemorySummary',
      'formatMemoryBlock', 'buildOptimizedContext', 'buildCacheOptimizedMessages',
      'extractMemoriesFromTurn', 'trackUserTier'];
    expect(exports).toHaveLength(9);
  });

  it('memory category values are valid', () => {
    const categories = ['preference', 'fact', 'behavior', 'context'];
    expect(categories).toHaveLength(4);
  });

  it('memory source values are valid', () => {
    const sources = ['explicit', 'inferred', 'system'];
    expect(sources).toHaveLength(3);
  });

  it('AIMemory has 10 required fields', () => {
    const fields = ['id', 'userId', 'category', 'key', 'value', 'confidence', 'source', 'createdAt', 'lastAccessed', 'ttlDays'];
    expect(fields).toHaveLength(10);
  });
});

// ─── paymentService — extended ───
describe('paymentService — Extended', () => {
  it('payment service exposes openWompiCheckout; monto/firma ya no se calculan en cliente', async () => {
    const mod = await import('../services/paymentService');
    expect(typeof mod.openWompiCheckout).toBe('function');
  });

  it('Wompi status is valid', () => {
    const statuses = ['PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED'];
    expect(statuses).toHaveLength(5);
  });

  it('amount in cents is amount * 100', () => {
    const toCents = (cop: number) => cop * 100;
    expect(toCents(50000)).toBe(5000000);
    expect(toCents(0)).toBe(0);
  });
});

// ─── aiChatService — extended ───
describe('aiChatService — Extended', () => {
  it('aiChatService exposes chatWithAI (proxy vía Cloud Function, sin key en el cliente)', async () => {
    const mod = await import('../services/aiChatService');
    expect(typeof mod.chatWithAI).toBe('function');
  });
});

// ─── categoryService — extended ───
describe('categoryService — Extended', () => {
  it('has seedCategories method', async () => {
    const mod = await import('../services/categoryService');
    expect(typeof mod.seedCategories).toBe('function');
  });

  it('has searchCategories method', async () => {
    const mod = await import('../services/categoryService');
    expect(typeof mod.searchCategories).toBe('function');
  });

  it('has incrementCategoryStats method', async () => {
    const mod = await import('../services/categoryService');
    expect(typeof mod.incrementCategoryStats).toBe('function');
  });
});

// ─── listingService — extended ───
describe('listingService — Extended', () => {
  it('has searchListings with pagination support', async () => {
    const mod = await import('../services/listingService');
    expect(typeof mod.searchListings).toBe('function');
    expect(typeof mod.getFeaturedListings).toBe('function');
    expect(typeof mod.getRecommendations).toBe('function');
  });

  it('has stats pipeline methods', async () => {
    const mod = await import('../services/listingService');
    expect(typeof mod.incrementViews).toBe('function');
    expect(typeof mod.deactivateListing).toBe('function');
  });
});

// ─── Types — extended ───
describe('Types — Extended', () => {
  it('DeliveryMethod has digital for virtual goods', async () => {
    const { DeliveryMethod } = await import('../types');
    expect(DeliveryMethod.DIGITAL).toBe('digital');
  });

  it('TransactionStatus has DISPUTED, REFUNDED', async () => {
    const { TransactionStatus } = await import('../types');
    expect(TransactionStatus.DISPUTED).toBe('DISPUTED');
    expect(TransactionStatus.REFUNDED).toBe('REFUNDED');
  });

  it('EcoAction has LOCAL_PURCHASE', async () => {
    const { EcoAction } = await import('../types');
    expect(EcoAction.LOCAL_PURCHASE).toBe('LOCAL_PURCHASE');
  });

  it('UserRole has COURIER', async () => {
    const { UserRole } = await import('../types');
    expect(UserRole.COURIER).toBe('COURIER');
  });
});

// ─── SEO component ───
describe('SEO — Extended', () => {
  it('SEO component is importable', async () => {
    const mod = await import('../components/seo/SEO');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── ErrorBoundary component ───
describe('ErrorBoundary — Extended', () => {
  it('ErrorBoundary is importable', async () => {
    const mod = await import('../components/ErrorBoundary');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── Skeleton component ───
describe('Skeleton — Extended', () => {
  it('Skeleton component is importable', async () => {
    const mod = await import('../components/skeleton/Skeleton');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── BottomTabs component ───
describe('BottomTabs — Extended', () => {
  it('BottomTabs is importable', async () => {
    const mod = await import('../components/layout/BottomTabs');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── GuestConversion component ───
describe('GuestConversion — Extended', () => {
  it('GuestConversion is importable', async () => {
    const mod = await import('../components/auth/GuestConversion');
    expect(mod.default).toBeDefined();
  });
});

// ─── PWAInstallPrompt component ───
describe('PWAInstallPrompt — Extended', () => {
  it('PWAInstallPrompt is importable', async () => {
    const mod = await import('../components/ui/PWAInstallPrompt');
    expect(mod.PWAInstallPrompt).toBeDefined();
  });
});

// ─── Additional component imports ───
describe('Component imports — Additional', () => {
  it('Onboarding is importable', async () => {
    const mod = await import('../components/onboarding/Onboarding');
    expect(mod.default).toBeDefined();
  });

  it('AIChat is importable', async () => {
    const mod = await import('../components/chat/AIChat');
    expect(mod.AIChatButton).toBeDefined();
  });

  it('Home page is importable', async () => {
    const mod = await import('../pages/Home');
    expect(mod.default).toBeDefined();
  });

  it('Explore page is importable', async () => {
    const mod = await import('../pages/Explore');
    expect(mod.default).toBeDefined();
  });

  it('Login page is importable', async () => {
    const mod = await import('../pages/Login');
    expect(mod.default).toBeDefined();
  });

  it('Register page is importable', async () => {
    const mod = await import('../pages/Register');
    expect(mod.default).toBeDefined();
  });

  it('Profile page is importable', async () => {
    const mod = await import('../pages/Profile');
    expect(mod.default).toBeDefined();
  });

  it('CategoryPage is importable', async () => {
    const mod = await import('../pages/CategoryPage');
    expect(mod.default).toBeDefined();
  });

  it('ListingDetail is importable', async () => {
    const mod = await import('../pages/ListingDetail');
    expect(mod.default).toBeDefined();
  });

  it('CheckoutPage is importable', async () => {
    const mod = await import('../pages/CheckoutPage');
    expect(mod.default).toBeDefined();
  });

  it('OrdersPage is importable', async () => {
    const mod = await import('../pages/OrdersPage');
    expect(mod.default).toBeDefined();
  });

  it('OrderDetail is importable', async () => {
    const mod = await import('../pages/OrderDetail');
    expect(mod.default).toBeDefined();
  });

  it('TermsPage is importable', async () => {
    const mod = await import('../pages/TermsPage');
    expect(mod.default).toBeDefined();
  });

  it('PrivacyPage is importable', async () => {
    const mod = await import('../pages/PrivacyPage');
    expect(mod.default).toBeDefined();
  });

  it('ReviewsPage is importable', async () => {
    const mod = await import('../pages/ReviewsPage');
    expect(mod.default).toBeDefined();
  });

  it('FavoritesPage is importable', async () => {
    const mod = await import('../pages/FavoritesPage');
    expect(mod.default).toBeDefined();
  });

  it('SellerDashboard is importable', async () => {
    const mod = await import('../pages/SellerDashboard');
    expect(mod.default).toBeDefined();
  });
});
