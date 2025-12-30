import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['./src/vendor.js'],
        },
      },
    },
  },
  plugins: [
    // Optional: Generate bundle stats with rollup-plugin-visualizer
    visualizer({
      filename: 'stats.json',
      json: true,
      gzipSize: true,
    }),
  ],
});
