# Findings & Decisions
# 调研发现与决策记录

## Requirements
<!-- 用户需求 -->
- 迁移到 Next.js 单一应用架构
- 简化部署流程（单一 Vercel 部署）
- 保持现有功能完整

## Research Findings
<!-- 调研发现 -->
- Next.js 15 支持 App Router 和 Server Components
- Prisma 是 Next.js 生态最推荐的 ORM
- NextAuth.js v5 (Auth.js) 支持多种认证策略
- shadcn/ui 是当前最流行的 Next.js UI 组件库

## Database Schema (From TypeORM Entities)

### User (users)
- id: UUID (PK)
- email: string (unique)
- password: string
- name: string
- role: enum (admin, editor, viewer)
- familyId: UUID (nullable)
- createdAt, updatedAt

### Family (families)
- id: UUID (PK)
- name: string
- description: string (nullable)
- createdBy: string
- inviteCode: string (nullable)
- createdAt, updatedAt

### FamilyMember (family_members)
- id: UUID (PK)
- familyId: UUID (FK → families, CASCADE)
- userId: UUID (FK → users, CASCADE)
- role: enum (owner, admin, member, viewer)
- invitedBy: string (nullable)
- createdAt, updatedAt

### AssetCategory (asset_categories)
- id: UUID (PK)
- name: string
- parentId: UUID (nullable, self-ref)
- familyId: UUID (FK)
- icon: string
- color: string
- isBuiltin: boolean
- order: number
- createdAt, updatedAt

### Asset (assets)
- id: UUID (PK)
- name: string
- categoryId: UUID (FK)
- familyId: UUID (FK)
- holderId: UUID (FK → users)
- initialValue: decimal(12,2)
- currentValue: decimal(12,2)
- currency: string (default: CNY)
- purchaseDate: Date
- status: enum (active, disposed, pending)
- attributes: JSON (nullable)
- notes: string (nullable)
- createdAt, updatedAt

### AssetChange (asset_changes)
- id: UUID (PK)
- assetId: UUID (FK → assets, CASCADE)
- type: enum (buy, sell, transfer_in, transfer_out, valuation_adjust, depreciation)
- amount: decimal(12,2)
- beforeValue: decimal(12,2)
- afterValue: decimal(12,2)
- profitLoss: decimal(12,2) (nullable) - **NEW** (from frontend types)
- profitLossRate: decimal(5,2) (nullable) - **NEW** (from frontend types)
- relatedTransactionId: UUID (nullable)
- relatedAssetId: UUID (nullable)
- date: Date
- notes: string (nullable)
- createdAt, updatedAt

### TransactionCategory (transaction_categories)
- id: UUID (PK)
- name: string
- type: enum (income, expense)
- familyId: UUID (FK)
- parentId: UUID (nullable, self-ref)
- icon: string
- color: string
- isBuiltin: boolean
- order: number
- createdAt, updatedAt

### Transaction (transactions)
- id: UUID (PK)
- type: enum (income, expense, transfer)
- amount: decimal(12,2)
- categoryId: UUID (FK)
- accountId: UUID (FK)
- familyId: UUID (FK)
- memberId: UUID (FK → users)
- date: Date
- notes: string (nullable)
- tags: string[] (nullable)
- relatedAssetId: UUID (nullable)
- createdAt, updatedAt

## Technical Decisions
<!-- 技术决策 -->
| Decision | Rationale |
|----------|-----------|
| Next.js 15 with App Router | 最新稳定版本，支持 RSC，更好的性能 |
| Prisma ORM | TypeScript 原生支持，类型安全 |
| shadcn/ui | 基于 Radix UI + TailwindCSS，完全可定制 |
| NextAuth.js v5 | 认证标准，支持 JWT 和 OAuth |
| Vercel Postgres | 托管数据库，零配置 |
| TailwindCSS | 与 shadcn/ui 配合，快速开发 |
| React Hook Form + Zod | 表单处理和验证 |
| Zustand | 轻量级状态管理，替代 Pinia |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| | |

## Resources
<!-- 资源链接 -->
- Next.js 15 Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth.js v5: https://authjs.dev
- shadcn/ui: https://ui.shadcn.com
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres

## 现有 API 端点清单
### Auth Module
- POST /auth/login
- POST /auth/register
- GET /auth/profile

### Families Module
- GET /families
- POST /families
- GET /families/:id
- PUT /families/:id
- DELETE /families/:id
- POST /families/:id/members
- DELETE /families/:id/members/:userId
- PUT /families/:id/members/:userId/role
- POST /families/join/:inviteCode
- POST /families/:id/switch
- POST /families/:id/regenerate-invite-code

### Assets Module
- GET /assets
- POST /assets
- GET /assets/:id
- PATCH /assets/:id
- DELETE /assets/:id
- GET /assets/categories/list
- POST /assets/categories
- GET /assets/:id/changes

### Transactions Module
- GET /transactions
- POST /transactions
- GET /transactions/statistics
- GET /transactions/:id
- PATCH /transactions/:id
- DELETE /transactions/:id
- GET /transactions/categories/list
- POST /transactions/categories

## Visual/Browser Findings
<!-- 视觉/浏览器发现 -->

---
*Update this file after every 2 view/browser/search operations*
