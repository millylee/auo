import { spawn, ChildProcess } from 'child_process';

/**
 * Check if Claude Code is installed
 * @returns Promise<boolean> Returns true if Claude Code is installed and available
 */
export async function checkClaudeCode(): Promise<boolean> {
  return new Promise((resolve) => {
    const claude: ChildProcess = spawn('claude', ['--version'], {
      stdio: 'pipe',
      shell: true,
    });

    let output = '';

    claude.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    claude.stderr?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    claude.on('close', (_code: number | null) => {
      // Check if output contains "Claude Code"
      const hasClaudeCode = output.includes('Claude Code');
      resolve(hasClaudeCode);
    });

    claude.on('error', () => {
      // Command doesn't exist or execution failed
      resolve(false);
    });

    // Timeout handling
    const timeout = setTimeout(() => {
      claude.kill();
      resolve(false);
    }, 5000);

    claude.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

/**
 * Automatically install Claude Code
 * @returns Promise<void> Promise that resolves when installation is complete
 */
export async function installClaudeCode(): Promise<void> {
  console.log('🔄 Installing Claude Code, please wait...');
  
  return new Promise((resolve, reject) => {
    const install: ChildProcess = spawn(
      'npm', 
      ['install', '-g', '@anthropic-ai/claude-code'], 
      {
        stdio: 'inherit',
        shell: true,
      }
    );

    install.on('close', (code: number | null) => {
      if (code === 0) {
        console.log('✅ Claude Code installation completed!');
        resolve();
      } else {
        reject(new Error(`❌ Installation failed with exit code: ${code}`));
      }
    });

    install.on('error', (error: Error) => {
      reject(new Error(`❌ Installation error: ${error.message}`));
    });
  });
}

/**
 * Run Claude Code command
 * @param args Arguments to pass to Claude Code
 * @param env Environment variables
 */
export function runClaudeCode(args: string[], env: NodeJS.ProcessEnv = {}): void {
  const mergedEnv = { ...process.env, ...env };
  
  const claude: ChildProcess = spawn('claude', args, {
    stdio: 'inherit',
    shell: true,
    env: mergedEnv,
  });

  claude.on('close', (code: number | null) => {
    process.exit(code || 0);
  });

  claude.on('error', (error: Error) => {
    console.error('❌ Claude Code execution failed:', error.message);
    console.error('🔧 Please try reinstalling: npm install -g auo');
    process.exit(1);
  });
}