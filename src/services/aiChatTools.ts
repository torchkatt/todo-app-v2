import { db, functions } from './firebase';
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { logger } from '../utils/logger';
import { checkToolAction } from './aiChatSecurity';
import type { Listing, Seller } from '../types';

let navigateToPath: ((path: string) => void) | null = null;
export const setNavigateHook = (fn: (path: string) => void) => { navigateToPath = fn; };

// ─── Tool Definitions (16 tools = everything in the app) ───

export interface ToolDefinition {
  type: 'function';
  function: { name: string; description: string; parameters: any };
}

export const TODO_TOOLS: ToolDefinition[] = [
  // ─── Búsqueda ───
  { type: 'function', function: { name: 'searchListings', description: 'Buscar productos, servicios o contenido digital. Filtra por query, categoría, tipo, precio y ciudad.', parameters: {
    type: 'object', properties: {
      query: { type: 'string', description: 'Término de búsqueda' },
      categoryId: { type: 'string', description: 'ID de categoría' },
      type: { type: 'string', enum: ['product', 'service', 'digital'] },
      maxPrice: { type: 'number', description: 'Precio máximo en COP' },
      city: { type: 'string' },
    }, required: ['query'],
  }}},
  { type: 'function', function: { name: 'searchSellers', description: 'Buscar vendedores por nombre, tipo, ciudad o categoría.', parameters: {
    type: 'object', properties: {
      query: { type: 'string', description: 'Nombre del negocio o servicio' },
      type: { type: 'string', enum: ['food', 'retail', 'service', 'digital', 'individual'] },
      city: { type: 'string' },
    }, required: ['query'],
  }}},
  { type: 'function', function: { name: 'getCategories', description: 'Obtener lista de categorías disponibles en Todo.', parameters: {
    type: 'object', properties: {
      parentId: { type: 'string', description: 'ID de categoría padre. Si se omite, categorías raíz.' },
    },
  }}},

  // ─── Detalle ───
  { type: 'function', function: { name: 'getSellerDetail', description: 'Ver detalle completo de un vendedor: info, horarios, listados activos, calificación.', parameters: {
    type: 'object', properties: { sellerId: { type: 'string' } }, required: ['sellerId'],
  }}},
  { type: 'function', function: { name: 'getListingDetail', description: 'Ver detalle completo de un producto o servicio con información del vendedor.', parameters: {
    type: 'object', properties: { listingId: { type: 'string' } }, required: ['listingId'],
  }}},

  // ─── Usuario ───
  { type: 'function', function: { name: 'getUserTransactions', description: 'Ver compras/reservas del usuario. Filtra por estado.', parameters: {
    type: 'object', properties: {
      status: { type: 'string', description: 'Filtrar por estado: pending, completed, cancelled' },
      limit: { type: 'number', description: 'Cantidad máxima (default 10)' },
    },
  }}},
  { type: 'function', function: { name: 'getUserStats', description: 'Estadísticas del usuario: gastado, puntos, nivel, transacciones, racha.', parameters: { type: 'object', properties: {} }}},
  { type: 'function', function: { name: 'getUserProfile', description: 'Obtener la información del perfil del usuario.', parameters: { type: 'object', properties: {} }}},
  { type: 'function', function: { name: 'updateProfile', description: 'Actualizar perfil del usuario: nombre, teléfono, ciudad, dirección.', parameters: {
    type: 'object', properties: {
      fullName: { type: 'string', description: 'Nombre completo' },
      phone: { type: 'string', description: 'Teléfono' },
      city: { type: 'string', description: 'Ciudad' },
      address: { type: 'string', description: 'Dirección' },
    },
  }}},

  // ─── Rol (seller / courier) ───
  { type: 'function', function: { name: 'getSellerOrders', description: 'Ver los pedidos recibidos en la tienda del usuario (solo si tiene una tienda registrada). Filtra por estado.', parameters: {
    type: 'object', properties: {
      status: { type: 'string', description: 'Filtrar por estado, ej. PREPARING, READY' },
      limit: { type: 'number', description: 'Cantidad máxima (default 10)' },
    },
  }}},
  { type: 'function', function: { name: 'getCourierDeliveries', description: 'Ver las entregas asignadas al domiciliario. Filtra por estado.', parameters: {
    type: 'object', properties: {
      status: { type: 'string', description: 'Filtrar por estado, ej. IN_TRANSIT, DELIVERED' },
      limit: { type: 'number', description: 'Cantidad máxima (default 10)' },
    },
  }}},
  { type: 'function', function: { name: 'getNotifications', description: 'Ver las notificaciones del usuario.', parameters: {
    type: 'object', properties: {
      unreadOnly: { type: 'boolean', description: 'Solo no leídas' },
      limit: { type: 'number', description: 'Cantidad máxima (default 10)' },
    },
  }}},
  { type: 'function', function: { name: 'updateOrderStatus', description: 'Cambiar el estado de un pedido — solo para vendedores (avance de preparación/entrega) o domiciliarios (en camino/entregado). Antes de llamarla, SIEMPRE confirma en un mensaje de texto con el usuario qué pedido y a qué estado va a cambiar, y solo procede tras confirmación explícita. Nunca la uses para cancelar, reembolsar o abrir disputas — eso no está permitido.', parameters: {
    type: 'object', properties: {
      transactionId: { type: 'string', description: 'ID del pedido' },
      status: { type: 'string', enum: ['PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED'], description: 'Nuevo estado' },
    }, required: ['transactionId', 'status'],
  }}},

  // ─── Favoritos ───
  { type: 'function', function: { name: 'getFavorites', description: 'Obtener lista de favoritos del usuario.', parameters: { type: 'object', properties: {} }}},
  { type: 'function', function: { name: 'toggleFavorite', description: 'Agregar o quitar un favorito.', parameters: {
    type: 'object', properties: {
      listingId: { type: 'string', description: 'ID del listado' },
    }, required: ['listingId'],
  }}},

  // ─── Carrito ───
  { type: 'function', function: { name: 'getCart', description: 'Ver contenido actual del carrito del usuario.', parameters: { type: 'object', properties: {} }}},
  { type: 'function', function: { name: 'addToCart', description: 'Agregar un producto/servicio al carrito.', parameters: {
    type: 'object', properties: {
      listingId: { type: 'string' }, quantity: { type: 'number', default: 1 },
    }, required: ['listingId'],
  }}},
  { type: 'function', function: { name: 'removeFromCart', description: 'Quitar un item del carrito.', parameters: {
    type: 'object', properties: { listingId: { type: 'string' } }, required: ['listingId'],
  }}},

  // ─── Reseñas ───
  { type: 'function', function: { name: 'getReviews', description: 'Obtener reseñas de un vendedor o listado.', parameters: {
    type: 'object', properties: {
      targetType: { type: 'string', enum: ['seller', 'listing'], description: 'seller o listing' },
      targetId: { type: 'string', description: 'ID del target' },
    }, required: ['targetType', 'targetId'],
  }}},

  // ─── Información ───
  { type: 'function', function: { name: 'getTodoInfo', description: 'Información sobre Todo: qué es, cómo funciona, pagos, cómo vender.', parameters: {
    type: 'object', properties: {
      topic: { type: 'string', description: 'Tema: pagos, vender, categorías, ayuda, que_es' },
    },
  }}},
  { type: 'function', function: { name: 'navigateTo', description: 'Navegar a una sección de la app.', parameters: {
    type: 'object', properties: {
      path: { type: 'string', description: '/explore, /orders, /profile, /cart, /favorites, /settings' },
    }, required: ['path'],
  }}},
];

