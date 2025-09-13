# auo

[![CI/CD](https://github.com/millylee/auo/actions/workflows/ci.yml/badge.svg)](https://github.com/millylee/auo/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/millylee/auo/branch/main/graph/badge.svg)](https://codecov.io/gh/millylee/auo)
[![npm version](https://badge.fury.io/js/auo.svg)](https://badge.fury.io/js/auo)
[![License: BSD 2-Clause](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://opensource.org/license/bsd-2-clause)

让 Claude Code 更易用，支持多配置切换和环境变量管理。非常适合有多个类似 [Any Router](https://github.com/millylee/anyrouter-check-in) 中转站的场景，某账号有问题切成另一个账号后使用 `/resume` 继续对话。

**主要特性:**

- 🔄 **多配置切换**: 轻松在不同API端点和认证之间切换
- 🔧 **环境变量管理**: 支持 ANTHROPIC_BASE_URL、ANTHROPIC_AUTH_TOKEN、ANTHROPIC_MODEL
- ⚡ **自动升级**: 配置格式自动升级，无需手动干预
- 🛡️ **向后兼容**: 完全兼容旧版本配置格式

## 前置要求

- Node.js >= 18.0.0

## 安装与使用

> 首次使用时会自动判断 claude-code 是否已安装，未安装会先安装。

```bash
# 安装
pnpm i -g auo

# 列出所有配置
auo --list

# 切换到指定索引的配置
auo --use 1

# 删除指定索引的配置
auo --remove 2

# 添加新配置（交互式）
auo --add

# 查看配置文件路径
auo --config-path

# 正常使用 Claude，自动使用当前选中的配置中的所有环境变量设置
auo "帮我写代码"
```

## 配置示例

配置文件会自动从旧格式升级到新格式。手动编辑配置文件 `~/.auo/config.json` 不推荐，建议使用 `auo --add` 命令。模型别名参考官方链接 [model-aliases](https://docs.anthropic.com/en/docs/claude-code/model-config#model-aliases)，比如使用 `sonnet[1m]` 可以使用最新的百万上下文。

**最新格式 (v2):**

```json
{
  "version": "v2",
  "providers": [
    {
      "name": "default",
      "description": "官方 Anthropic API",
      "env": {
        "ANTHROPIC_BASE_URL": "",
        "ANTHROPIC_AUTH_TOKEN": "your-anthropic-token",
        "ANTHROPIC_MODEL": "default"
      }
    },
    {
      "name": "custom-proxy",
      "description": "自定义代理服务器",
      "env": {
        "ANTHROPIC_BASE_URL": "https://your-proxy-server.com/v1",
        "ANTHROPIC_AUTH_TOKEN": "your-proxy-token",
        "ANTHROPIC_MODEL": "claude-3-5-sonnet-20241022"
      }
    },
    {
      "name": "local-dev",
      "description": "本地开发环境",
      "env": {
        "ANTHROPIC_BASE_URL": "http://localhost:8000",
        "ANTHROPIC_AUTH_TOKEN": "dev-token",
        "ANTHROPIC_MODEL": "default"
      }
    }
  ],
  "currentIndex": 0
}
```

**旧格式 (v1) - 自动升级:**

```json
{
  "providers": [
    {
      "name": "default",
      "baseUrl": "",
      "authToken": "your-anthropic-token",
      "description": "官方 Anthropic API"
    }
  ],
  "currentIndex": 0
}
```

> **注意**: 旧格式配置会在首次使用时自动升级到新格式，无需手动操作。

## 开发指南

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

### 项目结构

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

## 构建和发布

### 发布流程

1. 更新版本号：`pnpm version [major|minor|patch]`
2. 推送标签：`git push --tags`
3. GitHub Actions 自动构建和发布

## 贡献指南

1. Fork 这个仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
