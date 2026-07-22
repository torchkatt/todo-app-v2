// ─── Seed script: populate Firestore with categories + demo data ───
// Run: npx tsx src/scripts/seed.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { CATEGORY_SEED } from '../services/categorySeed';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: "todo-a44f9.firebaseapp.com",
  projectId: "todo-a44f9",
  storageBucket: "todo-a44f9.firebasestorage.app",
  messagingSenderId: "741867785122",
  appId: "1:741867785122:web:18cf567bfb8efa689f40fb",
  measurementId: "G-P6RMQD1Y54",
};

const app = initializeApp(firebaseConfig, 'seed');
const db = getFirestore(app);

const DEMO_SELLERS = [
  {
    id: 'seller-sushi83',
    name: 'Sushi 83',
    slug: 'sushi-83',
    type: 'food',
    categoryIds: ['cat-food', 'cat-food-packs'],
    ownerId: 'demo',
    description: 'Sushi artesanal con ingredientes frescos. Rescatamos packs diarios para evitar desperdicio.',
    logo: '🍣',
    coverImage: '',
    location: { address: 'Calle 83 # 45-20', city: 'Bucaramanga', neighborhood: 'Cabecera', lat: 7.1186, lng: -73.1169 },
    contact: { phone: '+573001234567', email: 'sushi83@demo.com' },
    deliveryConfig: { isEnabled: true, baseFee: 5000, pricePerKm: 1000, maxDistanceKm: 10, estimatedTime: '30-45 min' },
    rating: 4.8,
    ratingCount: 127,
    subscription: 'seller_pass_monthly',
    isActive: true,
    isVerified: true,
    stats: { totalTransactions: 320, totalRevenue: 4800000, totalListings: 5, activeListings: 3, completionRate: 0.98, avgRating: 4.8, responseTimeHours: 1 },
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-07-17T10:00:00Z',
  },
  {
    id: 'seller-techstore',
    name: 'TechStore',
    slug: 'techstore',
    type: 'retail',
    categoryIds: ['cat-tech', 'cat-tech-phones', 'cat-tech-computers', 'cat-tech-accessories'],
    ownerId: 'demo2',
    description: 'Tienda de tecnología con los mejores precios. Productos nuevos y reacondicionados con garantía.',
    logo: '💻',
    coverImage: '',
    location: { address: 'Calle 34 # 27-45', city: 'Bucaramanga', neighborhood: 'Centro', lat: 7.1194, lng: -73.1208 },
    contact: { phone: '+573009876543', email: 'info@techstore.com' },
    deliveryConfig: { isEnabled: true, baseFee: 8000, pricePerKm: 1500, maxDistanceKm: 15, freeThreshold: 100000 },
    rating: 4.5,
    ratingCount: 89,
    subscription: 'seller_pass_monthly',
    isActive: true,
    isVerified: true,
    stats: { totalTransactions: 180, totalRevenue: 15000000, totalListings: 12, activeListings: 8, completionRate: 0.95, avgRating: 4.5, responseTimeHours: 2 },
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-07-17T10:00:00Z',
  },
  {
    id: 'seller-barberking',
    name: 'BarberKing',
    slug: 'barberking',
    type: 'service',
    categoryIds: ['cat-services', 'cat-services-beauty'],
    ownerId: 'demo3',
    description: 'Barbería premium. Cortes modernos, barba, afeitado clásico y tratamientos capilares.',
    logo: '💇',
    coverImage: '',
    location: { address: 'Carrera 33 # 52-10', city: 'Bucaramanga', neighborhood: 'Cabecera', lat: 7.1210, lng: -73.1150 },
    contact: { phone: '+573005551122', email: 'citas@barberking.com' },
    deliveryConfig: { isEnabled: false, baseFee: 0, pricePerKm: 0, maxDistanceKm: 0 },
    rating: 4.9,
    ratingCount: 210,
    subscription: 'seller_pass_annual',
    isActive: true,
    isVerified: true,
    stats: { totalTransactions: 580, totalRevenue: 8000000, totalListings: 4, activeListings: 4, completionRate: 0.99, avgRating: 4.9, responseTimeHours: 0.5 },
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-07-17T10:00:00Z',
  },
  {
    id: 'seller-englishpro',
    name: 'EnglishPro',
    slug: 'englishpro',
    type: 'service',
    categoryIds: ['cat-services', 'cat-services-education'],
    ownerId: 'demo4',
    description: 'Clases de inglés con profesores nativos y certificados. Todos los niveles.',
    logo: '📚',
    coverImage: '',
    location: { address: 'Virtual', city: 'Bucaramanga', neighborhood: 'Online', lat: 7.1250, lng: -73.1200 },
    contact: { phone: '+573001112233', email: 'hello@englishpro.com' },
    deliveryConfig: { isEnabled: false, baseFee: 0, pricePerKm: 0, maxDistanceKm: 0 },
    rating: 4.7,
    ratingCount: 55,
    subscription: 'free',
    isActive: true,
    isVerified: true,
    stats: { totalTransactions: 120, totalRevenue: 6000000, totalListings: 3, activeListings: 3, completionRate: 0.97, avgRating: 4.7, responseTimeHours: 3 },
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-07-17T10:00:00Z',
  },
  {
    id: 'seller-fashionhub',
    name: 'FashionHub',
    slug: 'fashionhub',
    type: 'retail',
    categoryIds: ['cat-fashion', 'cat-fashion-women', 'cat-fashion-men'],
    ownerId: 'demo5',
    description: 'Moda urbana y clásica. Ropa nueva y de segunda mano en excelente estado.',
    logo: '👕',
    coverImage: '',
    location: { address: 'Calle 42 # 33-12', city: 'Bucaramanga', neighborhood: 'Sotomayor', lat: 7.1150, lng: -73.1180 },
    contact: { phone: '+573004445566', email: 'ventas@fashionhub.com' },
    deliveryConfig: { isEnabled: true, baseFee: 6000, pricePerKm: 1000, maxDistanceKm: 10, freeThreshold: 150000 },
    rating: 4.3,
    ratingCount: 42,
    subscription: 'free',
    isActive: true,
    isVerified: false,
    stats: { totalTransactions: 65, totalRevenue: 3500000, totalListings: 15, activeListings: 10, completionRate: 0.92, avgRating: 4.3, responseTimeHours: 5 },
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-07-17T10:00:00Z',
  },
  {
    id: 'seller-templatelab',
    name: 'TemplateLab',
    slug: 'templatelab',
    type: 'digital',
    categoryIds: ['cat-digital', 'cat-digital-templates', 'cat-digital-software'],
    ownerId: 'demo6',
    description: 'Plantillas para Notion, Excel, Google Sheets. Recursos digitales para productividad.',
    logo: '📱',
    coverImage: '',
    location: { address: 'Online', city: 'Todo Colombia', neighborhood: 'Digital' },
    contact: { email: 'hola@templatelab.co' },
    deliveryConfig: { isEnabled: false, baseFee: 0, pricePerKm: 0, maxDistanceKm: 0 },
    rating: 4.6,
    ratingCount: 78,
    subscription: 'seller_pass_monthly',
    isActive: true,
    isVerified: true,
    stats: { totalTransactions: 240, totalRevenue: 3800000, totalListings: 8, activeListings: 6, completionRate: 1.0, avgRating: 4.6, responseTimeHours: 1 },
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-07-17T10:00:00Z',
  },
];

