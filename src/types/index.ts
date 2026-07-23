// ─── TODO — Type System v1.0 ───
// The single source of truth for the entire app.
// Everything is a Listing. Every business is a Seller. Every sale is a Transaction.

// ═══════════════════════════════════════════
// REVIEW / RATING
// ═══════════════════════════════════════════

export interface Rating {
  id: string;
  transactionId: string;
  fromUserId: string;
  fromUserRole: UserRole;
  toUserId: string;
  toUserRole: UserRole;
  score: number;
  comment?: string;
  listingId?: string;
  sellerId?: string;
  createdAt: string;
}

export interface RatingStats {
  userId: string;
  averageRating: number;
  totalRatings: number;
  breakdown: Record<number, number>;
  lastUpdated: string;
}

// ═══════════════════════════════════════════
// IDENTITY & AUTH
// ═══════════════════════════════════════════

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  COURIER = 'COURIER',
  CUSTOMER = 'CUSTOMER',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  city?: string;
  address?: string;
  isActive: boolean;
  isGuest: boolean;
  isVerified: boolean;
  sellerId?: string; // if role=SELLER, link to their seller profile
  favoriteSellerIds?: string[];
  impact: UserImpact;
  referralCode?: string;
  invitedBy?: string;
  hasSeenOnboarding?: boolean;
  onboardingDone?: boolean;
  tosAcceptedAt?: string;
  createdAt: string;
}

export interface UserImpact {
  points: number;
  level: 'NOVICE' | 'HERO' | 'GUARDIAN';
  totalSpent: number;
  totalTransactions: number;
  streak: Streak;
  // CO₂ is food-rescue specific, but we keep it for backward compat
  co2SavedKg?: number;
}

export interface Streak {
  current: number;
  best: number;
  multiplier: number;
  lastTransactionDate: string;
}

export interface Membership {
  id: string;
  userId: string;
  role: UserRole;
  sellerId?: string;
  status: 'active' | 'pending' | 'suspended' | 'banned' | 'deleted';
  createdAt: string;
  createdBy?: string;
}

// ═══════════════════════════════════════════
// CORE DOMAIN — Categories, Sellers, Listings
// ═══════════════════════════════════════════

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  icon: string; // emoji — "🍽️" "💻" "🛠️" "🎨"
  listingAttributes: CategoryAttribute[];
  level: number; // 0=root, 1=sub, 2=sub-sub
  order: number;
  isActive: boolean;
  stats: { sellerCount: number; listingCount: number; transactionCount: number };
}

export interface CategoryAttribute {
  name: string; // "brand", "duration", "condition"
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  label: string; // Display label — "Marca"
  placeholder?: string;
  options?: string[]; // For type='select'
  min?: number;
  max?: number;
}

export enum SellerType {
  FOOD = 'food',         // Rescatto original — restaurants, hotels, supermarkets
  RETAIL = 'retail',     // Physical products — electronics, clothes, furniture
  SERVICE = 'service',   // Services — beauty, education, consulting
  DIGITAL = 'digital',   // Digital goods — ebooks, software, templates
  INDIVIDUAL = 'individual', // Peer-to-peer — second-hand, freelance
}

export interface Seller {
  id: string;
  name: string;
  slug: string;
  type: SellerType;
  categoryIds: string[]; // what categories they sell in
  ownerId: string; // userId
  description?: string;
  logo?: string;
  coverImage?: string;
  location: {
    address: string;
    city: string;
    neighborhood?: string;
    lat?: number;
    lng?: number;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
  };
  schedule?: {
    mon?: TimeRange; tue?: TimeRange; wed?: TimeRange;
    thu?: TimeRange; fri?: TimeRange; sat?: TimeRange; sun?: TimeRange;
  };
  deliveryConfig?: DeliveryConfig;
  rating: number;
  ratingCount: number;
  subscription: 'free' | 'seller_pass_monthly' | 'seller_pass_annual';
  isActive: boolean;
  isVerified: boolean;
  stats: SellerStats;
  createdAt: string;
  updatedAt: string;
}

export interface TimeRange {
  open: string; // "09:00"
  close: string; // "18:00"
}

