import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  input: 'src/main.js',
  output: [
    {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].[hash].js',
      chunkFileNames: '[name].[hash].js',
      assetFileNames: '[name].[hash][extname]',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    terser(),
    // Generate bundle stats
    visualizer({
      filename: 'dist/stats.json',
      json: true,
      gzipSize: true,
    }),
  ],
  // Code splitting configuration
  manualChunks: (id) => {
    if (id.includes('node_modules')) {
      return 'vendor';
    }
    if (id.includes('utils')) {
      return 'utils';
    }
  },
};
