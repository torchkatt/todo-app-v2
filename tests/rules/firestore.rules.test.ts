import { readFileSync } from 'fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { setDoc, doc, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const BUYER = 'buyer-1';
const SELLER_OWNER = 'seller-owner-1';
const OTHER_USER = 'other-user-1';
const SELLER_ID = 'seller-1';
const ADMIN = 'admin-1';
const COURIER = 'courier-1';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'todo-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed con Admin SDK (bypasa reglas) — estado base para cada test.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.collection('sellers').doc(SELLER_ID).set({
      ownerId: SELLER_OWNER,
      name: 'Tienda Test',
      rating: 0,
      ratingCount: 0,
      subscription: 'free',
      isActive: true,
      isVerified: false,
      stats: { totalTransactions: 0, totalRevenue: 0, totalListings: 0, activeListings: 0, completionRate: 0, avgRating: 0, responseTimeHours: 0 },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    await db.collection('transactions').doc('tx-1').set({
      buyerId: BUYER,
      sellerId: SELLER_ID,
      courierId: COURIER,
      status: 'PENDING_PAYMENT',
      totalAmount: 100000,
      sellerEarnings: 95000,
      payment: { gateway: 'wompi', status: 'pending', amount: 100000 },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });
});

function asBuyer() {
  return testEnv.authenticatedContext(BUYER, { role: 'CUSTOMER' }).firestore();
}
function asSellerOwner() {
  return testEnv.authenticatedContext(SELLER_OWNER, { role: 'SELLER' }).firestore();
}
function asOther() {
  return testEnv.authenticatedContext(OTHER_USER, { role: 'CUSTOMER' }).firestore();
}
function asAdmin() {
  return testEnv.authenticatedContext(ADMIN, { role: 'ADMIN' }).firestore();
}
function asCourier() {
  return testEnv.authenticatedContext(COURIER, { role: 'COURIER' }).firestore();
}

describe('transactions — el cliente nunca origina montos', () => {
  it('crear una transacción directamente desde el cliente está prohibido', async () => {
    const db = asBuyer();
    await assertFails(
      addDoc(collection(db, 'transactions'), {
        buyerId: BUYER,
        sellerId: SELLER_ID,
        status: 'PENDING_PAYMENT',
        totalAmount: 999999,
      })
    );
  });

  it('el comprador puede cancelar su propia orden PENDING_PAYMENT tocando solo status/updatedAt', async () => {
    const db = asBuyer();
    await assertSucceeds(
      updateDoc(doc(db, 'transactions', 'tx-1'), { status: 'CANCELLED', updatedAt: '2026-01-02T00:00:00Z' })
    );
  });

  it('el comprador NO puede modificar totalAmount al "cancelar"', async () => {
    const db = asBuyer();
    await assertFails(
      updateDoc(doc(db, 'transactions', 'tx-1'), { status: 'CANCELLED', totalAmount: 1 })
    );
  });

  it('el comprador no puede cancelar una orden que ya no está PENDING_PAYMENT', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('transactions').doc('tx-2').set({
        buyerId: BUYER, sellerId: SELLER_ID, status: 'DELIVERED', totalAmount: 100000,
      });
    });
    const db = asBuyer();
    await assertFails(updateDoc(doc(db, 'transactions', 'tx-2'), { status: 'CANCELLED' }));
  });

  it('otro usuario no puede leer ni cancelar la orden ajena', async () => {
    const db = asOther();
    await assertFails(getDoc(doc(db, 'transactions', 'tx-1')));
    await assertFails(updateDoc(doc(db, 'transactions', 'tx-1'), { status: 'CANCELLED' }));
  });

  it('admin puede leer y actualizar cualquier campo', async () => {
    const db = asAdmin();
    await assertSucceeds(getDoc(doc(db, 'transactions', 'tx-1')));
    await assertSucceeds(updateDoc(doc(db, 'transactions', 'tx-1'), { status: 'DISPUTED' }));
  });

  it('el dueño de la tienda (ownerId del seller, no el sellerId) puede leer la transacción', async () => {
    const db = asSellerOwner();
    await assertSucceeds(getDoc(doc(db, 'transactions', 'tx-1')));
  });

  it('el domiciliario asignado (courierId) puede leer la transacción', async () => {
    const db = asCourier();
    await assertSucceeds(getDoc(doc(db, 'transactions', 'tx-1')));
  });

  it('un domiciliario que no es el asignado no puede leer la transacción', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('transactions').doc('tx-3').set({
        buyerId: BUYER, sellerId: SELLER_ID, courierId: 'courier-other', status: 'IN_TRANSIT', totalAmount: 100000,
      });
    });
    const db = asCourier();
    await assertFails(getDoc(doc(db, 'transactions', 'tx-3')));
  });
});

