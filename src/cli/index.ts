#!/usr/bin/env node

import { handleCLI } from './commands';
import { checkClaudeCode, installClaudeCode } from '../utils/claude';

/**
 * Ensure Claude Code is available (lazy initialization)
 * Only runs when CLI is actually used, not during package installation
 */
async function ensureClaudeCode(): Promise<void> {
  try {
    const hasClaudeCode = await checkClaudeCode();

    if (hasClaudeCode) {
      // Claude Code is already available, proceed silently
      return;
    }

    // Claude Code not found, attempt automatic installation
    console.log('🔍 First time use detected, checking Claude Code installation...');
    console.log('📦 Claude Code not found, installing automatically...');

    try {
      await installClaudeCode();

      // Verify installation was successful
      const isInstalled = await checkClaudeCode();
      if (isInstalled) {
        console.log('✅ Claude Code installed successfully!');
        console.log("🎉 You're ready to use auo!");
      } else {
        console.warn('⚠️  Claude Code installation may have issues');
        console.log('💡 Manual installation: npm install -g @anthropic-ai/claude-code');
        console.log('📝 auo will continue to work, but may have limited functionality');
      }
    } catch (installError) {
      console.warn('⚠️  Failed to install Claude Code automatically');
      if (installError instanceof Error) {
        console.log(`   Error: ${installError.message}`);
      }
      console.log('\n💡 Possible solutions:');
      console.log('   • Check your network connection');
      console.log('   • Ensure you have permission to install global packages');
      console.log('   • Try manual installation: npm install -g @anthropic-ai/claude-code');
      console.log('   • Run with sudo if needed: sudo npm install -g @anthropic-ai/claude-code');
    }
  } catch (checkError) {
    console.warn('⚠️  Error occurred while checking Claude Code installation');
    if (checkError instanceof Error) {
      console.log(`   Error: ${checkError.message}`);
    }
    console.log("💡 This won't prevent auo from running, installation will be retried if needed");
  }
}

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
    // Lazy initialization - check Claude Code only when CLI is used
    await ensureClaudeCode();

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
const isESMMain =
  typeof import.meta !== 'undefined' &&
  import.meta.url &&
  process.argv[1] &&
  import.meta.url.includes(process.argv[1]);

if (isMainModule || isESMMain) {
  main().catch((error) => {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  });
}
