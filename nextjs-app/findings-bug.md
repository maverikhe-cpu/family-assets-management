# Bug Report: 创建家庭失败

## 问题描述
在 Vercel 部署后，创建新家庭操作提示"创建失败"

## 根本原因
数据库表不存在。在 Vercel 部署后，Prisma schema 定义的表结构还没有在数据库中创建。

## 诊断过程
1. 查看了 `/api/families` POST 端点代码
2. 代码逻辑正确，问题在于数据库操作
3. Vercel Postgres 数据库是空的，没有表结构

## 解决方案

### 方案 1: 运行 Prisma Push（推荐）
在本地项目目录执行：
```bash
npx prisma db push --skip-generate
```

### 方案 2: 添加初始化 API 端点
创建一个 `/api/db/init` 端点来自动检测数据库状态

## 实施状态
已完成：
1. 创建 `/api/db/init` 端点
   - GET: 检查数据库连接和表是否存在
   - POST: 运行 prisma db push 创建表结构（需要授权）

2. 添加数据库检查到 `/api/families`
   - GET 和 POST 端点都会检查数据库是否已初始化
   - 如果未初始化，返回友好的错误提示

3. 创建 `DatabaseInitAlert` 组件
   - 在前端显示数据库未初始化的警告
   - 提供解决步骤说明
   - 支持暂时忽略（24小时内不再显示）

4. 更新 Store
   - 添加 `dbInitNeeded` 状态
   - `fetchFamilies` 自动检测数据库状态

## 使用说明

### 部署后初始化数据库

**方法 1: 使用 Vercel CLI（推荐）**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 链接项目
vercel link

# 拉取环境变量
vercel env pull .env.local

# 推送数据库结构
npx prisma db push
```

**方法 2: 在本地使用 Vercel 环境变量**
1. 在 Vercel 项目设置中复制 `DATABASE_URL`
2. 在本地创建 `.env` 文件并添加 DATABASE_URL
3. 运行 `npx prisma db push`

**方法 3: 访问健康检查端点**
部署后访问 `https://your-app.vercel.app/api/db/init` 查看数据库状态

## 文件变更
- `src/app/api/db/init/route.ts` - 新增
- `src/app/api/families/route.ts` - 添加数据库检查
- `src/components/database-init-alert.tsx` - 新增
- `src/components/dashboard-layout.tsx` - 添加警告组件
- `src/store/use-store.ts` - 添加 dbInitNeeded 状态
