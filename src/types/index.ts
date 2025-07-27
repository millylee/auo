/**
 * Claude Code check result
 */
export interface ClaudeCodeCheckResult {
  /** Whether it's installed */
  isInstalled: boolean;
  /** Version information (if available) */
  version?: string;
  /** Error message (if any) */
  error?: string;
}

/**
 * Installation options
 */
export interface InstallOptions {
  /** Whether to install silently */
  silent?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to force reinstallation */
  force?: boolean;
}

// Re-export all config-related types
export type * from '../config/types';

/**
 * CLI command options
 */
export interface CLIOptions {
  /** Show help information */
  help?: boolean;
  /** Show version information */
  version?: boolean;
  /** Switch to the next configuration */
  next?: boolean;
  /** List all configurations */
  listConfigs?: boolean;
  /** Show configuration file path */
  configPath?: boolean;
  /** Add new configuration */
  addConfig?: boolean;
}

/**
 * Environment variable settings
 */
export interface EnvironmentVariables {
  /** Anthropic API base URL */
  ANTHROPIC_BASE_URL?: string;
  /** Anthropic authentication token */
  ANTHROPIC_AUTH_TOKEN?: string;
  [key: string]: string | undefined;
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Exit code */
  exitCode: number;
  /** Standard output */
  stdout?: string;
  /** Standard error output */
  stderr?: string;
  /** Whether successful */
  success: boolean;
}
