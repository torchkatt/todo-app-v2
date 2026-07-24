import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { authService } from '../services/authService';
import { type User, UserRole } from '../types';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Procesar cualquier resultado de redirección activa de Google Auth
    authService.handleRedirectResult().catch(err => {
      logger.error('handleRedirectResult error', err);
    });

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await authService.ensureUserDoc(fbUser);
          setUser(profile);
        } catch (e) {
          logger.error('Auth profile load error, constructing fallback', e);
          const fallbackUser = {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email || '',
            fullName: fbUser.displayName || 'Usuario',
            roles: [UserRole.CUSTOMER],
            primaryRole: UserRole.CUSTOMER,
            isGuest: fbUser.isAnonymous || false,
            isActive: true,
            isVerified: fbUser.emailVerified || false,
            authProvider: fbUser.providerData[0]?.providerId || 'google.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            impact: { points: 0, level: 'NOVICE', totalSpent: 0, totalTransactions: 0, streak: { current: 0, lastActivity: new Date().toISOString() } },
            favoriteListingIds: [],
          } as unknown as User;
          setUser(fallbackUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const authImpl = {
    login: useCallback(async (email: string, password: string) => {
      const u = await authService.login(email, password);
      setUser(u);
    }, []),
    register: useCallback(async (email: string, password: string, fullName: string) => {
      const u = await authService.register(email, password, fullName);
      setUser(u);
    }, []),
    loginWithGoogle: useCallback(async () => {
      const u = await authService.loginWithGoogle();
      if (u && u.id) setUser(u);
    }, []),
    loginAnonymously: useCallback(async () => {
      const u = await authService.loginAnonymously();
      setUser(u);
    }, []),
    logout: useCallback(async () => {
      await authService.logout();
      setUser(null);
    }, []),
    updateProfile: useCallback(async (data: Partial<User>) => {
      if (!user?.id) return;
      await authService.updateProfile(user.id, data);
      setUser(prev => prev ? { ...prev, ...data } : null);
    }, [user?.id]),
    switchRole: useCallback(async (newRole: UserRole) => {
      if (!user?.id || !user.roles.includes(newRole)) return;
      await authService.updateProfile(user.id, { primaryRole: newRole } as any);
      setUser(prev => prev ? { ...prev, primaryRole: newRole } : null);
    }, [user?.id, user?.roles]),
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isAuthenticated: !!user && !user.isGuest, loading, ...authImpl }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
