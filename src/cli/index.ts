#!/usr/bin/env node

import { handleCLI } from './commands';

/**
 * Main CLI entry function
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('❌ Unhandled async error:', reason);
    process.exit(1);
  });

  try {
    await handleCLI(args);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ CLI execution failed:', error.message);
    } else {
      console.error('❌ CLI execution failed:', String(error));
    }
    process.exit(1);
  }
}

// If this file is run directly, execute main function
// Support both CommonJS and ESM environments
const isMainModule = typeof require !== 'undefined' && require.main === module;
const isESMMain = typeof import.meta !== 'undefined' && import.meta.url && process.argv[1] && import.meta.url.includes(process.argv[1]);

if (isMainModule || isESMMain) {
  main().catch((error) => {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  });
}