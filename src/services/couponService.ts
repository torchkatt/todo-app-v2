/**
 * @file couponService.ts
 * @description Servicio de cupones — validar, aplicar, redimir, administrar.
 * Administradores crean cupones (porcentaje o monto fijo) y los usuarios
 * los aplican en checkout. Cada cupón tiene un límite de usos totales
 * y un límite de un uso por usuario.
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { COUPON_CONFIG } from '../config/constants';
import type { Coupon, CouponRedemption } from '../types';

const COUPONS_COLLECTION = 'coupons';
const REDEMPTIONS_COLLECTION = 'coupon_redemptions';

/** Genera un código de cupón: TODO-XXXXXX (8 chars) */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I,O,0,1 para evitar confusión
  let suffix = '';
  for (let i = 0; i < COUPON_CONFIG.codeLength; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${COUPON_CONFIG.codePrefix}-${suffix}`;
}

export const couponService = {
  /**
   * Valida que un cupón exista y sea aplicable por este usuario.
   * Lanza error descriptivo si no es válido.
   */
  async validate(codeOrId: string, userId: string): Promise<Coupon> {
    // Buscar por código (case-insensitive) o por id
    const code = codeOrId.toUpperCase().trim();
    let coupon: Coupon | null = null;

    // Intentar primero por código
    const byCodeSnap = await getDocs(
      query(collection(db, COUPONS_COLLECTION), where('code', '==', code), limit(1)),
    );
    if (!byCodeSnap.empty) {
      coupon = { id: byCodeSnap.docs[0].id, ...byCodeSnap.docs[0].data() } as Coupon;
    } else {
      // Intentar por id directo
      const docSnap = await getDoc(doc(db, COUPONS_COLLECTION, codeOrId));
      if (docSnap.exists()) {
        coupon = { id: docSnap.id, ...docSnap.data() } as Coupon;
      }
    }

    if (!coupon) {
      throw new Error('Cupón no encontrado. Verifica el código.');
    }

    if (!coupon.isActive) {
      throw new Error('Este cupón ya no está activo.');
    }

    if (new Date(coupon.expiresAt) < new Date()) {
      throw new Error('Este cupón ha expirado.');
    }

    if (coupon.currentUses >= coupon.maxUses) {
      throw new Error('Este cupón ha alcanzado su límite de usos.');
    }

    // Verificar que el usuario no lo haya usado ya
    const userRedemptions = await getDocs(
      query(
        collection(db, REDEMPTIONS_COLLECTION),
        where('couponId', '==', coupon.id),
        where('userId', '==', userId),
        limit(1),
      ),
    );
    if (!userRedemptions.empty) {
      throw new Error('Ya has usado este cupón anteriormente.');
    }

    return coupon;
  },

  /**
   * Aplica el cupón calculando el descuento.
   * Retorna {discount, finalTotal} o lanza error si no es válido.
   */
  async apply(
    codeOrId: string,
    userId: string,
    orderTotal: number,
  ): Promise<{ discount: number; finalTotal: number; coupon: Coupon }> {
    const coupon = await this.validate(codeOrId, userId);

    // Validar compra mínima
    if (coupon.minPurchase && orderTotal < coupon.minPurchase) {
      throw new Error(
        `Compra mínima de $${coupon.minPurchase.toLocaleString('es-CO')} requerida para este cupón.`,
      );
    }

    let discount = 0;

    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.round((coupon.discountValue / 100) * orderTotal);
      // Aplicar cap si existe
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      // FIXED — no puede exceder el total de la orden
      discount = Math.min(coupon.discountValue, orderTotal);
    }

    const finalTotal = Math.max(0, orderTotal - discount);

    return { discount, finalTotal, coupon };
  },

  /**
   * Redime un cupón (crea registro de uso e incrementa contador).
   * Se llama después de un pago exitoso.
   */
  async redeem(couponId: string, userId: string, orderId?: string): Promise<void> {
    const couponRef = doc(db, COUPONS_COLLECTION, couponId);
    const couponSnap = await getDoc(couponRef);

    if (!couponSnap.exists()) {
      throw new Error('Cupón no encontrado para redimir.');
    }

    const coupon = couponSnap.data() as Coupon;

    // Crear registro de redención
    await addDoc(collection(db, REDEMPTIONS_COLLECTION), {
      couponId,
      code: coupon.code,
      userId,
      orderId: orderId || null,
      discountAmount: coupon.discountType === 'PERCENTAGE'
        ? Math.round((coupon.discountValue / 100) * (coupon.minPurchase || 0))
        : coupon.discountValue,
      createdAt: new Date().toISOString(),
    } as Omit<CouponRedemption, 'id'>);

    // Incrementar usos
    await updateDoc(couponRef, {
      currentUses: (coupon.currentUses || 0) + 1,
    });
  },

  /**
   * Obtiene todos los cupones (admin).
   */
  async getCoupons(includeInactive = false): Promise<Coupon[]> {
    const constraints: any[] = [orderBy('createdAt', 'desc')];
    if (!includeInactive) {
      constraints.push(where('isActive', '==', true));
    }
    const snap = await getDocs(query(collection(db, COUPONS_COLLECTION), ...constraints));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
  },

  /**
   * Crea un nuevo cupón (admin).
   * Retorna el id del documento creado.
   */
  async create(data: Partial<Coupon> & { createdBy: string }): Promise<string> {
    if (!data.description || !data.discountType || !data.discountValue || !data.maxUses || !data.expiresAt) {
      throw new Error('Faltan campos requeridos: description, discountType, discountValue, maxUses, expiresAt');
    }

    // Validar tipo de descuento
    if (data.discountType === 'PERCENTAGE' && data.discountValue > COUPON_CONFIG.maxDiscountPercent) {
      throw new Error(`El porcentaje máximo de descuento es ${COUPON_CONFIG.maxDiscountPercent}%`);
    }

    // Generar código si no se proporciona
    const code = data.code?.trim() || generateCode();

    // Verificar unicidad del código
    const existingSnap = await getDocs(
      query(collection(db, COUPONS_COLLECTION), where('code', '==', code.toUpperCase()), limit(1)),
    );
    if (!existingSnap.empty) {
      throw new Error(`El código "${code}" ya existe. Usa otro código.`);
    }

    const coupon: Omit<Coupon, 'id'> = {
      code: code.toUpperCase(),
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minPurchase: data.minPurchase,
      maxDiscount: data.maxDiscount,
      maxUses: data.maxUses,
      currentUses: 0,
      expiresAt: data.expiresAt,
      isActive: true,
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
    };

    const ref = await addDoc(collection(db, COUPONS_COLLECTION), coupon);
    return ref.id;
  },

  /**
   * Desactiva un cupón (admin).
   */
  async deactivate(couponId: string): Promise<void> {
    await updateDoc(doc(db, COUPONS_COLLECTION, couponId), { isActive: false });
  },
};
