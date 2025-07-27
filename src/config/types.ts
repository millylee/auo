/**
 * Single configuration item
 */
export interface ConfigItem {
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
 * Configuration file structure
 */
export interface ConfigFile {
  /** All service provider configurations */
  providers: ConfigItem[];
  /** Current selected configuration index */
  currentIndex: number;
}

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
 * Parameters for adding configuration
 */
export interface AddConfigParams {
  /** Configuration name */
  name: string;
  /** API base URL */
  baseUrl: string;
  /** Authentication token */
  authToken: string;
  /** Configuration description */
  description?: string;
}