// ─── Tool Executors ───

async function execSearchListings(args: any) {
  try {
    let q = query(collection(db, 'listings'), where('isActive', '==', true), where('isApproved', '==', true));
    if (args.categoryId) q = query(q, where('categoryId', '==', args.categoryId));
    if (args.type) q = query(q, where('type', '==', args.type));
    q = query(q, orderBy('createdAt', 'desc'), limit(args.limit || 10));
    const snap = await getDocs(q);
    let list = snap.docs.map(d => d.data() as Listing);
    const term = args.query?.toLowerCase();
    if (term) list = list.filter(l => l.title.toLowerCase().includes(term) || l.description?.toLowerCase().includes(term));
    if (args.maxPrice) list = list.filter(l => l.price <= args.maxPrice);
    return JSON.stringify(list.map(l => ({ id: l.id, title: l.title, type: l.type, price: l.price, originalPrice: l.originalPrice, discount: l.discountPercent ? `${l.discountPercent}%` : null, sellerId: l.sellerId, categoryId: l.categoryId, deliveryMethods: l.deliveryMethods, rating: l.stats?.rating })));
  } catch (e) { logger.error('searchListings error', e); return '[]'; }
}

async function execSearchSellers(args: any) {
  try {
    let q = query(collection(db, 'sellers'), where('isActive', '==', true), orderBy('rating', 'desc'), limit(10));
    const snap = await getDocs(q);
    let list = snap.docs.map(d => d.data() as Seller);
    const term = args.query?.toLowerCase();
    if (term) list = list.filter(s => s.name.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term));
    if (args.type) list = list.filter(s => s.type === args.type);
    if (args.city) list = list.filter(s => s.location.city?.toLowerCase() === args.city.toLowerCase());
    return JSON.stringify(list.map(s => ({ id: s.id, name: s.name, type: s.type, city: s.location.city, rating: s.rating, ratingCount: s.ratingCount, categories: s.categoryIds, logo: s.logo, isVerified: s.isVerified })));
  } catch (e) { logger.error('searchSellers error', e); return '[]'; }
}

