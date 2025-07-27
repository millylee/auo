import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Read package.json to get version information
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  // Build configuration
  build: {
    target: 'node18', // Support Node.js 18+
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli/index.ts'),
        config: resolve(__dirname, 'src/config/index.ts'),
        utils: resolve(__dirname, 'src/utils/index.ts'),
        postinstall: resolve(__dirname, 'scripts/postinstall.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        // Node.js built-in modules
        'fs',
        'fs/promises',
        'path',
        'os',
        'child_process',
        'util',
        'events',
        'stream',
        'url',
        'crypto',
        'buffer',
        'process',
        'module',
        'readline',
        // Prevent bundling these dependencies
        /^node:/,
      ],
      output: {
        preserveModules: false,
        exports: 'named',
        interop: 'auto',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false, // CLI tools usually don't need minification
    emptyOutDir: true,
    reportCompressedSize: false, // Improve build performance
    chunkSizeWarningLimit: 1000,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/config': resolve(__dirname, 'src/config'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/cli': resolve(__dirname, 'src/cli'),
    },
  },

  // Environment variable configuration
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // Inject version information
    '__PKG_NAME__': JSON.stringify(pkg.name),
    '__PKG_VERSION__': JSON.stringify(pkg.version),
    '__PKG_DESCRIPTION__': JSON.stringify(pkg.description),
  },

  // Development server configuration (useful for development even though this is a CLI project)
  server: {
    port: 3000,
    strictPort: false,
    host: true,
  },

  // Optimization configuration - using Vite 5.1+ new configuration
  optimizeDeps: {
    // Disable dependency discovery since this is a Node.js CLI project
    noDiscovery: true,
    include: undefined,
  },

  // Clean console output
  logLevel: 'info',
  clearScreen: false,
});