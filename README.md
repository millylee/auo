# AUO - Claude Code Wrapper CLI

[![CI/CD](https://github.com/millylee/auo/actions/workflows/ci.yml/badge.svg)](https://github.com/millylee/auo/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/millylee/auo/branch/main/graph/badge.svg)](https://codecov.io/gh/millylee/auo)
[![npm version](https://badge.fury.io/js/auo.svg)](https://badge.fury.io/js/auo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

用于增强 Claude Code 的配置管理和使用体验。

## 📋 前置要求

- Node.js >= 18.0.0

## 配置示例

可以手动编辑配置文件 `~/.auo/config.json`：

```json
{
  "providers": [
    {
      "name": "default",
      "baseUrl": "",
      "authToken": "your-anthropic-token",
      "description": "官方 Anthropic API"
    },
    {
      "name": "custom-proxy",
      "baseUrl": "https://your-proxy-server.com/v1",
      "authToken": "your-proxy-token",
      "description": "自定义代理服务器"
    },
    {
      "name": "local-dev",
      "baseUrl": "http://localhost:8000",
      "authToken": "dev-token",
      "description": "本地开发环境"
    }
  ],
  "currentIndex": 0
}
```

## 使用方法

1. **列出所有配置**：
   ```bash
   auo --list
   ```

2. **切换到下一个配置**：
   ```bash
   auo --next
   ```

3. **添加新配置**（交互式）：
   ```bash
   auo --add
   ```

4. **查看配置文件路径**：
   ```bash
   auo --config-path
   ```

5. **正常使用 Claude**：
   ```bash
   auo "帮我写代码"
   ```
   会自动使用当前选中的配置中的 baseUrl 和 authToken

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
# 开发模式（监视文件变化）
pnpm run dev

# 类型检查
pnpm run type-check

# 运行测试
pnpm run test

# 运行测试（监视模式）
pnpm run test:watch

# 运行测试并生成覆盖率报告
pnpm run test:coverage
```

### 代码质量

```bash
# 运行 ESLint 检查
pnpm run lint

# 自动修复 ESLint 问题
pnpm run lint:fix

# 代码格式化
pnpm run format

# 检查代码格式
pnpm run format:check
```

### 构建

```bash
# 构建生产版本
pnpm run build

# 清理构建产物
pnpm run clean
```

## 📁 项目结构

```
auo/
├── src/                          # TypeScript 源代码
│   ├── cli/                      # CLI 相关模块
│   │   ├── index.ts             # CLI 入口点
│   │   └── commands.ts          # 命令处理逻辑
│   ├── config/                   # 配置管理模块
│   │   ├── index.ts             # 配置模块入口
│   │   ├── manager.ts           # 配置管理器
│   │   └── types.ts             # 配置相关类型
│   ├── utils/                    # 工具函数模块
│   │   ├── claude.ts            # Claude Code 相关工具
│   │   ├── system.ts            # 系统相关工具
│   │   └── index.ts             # 工具模块入口
│   ├── types/                    # 全局类型定义
│   │   └── index.ts             # 类型定义入口
│   └── index.ts                 # 主入口文件
├── tests/                        # 测试文件
│   ├── cli/                      # CLI 模块测试
│   ├── config/                   # 配置模块测试
│   └── utils/                    # 工具函数测试
├── dist/                         # 构建输出
├── coverage/                     # 测试覆盖率报告
├── .github/                      # GitHub Actions 配置
├── .husky/                       # Git 钩子配置
├── bin/                          # 可执行文件
├── scripts/                      # 项目脚本
├── eslint.config.js             # ESLint 配置
├── .prettierrc                   # Prettier 配置
├── vite.config.ts               # Vite 配置
├── vitest.config.ts             # Vitest 配置
├── tsconfig.json                # TypeScript 配置
└── package.json                 # 包配置
```

## 🔧 开发指南

### Git 工作流

项目使用 Husky 和 lint-staged 来确保代码质量：

- **pre-commit**: 自动运行 ESLint、Prettier 和相关测试
- **commit-msg**: 可选的提交消息格式检查

### 代码规范

- 使用 ESLint 9 的扁平化配置
- Prettier 进行代码格式化
- 严格的 TypeScript 类型检查
- 测试覆盖率要求 ≥ 80%

### 测试策略

- 单元测试：使用 Vitest
- 覆盖率报告：使用 v8 provider
- 测试环境：Node.js 环境
- Mock 支持：自动重置和清理

## 📦 构建和发布

### 构建配置

- **目标环境**: Node.js 18+
- **输出格式**: ESM (`.mjs`) 和 CommonJS (`.cjs`)
- **类型定义**: 自动生成 `.d.ts` 文件
- **Source Maps**: 包含调试信息

### 发布流程

1. 更新版本号：`pnpm version [major|minor|patch]`
2. 推送标签：`git push --tags`
3. GitHub Actions 自动构建和发布

## 🤝 贡献指南

1. Fork 这个仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`