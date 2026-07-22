// Espejo de src/types/index.ts — mantener sincronizado manualmente.
// Solo se replican los tipos que el backend necesita para pagos/órdenes.

export enum TransactionType {
  PURCHASE = 'purchase',
  BOOKING = 'booking',
}

export enum TransactionStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

export enum DeliveryMethod {
  PICKUP = 'pickup',
  SHIPPING = 'shipping',
  DIGITAL = 'digital',
  IN_PERSON = 'in_person',
  REMOTE = 'remote',
  AT_BUYER = 'at_buyer',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  COURIER = 'COURIER',
  CUSTOMER = 'CUSTOMER',
}

export interface LineItem {
  listingId: string;
  title: string;
  quantity: number;
  unitPrice: number; // centavos
  totalPrice: number; // centavos
  image?: string;
  stockReserved?: boolean; // false = stock ilimitado, no restituir al cancelar
}

export interface PaymentInfo {
  gateway: string; // "wompi"
  transactionId: string; // reference propio (== transactions/{id})
  status: 'pending' | 'approved' | 'declined' | 'refunded' | 'error';
  method: string;
  amount: number; // centavos
  currency: string; // "COP"
  createdAt: string;
  approvedAt?: string;
  wompiId?: string;
}

export interface DeliveryConfig {
  isEnabled: boolean;
  baseFee: number; // COP (pesos, no centavos — como está en el doc de seller)
  pricePerKm: number;
  maxDistanceKm: number;
  freeThreshold?: number;
  estimatedTime?: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  price: number; // COP pesos (no centavos) — se multiplica x100 al calcular
  quantity: number;
  isActive: boolean;
  isApproved: boolean;
  title: string;
}

export interface Seller {
  id: string;
  ownerId: string;
  deliveryConfig?: DeliveryConfig;
}
