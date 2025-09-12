/**
 * Environment variables for a configuration
 */
export interface ConfigEnvironment {
  /** Anthropic API base URL */
  ANTHROPIC_BASE_URL?: string | undefined;
  /** Anthropic authentication token */
  ANTHROPIC_AUTH_TOKEN?: string | undefined;
  /** Anthropic model to use */
  ANTHROPIC_MODEL?: string | undefined;
}

/**
 * Single configuration item (v1 format)
 */
export interface ConfigItemV1 {
  /** Configuration name */
  name: string;
  /** API base URL */
  baseUrl: string;
  /** Authentication token */
  authToken: string;
  /** Configuration description */
  description: string;
}

/**
 * Single configuration item (v2 format)
 */
export interface ConfigItemV2 {
  /** Configuration name */
  name: string;
  /** Configuration description */
  description: string;
  /** Environment variables */
  env: ConfigEnvironment;
}

/**
 * Union type for configuration items
 */
export type ConfigItem = ConfigItemV1 | ConfigItemV2;

/**
 * Configuration file structure (v1 format)
 */
export interface ConfigFileV1 {
  /** All service provider configurations */
  providers: ConfigItemV1[];
  /** Current selected configuration index */
  currentIndex: number;
}

/**
 * Configuration file structure (v2 format)
 */
export interface ConfigFileV2 {
  /** Configuration version */
  version: 'v2';
  /** All service provider configurations */
  providers: ConfigItemV2[];
  /** Current selected configuration index */
  currentIndex: number;
}

/**
 * Union type for configuration files
 */
export type ConfigFile = ConfigFileV1 | ConfigFileV2;

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
  /** Configuration directory path (optional, defaults to ~/.auo) */
  configDir?: string;
  /** Configuration file name (optional, defaults to config.json) */
  configFileName?: string;
}

/**
 * Parameters for adding configuration (v1 format)
 */
export interface AddConfigParamsV1 {
  /** Configuration name */
  name: string;
  /** API base URL */
  baseUrl: string;
  /** Authentication token */
  authToken: string;
  /** Configuration description */
  description?: string;
}

/**
 * Parameters for adding configuration (v2 format)
 */
export interface AddConfigParamsV2 {
  /** Configuration name */
  name: string;
  /** Configuration description */
  description?: string;
  /** Environment variables */
  env: ConfigEnvironment;
}

/**
 * Union type for add configuration parameters
 */
export type AddConfigParams = AddConfigParamsV1 | AddConfigParamsV2;

/**
 * Configuration migration result
 */
export interface MigrationResult {
  /** Whether migration was performed */
  migrated: boolean;
  /** Original version (if migration occurred) */
  fromVersion?: string;
  /** Target version */
  toVersion: string;
}

/**
 * Current configuration version
 */
export const CURRENT_CONFIG_VERSION = 'v2' as const;

/**
 * Type guard to check if config file is v2
 */
export function isConfigFileV2(config: ConfigFile): config is ConfigFileV2 {
  return 'version' in config && config.version === 'v2';
}

/**
 * Type guard to check if config item is v2
 */
export function isConfigItemV2(item: ConfigItem): item is ConfigItemV2 {
  return 'env' in item;
}

/**
 * Type guard to check if add config params is v2
 */
export function isAddConfigParamsV2(params: AddConfigParams): params is AddConfigParamsV2 {
  return 'env' in params;
}
