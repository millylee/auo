import { describe, test, expect } from 'vitest';
import { ConfigMigration } from '../../src/config/migration';
import type { ConfigFileV1, ConfigFileV2 } from '../../src/config/types';

describe('ConfigMigration', () => {
  test('should detect v1 config needs migration', () => {
    const v1Config: ConfigFileV1 = {
      providers: [
        {
          name: 'default',
          baseUrl: 'https://api.anthropic.com',
          authToken: 'sk-test-123',
          description: 'Default config',
        },
      ],
      currentIndex: 0,
    };

    expect(ConfigMigration.needsMigration(v1Config)).toBe(true);
  });

  test('should detect v2 config does not need migration', () => {
    const v2Config: ConfigFileV2 = {
      version: 'v2',
      providers: [
        {
          name: 'default',
          description: 'Default config',
          env: {
            ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
            ANTHROPIC_AUTH_TOKEN: 'sk-test-123',
            ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
          },
        },
      ],
      currentIndex: 0,
    };

    expect(ConfigMigration.needsMigration(v2Config)).toBe(false);
  });

  test('should migrate v1 to v2 format correctly', () => {
    const v1Config: ConfigFileV1 = {
      providers: [
        {
          name: 'official',
          baseUrl: 'https://api.anthropic.com',
          authToken: 'sk-official-123',
          description: 'Official API',
        },
        {
          name: 'proxy',
          baseUrl: 'https://proxy.example.com/v1',
          authToken: 'sk-proxy-456',
          description: 'Proxy server',
        },
      ],
      currentIndex: 1,
    };

    const migratedConfig = ConfigMigration.migrateV1ToV2(v1Config);

    expect(migratedConfig.version).toBe('v2');
    expect(migratedConfig.currentIndex).toBe(1);
    expect(migratedConfig.providers).toHaveLength(2);

    expect(migratedConfig.providers[0]).toEqual({
      name: 'official',
      description: 'Official API',
      env: {
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
        ANTHROPIC_AUTH_TOKEN: 'sk-official-123',
        ANTHROPIC_MODEL: 'default',
      },
    });

    expect(migratedConfig.providers[1]).toEqual({
      name: 'proxy',
      description: 'Proxy server',
      env: {
        ANTHROPIC_BASE_URL: 'https://proxy.example.com/v1',
        ANTHROPIC_AUTH_TOKEN: 'sk-proxy-456',
        ANTHROPIC_MODEL: 'default',
      },
    });
  });

  test('should handle empty baseUrl during migration', () => {
    const v1Config: ConfigFileV1 = {
      providers: [
        {
          name: 'default',
          baseUrl: '',
          authToken: 'sk-test-123',
          description: 'Default config',
        },
      ],
      currentIndex: 0,
    };

    const migratedConfig = ConfigMigration.migrateV1ToV2(v1Config);

    expect(migratedConfig.providers[0].env.ANTHROPIC_BASE_URL).toBeUndefined();
    expect(migratedConfig.providers[0].env.ANTHROPIC_AUTH_TOKEN).toBe('sk-test-123');
    expect(migratedConfig.providers[0].env.ANTHROPIC_MODEL).toBe('default');
  });

  test('should validate v2 config structure correctly', () => {
    const validV2Config: ConfigFileV2 = {
      version: 'v2',
      providers: [
        {
          name: 'test',
          description: 'Test config',
          env: {
            ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
            ANTHROPIC_AUTH_TOKEN: 'sk-test-123',
            ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
          },
        },
      ],
      currentIndex: 0,
    };

    expect(ConfigMigration.validateV2Config(validV2Config)).toBe(true);
  });

  test('should invalidate malformed v2 config', () => {
    const invalidV2Config = {
      version: 'v2',
      providers: [
        {
          name: 'test',
          // missing description
          env: {
            ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
            // missing ANTHROPIC_AUTH_TOKEN
          },
        },
      ],
      currentIndex: 0,
    } as ConfigFileV2;

    expect(ConfigMigration.validateV2Config(invalidV2Config)).toBe(false);
  });

  test('should perform automatic migration correctly', () => {
    const v1Config: ConfigFileV1 = {
      providers: [
        {
          name: 'test',
          baseUrl: 'https://api.anthropic.com',
          authToken: 'sk-test-123',
          description: 'Test config',
        },
      ],
      currentIndex: 0,
    };

    const { config, result } = ConfigMigration.migrate(v1Config);

    expect(result.migrated).toBe(true);
    expect(result.fromVersion).toBe('v1');
    expect(result.toVersion).toBe('v2');
    expect(config.version).toBe('v2');
  });

  test('should not migrate already v2 config', () => {
    const v2Config: ConfigFileV2 = {
      version: 'v2',
      providers: [
        {
          name: 'test',
          description: 'Test config',
          env: {
            ANTHROPIC_AUTH_TOKEN: 'sk-test-123',
          },
        },
      ],
      currentIndex: 0,
    };

    const { config, result } = ConfigMigration.migrate(v2Config);

    expect(result.migrated).toBe(false);
    expect(result.toVersion).toBe('v2');
    expect(config).toBe(v2Config); // Should return same object
  });
});
