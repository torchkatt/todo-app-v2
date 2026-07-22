// Espejo de solo-schema de src/services/aiChatTools.ts (TODO_TOOLS). El backend solo
// necesita describirle las funciones a DeepSeek; la ejecución real de cada tool sigue
// ocurriendo en el cliente, gobernada por las reglas de Firestore del usuario autenticado.
export interface ToolDefinition {
  type: 'function';
  function: { name: string; description: string; parameters: any };
}

export const TODO_TOOLS: ToolDefinition[] = [
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
  { type: 'function', function: { name: 'getSellerDetail', description: 'Ver detalle completo de un vendedor: info, horarios, listados activos, calificación.', parameters: {
    type: 'object', properties: { sellerId: { type: 'string' } }, required: ['sellerId'],
  }}},
  { type: 'function', function: { name: 'getListingDetail', description: 'Ver detalle completo de un producto o servicio con información del vendedor.', parameters: {
    type: 'object', properties: { listingId: { type: 'string' } }, required: ['listingId'],
  }}},
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
  { type: 'function', function: { name: 'getFavorites', description: 'Obtener lista de favoritos del usuario.', parameters: { type: 'object', properties: {} }}},
  { type: 'function', function: { name: 'toggleFavorite', description: 'Agregar o quitar un favorito.', parameters: {
    type: 'object', properties: {
      listingId: { type: 'string', description: 'ID del listado' },
    }, required: ['listingId'],
  }}},
  { type: 'function', function: { name: 'getCart', description: 'Ver contenido actual del carrito del usuario.', parameters: { type: 'object', properties: {} }}},
  { type: 'function', function: { name: 'addToCart', description: 'Agregar un producto/servicio al carrito.', parameters: {
    type: 'object', properties: {
      listingId: { type: 'string' }, quantity: { type: 'number', default: 1 },
    }, required: ['listingId'],
  }}},
  { type: 'function', function: { name: 'removeFromCart', description: 'Quitar un item del carrito.', parameters: {
    type: 'object', properties: { listingId: { type: 'string' } }, required: ['listingId'],
  }}},
  { type: 'function', function: { name: 'getReviews', description: 'Obtener reseñas de un vendedor o listado.', parameters: {
    type: 'object', properties: {
      targetType: { type: 'string', enum: ['seller', 'listing'], description: 'seller o listing' },
      targetId: { type: 'string', description: 'ID del target' },
    }, required: ['targetType', 'targetId'],
  }}},
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
