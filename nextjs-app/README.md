# 家庭资产管理系统

基于 Next.js 15 的家庭资产管理全栈应用。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js v5
- **UI**: shadcn/ui + TailwindCSS
- **状态管理**: Zustand
- **部署**: Vercel

## 开始使用

### 环境要求

- Node.js 18+
- PostgreSQL 数据库

### 安装依赖

```bash
npm install
```

### 环境变量

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

配置环境变量:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/family_assets"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 数据库设置

生成 Prisma Client:

```bash
npm run db:generate
```

推送数据库 schema:

```bash
npm run db:push
```

（可选）填充初始数据:

```bash
npm run db:seed
```

### 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

默认账户: `admin@example.com` / `admin123`

## 数据库命令

```bash
npm run db:generate    # 生成 Prisma Client
npm run db:push       # 推送 schema 到数据库
npm run db:migrate    # 运行数据库迁移
npm run db:seed       # 填充初始数据
npm run db:studio     # 打开 Prisma Studio
```

## 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API 路由
│   ├── dashboard/      # 仪表盘页面
│   ├── assets/         # 资产管理页面
│   ├── settings/       # 设置页面
│   └── auth/           # 认证页面
├── components/         # React 组件
│   └── ui/             # shadcn/ui 组件
├── lib/               # 工具函数
│   ├── prisma.ts      # Prisma 客户端
│   ├── auth.ts        # NextAuth 配置
│   └── permissions.ts # 权限工具
└── store/             # Zustand 状态管理
```

## 部署到 Vercel

### 1. 创建 Vercel Postgres 数据库

在 Vercel 项目中添加 **Vercel Postgres** 存储资源。

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量:

```
DATABASE_URL = [自动从 Vercel Postgres 获取]
NEXTAUTH_URL = https://your-domain.vercel.app
NEXTAUTH_SECRET = [生成随机字符串]
```

生成 NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

### 3. 部署

```bash
vercel deploy
```

或连接 GitHub 仓库自动部署。

### 4. 首次部署后运行数据库迁移

在 Vercel 项目中运行:

```bash
npx prisma db push --skip-generate
```

## API 端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/signin` - 登录 (NextAuth)
- `GET /api/auth/profile` - 获取用户信息

### 家庭管理
- `GET /api/families` - 获取家庭列表
- `POST /api/families` - 创建家庭
- `GET /api/families/[id]` - 获取家庭详情
- `PUT /api/families/[id]` - 更新家庭
- `DELETE /api/families/[id]` - 删除家庭
- `POST /api/families/join/[inviteCode]` - 通过邀请码加入
- `POST /api/families/[id]/switch` - 切换当前家庭
- `POST /api/families/[id]/regenerate-invite-code` - 重新生成邀请码
- `POST /api/families/[id]/members` - 添加成员
- `DELETE /api/families/[id]/members/[userId]` - 移除成员
- `PUT /api/families/[id]/members/[userId]/role` - 更新成员角色

### 资产管理
- `GET /api/assets` - 获取资产列表
- `POST /api/assets` - 创建资产
- `GET /api/assets/[id]` - 获取资产详情
- `PATCH /api/assets/[id]` - 更新资产
- `DELETE /api/assets/[id]` - 删除资产
- `GET /api/assets/[id]/changes` - 获取资产变动记录
- `GET /api/assets/categories` - 获取资产分类
- `POST /api/assets/categories` - 创建资产分类

### 交易管理
- `GET /api/transactions` - 获取交易列表
- `POST /api/transactions` - 创建交易
- `GET /api/transactions/[id]` - 获取交易详情
- `PATCH /api/transactions/[id]` - 更新交易
- `DELETE /api/transactions/[id]` - 删除交易
- `GET /api/transactions/statistics` - 获取交易统计
- `GET /api/transactions/categories` - 获取交易分类
- `POST /api/transactions/categories` - 创建交易分类

## 许可证

MIT
