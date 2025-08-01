import readline from 'readline';
import { ConfigManager } from '../config/manager';
import { runClaudeCode } from '../utils/claude';
import type { CLIOptions, EnvironmentVariables, ConfigItem } from '../types';

// Declare global variables that will be replaced by Vite during build
declare const __PKG_NAME__: string;
declare const __PKG_VERSION__: string;
declare const __PKG_DESCRIPTION__: string;

/**
 * Parse command line arguments into options object
 */
export function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
      case '--use': {
        // Get the next argument as index
        const useIndexStr = args[i + 1];
        if (useIndexStr !== undefined && !useIndexStr.startsWith('--')) {
          const useIndex = parseInt(useIndexStr, 10);
          if (!isNaN(useIndex)) {
            options.useIndex = useIndex;
            i++; // Skip next argument as it's the index
          }
        }
        break;
      }
      case '--remove': {
        // Get the next argument as index
        const removeIndexStr = args[i + 1];
        if (removeIndexStr !== undefined && !removeIndexStr.startsWith('--')) {
          const removeIndex = parseInt(removeIndexStr, 10);
          if (!isNaN(removeIndex)) {
            options.removeIndex = removeIndex;
            i++; // Skip next argument as it's the index
          }
        }
        break;
      }
      case '--list':
        options.listConfigs = true;
        break;
      case '--config-path':
        options.configPath = true;
        break;
      case '--add':
        options.addConfig = true;
        break;
    }
  }

  return options;
}

/**
 * Show version information
 */
export function showVersion(): void {
  console.log(`${__PKG_NAME__} v${__PKG_VERSION__}`);
  console.log(__PKG_DESCRIPTION__);
}

/**
 * Show auo's help information
 */
export function showHelp(): void {
  console.log(`${__PKG_NAME__} v${__PKG_VERSION__} - ${__PKG_DESCRIPTION__}

Usage:
  auo [options] [command]

Basic Commands:
  auo                         # Start Claude Code interactive mode
  auo "write some code"        # Ask Claude Code directly
  auo --version, -v           # Show auo version info
  auo --help, -h              # Show this help message

Configuration Management:
  auo --use <index>           # Switch to configuration at specified index
  auo --remove <index>        # Remove configuration at specified index
  auo --list                  # List all configurations
  auo --add                   # Add a new configuration (interactive)
  auo --config-path           # Show config file path

Notes:
  • Claude Code will be installed automatically on first use
  • Config file is stored at ~/.auo/config.json
  • Use config management to easily switch between different API endpoints and tokens
  • Use --list to see configuration indices before using --use or --remove

Examples:
  auo --add                   # Add a new API configuration
  auo --use 1                 # Switch to configuration at index 1
  auo --remove 2              # Remove configuration at index 2
  auo "Write a React component" # Ask Claude with the current config`);
}

/**
 * Handle configuration-related commands
 */
export function handleConfigCommands(options: CLIOptions, configManager: ConfigManager): boolean {
  if (options.useIndex !== undefined) {
    const config = configManager.switchToIndex(options.useIndex);
    if (config) {
      console.log(
        `✅ Switched to config [${options.useIndex}]: ${config.name} - ${config.description || 'No description'}`
      );
      console.log(`   Base URL: ${config.baseUrl || '(not set)'}`);
      console.log(`   Token: ${config.authToken ? 'set' : 'not set'}`);
    } else {
      const allConfigs = configManager.getAllConfigs();
      console.error(
        `❌ Invalid index ${options.useIndex}. Must be between 0 and ${allConfigs.length - 1}`
      );
    }
    return true;
  }

  if (options.removeIndex !== undefined) {
    configManager.removeConfigByIndex(options.removeIndex);
    return true;
  }

  if (options.listConfigs) {
    const configs = configManager.getAllConfigs();
    if (configs.length === 0) {
      console.log('No configurations found. Use --add to create one.');
    } else {
      console.log('Available configurations:');
      configs.forEach((cfg, idx) => {
        const currentConfig = configManager.getCurrentConfig();
        const current = cfg === currentConfig ? ' (current)' : '';
        console.log(
          `  [${idx}] ${cfg.name}${cfg.description ? ` - ${cfg.description}` : ''}${current}`
        );
      });
    }
    return true;
  }

  if (options.configPath) {
    console.log(`Config file path: ${configManager.getConfigPath()}`);
    return true;
  }

  if (options.addConfig) {
    addConfigInteractive(configManager);
    return true;
  }

  return false;
}

/**
 * Interactive prompt to add a new configuration
 */
export function addConfigInteractive(configManager: ConfigManager): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Config name: ', (name) => {
    if (!name.trim()) {
      console.log('❌ Config name cannot be empty');
      rl.close();
      return;
    }

    rl.question('Base URL (leave blank for default): ', (baseUrl) => {
      rl.question('Auth Token: ', (authToken) => {
        rl.question('Description (optional): ', (description) => {
          const success = configManager.addConfig({
            name: name.trim(),
            baseUrl: baseUrl.trim(),
            authToken: authToken.trim(),
            description: description.trim(),
          });

          if (success) {
            console.log(`✅ Config "${name}" added successfully!`);
          }

          rl.close();
        });
      });
    });
  });
}

/**
 * Set environment variables based on configuration
 */
export function setupEnvironment(config: ConfigItem): EnvironmentVariables {
  const env: EnvironmentVariables = {};

  if (config.baseUrl) {
    env.ANTHROPIC_BASE_URL = config.baseUrl;
  }
  if (config.authToken) {
    env.ANTHROPIC_AUTH_TOKEN = config.authToken;
  }

  return env;
}

/**
 * Show current configuration information
 */
export function showCurrentConfig(config: ConfigItem): void {
  if (config.name !== 'default' || config.baseUrl || config.authToken) {
    console.log(
      `🔧 Current config: ${config.name}${config.description ? ` - ${config.description}` : ''}`
    );
  }
}

/**
 * Main CLI handler function
 */
export async function handleCLI(args: string[]): Promise<void> {
  const configManager = new ConfigManager();
  const options = parseArgs(args);

  // Handle auo's own commands
  if (options.version) {
    showVersion();
    return;
  }

  if (options.help) {
    showHelp();
    return;
  }

  // Handle configuration-related commands
  if (handleConfigCommands(options, configManager)) {
    return;
  }

  try {
    // Show current configuration info (only in non-silent mode)
    const currentConfig = configManager.getCurrentConfig();
    showCurrentConfig(currentConfig);

    // Set environment variables and run Claude Code
    const env = setupEnvironment(currentConfig);
    runClaudeCode(args, env);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Error:', String(error));
    }
    console.error(
      '🔧 If the problem persists, please check your network connection or contact support.'
    );
    process.exit(1);
  }
}
