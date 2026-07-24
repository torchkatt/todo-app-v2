/**
 * @file authService.ts
 * @description Servicio de autenticación con Firebase Auth y sincronización de perfiles en Firestore.
 * Incluye fallback automático entre `signInWithPopup` y `signInWithRedirect` para evitar bloqueos por políticas COOP en navegadores web y móviles.
 */

import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, getRedirectResult, signInAnonymously, signOut, sendPasswordResetEmail,
  GoogleAuthProvider, OAuthProvider, FacebookAuthProvider, User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '../types';
import { UserRole } from '../types';
import { logger } from '../utils/logger';

const GOOGLE = new GoogleAuthProvider();
const APPLE = new OAuthProvider('apple.com');
const FACEBOOK = new FacebookAuthProvider();

/**
 * Garantiza que el documento del usuario exista en la colección `users` de Firestore.
 */
async function ensureUserDoc(fbUser: FirebaseUser, extra?: Partial<User>): Promise<User> {
  const userId = fbUser.uid;
  const ref = doc(db, 'users', userId);
  
  try {
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data() as User;
      if (extra) {
        await updateDoc(ref, { ...extra, lastLoginAt: new Date().toISOString() }).catch(() => {});
      }
      return { ...data, ...extra, id: userId, uid: userId } as User;
    }
  } catch (e) {
    logger.warn('getDoc users error in ensureUserDoc, creating fallback', e);
  }

  const userData = {
    id: userId,
    uid: userId,
    email: fbUser.email || extra?.email || '',
    fullName: fbUser.displayName || extra?.fullName || 'Usuario',
    roles: extra?.roles || [UserRole.CUSTOMER],
    primaryRole: extra?.primaryRole || UserRole.CUSTOMER,
    isGuest: fbUser.isAnonymous || false,
    isActive: true,
    isVerified: fbUser.emailVerified || false,
    isEmailVerified: fbUser.emailVerified || false,
    authProvider: fbUser.providerData[0]?.providerId || 'google.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    impact: { points: 0, level: 'NOVICE' as any, totalSpent: 0, totalTransactions: 0, streak: { current: 0, lastActivity: new Date().toISOString() } } as any,
    favoriteListingIds: [],
    ...extra,
  };

  try {
    await setDoc(ref, userData, { merge: true });
  } catch (err) {
    logger.error('Error writing user doc to Firestore', err);
  }

  return userData as User;
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return ensureUserDoc(cred.user);
  },

  async register(email: string, password: string, fullName: string, phone?: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return ensureUserDoc(cred.user, { fullName, phone, roles: [UserRole.CUSTOMER], primaryRole: UserRole.CUSTOMER });
  },

  /**
   * Inicia sesión con Google. Si el navegador bloquea la ventana emergente (COOP policy / popup blocker),
   * ejecuta automáticamente `signInWithRedirect`.
   */
  async loginWithGoogle(): Promise<User> {
    try {
      const cred = await signInWithPopup(auth, GOOGLE);
      return await ensureUserDoc(cred.user);
    } catch (err: any) {
      logger.warn('Google Popup failed, executing redirect:', err?.code || err?.message);
      await signInWithRedirect(auth, GOOGLE);
      return new Promise(() => {});
    }
  },

  async loginWithApple(): Promise<User> {
    try {
      const cred = await signInWithPopup(auth, APPLE);
      return await ensureUserDoc(cred.user);
    } catch (err: any) {
      await signInWithRedirect(auth, APPLE);
      return new Promise(() => {});
    }
  },

  async loginWithFacebook(): Promise<User> {
    try {
      const cred = await signInWithPopup(auth, FACEBOOK);
      return await ensureUserDoc(cred.user);
    } catch (err: any) {
      await signInWithRedirect(auth, FACEBOOK);
      return new Promise(() => {});
    }
  },

  async handleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        return await ensureUserDoc(result.user);
      }
    } catch (e) {
      logger.error('Error handling redirect result', e);
    }
    return null;
  },

  async loginAnonymously(): Promise<User> {
    const cred = await signInAnonymously(auth);
    return ensureUserDoc(cred.user, { fullName: 'Invitado', isGuest: true, roles: [UserRole.CUSTOMER], primaryRole: UserRole.CUSTOMER });
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getProfile(userId: string): Promise<User | null> {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? ({ ...snap.data(), id: userId, uid: userId } as unknown as User) : null;
    } catch (e) {
      logger.warn('getProfile failed for user', userId, e);
      return null;
    }
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: new Date().toISOString() });
  },

  async convertGuest(userId: string, email: string, password: string, fullName: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const guest = await getDoc(doc(db, 'users', userId));
    if (guest.exists()) {
      await setDoc(doc(db, 'users', cred.user.uid), { ...guest.data(), id: cred.user.uid, uid: cred.user.uid, email, fullName, isGuest: false, roles: [UserRole.CUSTOMER], primaryRole: UserRole.CUSTOMER, updatedAt: new Date().toISOString() });
    }
    await updateDoc(doc(db, 'users', userId), { mergedInto: cred.user.uid });
    return ensureUserDoc(cred.user, { fullName, email });
  },

  ensureUserDoc,
};
