import * as crypto from 'crypto';
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
import { TransactionStatus, TransactionType, DeliveryMethod, Listing, Seller } from '../domain/types';

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
  };
}

export const createTransaction = onCall(
  { secrets: [WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET] },
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
      // 1. Leer todos los listings dentro de la transacción (consistencia + lock de lectura).
      const listingRefs = data.items.map((it) => db.collection('listings').doc(it.listingId));
      const listingSnaps = await Promise.all(listingRefs.map((r) => t.get(r)));

      const listings: Listing[] = [];
      for (let i = 0; i < listingSnaps.length; i++) {
        const snap = listingSnaps[i];
        if (!snap.exists) throw new HttpsError('not-found', `Listado no encontrado: ${data.items[i].listingId}`);
        const listing = { id: snap.id, ...snap.data() } as Listing;
        if (!listing.isActive || !listing.isApproved) {
          throw new HttpsError('failed-precondition', `"${listing.title}" ya no está disponible.`);
        }
        const requestedQty = data.items[i].quantity;
        if (listing.quantity !== UNLIMITED_STOCK && listing.quantity < requestedQty) {
          throw new HttpsError('failed-precondition', `Stock insuficiente para "${listing.title}".`);
        }
        listings.push(listing);
      }

      // 2. Todos los items deben ser del mismo vendedor (una orden por seller).
      const sellerId = listings[0].sellerId;
      if (listings.some((l) => l.sellerId !== sellerId)) {
        throw new HttpsError(
          'invalid-argument',
          'El carrito tiene productos de distintos vendedores. Paga por separado a cada vendedor.'
        );
      }

      const sellerSnap = await t.get(db.collection('sellers').doc(sellerId));
      if (!sellerSnap.exists) throw new HttpsError('not-found', 'Vendedor no encontrado.');
      const seller = { id: sellerSnap.id, ...sellerSnap.data() } as Seller;

      // 3. Calcular montos en centavos enteros — server-authoritative, nunca desde el cliente.
      const lineItems = listings.map((listing, i) => {
        const quantity = data.items[i].quantity;
        const unitPrice = Math.round(listing.price * 100);
        const totalPrice = unitPrice * quantity;
        // stockReserved: si es false, esta línea nunca decrementó stock (producto "ilimitado")
        // y por lo tanto tampoco debe restituirse al cancelar.
        return {
          listingId: listing.id,
          title: listing.title,
          quantity,
          unitPrice,
          totalPrice,
          stockReserved: listing.quantity !== UNLIMITED_STOCK,
        };
      });
      const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);

      let deliveryFee = 0;
      if (data.delivery.method === DeliveryMethod.SHIPPING && seller.deliveryConfig?.isEnabled) {
        const cfg = seller.deliveryConfig;
        const freeThresholdCents = cfg.freeThreshold ? Math.round(cfg.freeThreshold * 100) : undefined;
        const overFreeThreshold = freeThresholdCents !== undefined && subtotal >= freeThresholdCents;
        deliveryFee = overFreeThreshold ? 0 : Math.round(cfg.baseFee * 100);
      }

      // NOTA: IVA calculado sobre el subtotal completo. Validar régimen tributario real
      // (en Colombia, el IVA de una plataforma marketplace suele aplicar solo sobre la
      // comisión, no sobre el valor del producto del vendedor) antes de ir a producción.
      const platformFee = Math.round((subtotal * PLATFORM_FEE_BPS.value()) / 10000);
      const taxes = Math.round((subtotal * IVA_BPS.value()) / 10000);
      const totalAmount = subtotal + deliveryFee + taxes;
      const sellerEarnings = subtotal - platformFee;

      // 4. Reservar stock (decrementar) — se restituye si la orden se cancela/declina.
      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        if (listing.quantity === UNLIMITED_STOCK) continue;
        t.update(listingRefs[i], { quantity: admin.firestore.FieldValue.increment(-data.items[i].quantity) });
      }

      // 5. Referencia única e idempotente.
      const reference = `TODO-${sellerId}-${crypto.randomUUID()}`;
      const orderRef = db.collection('transactions').doc(reference);

      const nowIso = new Date().toISOString();
      t.create(orderRef, {
        transactionType: TransactionType.PURCHASE,
        status: TransactionStatus.PENDING_PAYMENT,
        buyerId: auth.uid,
        sellerId,
        lineItems,
        subtotal,
        deliveryFee,
        platformFee,
        totalAmount,
        sellerEarnings,
        deliveryMethod: data.delivery.method,
        payment: {
          gateway: 'wompi',
          transactionId: reference,
          status: 'pending',
          method: 'unknown',
          amount: totalAmount,
          currency: CURRENCY,
          createdAt: nowIso,
        },
        shippingAddress: data.delivery.address ?? null,
        notes: null,
        buyerNotes: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { reference, totalAmount, sellerId };
    });

    await audit(
      'transaction.created',
      { reference: result.reference, totalAmount: result.totalAmount, sellerId: result.sellerId },
      { performedBy: auth.uid, targetType: 'transaction', targetId: result.reference }
    );

    if (!wompiConfigured()) {
      return {
        reference: result.reference,
        amountInCents: result.totalAmount,
        currency: CURRENCY,
        paymentReady: false as const,
      };
    }

    const integrity = integritySignature(result.reference, result.totalAmount, CURRENCY, WOMPI_INTEGRITY_SECRET.value());
    return {
      reference: result.reference,
      amountInCents: result.totalAmount,
      currency: CURRENCY,
      integrity,
      paymentReady: true as const,
    };
  }
);
