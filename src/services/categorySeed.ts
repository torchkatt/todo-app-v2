import type { Category } from '../types';

/**
 * Seed categories for Todo marketplace.
 * Hierarchical tree with dynamic attributes per category.
 * Rescatto's food rescue is preserved as a first-class category.
 */

export const CATEGORY_SEED: Omit<Category, 'stats'>[] = [
  // ─── ROOT CATEGORIES ───
  {
    id: 'cat-food',
    name: 'Comida y Bebidas 🍽️',
    slug: 'comida-bebidas',
    icon: '🍽️',
    level: 0,
    order: 1,
    isActive: true,
    listingAttributes: [],
  },
  {
    id: 'cat-tech',
    name: 'Tecnología 💻',
    slug: 'tecnologia',
    icon: '💻',
    level: 0,
    order: 2,
    isActive: true,
    listingAttributes: [],
  },
  {
    id: 'cat-services',
    name: 'Servicios 🛠️',
    slug: 'servicios',
    icon: '🛠️',
    level: 0,
    order: 3,
    isActive: true,
    listingAttributes: [],
  },
  {
    id: 'cat-fashion',
    name: 'Moda y Estilo 👕',
    slug: 'moda-estilo',
    icon: '👕',
    level: 0,
    order: 4,
    isActive: true,
    listingAttributes: [],
  },
  {
    id: 'cat-home',
    name: 'Hogar y Muebles 🏠',
    slug: 'hogar-muebles',
    icon: '🏠',
    level: 0,
    order: 5,
    isActive: true,
    listingAttributes: [],
  },
  {
    id: 'cat-digital',
    name: 'Productos Digitales 📱',
    slug: 'productos-digitales',
    icon: '📱',
    level: 0,
    order: 6,
    isActive: true,
    listingAttributes: [],
  },
  {
    id: 'cat-auto',
    name: 'Vehículos y Movilidad 🚗',
    slug: 'vehiculos-movilidad',
    icon: '🚗',
    level: 0,
    order: 7,
    isActive: true,
    listingAttributes: [],
  },
  {
    id: 'cat-other',
    name: 'Otros 🎁',
    slug: 'otros',
    icon: '🎁',
    level: 0,
    order: 99,
    isActive: true,
    listingAttributes: [],
  },

  // ─── SUBCATEGORIES: Comida y Bebidas ───
  {
    id: 'cat-food-packs',
    name: 'Packs Sorpresa 🎁',
    slug: 'packs-sorpresa',
    parentId: 'cat-food',
    icon: '🎁',
    level: 1,
    order: 1,
    isActive: true,
    listingAttributes: [
      { name: 'pickupWindowStart', type: 'text', required: true, label: 'Inicio de ventana de recogida', placeholder: '14:00' },
      { name: 'pickupWindowEnd', type: 'text', required: true, label: 'Fin de ventana de recogida', placeholder: '18:00' },
      { name: 'expiresAt', type: 'text', required: false, label: 'Fecha de vencimiento' },
      { name: 'ingredients', type: 'text', required: false, label: 'Ingredientes principales' },
      { name: 'allergens', type: 'text', required: false, label: 'Alérgenos' },
      { name: 'calories', type: 'number', required: false, label: 'Calorías aproximadas', min: 0, max: 5000 },
      { name: 'vegetarian', type: 'boolean', required: false, label: 'Vegetariano' },
      { name: 'glutenFree', type: 'boolean', required: false, label: 'Sin gluten' },
    ],
  },
  {
    id: 'cat-food-restaurants',
    name: 'Restaurantes y Menús 🍕',
    slug: 'restaurantes-menus',
    parentId: 'cat-food',
    icon: '🍕',
    level: 1,
    order: 2,
    isActive: true,
    listingAttributes: [
      { name: 'cuisine', type: 'select', required: false, label: 'Tipo de cocina', options: ['Italiana', 'Mexicana', 'Japonesa', 'Colombiana', 'China', 'Árabe', 'India', 'Peruana', 'Vegetariana', 'Otra'] },
      { name: 'spiceLevel', type: 'select', required: false, label: 'Nivel de picante', options: ['Sin picante', 'Suave', 'Medio', 'Picante', 'Muy picante'] },
    ],
  },
  {
    id: 'cat-food-bakery',
    name: 'Panadería y Pastelería 🥐',
    slug: 'panaderia-pasteleria',
    parentId: 'cat-food',
    icon: '🥐',
    level: 1,
    order: 3,
    isActive: true,
    listingAttributes: [
      { name: 'freshness', type: 'select', required: false, label: 'Preparación', options: ['Del día', 'Ayer', 'Congelado'] },
    ],
  },
  {
    id: 'cat-food-drinks',
    name: 'Bebidas y Licores 🍷',
    slug: 'bebidas-licores',
    parentId: 'cat-food',
    icon: '🍷',
    level: 1,
    order: 4,
    isActive: true,
    listingAttributes: [
      { name: 'alcoholContent', type: 'number', required: false, label: '% Alcohol', min: 0, max: 60 },
      { name: 'volume', type: 'text', required: false, label: 'Volumen', placeholder: '750ml' },
    ],
  },

  // ─── SUBCATEGORIES: Tecnología ───
  {
    id: 'cat-tech-phones',
    name: 'Celulares y Tablets 📱',
    slug: 'celulares-tablets',
    parentId: 'cat-tech',
    icon: '📱',
    level: 1,
    order: 1,
    isActive: true,
    listingAttributes: [
      { name: 'brand', type: 'select', required: true, label: 'Marca', options: ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Oppo', 'Otra'] },
      { name: 'model', type: 'text', required: false, label: 'Modelo', placeholder: 'iPhone 15 Pro' },
      { name: 'condition', type: 'select', required: true, label: 'Estado', options: ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Usado - Aceptable'] },
      { name: 'storage', type: 'select', required: false, label: 'Almacenamiento', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { name: 'warranty', type: 'select', required: false, label: 'Garantía', options: ['Sin garantía', '30 días', '3 meses', '6 meses', '1 año'] },
    ],
  },
  {
    id: 'cat-tech-computers',
    name: 'Computadores y Laptops 💻',
    slug: 'computadores-laptops',
    parentId: 'cat-tech',
    icon: '💻',
    level: 1,
    order: 2,
    isActive: true,
    listingAttributes: [
      { name: 'brand', type: 'select', required: true, label: 'Marca', options: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Otra'] },
      { name: 'processor', type: 'text', required: false, label: 'Procesador', placeholder: 'Intel i7-12700K' },
      { name: 'ram', type: 'select', required: false, label: 'RAM', options: ['4GB', '8GB', '16GB', '32GB', '64GB+'] },
      { name: 'storage', type: 'text', required: false, label: 'Disco', placeholder: '512GB SSD' },
      { name: 'condition', type: 'select', required: true, label: 'Estado', options: ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Usado - Aceptable'] },
    ],
  },
  {
    id: 'cat-tech-accessories',
    name: 'Accesorios y Periféricos ⌨️',
    slug: 'accesorios-perifericos',
    parentId: 'cat-tech',
    icon: '⌨️',
    level: 1,
    order: 3,
    isActive: true,
    listingAttributes: [
      { name: 'brand', type: 'text', required: false, label: 'Marca' },
      { name: 'compatibleWith', type: 'text', required: false, label: 'Compatible con', placeholder: 'USB-C, Bluetooth' },
    ],
  },
  {
    id: 'cat-tech-repair',
    name: 'Reparación y Soporte Técnico 🔧',
    slug: 'reparacion-soporte',
    parentId: 'cat-tech',
    icon: '🔧',
    level: 1,
    order: 4,
    isActive: true,
    listingAttributes: [
      { name: 'warranty', type: 'select', required: false, label: 'Garantía del servicio', options: ['Sin garantía', '30 días', '3 meses', '6 meses'] },
      { name: 'deviceTypes', type: 'text', required: false, label: 'Tipos de dispositivos que repara', placeholder: 'Celulares, laptops, tablets' },
    ],
  },

  // ─── SUBCATEGORIES: Servicios ───
  {
    id: 'cat-services-beauty',
    name: 'Belleza y Bienestar 💇',
    slug: 'belleza-bienestar',
    parentId: 'cat-services',
    icon: '💇',
    level: 1,
    order: 1,
    isActive: true,
    listingAttributes: [
      { name: 'duration', type: 'number', required: true, label: 'Duración (minutos)', min: 15, max: 480 },
      { name: 'gender', type: 'select', required: false, label: 'Para', options: ['Mujer', 'Hombre', 'Unisex'] },
      { name: 'includes', type: 'text', required: false, label: 'Incluye', placeholder: 'Corte, lavado, secado' },
    ],
  },
  {
    id: 'cat-services-education',
    name: 'Clases y Educación 📚',
    slug: 'clases-educacion',
    parentId: 'cat-services',
    icon: '📚',
    level: 1,
    order: 2,
    isActive: true,
    listingAttributes: [
      { name: 'duration', type: 'number', required: true, label: 'Duración (minutos)', min: 15, max: 480 },
      { name: 'modality', type: 'select', required: true, label: 'Modalidad', options: ['Presencial', 'Virtual', 'Híbrida'] },
      { name: 'level', type: 'select', required: false, label: 'Nivel', options: ['Básico', 'Intermedio', 'Avanzado', 'Todos'] },
      { name: 'materialsIncluded', type: 'boolean', required: false, label: 'Materiales incluidos' },
    ],
  },
  {
    id: 'cat-services-consulting',
    name: 'Consultoría y Asesoría 💼',
    slug: 'consultoria-asesoria',
    parentId: 'cat-services',
    icon: '💼',
    level: 1,
    order: 3,
    isActive: true,
    listingAttributes: [
      { name: 'duration', type: 'number', required: true, label: 'Duración (minutos)', min: 15, max: 480 },
      { name: 'modality', type: 'select', required: true, label: 'Modalidad', options: ['Presencial', 'Virtual'] },
      { name: 'specialization', type: 'text', required: false, label: 'Especialidad', placeholder: 'Finanzas, Legal, Marketing...' },
    ],
  },
  {
    id: 'cat-services-home',
    name: 'Servicios para el Hogar 🏡',
    slug: 'servicios-hogar',
    parentId: 'cat-services',
    icon: '🏡',
    level: 1,
    order: 4,
    isActive: true,
    listingAttributes: [
      { name: 'duration', type: 'number', required: true, label: 'Duración estimada (minutos)', min: 30, max: 480 },
      { name: 'bringsMaterials', type: 'boolean', required: false, label: 'El profesional trae materiales' },
    ],
  },
  {
    id: 'cat-services-delivery',
    name: 'Mensajería y Domicilios 📦',
    slug: 'mensajeria-domicilios',
    parentId: 'cat-services',
    icon: '📦',
    level: 1,
    order: 5,
    isActive: true,
    listingAttributes: [
      { name: 'vehicleType', type: 'select', required: false, label: 'Tipo de vehículo', options: ['Moto', 'Bicicleta', 'Carro', 'Camioneta', 'A pie'] },
      { name: 'coverage', type: 'text', required: false, label: 'Zona de cobertura', placeholder: 'Bucaramanga metropolitana' },
    ],
  },
  {
    id: 'cat-services-events',
    name: 'Eventos y Celebraciones 🎉',
    slug: 'eventos-celebraciones',
    parentId: 'cat-services',
    icon: '🎉',
    level: 1,
    order: 6,
    isActive: true,
    listingAttributes: [
      { name: 'capacity', type: 'number', required: false, label: 'Capacidad de personas', min: 1, max: 10000 },
      { name: 'duration', type: 'number', required: true, label: 'Duración (minutos)', min: 60, max: 1440 },
    ],
  },

  // ─── SUBCATEGORIES: Moda ───
  {
    id: 'cat-fashion-men',
    name: 'Ropa Hombre 👔',
    slug: 'ropa-hombre',
    parentId: 'cat-fashion',
    icon: '👔',
    level: 1,
    order: 1,
    isActive: true,
    listingAttributes: [
      { name: 'size', type: 'select', required: true, label: 'Talla', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
      { name: 'condition', type: 'select', required: true, label: 'Estado', options: ['Nuevo', 'Usado'] },
      { name: 'brand', type: 'text', required: false, label: 'Marca' },
    ],
  },
  {
    id: 'cat-fashion-women',
    name: 'Ropa Mujer 👗',
    slug: 'ropa-mujer',
    parentId: 'cat-fashion',
    icon: '👗',
    level: 1,
    order: 2,
    isActive: true,
    listingAttributes: [
      { name: 'size', type: 'select', required: true, label: 'Talla', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
      { name: 'condition', type: 'select', required: true, label: 'Estado', options: ['Nuevo', 'Usado'] },
      { name: 'brand', type: 'text', required: false, label: 'Marca' },
    ],
  },
  {
    id: 'cat-fashion-accessories',
    name: 'Accesorios y Joyería 💍',
    slug: 'accesorios-joyeria',
    parentId: 'cat-fashion',
    icon: '💍',
    level: 1,
    order: 3,
    isActive: true,
    listingAttributes: [
      { name: 'material', type: 'select', required: false, label: 'Material', options: ['Oro', 'Plata', 'Acero', 'Cuero', 'Tela', 'Otro'] },
    ],
  },

  // ─── SUBCATEGORIES: Hogar ───
  {
    id: 'cat-home-furniture',
    name: 'Muebles 🛋️',
    slug: 'muebles',
    parentId: 'cat-home',
    icon: '🛋️',
    level: 1,
    order: 1,
    isActive: true,
    listingAttributes: [
      { name: 'condition', type: 'select', required: true, label: 'Estado', options: ['Nuevo', 'Usado'] },
      { name: 'material', type: 'text', required: false, label: 'Material', placeholder: 'Madera, metal...' },
      { name: 'dimensions', type: 'text', required: false, label: 'Dimensiones', placeholder: '200x100x50 cm' },
    ],
  },
  {
    id: 'cat-home-decor',
    name: 'Decoración 🖼️',
    slug: 'decoracion',
    parentId: 'cat-home',
    icon: '🖼️',
    level: 1,
    order: 2,
    isActive: true,
    listingAttributes: [],
  },
  {
    id: 'cat-home-appliances',
    name: 'Electrodomésticos 🔌',
    slug: 'electrodomesticos',
    parentId: 'cat-home',
    icon: '🔌',
    level: 1,
    order: 3,
    isActive: true,
    listingAttributes: [
      { name: 'condition', type: 'select', required: true, label: 'Estado', options: ['Nuevo', 'Usado'] },
      { name: 'warranty', type: 'select', required: false, label: 'Garantía', options: ['Sin garantía', '30 días', '3 meses', '6 meses'] },
      { name: 'brand', type: 'text', required: false, label: 'Marca' },
    ],
  },

  // ─── SUBCATEGORIES: Digital ───
  {
    id: 'cat-digital-ebooks',
    name: 'Ebooks y Audiolibros 📖',
    slug: 'ebooks-audiolibros',
    parentId: 'cat-digital',
    icon: '📖',
    level: 1,
    order: 1,
    isActive: true,
    listingAttributes: [
      { name: 'format', type: 'select', required: true, label: 'Formato', options: ['PDF', 'EPUB', 'MOBI', 'MP3', 'Todos'] },
      { name: 'pages', type: 'number', required: false, label: 'Páginas', min: 1, max: 10000 },
      { name: 'language', type: 'select', required: false, label: 'Idioma', options: ['Español', 'Inglés', 'Ambos'] },
    ],
  },
  {
    id: 'cat-digital-software',
    name: 'Software y Apps ⚡',
    slug: 'software-apps',
    parentId: 'cat-digital',
    icon: '⚡',
    level: 1,
    order: 2,
    isActive: true,
    listingAttributes: [
      { name: 'platform', type: 'select', required: false, label: 'Plataforma', options: ['Web', 'Windows', 'Mac', 'Linux', 'iOS', 'Android', 'Multi-plataforma'] },
      { name: 'license', type: 'select', required: true, label: 'Tipo de licencia', options: ['Vitalicia', 'Anual', 'Mensual', 'Por uso'] },
    ],
  },
  {
    id: 'cat-digital-templates',
    name: 'Plantillas y Recursos 🎨',
    slug: 'plantillas-recursos',
    parentId: 'cat-digital',
    icon: '🎨',
    level: 1,
    order: 3,
    isActive: true,
    listingAttributes: [
      { name: 'format', type: 'select', required: true, label: 'Formato', options: ['Notion', 'Excel', 'Google Sheets', 'Figma', 'Canva', 'HTML/CSS', 'Otro'] },
      { name: 'category', type: 'select', required: false, label: 'Tipo', options: ['Negocios', 'Finanzas', 'Productividad', 'Diseño', 'Desarrollo', 'Marketing', 'Otro'] },
    ],
  },

  // ─── SUBCATEGORIES: Vehículos ───
  {
    id: 'cat-auto-cars',
    name: 'Carros y Camionetas 🚙',
    slug: 'carros-camionetas',
    parentId: 'cat-auto',
    icon: '🚙',
    level: 1,
    order: 1,
    isActive: true,
    listingAttributes: [
      { name: 'brand', type: 'text', required: true, label: 'Marca' },
      { name: 'model', type: 'text', required: false, label: 'Modelo', placeholder: '2022' },
      { name: 'mileage', type: 'number', required: false, label: 'Kilometraje', min: 0, max: 500000 },
      { name: 'transmission', type: 'select', required: false, label: 'Transmisión', options: ['Automática', 'Manual', 'CVT'] },
    ],
  },
  {
    id: 'cat-auto-motorcycles',
    name: 'Motos 🏍️',
    slug: 'motos',
    parentId: 'cat-auto',
    icon: '🏍️',
    level: 1,
    order: 2,
    isActive: true,
    listingAttributes: [
      { name: 'brand', type: 'text', required: true, label: 'Marca' },
      { name: 'engineSize', type: 'number', required: false, label: 'Cilindraje (cc)', min: 50, max: 2000 },
      { name: 'mileage', type: 'number', required: false, label: 'Kilometraje', min: 0, max: 200000 },
    ],
  },
];

/**
 * Get the slug → id mapping for quick lookup
 */
export const CATEGORY_SLUG_MAP: Record<string, string> = {};
CATEGORY_SEED.forEach(c => {
  CATEGORY_SLUG_MAP[c.slug] = c.id;
});

/**
 * Get subcategories for a parent category
 */
export function getSubcategories(parentId: string): typeof CATEGORY_SEED {
  return CATEGORY_SEED.filter(c => c.parentId === parentId && c.isActive);
}

/**
 * Get root categories (level 0)
 */
export function getRootCategories(): typeof CATEGORY_SEED {
  return CATEGORY_SEED.filter(c => c.level === 0 && c.isActive);
}

/**
 * Get full path breadcrumb for a category
 */
export function getCategoryBreadcrumb(categoryId: string): { id: string; name: string; slug: string }[] {
  const breadcrumb: { id: string; name: string; slug: string }[] = [];
  let current = CATEGORY_SEED.find(c => c.id === categoryId);
  while (current) {
    breadcrumb.unshift({ id: current.id, name: current.name, slug: current.slug });
    current = CATEGORY_SEED.find(c => c.id === current?.parentId);
  }
  return breadcrumb;
}
