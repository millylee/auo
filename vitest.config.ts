import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Read package.json to get version information
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  test: {
    // Test environment configuration
    globals: true,
    environment: 'node',
    
    // File matching patterns
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,ts}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{js,ts}',
        'src/**/*.spec.{js,ts}',
        'src/**/index.ts', // Entry files usually just re-export
        'src/**/*.config.{js,ts}',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      // Enable all coverage features
      all: true,
      skipFull: false,
    },
    
    // Timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    
    // Performance configuration
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    
    // Output configuration
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './coverage/test-results.html',
    },
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  
  // Resolve configuration (consistent with vite.config.ts)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/config': resolve(__dirname, 'src/config'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/cli': resolve(__dirname, 'src/cli'),
    },
  },
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    // Inject version information (consistent with vite.config.ts)
    '__PKG_NAME__': JSON.stringify(pkg.name),
    '__PKG_VERSION__': JSON.stringify(pkg.version),
    '__PKG_DESCRIPTION__': JSON.stringify(pkg.description),
  },
});