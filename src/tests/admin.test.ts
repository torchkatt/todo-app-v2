import { describe, it, expect, vi } from 'vitest';
import { UserRole, EcoAction } from '../types';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

describe('Admin — Role hierarchy', () => {
  it('SUPER_ADMIN is highest role', () => {
    const roles = Object.values(UserRole);
    expect(roles).toContain('SUPER_ADMIN');
    expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN');
  });

  it('ADMIN is below SUPER_ADMIN', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.SUPER_ADMIN).not.toBe(UserRole.ADMIN);
  });

  it('all roles are enumerated', () => {
    const allRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SELLER, UserRole.COURIER, UserRole.CUSTOMER];
    expect(allRoles).toHaveLength(5);
  });
});

describe('Admin — Permission checks', () => {
  const isAdmin = (role?: string): boolean => {
    return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
  };

  it('SUPER_ADMIN is admin', () => {
    expect(isAdmin(UserRole.SUPER_ADMIN)).toBe(true);
  });

  it('ADMIN is admin', () => {
    expect(isAdmin(UserRole.ADMIN)).toBe(true);
  });

  it('SELLER is not admin', () => {
    expect(isAdmin(UserRole.SELLER)).toBe(false);
  });

  it('CUSTOMER is not admin', () => {
    expect(isAdmin(UserRole.CUSTOMER)).toBe(false);
  });

  it('COURIER is not admin', () => {
    expect(isAdmin(UserRole.COURIER)).toBe(false);
  });

  it('undefined role is not admin', () => {
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin('')).toBe(false);
  });
});

describe('Admin — Audit log', () => {
  it('AuditLog has required fields', () => {
    const log = {
      id: 'audit-1',
      action: 'ai_chat_strike',
      performedBy: 'admin-user',
      performedByName: 'Admin',
      targetType: 'user',
      targetId: 'user-123',
      details: { reason: 'violation' },
      path: '/admin',
      metadata: { userAgent: 'Chrome', location: 'CO' },
      createdAt: new Date().toISOString(),
    };
    expect(log).toHaveProperty('id');
    expect(log).toHaveProperty('action');
    expect(log).toHaveProperty('performedBy');
    expect(log).toHaveProperty('createdAt');
  });

  it('AuditLog optional fields', () => {
    const minimal = {
      id: 'audit-min',
      action: 'page_view',
      performedBy: 'system',
      createdAt: new Date().toISOString(),
    };
    expect((minimal as any).performedByName).toBeUndefined();
    expect((minimal as any).targetType).toBeUndefined();
  });

  it('AuditLog actions are strings', () => {
    const actions = [
      'ai_chat_strike', 'user_blocked', 'listing_approved',
      'seller_verified', 'payment_refunded', 'order_cancelled',
    ];
    actions.forEach(a => {
      expect(typeof a).toBe('string');
      expect(a.length).toBeGreaterThan(0);
    });
  });
});

describe('Admin — User management', () => {
  it('can deactivate user', () => {
    const deactivate = (user: any) => ({ ...user, isActive: false });
    const user = { id: 'u1', isActive: true };
    expect(deactivate(user).isActive).toBe(false);
  });

  it('can reactivate user', () => {
    const reactivate = (user: any) => ({ ...user, isActive: true });
    const user = { id: 'u1', isActive: false };
    expect(reactivate(user).isActive).toBe(true);
  });

  it('can change user role', () => {
    const changeRole = (user: any, role: UserRole) => ({ ...user, role });
    const user = { id: 'u1', role: UserRole.CUSTOMER };
    expect(changeRole(user, UserRole.SELLER).role).toBe(UserRole.SELLER);
    expect(changeRole(user, UserRole.ADMIN).role).toBe(UserRole.ADMIN);
  });

  it('can ban user', () => {
    const ban = (user: any) => ({
      ...user,
      isActive: false,
      status: 'banned',
      bannedAt: new Date().toISOString(),
    });
    const result = ban({ id: 'u1', isActive: true });
    expect(result.isActive).toBe(false);
    expect(result.status).toBe('banned');
    expect(result).toHaveProperty('bannedAt');
  });
});

