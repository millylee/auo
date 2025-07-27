import { describe, it, expect, vi } from 'vitest';
import { checkClaudeCode, installClaudeCode } from '../../src/utils/claude';

// Mock child_process
vi.mock('child_process');

describe('Claude Utils', () => {
  describe('checkClaudeCode', () => {
    it('should check if Claude Code is installed', () => {
      expect(checkClaudeCode).toBeDefined();
    });
  });

  describe('installClaudeCode', () => {
    it('should install Claude Code', () => {
      expect(installClaudeCode).toBeDefined();
    });
  });
});