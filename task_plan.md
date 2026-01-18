# Task Plan: Next.js Migration
# Next.js 迁移计划

## Goal
将家庭资产管理系统从 Vue 3 + NestJS 前后端分离架构迁移到 Next.js 15 全栈架构，实现单一 Vercel 部署。

## Current Phase
**完成** 🎉

## Phases

### Phase 1: 项目初始化与基础配置
- [x] 创建 Next.js 15 项目 (App Router)
- [x] 配置 TypeScript, ESLint, TailwindCSS
- [x] 集成 shadcn/ui 组件库
- [x] 配置项目目录结构
- [x] 设置环境变量
- **Status:** complete

### Phase 2: 数据库层迁移 (TypeORM → Prisma)
- [x] 安装 Prisma CLI 和 Client
- [x] 定义 Prisma Schema (所有实体)
- [x] 创建数据库连接
- [x] 生成 Prisma Client
- [x] 编写数据迁移脚本
- **Status:** complete

### Phase 3: 认证系统 (NextAuth.js v5)
- [x] 安装 NextAuth.js v5
- [x] 配置 JWT 策略
- [x] 实现登录/注册 API
- [x] 实现 Family Context 处理
- [x] 权限中间件
- **Status:** complete

### Phase 4: API Routes 迁移
- [x] Auth API (3个端点)
- [x] Families API (11个端点)
- [x] Assets API (7个端点)
- [x] Transactions API (7个端点)
- **Status:** complete

### Phase 5: 前端页面迁移 (Vue → React)
- [x] 布局组件 (Layout, Header, Sidebar)
- [x] Dashboard 页面
- [x] Assets 页面
- [x] Settings 页面
- [x] 登录/注册页面
- [x] Zustand 状态管理
- **Status:** complete

### Phase 6: UI 组件迁移
- [x] shadcn/ui 组件集成
- [x] 表单组件
- [x] 表格组件
- [x] 对话框组件
- **Status:** complete

### Phase 7: 状态管理重构
- [x] Zustand 实现
- [x] API 调用层
- **Status:** complete

### Phase 8: 测试与部署
- [x] Vercel 部署配置
- [x] 环境变量配置
- [x] 文档完善
- **Status:** complete

## Summary

| 指标 | 数量 |
|------|------|
| API 端点 | 28 个 |
| 数据库模型 | 8 个 |
| 页面 | 5 个 |
| UI 组件 | 15+ 个 |
| 代码行数 | ~5000 行 |

## Key Decisions
| Decision | Rationale |
|----------|-----------|
| Next.js 15 with App Router | 最新稳定版本，支持 RSC |
| Prisma ORM | TypeScript 优先，与 Next.js 深度集成 |
| shadcn/ui | 可定制，基于 Radix UI 和 TailwindCSS |
| NextAuth.js v5 | 行业标准，支持多种认证策略 |
| Vercel Postgres | 与 Vercel 部署无缝集成 |
| Prisma 6 instead of 7 | Prisma 7 配置格式变化较大，Prisma 6 更稳定 |
| Zustand for state | 轻量级，类似 Pinia，支持持久化 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Prisma 7 directUrl error | 1 | 降级到 Prisma 6 |
| TransactionCategory self-relation error | 1 | 修复 family 关系指向 Family 而不是自身 |

## 部署步骤

1. 连接 GitHub 仓库到 Vercel
2. 添加 Vercel Postgres 数据库
3. 配置环境变量 (NEXTAUTH_SECRET, NEXTAUTH_URL)
4. 运行 `npx prisma db push --skip-generate`
5. 访问部署的 URL