describe('sellers — el dueño no puede inflar sus propias stats', () => {
  it('el dueño puede editar campos de perfil (nombre, descripción)', async () => {
    const db = asSellerOwner();
    await assertSucceeds(updateDoc(doc(db, 'sellers', SELLER_ID), { name: 'Nuevo nombre' }));
  });

  it('el dueño NO puede escribir stats.totalRevenue directamente', async () => {
    const db = asSellerOwner();
    await assertFails(
      updateDoc(doc(db, 'sellers', SELLER_ID), {
        stats: { totalTransactions: 999, totalRevenue: 999999999, totalListings: 0, activeListings: 0, completionRate: 1, avgRating: 5, responseTimeHours: 0 },
      })
    );
  });

  it('el dueño NO puede auto-verificarse (isVerified)', async () => {
    const db = asSellerOwner();
    await assertFails(updateDoc(doc(db, 'sellers', SELLER_ID), { isVerified: true }));
  });

  it('un usuario no puede crear un seller con ownerId de otra persona (suplantación)', async () => {
    const db = asOther();
    await assertFails(
      setDoc(doc(db, 'sellers', 'seller-fake'), {
        ownerId: SELLER_OWNER, // suplanta al dueño real
        name: 'Tienda falsa',
        rating: 0, ratingCount: 0, subscription: 'free', isActive: true, isVerified: false,
        stats: { totalTransactions: 0, totalRevenue: 0, totalListings: 0, activeListings: 0, completionRate: 0, avgRating: 0, responseTimeHours: 0 },
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      })
    );
  });
});

describe('listings — moderación: el seller no se auto-aprueba', () => {
  it('crear un listado con isApproved=true está prohibido', async () => {
    const db = asSellerOwner();
    await assertFails(
      setDoc(doc(db, 'listings', 'listing-fake'), {
        sellerId: SELLER_ID, title: 'Producto', price: 10000, isActive: true,
        isFeatured: false, isApproved: true,
        stats: { views: 0, favorites: 0, transactions: 0, rating: 0, ratingCount: 0 },
      })
    );
  });

  it('crear un listado con isApproved=false (pendiente de revisión) está permitido', async () => {
    const db = asSellerOwner();
    await assertSucceeds(
      setDoc(doc(db, 'listings', 'listing-ok'), {
        sellerId: SELLER_ID, title: 'Producto', price: 10000, isActive: true,
        isFeatured: false, isApproved: false,
        stats: { views: 0, favorites: 0, transactions: 0, rating: 0, ratingCount: 0 },
      })
    );
  });

  it('el seller no puede auto-aprobar un listado existente', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('listings').doc('listing-pending').set({
        sellerId: SELLER_ID, title: 'Producto', price: 10000, isActive: true,
        isFeatured: false, isApproved: false,
        stats: { views: 0, favorites: 0, transactions: 0, rating: 0, ratingCount: 0 },
      });
    });
    const db = asSellerOwner();
    await assertFails(updateDoc(doc(db, 'listings', 'listing-pending'), { isApproved: true }));
  });
});

