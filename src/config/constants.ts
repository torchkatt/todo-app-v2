/**
 * @file constants.ts
 * @description Constantes y Parámetros Globales del Negocio para la aplicación Todo.
 * Centraliza parámetros de configuración, formatos de moneda, umbrales de envío y colecciones.
 */

/**
 * Configuración general de la aplicación.
 * @property {string} name - Nombre público de la aplicación.
 * @property {string} tagline - Eslogan o descripción corta.
 * @property {string} country - País objetivo de operación.
 * @property {string} currency - Código de moneda oficial (COP).
 * @property {string} locale - Configuración regional de formateo (es-CO).
 * @property {number} freeShippingThreshold - Monto mínimo en COP para activar envío gratis ($150.000 COP).
 * @property {number} defaultLimit - Límite por defecto para consultas paginadas en Firestore.
 */
export const APP_CONFIG = {
  name: 'Todo',
  tagline: 'Marketplace Colombia',
  country: 'Colombia',
  currency: 'COP',
  locale: 'es-CO',
  freeShippingThreshold: 150_000,
  defaultLimit: 50,
} as const;

/**
 * Lista de ciudades principales de Colombia para filtrado en el marketplace.
 */
export const CIUDADES_COLOMBIA = [
  'Bucaramanga',
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Todo Colombia',
] as const;

/**
 * Chips de sugerencia rápida para el asistente inteligente de IA.
 * Utilizados en la interfaz de chat flotante (AIChat.tsx).
 */
export const AI_PROMPT_CHIPS = [
  '🔍 Productos destacados',
  '🛠️ Servicios disponibles',
  '📦 Mis pedidos',
  '💡 Ayuda y soporte',
] as const;

/**
 * Métodos de pago aceptados y soportados vía Wompi.
 */
export const PAYMENT_METHODS = [
  { id: 'card', label: '💳 Tarjeta Crédito/Débito' },
  { id: 'pse', label: '🏦 PSE' },
  { id: 'nequi', label: '📱 Nequi / Daviplata' },
  { id: 'efecty', label: '💵 Efecty' },
] as const;

/**
 * Formatea un valor numérico como cadena de moneda en pesos colombianos ($150.000).
 * @param {number} amount - Monto numérico a formatear.
 * @returns {string} Cadena formateada con símbolo de moneda y separador de miles.
 * @example formatCOP(150000) // => "$150.000"
 */
export function formatCOP(amount: number): string {
  return `$${amount.toLocaleString(APP_CONFIG.locale)}`;
}
