import type {
  ConfigFile,
  ConfigFileV1,
  ConfigFileV2,
  ConfigItemV1,
  ConfigItemV2,
  MigrationResult,
} from './types';

/**
 * Type guard to check if config file is v2
 */
function isConfigFileV2(config: ConfigFile): config is ConfigFileV2 {
  return 'version' in config && config.version === 'v2';
}

/**
 * Migration utility for configuration files
 */
export class ConfigMigration {
  /**
   * Check if configuration needs migration
   */
  static needsMigration(config: ConfigFile): boolean {
    // If config doesn't have version or version is not v2, it needs migration
    return !isConfigFileV2(config);
  }

  /**
   * Migrate configuration from v1 to v2 format
   */
  static migrateV1ToV2(configV1: ConfigFileV1): ConfigFileV2 {
    const migratedProviders: ConfigItemV2[] = configV1.providers.map((provider: ConfigItemV1) => ({
      name: provider.name,
      description: provider.description,
      env: {
        ANTHROPIC_BASE_URL: provider.baseUrl || undefined,
        ANTHROPIC_AUTH_TOKEN: provider.authToken || undefined,
        ANTHROPIC_MODEL: undefined, // Default value for migrated configurations
      },
    }));

    return {
      version: 'v2',
      providers: migratedProviders,
      currentIndex: configV1.currentIndex,
    };
  }

  /**
   * Perform automatic migration
   */
  static migrate(config: ConfigFile): { config: ConfigFileV2; result: MigrationResult } {
    if (isConfigFileV2(config)) {
      // Already v2, no migration needed
      return {
        config,
        result: {
          migrated: false,
          toVersion: 'v2',
        },
      };
    }

    // Migrate from v1 to v2
    const migratedConfig = this.migrateV1ToV2(config);

    return {
      config: migratedConfig,
      result: {
        migrated: true,
        fromVersion: 'v1',
        toVersion: 'v2',
      },
    };
  }

  /**
   * Get default v2 configuration
   */
  static getDefaultV2Config(): ConfigFileV2 {
    return {
      version: 'v2',
      providers: [
        {
          name: 'default',
          description: 'Default configuration',
          env: {
            ANTHROPIC_BASE_URL: undefined,
            ANTHROPIC_AUTH_TOKEN: '',
            ANTHROPIC_MODEL: undefined,
          },
        },
      ],
      currentIndex: 0,
    };
  }

  /**
   * Validate v2 configuration structure
   */
  static validateV2Config(config: ConfigFileV2): boolean {
    try {
      // Check basic structure
      if (!config.version || config.version !== 'v2') {
        return false;
      }

      if (!Array.isArray(config.providers) || config.providers.length === 0) {
        return false;
      }

      if (
        typeof config.currentIndex !== 'number' ||
        config.currentIndex < 0 ||
        config.currentIndex >= config.providers.length
      ) {
        return false;
      }

      // Validate each provider
      for (const provider of config.providers) {
        if (!provider.name || typeof provider.name !== 'string') {
          return false;
        }

        if (typeof provider.description !== 'string') {
          return false;
        }

        if (!provider.env || typeof provider.env !== 'object') {
          return false;
        }

        // env fields are optional, but if present must be strings
        const { ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_MODEL } = provider.env;

        if (ANTHROPIC_BASE_URL !== undefined && typeof ANTHROPIC_BASE_URL !== 'string') {
          return false;
        }

        if (ANTHROPIC_AUTH_TOKEN !== undefined && typeof ANTHROPIC_AUTH_TOKEN !== 'string') {
          return false;
        }

        if (ANTHROPIC_MODEL !== undefined && typeof ANTHROPIC_MODEL !== 'string') {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}