async function execGetSellerDetail(args: any) {
  try {
    const snap = await getDoc(doc(db, 'sellers', args.sellerId));
    if (!snap.exists()) return JSON.stringify({ error: 'Vendedor no encontrado' });
    const s = snap.data() as Seller;
    const lq = query(collection(db, 'listings'), where('sellerId', '==', args.sellerId), where('isActive', '==', true), limit(15));
    const ls = await getDocs(lq);
    return JSON.stringify({ ...s, listings: ls.docs.map(d => ({ id: d.id, title: d.data().title, price: d.data().price, type: d.data().type })) });
  } catch (e) { logger.error('getSellerDetail error', e); return JSON.stringify({ error: 'Error' }); }
}

async function execGetListingDetail(args: any) {
  try {
    const snap = await getDoc(doc(db, 'listings', args.listingId));
    if (!snap.exists()) return JSON.stringify({ error: 'No encontrado' });
    const l = snap.data() as Listing;
    const ss = await getDoc(doc(db, 'sellers', l.sellerId));
    return JSON.stringify({ ...l, sellerName: ss.exists() ? (ss.data() as Seller).name : null });
  } catch (e) { logger.error('getListingDetail error', e); return JSON.stringify({ error: 'Error' }); }
}

async function execGetUserTransactions(userId: string, args: any) {
  try {
    let q = query(collection(db, 'transactions'), where('buyerId', '==', userId), orderBy('createdAt', 'desc'), limit(args.limit || 10));
    const snap = await getDocs(q);
    let txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    if (args.status) txs = txs.filter(t => t.status?.toLowerCase().includes(args.status.toLowerCase()));
    return JSON.stringify(txs.map(t => ({ id: t.id, status: t.status, total: t.totalAmount, items: t.lineItems?.length || 0, method: t.payment?.method, date: t.createdAt, sellerId: t.sellerId })));
  } catch (e) { logger.error('getUserTransactions error', e); return '[]'; }
}

async function execGetUserStats(userId: string) {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return JSON.stringify({});
    const u = snap.data();
    return JSON.stringify({ points: u.impact?.points || 0, level: u.impact?.level || 'NOVICE', totalSpent: u.impact?.totalSpent || 0, totalTransactions: u.impact?.totalTransactions || 0, streak: u.impact?.streak?.current || 0, joinedDate: u.createdAt, referralCode: u.referralCode });
  } catch (e) { logger.error('getUserStats error', e); return JSON.stringify({}); }
}

async function execGetUserProfile(userId: string) {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return JSON.stringify({ error: 'No encontrado' });
    const u = snap.data();
    return JSON.stringify({ fullName: u.fullName, email: u.email, role: u.role, phone: u.phone, city: u.city, address: u.address, isVerified: u.isVerified, isGuest: u.isGuest, createdAt: u.createdAt });
  } catch (e) { logger.error('getUserProfile error', e); return JSON.stringify({}); }
}

async function execUpdateProfile(userId: string, args: any) {
  try {
    const updates: any = {};
    if (args.fullName) updates.fullName = args.fullName;
    if (args.phone) updates.phone = args.phone;
    if (args.city) updates.city = args.city;
    if (args.address) updates.address = args.address;
    await updateDoc(doc(db, 'users', userId), updates);
    return 'Perfil actualizado correctamente.';
  } catch (e) { logger.error('updateProfile error', e); return 'Error al actualizar perfil.'; }
}

const updateOrderStatusCallable = httpsCallable<{ transactionId: string; status: string }, { ok: boolean; status: string }>(functions, 'updateOrderStatus');

