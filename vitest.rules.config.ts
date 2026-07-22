import { defineConfig } from 'vitest/config';

// Config separada para tests de reglas de Firestore/Storage: corren contra el emulador
// real (firebase emulators:exec), en Node (no jsdom) y sin el setup del frontend.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
