import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Make sure there are no 'root' or 'build.rollupOptions.input' settings here
  // unless you specifically need them and they point correctly.
});