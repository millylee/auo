import fs from 'fs';
import path from 'path';
import os from 'os';
import type {
  ConfigFile,
  ConfigFileV2,
  ConfigItemV2,
  ConfigManagerOptions,
  AddConfigParams,
  AddConfigParamsV2,
  ConfigEnvironment,
  MigrationResult,
} from './types';
import { ConfigMigration } from './migration';

/**
 * Type guard to check if config file is v2
 */
function isConfigFileV2(config: ConfigFile): config is ConfigFileV2 {
  return 'version' in config && config.version === 'v2';
}

/**
 * Type guard to check if add config params is v2
 */
function isAddConfigParamsV2(params: AddConfigParams): params is AddConfigParamsV2 {
  return 'env' in params;
}

/**
 * Configuration manager class
 * Responsible for managing Claude CLI configuration files and state
 */
export class ConfigManager {
  private readonly configDir: string;
  private readonly configFile: string;

  constructor(options: ConfigManagerOptions = {}) {
    this.configDir = options.configDir || path.join(os.homedir(), '.auo');
    this.configFile = path.join(this.configDir, options.configFileName || 'config.json');
    this.ensureConfigDir();
  }

  /**
   * Ensure configuration directory exists
   */
  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Get default configuration (v2 format)
   */
  private getDefaultConfig(): ConfigFileV2 {
    return ConfigMigration.getDefaultV2Config();
  }

