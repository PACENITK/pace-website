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
    //
    // backend/tests/urbanMayhem.vitest.js also runs under this runner
    // rather than the backend's own Jest suite (backend/tests/*.test.js,
    // run via `npm test`): Jest's CommonJS module loader can't execute
    // a dynamic import() of a local ESM file (simulation/ is ESM) without
    // --experimental-vm-modules, which the existing Jest config doesn't
    // enable. Vitest's Vite-based loader handles that CJS<->ESM boundary
    // natively -- confirmed the *server* itself has no such problem (a
    // plain `node server.js` + curl exercised every route fine); this is
    // purely a test-runner limitation, not a runtime one. Named
    // `.vitest.js` (not `.test.js`) specifically so Jest's default
    // testMatch doesn't also try and fail to run it.
    include: ['simulation/**/*.test.js', 'backend/tests/*.vitest.js'],
    environment: 'node',
    // The backend test file is plain CommonJS written against Jest's
    // ambient describe/it/expect globals (matching backend/tests/
    // convention); this makes the same globals available under Vitest
    // instead of importing them explicitly like the simulation tests do.
    globals: true,
  },
});