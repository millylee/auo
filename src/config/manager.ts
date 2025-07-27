import fs from 'fs';
import path from 'path';
import os from 'os';
import type {
  ConfigItem,
  ConfigFile,
  ConfigManagerOptions,
  AddConfigParams,
} from './types';

/**
 * Configuration manager class
 * Responsible for managing Claude CLI configuration files and state
 */
export class ConfigManager {
  private readonly configDir: string;
  private readonly configFile: string;

  constructor(options: ConfigManagerOptions = {}) {
    this.configDir = options.configDir || path.join(os.homedir(), '.auo');
    this.configFile = path.join(
      this.configDir,
      options.configFileName || 'config.json'
    );
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
   * Get default configuration
   */
  private getDefaultConfig(): ConfigFile {
    return {
      providers: [
        {
          name: 'default',
          baseUrl: '',
          authToken: '',
          description: 'Default configuration',
        },
      ],
      currentIndex: 0,
    };
  }

  /**
   * Load configuration file
   */
  private loadConfig(): ConfigFile {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        const config = JSON.parse(data) as ConfigFile;
        
        // Validate configuration file format
        if (!config.providers || !Array.isArray(config.providers)) {
          throw new Error('Invalid config format');
        }
        
        // Ensure currentIndex is valid
        if (typeof config.currentIndex !== 'number' || 
            config.currentIndex < 0 || 
            config.currentIndex >= config.providers.length) {
          config.currentIndex = 0;
        }
        
        return config;
      }
    } catch (error) {
      console.warn('⚠️ Failed to read configuration file, using default config:', error);
    }
    
    return this.getDefaultConfig();
  }

  /**
   * Save configuration file
   */
  private saveConfig(config: ConfigFile): void {
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
  getCurrentConfig(): ConfigItem {
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
   * Switch to next configuration
   */
  switchToNext(): ConfigItem {
    const config = this.loadConfig();
    const nextIndex = (config.currentIndex + 1) % config.providers.length;

    config.currentIndex = nextIndex;
    this.saveConfig(config);

    const nextConfig = config.providers[nextIndex];
    if (!nextConfig) {
      throw new Error('Unable to get next configuration');
    }
    return nextConfig;
  }

  /**
   * Switch to configuration at specified index
   */
  switchToIndex(index: number): ConfigItem | null {
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
      const baseUrl = cfg.baseUrl || '(not set)';
      const authToken = cfg.authToken ? '✅' : '❌';
      const description = cfg.description ? ` - ${cfg.description}` : '';
      
      console.log(`${marker} [${index}] ${cfg.name}${description}`);
      console.log(`      Base URL: ${baseUrl}`);
      console.log(`      Auth Token: ${authToken}`);
    });
  }

  /**
   * Add new configuration
   */
  addConfig(params: AddConfigParams): boolean {
    try {
      const config = this.loadConfig();

      // Validate input parameters
      if (!params.name || !params.name.trim()) {
        console.error('❌ Configuration name cannot be empty');
        return false;
      }

      if (!params.authToken || !params.authToken.trim()) {
        console.error('❌ Auth Token cannot be empty');
        return false;
      }

      // Format parameters
      const formattedParams = {
        name: params.name.trim(),
        baseUrl: params.baseUrl?.trim() || '',
        authToken: params.authToken.trim(),
        description: params.description?.trim() || '',
      };

      // Check if name already exists
      if (config.providers.some((cfg) => cfg.name === params.name)) {
        console.error(`❌ Configuration name "${params.name}" already exists`);
        return false;
      }

      config.providers.push({
        name: formattedParams.name,
        baseUrl: formattedParams.baseUrl,
        authToken: formattedParams.authToken,
        description: formattedParams.description,
      });

      this.saveConfig(config);
      console.log(`✅ Configuration "${formattedParams.name}" added successfully`);
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
  updateConfig(name: string, updates: Partial<ConfigItem>): boolean {
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
        baseUrl: updates.baseUrl !== undefined ? updates.baseUrl : existingConfig.baseUrl,
        authToken: updates.authToken !== undefined ? updates.authToken : existingConfig.authToken,
        description: updates.description !== undefined ? updates.description : existingConfig.description,
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
  getConfig(name: string): ConfigItem | null {
    const config = this.loadConfig();
    return config.providers.find((cfg) => cfg.name === name) || null;
  }

  /**
   * Get all configurations
   */
  getAllConfigs(): ConfigItem[] {
    const config = this.loadConfig();
    return [...config.providers];
  }
}