const DEMO_LISTINGS = [
  // ─── Sushi 83 ───
  { id: 'listing-1', sellerId: 'seller-sushi83', categoryId: 'cat-food', subcategoryId: 'cat-food-packs', type: 'product', title: 'Pack Sorpresa Sushi 83', description: 'Pack sorpresa con 8 piezas de sushi variado. Ingredientes frescos del día. ¡Recoge antes de las 7PM!', images: [], price: 15000, originalPrice: 35000, quantity: 10, deliveryMethods: ['pickup'], attributes: { pickupWindowStart: '12:00', pickupWindowEnd: '19:00', ingredients: 'Salmón, atún, aguacate, arroz', allergens: 'Pescado, soya' }, tags: ['sushi', 'comida', 'pack', 'rescate'], discountPercent: 57, isActive: true, isFeatured: true, isApproved: true, stats: { views: 230, favorites: 45, transactions: 38, rating: 4.7, ratingCount: 18 } },
  // ─── TechStore ───
  { id: 'listing-2', sellerId: 'seller-techstore', categoryId: 'cat-tech', subcategoryId: 'cat-tech-computers', type: 'product', title: 'MacBook Pro M3 2025', description: 'MacBook Pro 14" con chip M3, 16GB RAM, 512GB SSD. Pantalla Liquid Retina XDR. Batería 18h. Incluye cargador.', images: [], price: 4500000, originalPrice: 6200000, quantity: 3, deliveryMethods: ['pickup', 'shipping'], attributes: { brand: 'Apple', model: 'MacBook Pro M3', ram: '16GB', storage: '512GB SSD', condition: 'Nuevo', warranty: '1 año' }, tags: ['macbook', 'apple', 'laptop', 'tecnología'], discountPercent: 27, isActive: true, isFeatured: true, isApproved: true, stats: { views: 890, favorites: 112, transactions: 15, rating: 4.8, ratingCount: 12 } },
  { id: 'listing-3', sellerId: 'seller-techstore', categoryId: 'cat-tech', subcategoryId: 'cat-tech-phones', type: 'product', title: 'iPhone 16 Pro 256GB', description: 'iPhone 16 Pro color titanio natural. 256GB. Cámara 48MP. Chip A18 Pro.', images: [], price: 3800000, originalPrice: 4200000, quantity: 5, deliveryMethods: ['pickup', 'shipping'], attributes: { brand: 'Apple', model: 'iPhone 16 Pro', storage: '256GB', condition: 'Nuevo', warranty: '1 año' }, tags: ['iphone', 'apple', 'celular', 'tecnología'], discountPercent: 10, isActive: true, isFeatured: false, isApproved: true, stats: { views: 650, favorites: 88, transactions: 12, rating: 4.6, ratingCount: 8 } },
  // ─── BarberKing ───
  { id: 'listing-4', sellerId: 'seller-barberking', categoryId: 'cat-services', subcategoryId: 'cat-services-beauty', type: 'service', title: 'Corte + Barba Premium', description: 'Corte personalizado + delineado de barba + lavado con shampoo premium. Incluye café o cerveza artesanal.', images: [], price: 35000, originalPrice: 50000, quantity: 999, deliveryMethods: ['in_person'], attributes: { duration: 45, gender: 'Hombre', includes: 'Corte, barba, lavado, bebida' }, tags: ['barbería', 'corte', 'barba', 'premium'], discountPercent: 30, isActive: true, isFeatured: true, isApproved: true, stats: { views: 1200, favorites: 200, transactions: 180, rating: 4.9, ratingCount: 95 } },
  { id: 'listing-5', sellerId: 'seller-barberking', categoryId: 'cat-services', subcategoryId: 'cat-services-beauty', type: 'service', title: 'Afeitado Clásico + Mascarilla', description: 'Afeitado clásico con navaja + mascarilla facial hidratante. 60 min de relax total.', images: [], price: 25000, quantity: 999, deliveryMethods: ['in_person'], attributes: { duration: 60, gender: 'Hombre', includes: 'Afeitado, mascarilla, toalla caliente' }, tags: ['barbería', 'afeitado', 'mascarilla', 'spa'], discountPercent: 0, isActive: true, isFeatured: false, isApproved: true, stats: { views: 450, favorites: 78, transactions: 65, rating: 4.8, ratingCount: 32 } },
  // ─── EnglishPro ───
  { id: 'listing-6', sellerId: 'seller-englishpro', categoryId: 'cat-services', subcategoryId: 'cat-services-education', type: 'service', title: 'Clase de inglés individual', description: 'Clase 1:1 con profesor certificado. Enfoque en conversación. Nivel básico a avanzado. Material incluido.', images: [], price: 50000, quantity: 999, deliveryMethods: ['remote'], attributes: { duration: 60, modality: 'Virtual', level: 'Todos', materialsIncluded: true }, tags: ['inglés', 'clases', 'educación', 'online'], discountPercent: 0, isActive: true, isFeatured: true, isApproved: true, stats: { views: 340, favorites: 56, transactions: 89, rating: 4.7, ratingCount: 45 } },
  { id: 'listing-7', sellerId: 'seller-englishpro', categoryId: 'cat-services', subcategoryId: 'cat-services-education', type: 'service', title: 'Curso intensivo 10 clases', description: '10 clases individuales de 60 min. Mejora tu nivel rápidamente. Certificado al finalizar.', images: [], price: 400000, originalPrice: 500000, quantity: 999, deliveryMethods: ['remote'], attributes: { duration: 60, modality: 'Virtual', level: 'Todos', materialsIncluded: true }, tags: ['inglés', 'curso', 'intensivo', 'certificado'], discountPercent: 20, isActive: true, isFeatured: false, isApproved: true, stats: { views: 189, favorites: 34, transactions: 22, rating: 4.6, ratingCount: 18 } },
  // ─── FashionHub ───
  { id: 'listing-8', sellerId: 'seller-fashionhub', categoryId: 'cat-fashion', subcategoryId: 'cat-fashion-women', type: 'product', title: 'Chaqueta Leather Premium', description: 'Chaqueta de cuero genuino. Talla M. Excelente estado. Ideal para look casual elegante.', images: [], price: 180000, originalPrice: 320000, quantity: 2, deliveryMethods: ['pickup', 'shipping'], attributes: { size: 'M', condition: 'Usado', brand: 'Levi\'s' }, tags: ['chaqueta', 'cuero', 'moda', 'premium'], discountPercent: 44, isActive: true, isFeatured: true, isApproved: true, stats: { views: 310, favorites: 67, transactions: 5, rating: 4.2, ratingCount: 4 } },
  // ─── TemplateLab ───
  { id: 'listing-9', sellerId: 'seller-templatelab', categoryId: 'cat-digital', subcategoryId: 'cat-digital-templates', type: 'digital', title: 'Template Notion Finanzas', description: 'Plantilla completa para gestión de finanzas personales. Controla ingresos, gastos, inversiones y metas. Incluye dashboard automático.', images: [], price: 25000, originalPrice: 50000, quantity: 999, deliveryMethods: ['digital'], attributes: { format: 'Notion', category: 'Finanzas' }, tags: ['notion', 'finanzas', 'plantilla', 'digital'], discountPercent: 50, isActive: true, isFeatured: true, isApproved: true, stats: { views: 780, favorites: 145, transactions: 120, rating: 4.5, ratingCount: 56 } },
  { id: 'listing-10', sellerId: 'seller-templatelab', categoryId: 'cat-digital', subcategoryId: 'cat-digital-templates', type: 'digital', title: 'Bundle Productividad - 5 Plantillas', description: '5 plantillas de productividad: Kanban, OKRs, Habit Tracker, Calendar, Notes. Para Notion.', images: [], price: 45000, originalPrice: 80000, quantity: 999, deliveryMethods: ['digital'], attributes: { format: 'Notion', category: 'Productividad' }, tags: ['notion', 'productividad', 'bundle', 'digital'], discountPercent: 44, isActive: true, isFeatured: false, isApproved: true, stats: { views: 420, favorites: 89, transactions: 67, rating: 4.4, ratingCount: 33 } },
];

async function seed() {
  console.log('🌱 Seeding categories...');
  for (const cat of CATEGORY_SEED) {
    const ref = doc(db, 'categories', cat.id);
    await setDoc(ref, { ...cat, stats: { sellerCount: 0, listingCount: 0, transactionCount: 0 } });
    console.log(`  ✓ ${cat.icon} ${cat.name}`);
  }

  console.log('\n🏪 Seeding sellers...');
  for (const s of DEMO_SELLERS) {
    await setDoc(doc(db, 'sellers', s.id), s);
    console.log(`  ✓ ${s.name}`);
  }

  console.log('\n📦 Seeding listings...');
  for (const l of DEMO_LISTINGS) {
    await setDoc(doc(db, 'listings', l.id), { ...l, updatedAt: new Date().toISOString(), createdAt: l.id.includes('listing-1') ? '2026-07-17T10:00:00Z' : new Date(Date.now() - Math.random() * 30 * 86400000).toISOString() });
    console.log(`  ✓ ${l.title}`);
  }

  console.log('\n✅ Seed complete!');
  process.exit(0);
}

seed().catch(e => { console.error('❌', e); process.exit(1); });