describe('users — no se puede escalar el propio rol', () => {
  it('un usuario se auto-crea como CUSTOMER', async () => {
    const db = asOther();
    await assertSucceeds(
      setDoc(doc(db, 'users', OTHER_USER), {
        uid: OTHER_USER, email: 'x@x.com', role: 'CUSTOMER', createdAt: '2026-01-01T00:00:00Z',
      })
    );
  });

  it('un usuario NO puede auto-crearse como ADMIN', async () => {
    const db = asOther();
    await assertFails(
      setDoc(doc(db, 'users', OTHER_USER), {
        uid: OTHER_USER, email: 'x@x.com', role: 'ADMIN', createdAt: '2026-01-01T00:00:00Z',
      })
    );
  });

  it('un usuario NO puede actualizar su propio role a ADMIN', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('users').doc(OTHER_USER).set({
        email: 'x@x.com', role: 'CUSTOMER', createdAt: '2026-01-01T00:00:00Z', fullName: 'X',
      });
    });
    const db = asOther();
    await assertFails(updateDoc(doc(db, 'users', OTHER_USER), { role: 'ADMIN' }));
    await assertSucceeds(updateDoc(doc(db, 'users', OTHER_USER), { fullName: 'Nuevo nombre' }));
  });

  it('un usuario puede marcar su propio onboarding como completado', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('users').doc(OTHER_USER).set({
        email: 'x@x.com', role: 'CUSTOMER', createdAt: '2026-01-01T00:00:00Z', fullName: 'X',
      });
    });
    const db = asOther();
    await assertSucceeds(setDoc(doc(db, 'users', OTHER_USER), { onboardingDone: true }, { merge: true }));
  });

  it('un admin puede crear/promover un usuario a role COURIER (el auto-registro sigue siendo solo CUSTOMER)', async () => {
    const db = asAdmin();
    await assertSucceeds(
      setDoc(doc(db, 'users', 'courier-1'), {
        uid: 'courier-1', email: 'c@x.com', role: 'COURIER', createdAt: '2026-01-01T00:00:00Z',
      })
    );
    const selfDb = testEnv.authenticatedContext('courier-2', { role: 'COURIER' }).firestore();
    await assertFails(
      setDoc(doc(selfDb, 'users', 'courier-2'), {
        uid: 'courier-2', email: 'c2@x.com', role: 'COURIER', createdAt: '2026-01-01T00:00:00Z',
      })
    );
  });
});

