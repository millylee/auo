import readline from 'readline';
import { ConfigManager } from '../config/manager';
import { runClaudeCode } from '../utils/claude';
import type { CLIOptions, EnvironmentVariables, ConfigItemV2, AddConfigParamsV2 } from '../types';

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
      case '--edit': {
        // Get the next argument as index
        const editIndexStr = args[i + 1];
        if (editIndexStr !== undefined && !editIndexStr.startsWith('--')) {
          const editIndex = parseInt(editIndexStr, 10);
          if (!isNaN(editIndex)) {
            options.editIndex = editIndex;
            i++; // Skip next argument as it's the index
          }
        }
        break;
      }
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
  auo --edit <index>          # Edit configuration at specified index
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
  auo --edit 1                # Edit configuration at index 1
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
      console.log(`   Base URL: ${config.env.ANTHROPIC_BASE_URL || '(not set)'}`);
      console.log(`   Token: ${config.env.ANTHROPIC_AUTH_TOKEN ? 'set' : 'not set'}`);
      console.log(`   Model: ${config.env.ANTHROPIC_MODEL || 'not set'}`);
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

  if (options.editIndex !== undefined) {
    editConfigInteractive(configManager, options.editIndex);
    return true;
  }

  return false;
}

/**
 * Interactive prompt to add a new configuration (v2 format)
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

    rl.question('Description (optional): ', (description) => {
      rl.question('Base URL (leave blank for default): ', (baseUrl) => {
        rl.question('Auth Token: ', (authToken) => {
          rl.question('Model (optional, e.g., claude-3-5-sonnet-20241022): ', (model) => {
            const configParams: AddConfigParamsV2 = {
              name: name.trim(),
              description: description.trim(),
              env: {
                ANTHROPIC_BASE_URL: baseUrl.trim() || undefined,
                ANTHROPIC_AUTH_TOKEN: authToken.trim(),
                ANTHROPIC_MODEL: model.trim() || undefined,
              },
            };

            const success = configManager.addConfig(configParams);

            if (success) {
              console.log(`✅ Config "${name}" added successfully!`);
            }

            rl.close();
          });
        });
      });
    });
  });
}

/**
 * Interactive prompt to edit an existing configuration (v2 format)
 */
export function editConfigInteractive(configManager: ConfigManager, index: number): void {
  const allConfigs = configManager.getAllConfigs();

  // Validate index
  if (index < 0 || index >= allConfigs.length) {
    console.error(`❌ Invalid index ${index}. Must be between 0 and ${allConfigs.length - 1}`);
    return;
  }

  const currentConfig = allConfigs[index];
  if (!currentConfig) {
    console.error(`❌ Configuration at index ${index} not found`);
    return;
  }

  console.log(
    `📝 Editing configuration [${index}]: ${currentConfig.name}${
      currentConfig.description ? ` - ${currentConfig.description}` : ''
    }`
  );
  console.log('💡 Leave blank to keep current value');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`Config name (${currentConfig.name}): `, (name) => {
    rl.question(`Description (${currentConfig.description || 'none'}): `, (description) => {
      rl.question(
        `Base URL (${currentConfig.env.ANTHROPIC_BASE_URL || 'not set'}): `,
        (baseUrl) => {
          rl.question(
            `Auth Token (${currentConfig.env.ANTHROPIC_AUTH_TOKEN ? 'set' : 'not set'}): `,
            (authToken) => {
              rl.question(
                `Model (${currentConfig.env.ANTHROPIC_MODEL || 'not set'}): `,
                (model) => {
                  const oldName = currentConfig.name;

                  // Build updates object - only include changed values
                  const updates: Partial<ConfigItemV2> = {};

                  if (name.trim() && name.trim() !== currentConfig.name) {
                    updates.name = name.trim();
                  }

                  if (description.trim() !== currentConfig.description) {
                    updates.description = description.trim();
                  }

                  // Handle environment variables
                  const envUpdates: Partial<typeof currentConfig.env> = {};
                  let hasEnvUpdates = false;

                  // Only update if user actually provided input (not empty)
                  if (baseUrl.trim()) {
                    envUpdates.ANTHROPIC_BASE_URL = baseUrl.trim();
                    hasEnvUpdates = true;
                  }

                  // Only update if user provided a new token (not empty)
                  if (
                    authToken.trim() &&
                    authToken.trim() !== currentConfig.env.ANTHROPIC_AUTH_TOKEN
                  ) {
                    envUpdates.ANTHROPIC_AUTH_TOKEN = authToken.trim();
                    hasEnvUpdates = true;
                  }

                  // Only update if user provided input (not empty) and different from current value
                  if (model.trim() && model.trim() !== (currentConfig.env.ANTHROPIC_MODEL || '')) {
                    envUpdates.ANTHROPIC_MODEL = model.trim();
                    hasEnvUpdates = true;
                  }

                  if (hasEnvUpdates) {
                    updates.env = envUpdates;
                  }

                  // Check if there are any changes
                  if (Object.keys(updates).length === 0) {
                    console.log('ℹ️  No changes made to configuration');
                    rl.close();
                    return;
                  }

                  const success = configManager.updateConfig(oldName, updates);

                  if (success) {
                    console.log(
                      `✅ Configuration "${updates.name || oldName}" updated successfully!`
                    );
                  }

                  rl.close();
                }
              );
            }
          );
        }
      );
    });
  });
}

/**
 * Set environment variables based on configuration (v2 format)
 */
export function setupEnvironment(config: ConfigItemV2): EnvironmentVariables {
  const env: EnvironmentVariables = {};

  // Ensure config.env exists before accessing its properties
  if (!config.env) {
    return env;
  }

  // Set environment variables from config.env
  if (config.env.ANTHROPIC_BASE_URL) {
    env.ANTHROPIC_BASE_URL = config.env.ANTHROPIC_BASE_URL;
  }
  if (config.env.ANTHROPIC_AUTH_TOKEN) {
    env.ANTHROPIC_AUTH_TOKEN = config.env.ANTHROPIC_AUTH_TOKEN;
  }
  if (config.env.ANTHROPIC_MODEL) {
    env.ANTHROPIC_MODEL = config.env.ANTHROPIC_MODEL;
  }

  return env;
}

/**
 * Show current configuration information (v2 format)
 */
export function showCurrentConfig(config: ConfigItemV2): void {
  if (
    config.name !== 'default' ||
    config.env.ANTHROPIC_BASE_URL ||
    config.env.ANTHROPIC_AUTH_TOKEN ||
    config.env.ANTHROPIC_MODEL
  ) {
    console.log(
      `🔧 Current config: ${config.name}${config.description ? ` - ${config.description}` : ''}`
    );

    const model = config.env.ANTHROPIC_MODEL || 'not set';
    console.log(`   Using model: ${model}`);
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
