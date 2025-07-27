import { checkClaudeCode, installClaudeCode } from '../src/utils/claude';

/**
 * Post-install script - ensure Claude Code is available
 * Check if Claude Code is installed, install automatically if not
 */
async function postInstall(): Promise<void> {
  try {
    console.log('🔍 Checking if Claude Code is installed...');
    
    const hasClaudeCode = await checkClaudeCode();
    
    if (hasClaudeCode) {
      console.log('✅ Claude Code is installed and available');
      console.log('🎉 auo is ready! You can start using it now');
    } else {
      console.log('⚠️  Claude Code not detected, installing automatically...');
      
      try {
        await installClaudeCode();
        
        // Check again after installation
        const isInstalled = await checkClaudeCode();
        if (isInstalled) {
          console.log('🎉 Claude Code installation successful, auo is ready!');
          console.log('💡 You can now use the auo command');
        } else {
          console.log('⚠️  Claude Code installation may have issues, please check manually');
          console.log('💡 Don\'t worry, auo will automatically retry installation on first use');
        }
      } catch (installError) {
        console.log('⚠️  Claude Code automatic installation failed');
        if (installError instanceof Error) {
          console.log(`   Error message: ${installError.message}`);
        }
        console.log('💡 Possible solutions:');
        console.log('   1. Check if network connection is normal');
        console.log('   2. Ensure you have permission to install global packages (may need sudo)');
        console.log('   3. Manual installation: npm install -g @anthropic-ai/claude-code');
        console.log('   4. auo will automatically retry installation on first use');
      }
    }
  } catch (error) {
    console.log('⚠️  Error occurred during check process');
    if (error instanceof Error) {
      console.log(`   Error message: ${error.message}`);
    }
    console.log('💡 This will not affect normal use of auo, it will automatically retry on first run');
  }
}

// Run post-install script
postInstall().catch((error) => {
  console.error('❌ postinstall script execution failed:', error);
  // Don't exit process to avoid affecting package installation
}); 