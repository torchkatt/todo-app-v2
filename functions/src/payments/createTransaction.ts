import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  WOMPI_PRIVATE_KEY,
  WOMPI_EVENTS_SECRET,
  WOMPI_INTEGRITY_SECRET,
  PLATFORM_FEE_BPS,
  IVA_BPS,
  wompiConfigured,
} from '../config';
import { integritySignature } from './wompiSignature';
import { audit } from '../lib/audit';
import { TransactionStatus, TransactionType, DeliveryMethod, Listing } from '../domain/types';

const CURRENCY = 'COP';
const UNLIMITED_STOCK = 999;

interface CreateTransactionItem {
  listingId: string;
  quantity: number;
}

interface CreateTransactionRequest {
  items: CreateTransactionItem[];
  delivery: {
    method: DeliveryMethod;
    address?: string;
    name?: string;
    phone?: string;
    city?: string;
    notes?: string;
  };
}

export const createTransaction = onCall(
  { cors: true, secrets: [WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET] },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

    const data = request.data as CreateTransactionRequest;
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      throw new HttpsError('invalid-argument', 'El carrito está vacío.');
    }
    for (const it of data.items) {
      if (!it.listingId || !Number.isInteger(it.quantity) || it.quantity <= 0) {
        throw new HttpsError('invalid-argument', 'Item de carrito inválido.');
      }
    }
    if (!data.delivery?.method) {
      throw new HttpsError('invalid-argument', 'Falta el método de entrega.');
    }

    const db = admin.firestore();

    const result = await db.runTransaction(async (t) => {
      const listingRefs = data.items.map((i) => db.collection('listings').doc(i.listingId));
      const listingSnaps = await Promise.all(listingRefs.map((r) => t.get(r)));

      let sellerId: string | null = null;
      let calculatedTotal = 0;
      const snapshotItems: any[] = [];

      for (let idx = 0; idx < data.items.length; idx++) {
        const item = data.items[idx];
        const snap = listingSnaps[idx];
        if (!snap.exists) {
          throw new HttpsError('not-found', `Producto ${item.listingId} no encontrado.`);
        }
        const listing = snap.data() as Listing;
        if (!listing.isActive || listing.isApproved === false) {
          throw new HttpsError('failed-precondition', `Producto "${listing.title}" no está disponible.`);
        }
        if (sellerId && listing.sellerId !== sellerId) {
          throw new HttpsError('invalid-argument', 'Todos los productos del carrito deben ser del mismo vendedor.');
        }
        sellerId = listing.sellerId;

        const effectiveStock = listing.quantity ?? UNLIMITED_STOCK;
        if (effectiveStock < item.quantity) {
          throw new HttpsError('resource-exhausted', `Stock insuficiente para "${listing.title}". Disponibles: ${effectiveStock}`);
        }

        const subtotal = listing.price * item.quantity;
        calculatedTotal += subtotal;

        snapshotItems.push({
          listingId: listing.id,
          title: listing.title,
          price: listing.price,
          quantity: item.quantity,
          imageUrl: (listing as any).images?.[0] || null,
        });

        if (listing.quantity !== undefined) {
          t.update(snap.ref, {
            quantity: listing.quantity - item.quantity,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (!sellerId) throw new HttpsError('invalid-argument', 'Vendedor inválido.');
      const sellerSnap = await t.get(db.collection('sellers').doc(sellerId));
      if (!sellerSnap.exists) throw new HttpsError('not-found', 'Vendedor no encontrado.');

      const platformFee = Math.round((calculatedTotal * PLATFORM_FEE_BPS.value()) / 10000);
      const ivaOnFee = Math.round((platformFee * IVA_BPS.value()) / 10000);
      const sellerNetPayout = calculatedTotal - platformFee - ivaOnFee;

      const orderRef = db.collection('transactions').doc();
      const orderId = orderRef.id;
      const amountInCents = calculatedTotal * 100;

      let integrity = '';
      if (wompiConfigured()) {
        integrity = integritySignature(orderId, amountInCents, CURRENCY, WOMPI_INTEGRITY_SECRET.value());
      }

      const now = new Date().toISOString();
      const transactionData = {
        id: orderId,
        buyerId: auth.uid,
        sellerId,
        items: snapshotItems,
        totalAmount: calculatedTotal,
        financials: {
          grossTotal: calculatedTotal,
          platformFeeBps: PLATFORM_FEE_BPS.value(),
          platformFee,
          ivaBps: IVA_BPS.value(),
          ivaOnFee,
          sellerNetPayout,
          currency: CURRENCY,
        },
        delivery: {
          method: data.delivery.method,
          address: data.delivery.address || '',
          name: data.delivery.name || '',
          phone: data.delivery.phone || '',
          city: data.delivery.city || '',
          notes: data.delivery.notes || '',
        },
        status: TransactionStatus.PENDING_PAYMENT,
        type: TransactionType.PURCHASE,
        payment: {
          ready: wompiConfigured(),
          wompiId: null,
          integritySignature: integrity,
          currency: CURRENCY,
          amountInCents,
        },
        createdAt: now,
        updatedAt: now,
      };

      t.set(orderRef, transactionData);
      return transactionData;
    });

    await audit('TRANSACTION_CREATED', {
      userId: auth.uid,
      orderId: result.id,
      totalAmount: result.totalAmount,
      sellerId: result.sellerId,
    });

    return {
      orderId: result.id,
      totalAmount: result.totalAmount,
      currency: CURRENCY,
      amountInCents: result.payment.amountInCents,
      integritySignature: result.payment.integritySignature,
      paymentReady: result.payment.ready,
    };
  }
);
