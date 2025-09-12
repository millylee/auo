// Configuration module entry point
export * from './types';
export * from './manager';
export * from './migration';

// Export a default instance for convenience
export { ConfigManager as default } from './manager';
