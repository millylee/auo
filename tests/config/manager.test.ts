import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ConfigManager } from '../../src/config/manager';
import type { ConfigItem as _ConfigItem } from '../../src/types';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = path.join(os.tmpdir(), `auo-test-${Date.now()}`);
    configManager = new ConfigManager({
      configDir: tempDir,
    });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create configuration directory', () => {
      expect(fs.existsSync(tempDir)).toBe(true);
    });

    it('should use custom configuration options', () => {
      const customDir = path.join(os.tmpdir(), `auo-custom-${Date.now()}`);
      const _customManager = new ConfigManager({
        configDir: customDir,
        configFileName: 'custom-config.json',
      });

      expect(fs.existsSync(customDir)).toBe(true);

      // Clean up
      if (fs.existsSync(customDir)) {
        fs.rmSync(customDir, { recursive: true, force: true });
      }
    });
  });

  describe('loadConfig', () => {
    it('should return default configuration when config file does not exist', () => {
      const config = configManager.getCurrentConfig();
      expect(config.name).toBe('default');
    });

    it('should load existing configuration file', () => {
      // Add a configuration first, which will create the config file
      configManager.addConfig({
        name: 'test',
        baseUrl: 'https://api.test.com',
        authToken: 'test-token',
        description: 'Test configuration',
      });

      // Create new manager instance to test loading
      const newManager = new ConfigManager({
        configDir: tempDir,
      });

      const config = newManager.getCurrentConfig();
      expect(config.name).toBe('default'); // Current is still default config
    });

    it('should handle corrupted configuration file', () => {
      // Write invalid JSON
      const configPath = path.join(tempDir, 'config.json');
      fs.writeFileSync(configPath, '{ invalid json }');

      const newManager = new ConfigManager({
        configDir: tempDir,
      });

      const config = newManager.getCurrentConfig();
      expect(config.name).toBe('default');
    });

    it('should reset invalid currentIndex to 0', () => {
      // Write config with invalid currentIndex
      const configPath = path.join(tempDir, 'config.json');
      const invalidConfig = {
        providers: [{ name: 'test', baseUrl: '', authToken: 'token', description: 'test' }],
        currentIndex: 999, // Invalid index
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      const newManager = new ConfigManager({
        configDir: tempDir,
      });

      const config = newManager.getCurrentConfig();
      expect(config.name).toBe('test');
    });
  });

  describe('saveConfig', () => {
    it('should successfully save configuration', () => {
      const result = configManager.addConfig({
        name: 'test',
        baseUrl: 'https://api.test.com',
        authToken: 'test-token',
        description: 'Test configuration',
      });

      expect(result).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'config.json'))).toBe(true);
    });

    it('should handle save failure', () => {
      // Create a read-only directory to simulate save failure
      const readOnlyDir = path.join(os.tmpdir(), `auo-readonly-${Date.now()}`);
      fs.mkdirSync(readOnlyDir);

      try {
        // On Windows, we simulate write failure
        const spy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const manager = new ConfigManager({
          configDir: readOnlyDir,
        });

        const result = manager.addConfig({
          name: 'test',
          baseUrl: 'https://api.test.com',
          authToken: 'test-token',
        });

        expect(result).toBe(false);
        spy.mockRestore();
      } finally {
        // Clean up
        if (fs.existsSync(readOnlyDir)) {
          fs.rmSync(readOnlyDir, { recursive: true, force: true });
        }
      }
    });
  });

  describe('getCurrentConfig', () => {
    it('should return current configuration', () => {
      const config = configManager.getCurrentConfig();
      expect(config).toBeDefined();
      expect(config.name).toBe('default');
    });
  });

  describe('switchToIndex', () => {
    it('should switch to configuration at specified index', () => {
      // Add another configuration
      configManager.addConfig({
        name: 'second',
        baseUrl: 'https://api.second.com',
        authToken: 'second-token',
        description: 'Second configuration',
      });

      // Switch to index 1 (should be 'second')
      const config = configManager.switchToIndex(1);
      expect(config?.name).toBe('second');

      // Current config should now be 'second'
      const currentConfig = configManager.getCurrentConfig();
      expect(currentConfig.name).toBe('second');
    });

    it('should return null for invalid index', () => {
      const result = configManager.switchToIndex(999);
      expect(result).toBeNull();

      const result2 = configManager.switchToIndex(-1);
      expect(result2).toBeNull();
    });

    it('should not change current config when index is invalid', () => {
      const originalConfig = configManager.getCurrentConfig();
      configManager.switchToIndex(999);
      const currentConfig = configManager.getCurrentConfig();
      expect(currentConfig.name).toBe(originalConfig.name);
    });
  });

  describe('removeConfigByIndex', () => {
    it('should successfully remove configuration by index', () => {
      // Add a configuration to remove
      configManager.addConfig({
        name: 'to-remove',
        baseUrl: 'https://api.remove.com',
        authToken: 'remove-token',
        description: 'To be removed',
      });

      const result = configManager.removeConfigByIndex(1);
      expect(result).toBe(true);

      const allConfigs = configManager.getAllConfigs();
      expect(allConfigs.find((c) => c.name === 'to-remove')).toBeUndefined();
    });

    it('should reject invalid indices', () => {
      const result1 = configManager.removeConfigByIndex(-1);
      expect(result1).toBe(false);

      const result2 = configManager.removeConfigByIndex(999);
      expect(result2).toBe(false);
    });

    it('should prevent removing the last configuration', () => {
      // Only default config exists
      const result = configManager.removeConfigByIndex(0);
      expect(result).toBe(false);

      // Config should still exist
      const allConfigs = configManager.getAllConfigs();
      expect(allConfigs.length).toBe(1);
    });

    it('should adjust currentIndex when removing current configuration', () => {
      // Add configurations
      configManager.addConfig({
        name: 'second',
        baseUrl: 'https://api.second.com',
        authToken: 'second-token',
        description: 'Second configuration',
      });

      // Switch to second configuration (index 1)
      configManager.switchToIndex(1);
      expect(configManager.getCurrentConfig().name).toBe('second');

      // Remove the current configuration
      const result = configManager.removeConfigByIndex(1);
      expect(result).toBe(true);

      // Should now be back to default (index 0)
      const currentConfig = configManager.getCurrentConfig();
      expect(currentConfig.name).toBe('default');
    });
  });

  describe('addConfig', () => {
    it('should successfully add new configuration', () => {
      const result = configManager.addConfig({
        name: 'test-provider',
        baseUrl: 'https://api.test.com',
        authToken: 'test-token',
        description: 'Test provider',
      });

      expect(result).toBe(true);

      const allConfigs = configManager.getAllConfigs();
      expect(allConfigs).toHaveLength(2); // default + new
      expect(allConfigs.find((c) => c.name === 'test-provider')).toBeDefined();
    });

    it('should reject duplicate configuration names', () => {
      // Add a configuration first
      configManager.addConfig({
        name: 'duplicate',
        baseUrl: 'https://api.test.com',
        authToken: 'test-token',
      });

      // Try to add configuration with duplicate name
      const result = configManager.addConfig({
        name: 'duplicate',
        baseUrl: 'https://api.other.com',
        authToken: 'other-token',
      });

      expect(result).toBe(false);

      const allConfigs = configManager.getAllConfigs();
      expect(allConfigs.filter((c) => c.name === 'duplicate')).toHaveLength(1);
    });
  });

  describe('deleteConfig', () => {
    it('should successfully delete configuration', () => {
      // Add a configuration to delete
      configManager.addConfig({
        name: 'to-delete',
        baseUrl: 'https://api.delete.com',
        authToken: 'delete-token',
        description: 'To be deleted',
      });

      const result = configManager.deleteConfig('to-delete');
      expect(result).toBe(true);

      const allConfigs = configManager.getAllConfigs();
      expect(allConfigs.find((c) => c.name === 'to-delete')).toBeUndefined();
    });

    it('should adjust currentIndex when deleting current configuration', () => {
      // Add configurations
      configManager.addConfig({
        name: 'second',
        baseUrl: 'https://api.second.com',
        authToken: 'second-token',
        description: 'Second configuration',
      });

      // Switch to second configuration
      configManager.switchToIndex(1);
      expect(configManager.getCurrentConfig().name).toBe('second');

      // Delete the current configuration
      const result = configManager.deleteConfig('second');
      expect(result).toBe(true);

      // Should now be back to default
      const currentConfig = configManager.getCurrentConfig();
      expect(currentConfig.name).toBe('default');
    });
  });
});
