// ─── Seed via Firestore REST API with gcloud auth ───
// Run: npx tsx src/scripts/seed-rest.ts
// Requires valid access token at /tmp/token.txt

import { CATEGORY_SEED } from '../services/categorySeed';
import * as fs from 'fs';

const PROJECT = 'todo-a44f9';
const TOKEN = fs.readFileSync('./seed_token.txt', 'utf-8').trim();
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

function toFields(obj: any): any {
  const fields: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'number') fields[key] = { integerValue: String(Math.round(value)) };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === 'string') {
        fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: v })) } };
      } else if (typeof first === 'object' && first !== null) {
        fields[key] = { arrayValue: { values: value.map(v => ({ mapValue: { fields: toFields(v) } })) } };
      }
    }
    else if (typeof value === 'object') fields[key] = { mapValue: { fields: toFields(value) } };
  }
  return fields;
}

async function createDoc(collection: string, id: string, data: any) {
  const url = `${BASE}/${collection}?documentId=${id}`;
  const body = { fields: toFields(data) };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${collection}/${id}: ${res.status} ${err}`);
  }
  return id;
}

async function main() {
  console.log('🌱 Seeding from REST API...\n');
  
  for (const cat of CATEGORY_SEED) {
    await createDoc('categories', cat.id, { ...cat, stats: { sellerCount: 0, listingCount: 0, transactionCount: 0 } });
    console.log(`  ✓ ${cat.icon} ${cat.name}`);
  }

  const DEMO_SELLERS = [
    { id:'seller-sushi83', name:'Sushi 83', slug:'sushi-83', type:'food', categoryIds:['cat-food','cat-food-packs'], ownerId:'demo', description:'Sushi artesanal con ingredientes frescos.', logo:'🍣', location:{address:'Calle 83 # 45-20',city:'Bucaramanga',neighborhood:'Cabecera'}, contact:{phone:'+573001234567',email:'sushi83@demo.com'}, rating:4.8, ratingCount:127, subscription:'seller_pass_monthly', isActive:true, isVerified:true, deliveryConfig:{isEnabled:true,baseFee:5000,pricePerKm:1000,maxDistanceKm:10}, stats:{totalTransactions:320,totalRevenue:4800000,totalListings:5,activeListings:3,completionRate:0.98,avgRating:4.8,responseTimeHours:1} },
    { id:'seller-techstore', name:'TechStore', slug:'techstore', type:'retail', categoryIds:['cat-tech','cat-tech-phones','cat-tech-computers'], ownerId:'demo2', description:'Tienda de tecnología. Productos nuevos con garantía.', logo:'💻', location:{address:'Calle 34 # 27-45',city:'Bucaramanga',neighborhood:'Centro'}, contact:{phone:'+573009876543',email:'info@techstore.com'}, rating:4.5, ratingCount:89, subscription:'seller_pass_monthly', isActive:true, isVerified:true, deliveryConfig:{isEnabled:true,baseFee:8000,pricePerKm:1500,maxDistanceKm:15}, stats:{totalTransactions:180,totalRevenue:15000000,totalListings:12,activeListings:8,completionRate:0.95,avgRating:4.5,responseTimeHours:2} },
    { id:'seller-barberking', name:'BarberKing', slug:'barberking', type:'service', categoryIds:['cat-services','cat-services-beauty'], ownerId:'demo3', description:'Barbería premium. Cortes modernos y barba.', logo:'💇', location:{address:'Carrera 33 # 52-10',city:'Bucaramanga',neighborhood:'Cabecera'}, contact:{phone:'+573005551122',email:'citas@barberking.com'}, rating:4.9, ratingCount:210, subscription:'seller_pass_annual', isActive:true, isVerified:true, deliveryConfig:{isEnabled:false,baseFee:0,pricePerKm:0,maxDistanceKm:0}, stats:{totalTransactions:580,totalRevenue:8000000,totalListings:4,activeListings:4,completionRate:0.99,avgRating:4.9,responseTimeHours:0.5} },
    { id:'seller-englishpro', name:'EnglishPro', slug:'englishpro', type:'service', categoryIds:['cat-services','cat-services-education'], ownerId:'demo4', description:'Clases de inglés con profesores certificados.', logo:'📚', location:{address:'Virtual',city:'Bucaramanga',neighborhood:'Online'}, contact:{phone:'+573001112233',email:'hello@englishpro.com'}, rating:4.7, ratingCount:55, subscription:'free', isActive:true, isVerified:true, deliveryConfig:{isEnabled:false,baseFee:0,pricePerKm:0,maxDistanceKm:0}, stats:{totalTransactions:120,totalRevenue:6000000,totalListings:3,activeListings:3,completionRate:0.97,avgRating:4.7,responseTimeHours:3} },
    { id:'seller-fashionhub', name:'FashionHub', slug:'fashionhub', type:'retail', categoryIds:['cat-fashion','cat-fashion-women','cat-fashion-men'], ownerId:'demo5', description:'Moda urbana. Ropa nueva y de segunda mano.', logo:'👕', location:{address:'Calle 42 # 33-12',city:'Bucaramanga',neighborhood:'Sotomayor'}, contact:{phone:'+573004445566',email:'ventas@fashionhub.com'}, rating:4.3, ratingCount:42, subscription:'free', isActive:true, isVerified:false, deliveryConfig:{isEnabled:true,baseFee:6000,pricePerKm:1000,maxDistanceKm:10}, stats:{totalTransactions:65,totalRevenue:3500000,totalListings:15,activeListings:10,completionRate:0.92,avgRating:4.3,responseTimeHours:5} },
    { id:'seller-templatelab', name:'TemplateLab', slug:'templatelab', type:'digital', categoryIds:['cat-digital','cat-digital-templates','cat-digital-software'], ownerId:'demo6', description:'Plantillas para Notion, Excel, Google Sheets.', logo:'📱', location:{address:'Online',city:'Todo Colombia',neighborhood:'Digital'}, contact:{email:'hola@templatelab.co'}, rating:4.6, ratingCount:78, subscription:'seller_pass_monthly', isActive:true, isVerified:true, deliveryConfig:{isEnabled:false,baseFee:0,pricePerKm:0,maxDistanceKm:0}, stats:{totalTransactions:240,totalRevenue:3800000,totalListings:8,activeListings:6,completionRate:1,avgRating:4.6,responseTimeHours:1} },
  ];

  for (const s of DEMO_SELLERS) {
    await createDoc('sellers', s.id, { ...s, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    console.log(`  ✓ 🏪 ${s.name}`);
  }

  const DEMO_LISTINGS = [
    { id:'listing-1', sellerId:'seller-sushi83', categoryId:'cat-food', subcategoryId:'cat-food-packs', type:'product', title:'Pack Sorpresa Sushi 83', description:'8 piezas de sushi variado. Ingredientes frescos del día.', price:15000, originalPrice:35000, quantity:10, deliveryMethods:['pickup'], tags:['sushi','comida','pack'], isActive:true, isFeatured:true, isApproved:true, discountPercent:57, stats:{views:230,favorites:45,transactions:38,rating:4.7,ratingCount:18} },
    { id:'listing-2', sellerId:'seller-techstore', categoryId:'cat-tech', subcategoryId:'cat-tech-computers', type:'product', title:'MacBook Pro M3 2025', description:'MacBook Pro 14" M3, 16GB RAM, 512GB SSD.', price:4500000, originalPrice:6200000, quantity:3, deliveryMethods:['pickup','shipping'], tags:['macbook','apple','laptop'], isActive:true, isFeatured:true, isApproved:true, discountPercent:27, stats:{views:890,favorites:112,transactions:15,rating:4.8,ratingCount:12} },
    { id:'listing-3', sellerId:'seller-techstore', categoryId:'cat-tech', subcategoryId:'cat-tech-phones', type:'product', title:'iPhone 16 Pro 256GB', description:'iPhone 16 Pro titanio natural. 256GB. Cámara 48MP.', price:3800000, originalPrice:4200000, quantity:5, deliveryMethods:['pickup','shipping'], tags:['iphone','apple','celular'], isActive:true, isFeatured:false, isApproved:true, discountPercent:10, stats:{views:650,favorites:88,transactions:12,rating:4.6,ratingCount:8} },
    { id:'listing-4', sellerId:'seller-barberking', categoryId:'cat-services', subcategoryId:'cat-services-beauty', type:'service', title:'Corte + Barba Premium', description:'Corte personalizado + barba + lavado premium.', price:35000, originalPrice:50000, quantity:999, deliveryMethods:['in_person'], tags:['barbería','corte','barba'], isActive:true, isFeatured:true, isApproved:true, discountPercent:30, stats:{views:1200,favorites:200,transactions:180,rating:4.9,ratingCount:95} },
    { id:'listing-5', sellerId:'seller-barberking', categoryId:'cat-services', subcategoryId:'cat-services-beauty', type:'service', title:'Afeitado Clásico + Mascarilla', description:'Afeitado con navaja + mascarilla facial.', price:25000, quantity:999, deliveryMethods:['in_person'], tags:['barbería','afeitado','spa'], isActive:true, isFeatured:false, isApproved:true, stats:{views:450,favorites:78,transactions:65,rating:4.8,ratingCount:32} },
    { id:'listing-6', sellerId:'seller-englishpro', categoryId:'cat-services', subcategoryId:'cat-services-education', type:'service', title:'Clase de inglés individual', description:'Clase 1:1 con profesor certificado. 60 min.', price:50000, quantity:999, deliveryMethods:['remote'], tags:['inglés','clases','online'], isActive:true, isFeatured:true, isApproved:true, stats:{views:340,favorites:56,transactions:89,rating:4.7,ratingCount:45} },
    { id:'listing-7', sellerId:'seller-englishpro', categoryId:'cat-services', subcategoryId:'cat-services-education', type:'service', title:'Curso intensivo 10 clases', description:'10 clases individuales. Certificado al finalizar.', price:400000, originalPrice:500000, quantity:999, deliveryMethods:['remote'], tags:['inglés','curso','intensivo'], isActive:true, isFeatured:false, isApproved:true, discountPercent:20, stats:{views:189,favorites:34,transactions:22,rating:4.6,ratingCount:18} },
    { id:'listing-8', sellerId:'seller-fashionhub', categoryId:'cat-fashion', subcategoryId:'cat-fashion-women', type:'product', title:'Chaqueta Leather Premium', description:'Chaqueta cuero genuino. Talla M. Excelente estado.', price:180000, originalPrice:320000, quantity:2, deliveryMethods:['pickup','shipping'], tags:['chaqueta','cuero','moda'], isActive:true, isFeatured:true, isApproved:true, discountPercent:44, stats:{views:310,favorites:67,transactions:5,rating:4.2,ratingCount:4} },
    { id:'listing-9', sellerId:'seller-templatelab', categoryId:'cat-digital', subcategoryId:'cat-digital-templates', type:'digital', title:'Template Notion Finanzas', description:'Plantilla completa de finanzas personales.', price:25000, originalPrice:50000, quantity:999, deliveryMethods:['digital'], tags:['notion','finanzas','plantilla'], isActive:true, isFeatured:true, isApproved:true, discountPercent:50, stats:{views:780,favorites:145,transactions:120,rating:4.5,ratingCount:56} },
    { id:'listing-10', sellerId:'seller-templatelab', categoryId:'cat-digital', subcategoryId:'cat-digital-templates', type:'digital', title:'Bundle Productividad 5 Plantillas', description:'5 plantillas para Notion: Kanban, OKRs, Tracker.', price:45000, originalPrice:80000, quantity:999, deliveryMethods:['digital'], tags:['notion','productividad','bundle'], isActive:true, isFeatured:false, isApproved:true, discountPercent:44, stats:{views:420,favorites:89,transactions:67,rating:4.4,ratingCount:33} },
  ];

  for (const l of DEMO_LISTINGS) {
    await createDoc('listings', l.id, { ...l, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attributes: {} });
    console.log(`  ✓ 📦 ${l.title}`);
  }

  console.log('\n✅ Seed complete!');
}

main().catch(e => { console.error('\n❌', e); process.exit(1); });
