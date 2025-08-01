import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseArgs, showHelp, setupEnvironment } from '../../src/cli/commands';
import type { ConfigItem } from '../../src/types';

describe('CLI Command Parsing', () => {
  it('should correctly parse help parameters', () => {
    const result = parseArgs(['--help']);
    expect(result.help).toBe(true);

    const result2 = parseArgs(['-h']);
    expect(result2.help).toBe(true);
  });

  it('should correctly parse version parameters', () => {
    const result = parseArgs(['--version']);
    expect(result.version).toBe(true);

    const result2 = parseArgs(['-v']);
    expect(result2.version).toBe(true);
  });

  it('should correctly parse list configs parameter', () => {
    const result = parseArgs(['--list']);
    expect(result.listConfigs).toBe(true);
  });

  it('should correctly parse use config parameter with index', () => {
    const result = parseArgs(['--use', '1']);
    expect(result.useIndex).toBe(1);
  });

  it('should correctly parse remove config parameter with index', () => {
    const result = parseArgs(['--remove', '2']);
    expect(result.removeIndex).toBe(2);
  });

  it('should ignore invalid use index', () => {
    const result = parseArgs(['--use', 'invalid']);
    expect(result.useIndex).toBeUndefined();
  });

  it('should ignore missing use index', () => {
    const result = parseArgs(['--use']);
    expect(result.useIndex).toBeUndefined();
  });

  it('should correctly parse add config parameter', () => {
    const result = parseArgs(['--add']);
    expect(result.addConfig).toBe(true);
  });

  it('should correctly parse config path parameter', () => {
    const result = parseArgs(['--config-path']);
    expect(result.configPath).toBe(true);
  });

  it('should correctly parse multiple parameters', () => {
    const result = parseArgs(['--help', '--use', '1', '--list']);
    expect(result.help).toBe(true);
    expect(result.useIndex).toBe(1);
    expect(result.listConfigs).toBe(true);
  });

  it('should correctly parse use config parameter with index', () => {
    const result = parseArgs(['--use', '1']);
    expect(result.useIndex).toBe(1);
  });

  it('should correctly parse remove config parameter with index', () => {
    const result = parseArgs(['--remove', '2']);
    expect(result.removeIndex).toBe(2);
  });

  it('should ignore invalid use index', () => {
    const result = parseArgs(['--use', 'invalid']);
    expect(result.useIndex).toBeUndefined();
  });

  it('should ignore missing use index', () => {
    const result = parseArgs(['--use']);
    expect(result.useIndex).toBeUndefined();
  });
});

describe('CLI Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showHelp', () => {
    it('should display help information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showHelp();

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('auo');
      expect(consoleSpy.mock.calls[0][0]).toContain('Usage');

      consoleSpy.mockRestore();
    });
  });

  describe('setupEnvironment', () => {
    it('should correctly set environment variables', () => {
      const config: ConfigItem = {
        name: 'test',
        baseUrl: 'https://api.example.com',
        authToken: 'test-token',
        description: 'Test configuration',
      };

      const env = setupEnvironment(config);

      expect(env.ANTHROPIC_BASE_URL).toBe('https://api.example.com');
      expect(env.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
    });

    it('should handle empty baseUrl', () => {
      const config: ConfigItem = {
        name: 'test',
        baseUrl: '',
        authToken: 'test-token',
        description: 'Test configuration',
      };

      const env = setupEnvironment(config);

      expect(env.ANTHROPIC_BASE_URL).toBeUndefined();
      expect(env.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
    });

    it('should handle empty authToken', () => {
      const config: ConfigItem = {
        name: 'test',
        baseUrl: 'https://api.example.com',
        authToken: '',
        description: 'Test configuration',
      };

      const env = setupEnvironment(config);

      expect(env.ANTHROPIC_BASE_URL).toBe('https://api.example.com');
      expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    });

    it('should handle completely empty configuration', () => {
      const config: ConfigItem = {
        name: 'test',
        baseUrl: '',
        authToken: '',
        description: 'Test configuration',
      };

      const env = setupEnvironment(config);

      expect(env.ANTHROPIC_BASE_URL).toBeUndefined();
      expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    });
  });
});
