import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signInAnonymously, signOut, sendPasswordResetEmail,
  GoogleAuthProvider, OAuthProvider, FacebookAuthProvider, User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '../types';
import { UserRole } from '../types';

const GOOGLE = new GoogleAuthProvider();
const APPLE = new OAuthProvider('apple.com');
const FACEBOOK = new FacebookAuthProvider();

async function ensureUserDoc(fbUser: FirebaseUser, extra?: Partial<User>): Promise<User> {
  const userId = fbUser.uid;
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as User;
    if (extra) await updateDoc(ref, { ...extra, lastLoginAt: new Date().toISOString() });
    return { ...data, ...extra, id: userId } as User;
  }

  const userData = {
    id: userId,
    email: fbUser.email || extra?.email || '',
    fullName: fbUser.displayName || extra?.fullName || 'Usuario',
    role: extra?.role || UserRole.CUSTOMER,
    isGuest: false,
    isActive: true,
    isVerified: fbUser.emailVerified || false,
    isEmailVerified: fbUser.emailVerified || false,
    authProvider: fbUser.providerData[0]?.providerId || 'password',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    impact: { points: 0, level: 'NOVICE' as any, totalSpent: 0, totalTransactions: 0, streak: { current: 0, lastActivity: new Date().toISOString() } } as any,
    favoriteListingIds: [],
    ...extra,
  };

  await setDoc(ref, userData);
  return userData;
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return ensureUserDoc(cred.user);
  },

  async register(email: string, password: string, fullName: string, phone?: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return ensureUserDoc(cred.user, { fullName, phone, role: UserRole.CUSTOMER });
  },

  async loginWithGoogle(): Promise<User> {
    const cred = await signInWithPopup(auth, GOOGLE);
    return ensureUserDoc(cred.user);
  },

  async loginWithApple(): Promise<User> {
    const cred = await signInWithPopup(auth, APPLE);
    return ensureUserDoc(cred.user);
  },

  async loginWithFacebook(): Promise<User> {
    const cred = await signInWithPopup(auth, FACEBOOK);
    return ensureUserDoc(cred.user);
  },

  async loginAnonymously(): Promise<User> {
    const cred = await signInAnonymously(auth);
    return ensureUserDoc(cred.user, { fullName: 'Invitado', isGuest: true, role: UserRole.CUSTOMER });
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getProfile(userId: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? { ...snap.data(), id: userId } as User : null;
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: new Date().toISOString() });
  },

  async convertGuest(userId: string, email: string, password: string, fullName: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Copy guest doc to new uid
    const guest = await getDoc(doc(db, 'users', userId));
    if (guest.exists()) {
      await setDoc(doc(db, 'users', cred.user.uid), { ...guest.data(), id: cred.user.uid, uid: cred.user.uid, email, fullName, isGuest: false, updatedAt: new Date().toISOString() });
    }
    await updateDoc(doc(db, 'users', userId), { mergedInto: cred.user.uid });
    return ensureUserDoc(cred.user, { fullName, email });
  },
};