  /**
   * Load configuration file with automatic migration
   */
  private loadConfig(): ConfigFileV2 {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        const rawConfig = JSON.parse(data) as ConfigFile;

        // Check if migration is needed
        if (ConfigMigration.needsMigration(rawConfig)) {
          console.log('🔄 Migrating configuration to latest format...');
          const { config: migratedConfig, result } = ConfigMigration.migrate(rawConfig);

          // Save migrated configuration
          this.saveConfig(migratedConfig);

          if (result.migrated) {
            console.log(
              `✅ Configuration migrated from ${result.fromVersion} to ${result.toVersion}`
            );
          }

          return migratedConfig;
        }

        // Validate v2 configuration
        if (isConfigFileV2(rawConfig)) {
          if (ConfigMigration.validateV2Config(rawConfig)) {
            // Ensure currentIndex is valid
            if (
              rawConfig.currentIndex < 0 ||
              rawConfig.currentIndex >= rawConfig.providers.length
            ) {
              rawConfig.currentIndex = 0;
            }
            return rawConfig;
          } else {
            console.warn('⚠️ Invalid v2 configuration format detected, using default config');
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to read configuration file, using default config:', error);
    }

    return this.getDefaultConfig();
  }

  /**
   * Save configuration file (always saves as v2 format)
   */
  private saveConfig(config: ConfigFileV2): void {
    try {
      const data = JSON.stringify(config, null, 2);
      fs.writeFileSync(this.configFile, data, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save configuration file: ${error}`);
    }
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configFile;
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): ConfigItemV2 {
    const config = this.loadConfig();
    const currentIndex = config.currentIndex;

    if (currentIndex >= 0 && currentIndex < config.providers.length) {
      const currentConfig = config.providers[currentIndex];
      if (currentConfig) {
        return currentConfig;
      }
    }

    const firstConfig = config.providers[0];
    if (firstConfig) {
      return firstConfig;
    }

    const defaultConfig = this.getDefaultConfig().providers[0];
    if (!defaultConfig) {
      throw new Error('Unable to get default configuration');
    }
    return defaultConfig;
  }

  /**
   * Switch to configuration at specified index
   */
  switchToIndex(index: number): ConfigItemV2 | null {
    const config = this.loadConfig();

    if (index < 0 || index >= config.providers.length) {
      return null;
    }

    config.currentIndex = index;
    this.saveConfig(config);

    return config.providers[index] || null;
  }

  /**
   * List all configurations
   */
  listConfigs(): void {
    const config = this.loadConfig();
    const currentIndex = config.currentIndex;

    console.log('📋 All configurations:');
    config.providers.forEach((cfg, index) => {
      const isCurrent = index === currentIndex;
      const marker = isCurrent ? '👉' : '  ';
      const baseUrl = cfg.env.ANTHROPIC_BASE_URL || '(not set)';
      const authToken = cfg.env.ANTHROPIC_AUTH_TOKEN ? '✅' : '❌';
      const model = cfg.env.ANTHROPIC_MODEL || 'not set';
      const description = cfg.description ? ` - ${cfg.description}` : '';

      console.log(`${marker} [${index}] ${cfg.name}${description}`);
      console.log(`      Base URL: ${baseUrl}`);
      console.log(`      Auth Token: ${authToken}`);
      console.log(`      Model: ${model}`);
    });
  }

  /**
   * Add new configuration (v2 format)
   */
  addConfig(params: AddConfigParams): boolean {
    try {
      const config = this.loadConfig();

      // Validate input parameters
      if (!params.name || !params.name.trim()) {
        console.error('❌ Configuration name cannot be empty');
        return false;
      }

      // Check if name already exists
      if (config.providers.some((cfg) => cfg.name === params.name)) {
        console.error(`❌ Configuration name "${params.name}" already exists`);
        return false;
      }

      let newProvider: ConfigItemV2;

      if (isAddConfigParamsV2(params)) {
        // V2 format parameters
        if (!params.env.ANTHROPIC_AUTH_TOKEN || !params.env.ANTHROPIC_AUTH_TOKEN.trim()) {
          console.error('❌ Auth Token cannot be empty');
          return false;
        }

        newProvider = {
          name: params.name.trim(),
          description: params.description?.trim() || '',
          env: {
            ANTHROPIC_BASE_URL: params.env.ANTHROPIC_BASE_URL?.trim() || undefined,
            ANTHROPIC_AUTH_TOKEN: params.env.ANTHROPIC_AUTH_TOKEN.trim(),
            ANTHROPIC_MODEL: params.env.ANTHROPIC_MODEL?.trim() || undefined,
          },
        };
      } else {
        // V1 format parameters - convert to V2
        if (!params.authToken || !params.authToken.trim()) {
          console.error('❌ Auth Token cannot be empty');
          return false;
        }

        newProvider = {
          name: params.name.trim(),
          description: params.description?.trim() || '',
          env: {
            ANTHROPIC_BASE_URL: params.baseUrl?.trim() || undefined,
            ANTHROPIC_AUTH_TOKEN: params.authToken.trim(),
            ANTHROPIC_MODEL: undefined,
          },
        };
      }

      config.providers.push(newProvider);
      this.saveConfig(config);
      console.log(`✅ Configuration "${newProvider.name}" added successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to add configuration:', error);
      return false;
    }
  }

  /**
   * Delete configuration
   */
  deleteConfig(name: string): boolean {
    try {
      const config = this.loadConfig();
      const index = config.providers.findIndex((cfg) => cfg.name === name);
      if (index === -1) {
        console.error(`❌ Configuration "${name}" not found`);
        return false;
      }

      if (config.providers.length <= 1) {
        console.error('❌ Cannot delete the last configuration');
        return false;
      }

      config.providers.splice(index, 1);

      // Adjust current index if necessary
      if (config.currentIndex >= config.providers.length) {
        config.currentIndex = config.providers.length - 1;
      } else if (config.currentIndex > index) {
        config.currentIndex = config.currentIndex - 1;
      }

      this.saveConfig(config);
      console.log(`✅ Configuration "${name}" deleted successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete configuration:', error);
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(name: string, updates: Partial<ConfigItemV2>): boolean {
    try {
      const config = this.loadConfig();
      const index = config.providers.findIndex((cfg) => cfg.name === name);
      if (index === -1) {
        console.error(`❌ Configuration "${name}" not found`);
        return false;
      }

      // Check if new name conflicts with other configurations (if name was modified)
      if (updates.name && updates.name !== name) {
        if (config.providers.some((cfg) => cfg.name === updates.name)) {
          console.error(`❌ Configuration name "${updates.name}" already exists`);
          return false;
        }
      }

      // Update configuration
      const existingConfig = config.providers[index];
      if (!existingConfig) {
        console.error(`❌ Configuration "${name}" does not exist`);
        return false;
      }

      // Merge updates, keeping existing values as defaults
      config.providers[index] = {
        name: updates.name || existingConfig.name,
        description:
          updates.description !== undefined ? updates.description : existingConfig.description,
        env: {
          ANTHROPIC_BASE_URL:
            updates.env && 'ANTHROPIC_BASE_URL' in updates.env
              ? updates.env.ANTHROPIC_BASE_URL
              : existingConfig.env.ANTHROPIC_BASE_URL,
          ANTHROPIC_AUTH_TOKEN:
            updates.env && 'ANTHROPIC_AUTH_TOKEN' in updates.env
              ? updates.env.ANTHROPIC_AUTH_TOKEN
              : existingConfig.env.ANTHROPIC_AUTH_TOKEN,
          ANTHROPIC_MODEL:
            updates.env && 'ANTHROPIC_MODEL' in updates.env
              ? updates.env.ANTHROPIC_MODEL
              : existingConfig.env.ANTHROPIC_MODEL,
        },
      };

      this.saveConfig(config);
      console.log(`✅ Configuration "${name}" updated successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update configuration:', error);
      return false;
    }
  }

  /**
   * Reset configuration to default values
   */
  resetConfig(): void {
    const defaultConfig = this.getDefaultConfig();
    this.saveConfig(defaultConfig);

    console.log('✅ Configuration reset to default values');
  }

  /**
   * Check if configuration exists
   */
  hasConfig(name: string): boolean {
    const config = this.loadConfig();
    return config.providers.some((cfg) => cfg.name === name);
  }

  /**
   * Get configuration by name
   */
  getConfig(name: string): ConfigItemV2 | null {
    const config = this.loadConfig();
    return config.providers.find((cfg) => cfg.name === name) || null;
  }

  /**
   * Get all configurations
   */
  getAllConfigs(): ConfigItemV2[] {
    const config = this.loadConfig();
    return [...config.providers];
  }

  /**
   * Delete configuration by index
   */
  removeConfigByIndex(index: number): boolean {
    try {
      const config = this.loadConfig();

      // Check index boundaries
      if (index < 0 || index >= config.providers.length) {
        console.error(
          `❌ Invalid index ${index}. Must be between 0 and ${config.providers.length - 1}`
        );
        return false;
      }

      if (config.providers.length <= 1) {
        console.error('❌ Cannot delete the last configuration');
        return false;
      }

      const deletedConfig = config.providers[index];
      if (!deletedConfig) {
        console.error(`❌ Configuration at index ${index} not found`);
        return false;
      }

      config.providers.splice(index, 1);

      // Adjust current index if necessary
      if (config.currentIndex >= config.providers.length) {
        config.currentIndex = config.providers.length - 1;
      } else if (config.currentIndex > index) {
        config.currentIndex = config.currentIndex - 1;
      }

      this.saveConfig(config);
      console.log(`✅ Configuration "${deletedConfig.name}" (index ${index}) deleted successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete configuration:', error);
      return false;
    }
  }

  /**
   * Get configuration environment variables
   */
  getConfigEnvironment(config?: ConfigItemV2): ConfigEnvironment {
    const targetConfig = config || this.getCurrentConfig();
    return { ...targetConfig.env };
  }

  /**
   * Force migration of existing configuration
   */
  forceMigration(): MigrationResult {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        const rawConfig = JSON.parse(data) as ConfigFile;

        const { config: migratedConfig, result } = ConfigMigration.migrate(rawConfig);

        if (result.migrated) {
          this.saveConfig(migratedConfig);
          console.log(
            `✅ Configuration migrated from ${result.fromVersion} to ${result.toVersion}`
          );
        } else {
          console.log('ℹ️  Configuration is already up to date');
        }

        return result;
      } else {
        // No config file exists, create default
        const defaultConfig = this.getDefaultConfig();
        this.saveConfig(defaultConfig);

        return {
          migrated: true,
          fromVersion: 'none',
          toVersion: 'v2',
        };
      }
    } catch (error) {
      console.error('❌ Failed to perform migration:', error);
      throw error;
    }
  }
}
