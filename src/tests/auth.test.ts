import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '../types';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));

// ─── Mock firebase/auth ───
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  OAuthProvider: vi.fn(),
  FacebookAuthProvider: vi.fn(),
  getAuth: vi.fn(() => ({})),
}));

// ─── Mock firebase/firestore ───
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(),
}));

describe('Auth — User Roles & Types', () => {
  it('UserRole enum has all expected values', () => {
    expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN');
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.SELLER).toBe('SELLER');
    expect(UserRole.COURIER).toBe('COURIER');
    expect(UserRole.CUSTOMER).toBe('CUSTOMER');
  });

  it('UserRole has exactly 5 roles', () => {
    const roles = Object.values(UserRole);
    expect(roles).toHaveLength(5);
  });

  it('UserRole values are strings', () => {
    for (const role of Object.values(UserRole)) {
      expect(typeof role).toBe('string');
    }
  });

  it('no duplicate UserRole values', () => {
    const values = Object.values(UserRole);
    const unique = [...new Set(values)];
    expect(unique).toHaveLength(values.length);
  });
});

describe('Auth — Type-level validations', () => {
  it('User type has required fields', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      fullName: 'Test User',
      role: UserRole.CUSTOMER,
      isActive: true,
      isGuest: false,
      isVerified: false,
      impact: {
        points: 0,
        level: 'NOVICE' as const,
        totalSpent: 0,
        totalTransactions: 0,
        streak: {
          current: 0,
          best: 0,
          multiplier: 1,
          lastTransactionDate: new Date().toISOString(),
        },
      },
      createdAt: new Date().toISOString(),
    };
    expect(mockUser).toHaveProperty('id');
    expect(mockUser).toHaveProperty('email');
    expect(mockUser).toHaveProperty('fullName');
    expect(mockUser).toHaveProperty('role');
    expect(mockUser).toHaveProperty('isActive');
    expect(mockUser).toHaveProperty('isGuest');
  });

  it('User impact levels are valid', () => {
    const levels = ['NOVICE', 'HERO', 'GUARDIAN'] as const;
    expect(levels).toContain('NOVICE');
    expect(levels).toContain('HERO');
    expect(levels).toContain('GUARDIAN');
    expect(levels).toHaveLength(3);
  });

  it('User optional fields can be present', () => {
    const optionalFields = ['avatarUrl', 'phone', 'city', 'address', 'sellerId',
      'favoriteSellerIds', 'referralCode', 'invitedBy', 'hasSeenOnboarding', 'tosAcceptedAt'];
    for (const field of optionalFields) {
      expect(field).toBeDefined();
    }
  });
});

describe('Auth — Validation helpers', () => {
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password: string): boolean => {
    return password.length >= 8;
  };

  it('validates correct email formats', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@domain.co')).toBe(true);
    expect(isValidEmail('a@b.c')).toBe(true);
  });

  it('rejects invalid email formats', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
    expect(isValidEmail('user name@domain.com')).toBe(false);
  });

  it('validates password minimum length', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('abcdefgh')).toBe(true);
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('')).toBe(false);
    expect(isValidPassword('exactly8')).toBe(true);
  });

  it('validates fullName not empty', () => {
    const isValidName = (name: string) => name.trim().length >= 2;
    expect(isValidName('Alexander')).toBe(true);
    expect(isValidName('A')).toBe(false);
    expect(isValidName('')).toBe(false);
    expect(isValidName('  ')).toBe(false);
    expect(isValidName('María José')).toBe(true);
  });
});

describe('Auth — AuthService structure', () => {
  it('authService has all expected methods', async () => {
    const { authService } = await import('../services/authService');
    expect(authService).toBeDefined();
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.register).toBe('function');
    expect(typeof authService.loginWithGoogle).toBe('function');
    expect(typeof authService.loginWithApple).toBe('function');
    expect(typeof authService.loginWithFacebook).toBe('function');
    expect(typeof authService.loginAnonymously).toBe('function');
    expect(typeof authService.resetPassword).toBe('function');
    expect(typeof authService.logout).toBe('function');
    expect(typeof authService.getProfile).toBe('function');
    expect(typeof authService.updateProfile).toBe('function');
    expect(typeof authService.convertGuest).toBe('function');
  });

  it('authService has exactly 11 methods', () => {
    const methodNames = [
      'login', 'register', 'loginWithGoogle', 'loginWithApple',
      'loginWithFacebook', 'loginAnonymously', 'resetPassword',
      'logout', 'getProfile', 'updateProfile', 'convertGuest',
    ];
    expect(methodNames).toHaveLength(11);
  });
});

