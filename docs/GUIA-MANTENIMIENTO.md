# Guía de Mantenimiento y Operación Rápida — App Todo

Esta guía contiene la arquitectura, convenciones y procedimientos sencillos para realizar mantenimiento, agregar características o ajustar parámetros en el proyecto **Todo** en cuestión de minutos.

---

## 📁 1. Estructura y Módulos Centrales

```text
src/
├── config/                  # Fuente única de verdad de constantes y tema
│   ├── constants.ts         # Precios mínimos, ciudades, formato COP, chips IA
│   ├── theme.ts             # Tokens de Tailwind, colores de variante, animaciones
│   └── index.ts             # Barrel Export (`import { formatCOP } from '../config'`)
├── components/
│   └── ui/                  # Componentes atómicos reutilizables (Design System)
│       ├── Button.tsx       # Botón reutilizable con loader y active-bounce
│       ├── Badge.tsx        # Etiquetas de oferta, tipo de envío y filtros
│       ├── PriceDisplay.tsx # Presentador de precios COP con descuento
│       ├── ProductCard.tsx  # Tarjeta estandarizada de producto/publicación
│       ├── TrustBadge.tsx   # Bloque de garantía y seguridad Wompi
│       ├── ProductSkeleton.tsx # Carga asíncrona con animación shimmer
│       └── index.ts         # Barrel Export (`import { Button, Badge } from '../components/ui'`)
```

---

## 🛠️ 2. ¿Cómo Hacer Cambios Frecuentes?

### A. Modificar Umbral de Envío Gratis o Nombre de la App
Edita el archivo `src/config/constants.ts`:
```ts
export const APP_CONFIG = {
  name: 'Todo',
  freeShippingThreshold: 150_000, // <--- Modificar aquí
  // ...
};
```

### B. Agregar una Nueva Ciudad a los Filtros
Edita la lista `CIUDADES_COLOMBIA` en `src/config/constants.ts`:
```ts
export const CIUDADES_COLOMBIA = [
  'Bucaramanga',
  'Bogotá',
  'Medellín',
  'CualquierNuevaCiudad', // <--- Agregar aquí
] as const;
```

### C. Cambiar Estilos de Botones o Colores Principales
Para cambiar colores o animaciones de interacción táctil, modifica `src/index.css` o `src/config/theme.ts`.

---

## ⚡ 3. Comandos Útiles de Validación

Antes de publicar cualquier cambio, ejecuta la suite de validación completa:

1. **Verificar Compilación TypeScript sin Errores**:
   ```bash
   npx tsc -b
   ```
2. **Ejecutar Pruebas Unitarias del Frontend**:
   ```bash
   npm run test
   ```
3. **Ejecutar Pruebas de Cloud Functions**:
   ```bash
   npm --prefix functions test
   ```
4. **Ejecutar Pruebas de Reglas de Seguridad (Emuladores)**:
   ```bash
   npm run test:rules
   ```
5. **Generar Bundle PWA de Producción**:
   ```bash
   npm run build
   ```

---

## 🚀 4. Despliegue a Producción (Firebase)

- **Desplegar Frontend (Hosting)**:
  ```bash
  firebase deploy --only hosting
  ```
- **Desplegar Cloud Functions**:
  ```bash
  firebase deploy --only functions
  ```
- **Desplegar Reglas de Seguridad**:
  ```bash
  firebase deploy --only firestore:rules,storage
  ```