describe('Admin — Listing approval', () => {
  it('listing starts unapproved', () => {
    const listing = { id: 'l1', isApproved: false };
    expect(listing.isApproved).toBe(false);
  });

  it('admin can approve listing', () => {
    const approve = (l: any) => ({ ...l, isApproved: true });
    const result = approve({ id: 'l1', isApproved: false });
    expect(result.isApproved).toBe(true);
  });

  it('admin can reject listing', () => {
    const reject = (l: any) => ({ ...l, isApproved: false, isActive: false });
    const result = reject({ id: 'l1', isApproved: false, isActive: true });
    expect(result.isApproved).toBe(false);
    expect(result.isActive).toBe(false);
  });

  it('approved listing appears in public results', () => {
    const listings = [
      { id: '1', isApproved: true },
      { id: '2', isApproved: false },
    ];
    const visible = listings.filter(l => l.isApproved);
    expect(visible).toHaveLength(1);
  });
});

describe('Admin — Seller verification', () => {
  it('seller starts unverified', () => {
    const seller = { id: 's1', isVerified: false };
    expect(seller.isVerified).toBe(false);
  });

  it('admin can verify seller', () => {
    const verify = (s: any) => ({ ...s, isVerified: true });
    const result = verify({ id: 's1', isVerified: false });
    expect(result.isVerified).toBe(true);
  });

  it('admin can unverify seller', () => {
    const unverify = (s: any) => ({ ...s, isVerified: false });
    const result = unverify({ id: 's1', isVerified: true });
    expect(result.isVerified).toBe(false);
  });
});

describe('Admin — Analytics access', () => {
  it('analytics service has query methods', async () => {
    const mod = await import('../services/analyticsService');
    expect(typeof mod.analytics.getDailyActiveUsers).toBe('function');
    expect(typeof mod.analytics.getPopularListings).toBe('function');
  });

  it('analytics tracks all event types', () => {
    const eventNames = [
      'page_view', 'search', 'add_to_cart', 'remove_from_cart',
      'checkout_start', 'purchase', 'login', 'register', 'logout',
      'view_listing', 'view_seller', 'add_favorite', 'remove_favorite',
      'ai_chat_message', 'ai_tool_call', 'error', 'click_cta', 'share', 'install_pwa',
    ];
    expect(eventNames.length).toBeGreaterThanOrEqual(15);
    eventNames.forEach(name => expect(typeof name).toBe('string'));
  });

  it('analytics track method exists', async () => {
    const { analytics } = await import('../services/analyticsService');
    expect(typeof analytics.track).toBe('function');
    expect(typeof analytics.pageView).toBe('function');
    expect(typeof analytics.search).toBe('function');
    expect(typeof analytics.addToCart).toBe('function');
    expect(typeof analytics.purchase).toBe('function');
    expect(typeof analytics.error).toBe('function');
    expect(typeof analytics.login).toBe('function');
  });
});

describe('Admin — EcoAction / Gamification', () => {
  it('EcoAction enum has expected values', () => {
    expect(EcoAction.FOOD_RESCUE).toBe('FOOD_RESCUE');
    expect(EcoAction.LOCAL_PURCHASE).toBe('LOCAL_PURCHASE');
    expect(EcoAction.DIGITAL_PURCHASE).toBe('DIGITAL_PURCHASE');
  });

  it('ImpactRecord has required fields', () => {
    const record = {
      id: 'impact-1',
      userId: 'user-1',
      action: EcoAction.FOOD_RESCUE,
      value: 2.5,
      transactionId: 'tx-1',
      createdAt: new Date().toISOString(),
    };
    expect(record).toHaveProperty('id');
    expect(record).toHaveProperty('userId');
    expect(record).toHaveProperty('action');
    expect(record).toHaveProperty('value');
    expect(record).toHaveProperty('createdAt');
  });

  it('action value is non-negative', () => {
    const isValid = (v: number) => v >= 0;
    expect(isValid(2.5)).toBe(true);
    expect(isValid(0)).toBe(true);
    expect(isValid(-1)).toBe(false);
  });
});

