import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    // First run downloads a MongoDB binary for mongodb-memory-server
    hookTimeout: 180_000,
    testTimeout: 30_000,
    fileParallelism: false,
    env: { NODE_ENV: 'test', ADMIN_EMAIL: 'owner@niwas.test', ADMIN_PASSWORD: 'owner-password-1', CLIENT_URL: 'http://localhost:5173' },
  },
});