async function execGetSellerOrders(userId: string, args: any) {
  try {
    const sq = query(collection(db, 'sellers'), where('ownerId', '==', userId), limit(1));
    const ss = await getDocs(sq);
    if (ss.empty) return JSON.stringify({ error: 'No tienes una tienda registrada.' });
    const sellerId = ss.docs[0].id;
    let q = query(collection(db, 'transactions'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'), limit(args.limit || 10));
    const snap = await getDocs(q);
    let txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    if (args.status) txs = txs.filter(t => t.status?.toLowerCase().includes(args.status.toLowerCase()));
    return JSON.stringify(txs.map(t => ({ id: t.id, status: t.status, total: t.totalAmount, items: t.lineItems?.length || 0, buyerId: t.buyerId, courierId: t.courierId, date: t.createdAt })));
  } catch (e) { logger.error('getSellerOrders error', e); return '[]'; }
}

async function execGetCourierDeliveries(userId: string, args: any) {
  try {
    let q = query(collection(db, 'transactions'), where('courierId', '==', userId), orderBy('createdAt', 'desc'), limit(args.limit || 10));
    const snap = await getDocs(q);
    let txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    if (args.status) txs = txs.filter(t => t.status?.toLowerCase().includes(args.status.toLowerCase()));
    return JSON.stringify(txs.map(t => ({ id: t.id, status: t.status, total: t.totalAmount, shippingAddress: t.shippingAddress, buyerId: t.buyerId, date: t.createdAt })));
  } catch (e) { logger.error('getCourierDeliveries error', e); return '[]'; }
}

async function execGetNotifications(userId: string, args: any) {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(args.limit || 10));
    const snap = await getDocs(q);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    if (args.unreadOnly) list = list.filter(n => !n.read);
    return JSON.stringify(list.map(n => ({ id: n.id, title: n.title, body: n.body, type: n.type, read: n.read, date: n.createdAt })));
  } catch (e) { logger.error('getNotifications error', e); return '[]'; }
}

async function execUpdateOrderStatus(args: any) {
  try {
    const { data } = await updateOrderStatusCallable({ transactionId: args.transactionId, status: args.status });
    return `Pedido actualizado a ${data.status}.`;
  } catch (e: any) {
    logger.error('updateOrderStatus error', e);
    return JSON.stringify({ error: e?.message || 'No se pudo actualizar el pedido.' });
  }
}

async function execGetFavorites(userId: string) {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    const favIds = snap.data()?.favoriteListingIds || [];
    if (favIds.length === 0) return '[]';
    const results: any[] = [];
    for (const id of favIds.slice(0, 20)) {
      const ls = await getDoc(doc(db, 'listings', id));
      if (ls.exists()) results.push({ id, title: ls.data().title, price: ls.data().price, type: ls.data().type });
    }
    return JSON.stringify(results);
  } catch (e) { logger.error('getFavorites error', e); return '[]'; }
}

async function execToggleFavorite(userId: string, args: any) {
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    const favs: string[] = snap.data()?.favoriteListingIds || [];
    if (favs.includes(args.listingId)) {
      await updateDoc(ref, { favoriteListingIds: favs.filter(f => f !== args.listingId) });
      return 'Quitado de favoritos.';
    } else {
      await updateDoc(ref, { favoriteListingIds: [...favs, args.listingId] });
      return 'Agregado a favoritos.';
    }
  } catch (e) { logger.error('toggleFavorite error', e); return 'Error al actualizar favoritos.'; }
}

async function execGetCart(userId: string) {
  try {
    const snap = await getDoc(doc(db, 'carts', userId));
    if (!snap.exists()) return '[]';
    return JSON.stringify(snap.data().items || []);
  } catch (e) { logger.error('getCart error', e); return '[]'; }
}

async function execAddToCart(userId: string, args: any) {
  try {
    const ref = doc(db, 'carts', userId);
    const snap = await getDoc(ref);
    const items: any[] = snap.exists() ? (snap.data().items || []) : [];
    const ls = await getDoc(doc(db, 'listings', args.listingId));
    if (!ls.exists()) return 'Producto no encontrado.';
    const l = ls.data() as Listing;
    items.push({ listingId: args.listingId, title: l.title, price: l.price, quantity: args.quantity || 1, sellerId: l.sellerId });
    await setDoc(ref, { items, updatedAt: serverTimestamp() });
    return `Agregado al carrito: ${l.title}`;
  } catch (e) { logger.error('addToCart error', e); return 'Error al agregar al carrito.'; }
}