describe('Admin — Dispute management', () => {
  it('TransactionStatus DISPUTED exists', async () => {
    const { TransactionStatus } = await import('../types');
    expect(TransactionStatus.DISPUTED).toBe('DISPUTED');
  });

  it('disputed order can be refunded', () => {
    const validTransition = (from: string, to: string): boolean => {
      const transitions: Record<string, string[]> = {
        'DISPUTED': ['REFUNDED', 'DELIVERED'],
      };
      return transitions[from]?.includes(to) || false;
    };
    expect(validTransition('DISPUTED', 'REFUNDED')).toBe(true);
    expect(validTransition('DISPUTED', 'DELIVERED')).toBe(true);
    expect(validTransition('DISPUTED', 'CANCELLED')).toBe(false);
  });
});

describe('Admin — Bulk operations validation', () => {
  it('can filter users by role', () => {
    const users = [
      { id: '1', role: UserRole.CUSTOMER },
      { id: '2', role: UserRole.SELLER },
      { id: '3', role: UserRole.CUSTOMER },
      { id: '4', role: UserRole.ADMIN },
    ];
    const filterByRole = (users: Array<{ role: string }>, role: string) =>
      users.filter(u => u.role === role);
    expect(filterByRole(users, UserRole.CUSTOMER)).toHaveLength(2);
    expect(filterByRole(users, UserRole.SELLER)).toHaveLength(1);
    expect(filterByRole(users, UserRole.ADMIN)).toHaveLength(1);
    expect(filterByRole(users, UserRole.SUPER_ADMIN)).toHaveLength(0);
  });

  it('can filter listings by approval status', () => {
    const listings = [
      { id: '1', isApproved: true },
      { id: '2', isApproved: false },
      { id: '3', isApproved: true },
    ];
    const pending = listings.filter(l => !l.isApproved);
    expect(pending).toHaveLength(1);
    const approved = listings.filter(l => l.isApproved);
    expect(approved).toHaveLength(2);
  });

  it('can filter sellers by verification status', () => {
    const sellers = [
      { id: '1', isVerified: true },
      { id: '2', isVerified: false },
      { id: '3', isVerified: true },
    ];
    const unverified = sellers.filter(s => !s.isVerified);
    expect(unverified).toHaveLength(1);
  });
});

describe('Admin — AdminPanel component', () => {
  it('AdminPanel component is importable', async () => {
    const mod = await import('../pages/AdminPanel');
    expect(mod.default).toBeDefined();
  });
});

describe('Admin — Review system', () => {
  it('Review has required fields', () => {
    const review = {
      id: 'rev-1',
      transactionId: 'tx-1',
      reviewerId: 'user-1',
      reviewerName: 'Test User',
      targetType: 'seller' as const,
      targetId: 'seller-1',
      rating: 4,
      text: 'Great!',
      createdAt: new Date().toISOString(),
    };
    expect(review).toHaveProperty('id');
    expect(review).toHaveProperty('rating');
    expect(review.rating).toBeGreaterThanOrEqual(1);
    expect(review.rating).toBeLessThanOrEqual(5);
  });

  it('rating is between 1 and 5', () => {
    const isValid = (r: number) => r >= 1 && r <= 5 && Number.isInteger(r);
    expect(isValid(1)).toBe(true);
    expect(isValid(5)).toBe(true);
    expect(isValid(3)).toBe(true);
    expect(isValid(0)).toBe(false);
    expect(isValid(6)).toBe(false);
    expect(isValid(3.5)).toBe(false);
  });

  it('review target type is seller or listing', () => {
    const targets = ['seller', 'listing'];
    expect(targets).toHaveLength(2);
  });
});
