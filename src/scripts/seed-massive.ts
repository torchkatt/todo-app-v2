// ─── Todo Seed — Data Generator ───
// Run: npx tsx src/scripts/seed-massive.ts
// Generates 50+ sellers, 200+ listings across all categories

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: "todo-a44f9.firebaseapp.com",
  projectId: "todo-a44f9",
  storageBucket: "todo-a44f9.firebasestorage.app",
  messagingSenderId: "741867785122",
  appId: "1:741867785122:web:18cf567bfb8efa689f40fb",
  measurementId: "G-P6RMQD1Y54",
};

const app = initializeApp(firebaseConfig, 'seed-massive');
const db = getFirestore(app);

const CITIES = ['Bucaramanga', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Pereira', 'Manizales', 'Santa Marta', 'Cúcuta'];
const NEIGHBORHOODS = ['Centro', 'Cabecera', 'Sotomayor', 'Provenza', 'Laureles', 'El Poblado', 'San Antonio', 'Granada', 'Alfonso López', 'Caobos'];

const FOOD = [
  { name: 'La Hamburguesa Feliz', logo: '🍔', desc: 'Hamburguesas artesanales con ingredientes locales' },
  { name: 'Pizza Nostra', logo: '🍕', desc: 'Pizza napolitana horneada en horno de leña' },
  { name: 'Sushi 83', logo: '🍣', desc: 'Sushi fresco con ingredientes del mar colombiano' },
  { name: 'Arepas Doña Rosa', logo: '🫓', desc: 'Arepas rellenas tradicionales y gourmet' },
  { name: 'La Parrilla de Juan', logo: '🥩', desc: 'Carnes a la parrilla con cortes premium' },
  { name: 'El Café de la Abuela', logo: '☕', desc: 'Café de especialidad del eje cafetero' },
  { name: 'Helados Crema', logo: '🍦', desc: 'Helados artesanales con frutas naturales' },
  { name: 'Empanadas Express', logo: '🥟', desc: 'Empanadas colombianas de diversos sabores' },
];
const TECH = [
  { name: 'TechStore', logo: '💻', desc: 'Electrónica y tecnología con garantía' },
  { name: 'Celulares Ya', logo: '📱', desc: 'Smartphones nuevos y reacondicionados' },
  { name: 'GameZone', logo: '🎮', desc: 'Videojuegos, consolas y accesorios gaming' },
  { name: 'FotoDigital', logo: '📷', desc: 'Cámaras, lentes y equipos de fotografía' },
  { name: 'AudioPro', logo: '🎧', desc: 'Audífonos, parlantes y equipos de sonido' },
];
const SERVICES = [
  { name: 'BarberKing', logo: '💇', desc: 'Barbería premium y grooming masculino' },
  { name: 'EnglishPro', logo: '📚', desc: 'Clases de inglés con profesores nativos' },
  { name: 'Mecánico Express', logo: '🔧', desc: 'Taller mecánico y mantenimiento preventivo' },
  { name: 'Fitness Club', logo: '💪', desc: 'Entrenamiento personal y nutrición' },
  { name: 'Limpieza Total', logo: '🧹', desc: 'Servicios de limpieza para hogar y oficina' },
  { name: 'Abogados Contigo', logo: '⚖️', desc: 'Consultoría legal y representación judicial' },
  { name: 'Fotografía Pro', logo: '📸', desc: 'Fotografía profesional para eventos' },
  { name: 'Mascotas Felices', logo: '🐾', desc: 'Paseo, cuidado y grooming de mascotas' },
];
const FASHION = [
  { name: 'FashionHub', logo: '👕', desc: 'Moda urbana y contemporánea' },
  { name: 'Zapatería Sport', logo: '👟', desc: 'Zapatillas y calzado deportivo' },
  { name: 'Accesorios Diva', logo: '💍', desc: 'Joyas, relojes y accesorios de moda' },
  { name: 'Ropa Infantil Sol', logo: '🧒', desc: 'Ropa para niños de 0 a 12 años' },
  { name: 'Trajes Elegantes', logo: '🤵', desc: 'Trajes formales y de ceremonia' },
];
const DIGITAL = [
  { name: 'TemplateLab', logo: '📱', desc: 'Plantillas Notion, Excel, Google Sheets' },
  { name: 'Ebook Colombia', logo: '📖', desc: 'Libros digitales de autores colombianos' },
  { name: 'Software Solutions', logo: '⚡', desc: 'Software y apps para negocios' },
  { name: 'Música Independiente', logo: '🎵', desc: 'Música y pistas libres de regalías' },
  { name: 'Cursos Online', logo: '🎓', desc: 'Cursos digitales de diversas áreas' },
];

const SELLERS = [...FOOD.map(s => ({...s, type:'food', cats:['cat-food','cat-food-restaurants']})),
  ...TECH.map(s => ({...s, type:'retail', cats:['cat-tech','cat-tech-phones']})),
  ...SERVICES.map(s => ({...s, type:'service', cats:['cat-services']})),
  ...FASHION.map(s => ({...s, type:'retail', cats:['cat-fashion']})),
  ...DIGITAL.map(s => ({...s, type:'digital', cats:['cat-digital']})),
];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }
function slug(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function rPrice(min: number, max: number) { return rand(min, max) * 1000; }
function rDate(daysAgo: number) { return new Date(Date.now() - rand(1, daysAgo) * 86400000).toISOString(); }

async function seed() {
  console.log('🌱 Massive seed starting...\n');

  let totalSellers = 0;
  let totalListings = 0;

  for (const sellerData of SELLERS) {
    const sellerId = `seller-${slug(sellerData.name)}`;
    const city = pick(CITIES);
    const hood = pick(NEIGHBORHOODS);
    const rating = Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
    const transactions = rand(5, 500);
    const revenue = transactions * rand(20, 80);
    const listingsCount = rand(2, 8);

    await setDoc(doc(db, 'sellers', sellerId), {
      name: sellerData.name, slug: slug(sellerData.name), type: sellerData.type,
      categoryIds: sellerData.cats, ownerId: `demo_${sellerId}`,
      description: sellerData.desc, logo: sellerData.logo,
      location: { address: `Calle ${rand(1,200)} # ${rand(1,100)}-${rand(1,50)}`, city, neighborhood: hood },
      contact: { phone: `+57300${rand(1000000, 9999999)}`, email: `contacto@${slug(sellerData.name)}.co` },
      deliveryConfig: { isEnabled: Math.random() > 0.3, baseFee: rand(3,10) * 1000, pricePerKm: rand(500,2000), maxDistanceKm: rand(5,20) },
      rating, ratingCount: Math.round(rating * rand(10, 50)), subscription: Math.random() > 0.5 ? 'free' : 'seller_pass_monthly',
      isActive: true, isVerified: Math.random() > 0.3,
      stats: { totalTransactions: transactions, totalRevenue: revenue, totalListings: listingsCount,
        activeListings: listingsCount, completionRate: Math.round((0.85 + Math.random() * 0.15) * 100) / 100,
        avgRating: rating, responseTimeHours: rand(1, 12) },
      createdAt: rDate(180), updatedAt: new Date().toISOString(),
    });
    totalSellers++;
    process.stdout.write(`  ✓ ${sellerData.logo} ${sellerData.name}`.padEnd(40) + ` [${city}] ${listingsCount} listings\n`);

    // Generate listings for this seller
    for (let i = 0; i < listingsCount; i++) {
      const listingId = `${sellerId}-listing-${i + 1}`;
      const types = ['product', 'service', 'digital'];
      const type = sellerData.type === 'food' ? 'product' : sellerData.type === 'service' ? 'service' : sellerData.type === 'digital' ? 'digital' : pick(types);
      const price = rPrice(5, sellerData.type === 'retail' ? 5000 : sellerData.type === 'digital' ? 100 : 150);
      const discount = Math.random() > 0.6 ? rand(10, 60) : 0;
      const names = ['Premium', 'Especial', 'Del día', 'Clásico', 'Pro', 'Plus', 'Económico', 'VIP', 'Express', 'Familiar'];
      
      await setDoc(doc(db, 'listings', listingId), {
        sellerId, categoryId: pick(sellerData.cats),
        subcategoryId: pick(sellerData.cats),
        type, title: `${sellerData.name} ${pick(names)} ${i + 1}`,
        description: `${sellerData.desc}. Producto de alta calidad.`,
        price, originalPrice: discount > 0 ? Math.round(price * (1 + discount / 100) / 1000) * 1000 : 0,
        quantity: type === 'digital' ? 999 : rand(1, 50),
        deliveryMethods: type === 'digital' ? ['digital'] : type === 'service' ? ['in_person', 'remote'] : ['pickup', 'shipping'],
        tags: [slug(sellerData.name), type, city.toLowerCase()],
        discountPercent: discount, isActive: true, isFeatured: Math.random() > 0.7,
        isApproved: true, attributes: {},
        stats: { views: rand(50, 2000), favorites: rand(5, 200), transactions: rand(1, transactions), rating: Math.round((3 + Math.random() * 2) * 10) / 10, ratingCount: rand(1, 50) },
        createdAt: rDate(90), updatedAt: new Date().toISOString(),
      });
      totalListings++;
    }
  }

  console.log(`\n✅ Seed complete: ${totalSellers} sellers, ${totalListings} listings`);
  process.exit(0);
}

seed().catch(e => { console.error('❌', e); process.exit(1); });
