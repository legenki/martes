import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
    setupFiles: ['./test/setup.js'],
    // The heavier suites render all 34 generators against all 13 effects;
    // that legitimately exceeds the 5s default on a loaded machine.
    testTimeout: 30000,
  },
});