async function execRemoveFromCart(userId: string, args: any) {
  try {
    const ref = doc(db, 'carts', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return 'Carrito vacío.';
    const items = (snap.data().items || []).filter((i: any) => i.listingId !== args.listingId);
    await updateDoc(ref, { items, updatedAt: serverTimestamp() });
    return 'Item quitado del carrito.';
  } catch (e) { logger.error('removeFromCart error', e); return 'Error.'; }
}

async function execGetReviews(args: any) {
  try {
    const q = query(collection(db, 'reviews'), where('targetType', '==', args.targetType), where('targetId', '==', args.targetId), orderBy('createdAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return JSON.stringify(snap.docs.map(d => d.data()));
  } catch (e) { logger.error('getReviews error', e); return '[]'; }
}

function execGetTodoInfo(args: any) {
  const faq: Record<string, string> = {
    que_es: 'Todo es un marketplace general de Colombia. Compra productos, contrata servicios, descarga contenido digital. Es como tener "todo" en un solo lugar.',
    pagos: 'Aceptamos tarjetas débito/crédito, PSE, Nequi, Daviplata y efectivo vía Wompi. Tus datos están seguros.',
    vender: 'Para vender, regístrate, ve a tu perfil y crea tu tienda. Puedes publicar productos, servicios y contenido digital. Comisión del 10%.',
    categorias: 'Categorías principales: Comida 🍽️, Tecnología 💻, Servicios 🛠️, Moda 👕, Hogar 🏠, Digital 📱, Vehículos 🚗 y Otros 🎁.',
    ayuda: 'Escribe a soporte@todoapp.co o usa este chat para cualquier duda. También ve a /help.',
    envio: 'Cada vendedor configura su método de entrega: recogida local, envío a domicilio o entrega digital instantánea.',
    garantia: 'Si algo sale mal con tu pedido, abre una disputa y nuestro equipo lo revisa en 24-48 horas hábiles.',
  };
  const topic = args.topic?.toLowerCase().replace(/\s+/g, '_') || '';
  return faq[Object.keys(faq).find(k => topic.includes(k)) || 'que_es'] || faq.que_es;
}

// ─── Main Dispatcher ───

export async function executeToolCall(name: string, args: any, userId?: string, userRole?: string): Promise<string> {
  if (!userId) return JSON.stringify({ error: 'Inicia sesión para usar el asistente.' });

  // Security check for the tool action
  const secCheck = await checkToolAction(userId, name, args, userRole);
  if (!secCheck.allowed && secCheck.error) {
    return JSON.stringify({ error: secCheck.error });
  }

  try {
    switch (name) {
      case 'searchListings': return execSearchListings(args);
      case 'searchSellers': return execSearchSellers(args);
      case 'getCategories': return execSearchListings({ query: '', categoryId: args.parentId, limit: 20 });
      case 'getSellerDetail': return execGetSellerDetail(args);
      case 'getListingDetail': return execGetListingDetail(args);
      case 'getUserTransactions': return execGetUserTransactions(userId, args);
      case 'getUserStats': return execGetUserStats(userId);
      case 'getUserProfile': return execGetUserProfile(userId);
      case 'updateProfile': return execUpdateProfile(userId, args);
      case 'getSellerOrders': return execGetSellerOrders(userId, args);
      case 'getCourierDeliveries': return execGetCourierDeliveries(userId, args);
      case 'getNotifications': return execGetNotifications(userId, args);
      case 'updateOrderStatus': return execUpdateOrderStatus(args);
      case 'getFavorites': return execGetFavorites(userId);
      case 'toggleFavorite': return execToggleFavorite(userId, args);
      case 'getCart': return execGetCart(userId);
      case 'addToCart': return execAddToCart(userId, args);
      case 'removeFromCart': return execRemoveFromCart(userId, args);
      case 'getReviews': return execGetReviews(args);
      case 'getTodoInfo': return execGetTodoInfo(args);
      case 'navigateTo':
        if (navigateToPath) navigateToPath(args.path);
        return `Navegando a ${args.path}`;
      default: return JSON.stringify({ error: 'Función no disponible' });
    }
  } catch (e) {
    logger.error(`Tool ${name} error:`, e);
    return JSON.stringify({ error: 'Error al ejecutar la acción. Intenta de nuevo.' });
  }
}