describe('chats — hilos IA / negocio / domiciliario', () => {
  const AI_CHAT = 'ai_buyer-1';
  const SELLER_CHAT = 'seller_buyer-1_seller-1';

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.collection('chats').doc(AI_CHAT).set({
        type: 'ai', participants: [BUYER], buyerId: BUYER,
        lastMessage: '', lastMessageAt: null, createdAt: '2026-01-01T00:00:00Z',
      });
      await db.collection('chats').doc(SELLER_CHAT).set({
        type: 'seller', participants: [BUYER, SELLER_OWNER],
        buyerId: BUYER, sellerId: SELLER_ID, sellerOwnerId: SELLER_OWNER,
        lastMessage: '', lastMessageAt: null, createdAt: '2026-01-01T00:00:00Z',
      });
    });
  });

  it('el documento padre del chat nunca se crea ni actualiza desde el cliente', async () => {
    const db = asBuyer();
    await assertFails(
      setDoc(doc(db, 'chats', 'chat-fake'), { type: 'ai', participants: [BUYER] })
    );
    await assertFails(updateDoc(doc(db, 'chats', SELLER_CHAT), { lastMessage: 'hackeado' }));
  });

  it('solo los participantes pueden leer el chat', async () => {
    await assertSucceeds(getDoc(doc(asBuyer(), 'chats', SELLER_CHAT)));
    await assertSucceeds(getDoc(doc(asSellerOwner(), 'chats', SELLER_CHAT)));
    await assertFails(getDoc(doc(asOther(), 'chats', SELLER_CHAT)));
  });

  it('un participante puede publicar un mensaje propio', async () => {
    await assertSucceeds(
      setDoc(doc(asBuyer(), 'chats', SELLER_CHAT, 'messages', 'm1'), {
        senderId: BUYER, text: 'Hola, ¿tienen stock?', createdAt: '2026-01-01T00:00:00Z',
      })
    );
  });

  it('nadie puede publicar un mensaje suplantando a otro remitente', async () => {
    await assertFails(
      setDoc(doc(asBuyer(), 'chats', SELLER_CHAT, 'messages', 'm2'), {
        senderId: SELLER_OWNER, text: 'suplantación', createdAt: '2026-01-01T00:00:00Z',
      })
    );
  });

  it('un no-participante no puede leer ni escribir mensajes', async () => {
    await assertFails(getDoc(doc(asOther(), 'chats', SELLER_CHAT, 'messages', 'm1')));
    await assertFails(
      setDoc(doc(asOther(), 'chats', SELLER_CHAT, 'messages', 'm3'), {
        senderId: OTHER_USER, text: 'colado', createdAt: '2026-01-01T00:00:00Z',
      })
    );
  });

  it('el participante de un hilo IA puede persistir la respuesta del asistente (senderId "ai")', async () => {
    await assertSucceeds(
      setDoc(doc(asBuyer(), 'chats', AI_CHAT, 'messages', 'm-ai'), {
        senderId: 'ai', text: 'Te ayudo a buscar...', createdAt: '2026-01-01T00:00:00Z',
      })
    );
  });

  it('senderId "ai" está prohibido fuera de un hilo type==ai', async () => {
    await assertFails(
      setDoc(doc(asBuyer(), 'chats', SELLER_CHAT, 'messages', 'm-fake-ai'), {
        senderId: 'ai', text: 'finjo ser el asistente', createdAt: '2026-01-01T00:00:00Z',
      })
    );
  });

  it('cada participante solo puede leer/escribir su propio marcador de lectura', async () => {
    await assertSucceeds(
      setDoc(doc(asBuyer(), 'chats', SELLER_CHAT, 'reads', BUYER), { lastReadAt: '2026-01-01T00:00:00Z' })
    );
    await assertFails(
      setDoc(doc(asBuyer(), 'chats', SELLER_CHAT, 'reads', SELLER_OWNER), { lastReadAt: '2026-01-01T00:00:00Z' })
    );
  });
});

describe('colecciones internas — solo backend (Admin SDK)', () => {
  it('processed_events es inaccesible desde el cliente', async () => {
    const db = asAdmin();
    await assertFails(getDoc(doc(db, 'processed_events', 'evt-1')));
    await assertFails(setDoc(doc(db, 'processed_events', 'evt-1'), { at: 1 }));
  });

  it('audit_logs: admin lee, nadie escribe desde el cliente', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('audit_logs').doc('log-1').set({ action: 'test' });
    });
    await assertSucceeds(getDoc(doc(asAdmin(), 'audit_logs', 'log-1')));
    await assertFails(getDoc(doc(asBuyer(), 'audit_logs', 'log-1')));
    await assertFails(setDoc(doc(asAdmin(), 'audit_logs', 'log-2'), { action: 'x' }));
  });

  it('ai_usage: el dueño puede leer el suyo, nadie escribe desde el cliente', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('ai_usage').doc(BUYER).set({ messagesToday: 1 });
    });
    await assertSucceeds(getDoc(doc(asBuyer(), 'ai_usage', BUYER)));
    await assertFails(getDoc(doc(asOther(), 'ai_usage', BUYER)));
    await assertFails(setDoc(doc(asBuyer(), 'ai_usage', BUYER), { messagesToday: 999 }));
  });
});