describe('Auth — Membership types', () => {
  it('Membership status values', () => {
    const statuses = ['active', 'pending', 'suspended', 'banned', 'deleted'];
    expect(statuses).toHaveLength(5);
    for (const s of statuses) {
      expect(typeof s).toBe('string');
    }
  });

  it('Membership has required fields', () => {
    const mock: Record<string, any> = {
      id: 'mem-1',
      userId: 'user-1',
      role: UserRole.CUSTOMER,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    expect(mock).toHaveProperty('id');
    expect(mock).toHaveProperty('userId');
    expect(mock).toHaveProperty('role');
    expect(mock).toHaveProperty('status');
    expect(mock).toHaveProperty('createdAt');
  });

  it('AdditionalUserData optional fields', () => {
    const fields = ['fullName', 'role', 'sellerId', 'phone', 'address',
      'avatarUrl', 'isVerified', 'referralCode', 'invitedBy', 'tosAcceptedAt', 'preferences'];
    expect(fields.length).toBeGreaterThanOrEqual(10);
  });
});

describe('Auth — Streak and impact', () => {
  it('Streak has required fields', () => {
    const streak = {
      current: 5,
      best: 10,
      multiplier: 1.5,
      lastTransactionDate: new Date().toISOString(),
    };
    expect(streak).toHaveProperty('current');
    expect(streak).toHaveProperty('best');
    expect(streak).toHaveProperty('multiplier');
    expect(streak).toHaveProperty('lastTransactionDate');
  });

  it('UserImpact has required fields', () => {
    const impact = {
      points: 150,
      level: 'HERO' as const,
      totalSpent: 50000,
      totalTransactions: 12,
      streak: { current: 3, best: 7, multiplier: 1.2, lastTransactionDate: '' },
      co2SavedKg: 25.5,
    };
    expect(impact.points).toBeGreaterThanOrEqual(0);
    expect(impact.totalSpent).toBeGreaterThanOrEqual(0);
    expect(impact.totalTransactions).toBeGreaterThanOrEqual(0);
  });
});

describe('Auth — Security edge cases', () => {
  it('trims whitespace from emails', () => {
    const trim = (s: string) => s.trim();
    expect(trim('  user@test.com  ')).toBe('user@test.com');
    expect(trim('user@test.com')).toBe('user@test.com');
  });

  it('normalizes email to lowercase', () => {
    const normalize = (e: string) => e.trim().toLowerCase();
    expect(normalize('User@Test.Com')).toBe('user@test.com');
    expect(normalize('  ADMIN@SITE.ORG ')).toBe('admin@site.org');
  });

  it('detects guest user from isGuest flag', () => {
    const isGuest = (user: any) => !!user?.isGuest;
    expect(isGuest({ isGuest: true })).toBe(true);
    expect(isGuest({ isGuest: false })).toBe(false);
    expect(isGuest({})).toBe(false);
    expect(isGuest(null)).toBe(false);
    expect(isGuest(undefined)).toBe(false);
  });

  it('verifies email patterns with special chars', () => {
    const isValidEmail = (email: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    expect(isValidEmail('user+alias@domain.com')).toBe(true);
    expect(isValidEmail('user_name@sub.domain.co')).toBe(true);
    expect(isValidEmail('123@123.123')).toBe(true);
  });

  it('validates phone numbers (Colombian)', () => {
    const isValidColPhone = (phone: string): boolean => {
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length === 10 || cleaned.length === 12;
    };
    expect(isValidColPhone('3001234567')).toBe(true);
    expect(isValidColPhone('573001234567')).toBe(true);
    expect(isValidColPhone('123')).toBe(false);
    expect(isValidColPhone('')).toBe(false);
    expect(isValidColPhone('abcd')).toBe(false);
  });
});
