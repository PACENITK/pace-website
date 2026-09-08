import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    // Engine unit tests are plain Node -- no DOM, no React -- so this
    // stays fast. Scoped to simulation/ on purpose: that's the rules
    // engine shared by the live game and the balance simulator; UI
    // components aren't covered here yet.
    environment: 'node',
    include: ['simulation/**/*.test.js'],
  },
});