export interface DeliveryConfig {
  isEnabled: boolean;
  baseFee: number;
  pricePerKm: number;
  maxDistanceKm: number;
  freeThreshold?: number;
  estimatedTime?: string; // "30-45 min"
}

export interface SellerStats {
  totalTransactions: number;
  totalRevenue: number;
  totalListings: number;
  activeListings: number;
  completionRate: number; // 0-1
  avgRating: number;
  responseTimeHours: number; // avg chat response
}

export enum ListingType {
  PRODUCT = 'product', // Physical item — electronics, clothes, food pack
  SERVICE = 'service', // Bookable service — haircut, class, repair
  DIGITAL = 'digital', // Downloadable — ebook, template, software
}

export enum DeliveryMethod {
  PICKUP = 'pickup',       // Buyer picks up at seller location
  SHIPPING = 'shipping',   // Courier delivery
  DIGITAL = 'digital',     // Instant download
  IN_PERSON = 'in_person', // Service at seller's location
  REMOTE = 'remote',       // Service via call/video
  AT_BUYER = 'at_buyer',   // Service at buyer's location
}

export interface Listing {
  id: string;
  sellerId: string;
  categoryId: string;
  subcategoryId?: string;
  type: ListingType;
  title: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;  // for discount display
  compareAtPrice?: number;  // for "was $X, now $Y"
  discountPercent?: number; // auto-calculated
  quantity: number;         // stock for products. 999 = "unlimited"
  attributes: Record<string, any>; // Dynamic per category — see CategoryAttribute
  deliveryMethods: DeliveryMethod[];
  // For PICKUP
  pickupWindow?: { start: string; end: string; instructions?: string };
  // For SHIPPING
  shippingWeight?: number;  // grams
  shippingDimensions?: { l: number; w: number; h: number }; // cm
  // For SERVICE
  serviceDuration?: number; // minutes
  maxParticipants?: number;
  locationType?: 'in_person' | 'remote' | 'both';
  // For DIGITAL
  digitalFileUrl?: string;
  digitalFileSize?: number; // bytes
  conditions?: string[];    // for service/rental
  isActive: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  stats: ListingStats;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingStats {
  views: number;
  favorites: number;
  transactions: number;
  rating: number;
  ratingCount: number;
}

// ═══════════════════════════════════════════
// TRANSACTIONS & BOOKINGS
// ═══════════════════════════════════════════

export enum TransactionType {
  PURCHASE = 'purchase',   // Direct buy — product or digital
  BOOKING = 'booking',     // Service reservation
}

export enum TransactionStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  // For PURCHASE:
  PREPARING = 'PREPARING',     // Seller is preparing the item
  READY = 'READY',             // Ready for pickup/shipping
  IN_TRANSIT = 'IN_TRANSIT',   // With courier
  DELIVERED = 'DELIVERED',
  // For BOOKING:
  CONFIRMED = 'CONFIRMED',     // Booking confirmed
  ATTENDED = 'ATTENDED',       // Service completed
  NO_SHOW = 'NO_SHOW',
  // Shared:
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

export interface Transaction {
  id: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  buyerId: string;
  sellerId: string;
  lineItems: LineItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;     // Rescatto/Todo commission
  totalAmount: number;
  sellerEarnings: number;
  deliveryMethod: DeliveryMethod;
  // Payment
  payment: PaymentInfo;
  // Pickup
  pickupWindow?: { start: string; end: string };
  pickupCode?: string;
  // Shipping
  shippingAddress?: string;
  courierId?: string;
  trackingNumber?: string;
  // Digital
  downloadUrl?: string;
  downloadExpiresAt?: string;
  // Booking
  booking?: BookingSummary;
  notes?: string;
  buyerNotes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface LineItem {
  listingId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
  stockReserved?: boolean; // false = stock ilimitado, no se restituye al cancelar
}

export interface PaymentInfo {
  gateway: string; // "wompi"
  transactionId: string;
  status: 'pending' | 'approved' | 'declined' | 'refunded' | 'error';
  method: string; // "card" | "pse" | "nequi" | "daviplata" | "efecty"
  amount: number;
  currency: string; // "COP"
  createdAt: string;
  approvedAt?: string;
}

export interface BookingSummary {
  startTime: string;
  endTime: string;
  duration: number; // minutes
}

export interface Booking {
  id: string;
  transactionId: string;
  sellerId: string;
  buyerId: string;
  listingId: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  capacity: number;
  bookedCount: number;
  notes?: string;
  remindersSent: number;
  createdAt: string;
}

// ═══════════════════════════════════════════
// REVIEWS & SOCIAL
// ═══════════════════════════════════════════

export interface Review {
  id: string;
  transactionId: string;
  reviewerId: string;
  reviewerName: string;
  targetType: 'seller' | 'listing';
  targetId: string; // sellerId or listingId
  rating: number; // 1-5
  text?: string;
  images?: string[];
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[]; // userIds
  participantNames: Record<string, string>;
  transactionId?: string;
  lastMessage?: { text: string; senderId: string; timestamp: string; read: boolean };
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'text' | 'image' | 'system';
  timestamp: string;
  read: boolean;
}

// ═══════════════════════════════════════════
// FAVORITES & CART
// ═══════════════════════════════════════════

export interface CartItem {
  listingId: string;
  sellerId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  deliveryMethod: DeliveryMethod;
  // For BOOKING
  bookingSlot?: { date: string; time: string };
}

export interface Cart {
  id: string; // userId
  items: CartItem[];
  updatedAt: string;
}

// ═══════════════════════════════════════════
// GAMIFICATION (generalized from Rescatto)
// ═══════════════════════════════════════════

export enum EcoAction {
  FOOD_RESCUE = 'FOOD_RESCUE',   // food rescued (kg)
  LOCAL_PURCHASE = 'LOCAL_PURCHASE', // bought from local seller
  DIGITAL_PURCHASE = 'DIGITAL_PURCHASE', // no paper, no shipping
}

export interface ImpactRecord {
  id: string;
  userId: string;
  action: EcoAction;
  value: number; // kg CO₂ saved, trees equivalent, etc.
  transactionId?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════
// AI CHAT
// ═══════════════════════════════════════════

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface AIChatUsage {
  messagesToday: number;
  lastMessageDate: string;
  totalMessages: number;
  tier: string;
}

export interface AIMemory {
  id: string;
  userId: string;
  category: 'preference' | 'fact' | 'behavior' | 'context';
  key: string;
  value: string;
  confidence: number;
  source: 'explicit' | 'inferred' | 'system';
  createdAt: any;
  lastAccessed: any;
  ttlDays: number;
}

// ═══════════════════════════════════════════
// ANALYTICS & AUDIT
// ═══════════════════════════════════════════

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  path?: string;
  metadata?: { userAgent?: string; location?: string };
  createdAt: any;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export interface AdditionalUserData {
  fullName?: string;
  role?: UserRole;
  sellerId?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  referralCode?: string;
  invitedBy?: string;
  tosAcceptedAt?: string;
  preferences?: {
    notifications?: { orderUpdates?: boolean };
  };
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
}

export type Permission = 
  | 'manage_users' | 'manage_sellers' | 'manage_categories'
  | 'manage_transactions' | 'view_analytics' | 'manage_own_seller'
  | 'create_listings' | 'manage_bookings' | 'view_audit_logs';

// ═══════════════════════════════════════════════════════════════
// 🏦 FASE RAPPI/WECHAT — Wallet, Cashback, Social, Analytics
// ═══════════════════════════════════════════════════════════════

// ─── Todo Wallet ──────────────────────────────────────────────────────────
export interface Wallet {
  id: string;                // = userId
  balance: number;           // Saldo disponible en COP
  pendingCashback: number;   // Cashback no reclamado
  lifetimeCashback: number;  // Cashback total acumulado
  lifetimeSpent: number;     // Gasto total con wallet
  autoReload?: AutoReloadConfig;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'TOP_UP' | 'PAYMENT' | 'CASHBACK_EARNED' | 'CASHBACK_CLAIMED'
      | 'REFUND' | 'WITHDRAWAL' | 'GIFT_SENT' | 'GIFT_RECEIVED';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType?: 'transaction' | 'top_up' | 'gift';
  referenceId?: string;
  createdAt: string;
}

// ─── Cashback ─────────────────────────────────────────────────────────────
export interface CashbackRule {
  id: string;
  name: string;
  rateBps: number;           // basis points: 300 = 3%
  minPurchaseAmount: number;
  maxCashbackAmount: number;
  categoryId?: string;       // null = aplica a todas
  isActive: boolean;
  createdAt: string;
}

export interface CashbackRecord {
  id: string;
  userId: string;
  transactionId: string;
  amount: number;
  rateBps: number;
  status: 'PENDING' | 'AVAILABLE' | 'CLAIMED' | 'EXPIRED';
  expiresAt: string;         // 90 días
  createdAt: string;
  claimedAt?: string;
}

// ─── Social Commerce — Group Buying ────────────────────────────────────────
export interface GroupDeal {
  id: string;
  listingId: string;
  sellerId: string;
  title: string;
  originalPrice: number;
  groupPrice: number;
  discountPercent: number;
  minParticipants: number;
  maxParticipants: number;
  currentCount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}

export interface GroupDealParticipant {
  id: string;
  groupDealId: string;
  userId: string;
  transactionId?: string;
  status: 'JOINED' | 'PAID' | 'REFUNDED';
  joinedAt: string;
}

// ─── Seguir Sellers ──────────────────────────────────────────────────────
export interface SellerFollow {
  userId: string;
  sellerId: string;
  notifiedListing: boolean;
  followedAt: string;
}

// ─── Seller Content (WeChat Official Accounts style) ─────────────────────
export interface SellerPost {
  id: string;
  sellerId: string;
  title: string;
  content: string;
  media: { type: 'image' | 'video'; url: string }[];
  listingIds?: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface SellerPostView {
  postId: string;
  userId: string;
  viewedAt: string;
}

// ─── Seller Analytics (Brands by Rappi style) ────────────────────────────
export interface SellerAnalytics {
  sellerId: string;
  date: string;
  views: number;
  uniqueVisitors: number;
  listingViews: Record<string, number>;
  transactions: number;
  revenue: number;
  conversionRate: number;
  avgOrderValue: number;
  topListings: { listingId: string; views: number; sales: number }[];
}

// ─── Featured / Sponsored Listings ───────────────────────────────────────
export interface FeaturedListing {
  id: string;
  listingId: string;
  sellerId: string;
  campaignType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  budget: number;
  impressions: number;
  clicks: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Todo Gift (Red Packets style) ───────────────────────────────────────
export interface GiftCredit {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  message?: string;
  status: 'SENT' | 'CLAIMED' | 'EXPIRED' | 'REFUNDED';
  expiresAt: string;
  createdAt: string;
  claimedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// 🎁 STARBUCKS-INSPIRED — Gift Cards + Auto-Reload
// ═══════════════════════════════════════════════════════════════

// ─── Gift Card (multi-wallet style) ──────────────────────────
export interface GiftCard {
  id: string;
  userId: string;
  name: string;
  balance: number;
  originalAmount: number;
  message?: string;
  design?: 'default' | 'birthday' | 'celebration' | 'thanks' | 'holiday';
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'CANCELLED';
  source: 'purchased' | 'received' | 'promo' | 'corporate';
  isPrimary: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Gift Card Transaction ───────────────────────────────────
export interface GiftCardTransaction {
  id: string;
  cardId: string;
  userId: string;
  type: 'LOAD' | 'PURCHASE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'REFUND' | 'EXPIRATION';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

// ─── Auto-Reload Configuration ───────────────────────────────
export interface AutoReloadConfig {
  enabled: boolean;
  threshold: number;     // Recargar cuando saldo baje de X
  amount: number;        // Monto a recargar
  paymentMethod?: string; // "wompi" por ahora
  maxMonthly: number;    // Tope mensual de recargas automáticas
  monthlyCount: number;
  lastReloadAt?: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 🎫 COUPON SYSTEM
// ═══════════════════════════════════════════════════════════════

export interface Coupon {
  id: string;
  code: string;                 // e.g. "BIENVENIDO10"
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;        // 10 for 10% or 50000 for $50K
  minPurchase?: number;         // Minimum order amount
  maxDiscount?: number;         // Cap for percentage discounts
  maxUses: number;              // Total times it can be used
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  code: string;
  userId: string;
  orderId?: string;
  discountAmount: number;
  createdAt: string;
}
