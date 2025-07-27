import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 基础推荐配置
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // Prettier 集成
  prettierConfig,
  
  // 源代码配置
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_' 
        }
      ],
      'no-console': 'off', // CLI 工具需要 console
    },
  },
  
  // 测试文件配置
  {
    files: ['tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.test.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_' 
        }
      ],
      'no-console': 'off',
    },
  },
  
  // 忽略配置
  {
    ignores: [
      'dist/',
      'coverage/',
      'node_modules/',
      '*.js',
      '*.mjs', 
      '*.cjs'
    ],
  }
); 