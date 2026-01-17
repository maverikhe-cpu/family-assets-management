# 家庭资产管理系统

基于 Vue 3 + NestJS 的家庭资产管理系统。

## 项目结构

```
family-assets-management/
├── frontend/          # Vue 3 前端 (Vite + TypeScript + Naive UI)
├── backend/           # NestJS 后端 (TypeScript + PostgreSQL)
├── docker-compose.yml # PostgreSQL 数据库
├── PRD.md            # 产品需求文档
└── README.md         # 本文件
```

## 快速开始

### 1. 启动数据库

```bash
docker-compose up -d
```

### 2. 启动后端

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

后端服务运行在 http://localhost:3000/api

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 http://localhost:5173

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建**: Vite
- **UI 组件**: Naive UI
- **状态管理**: Pinia
- **路由**: Vue Router
- **图表**: Chart.js
- **本地存储**: Dexie (IndexedDB)

### 后端
- **框架**: NestJS
- **数据库**: PostgreSQL + TypeORM
- **认证**: JWT
- **验证**: class-validator

## MVP 功能

- ✅ 资产管理（分类、增删改查）
- ✅ 收支记账
- ✅ 仪表盘（净资产、资产分布）
- ✅ 本地数据存储

## 后续规划

详见 [PRD.md](./PRD.md)

## 开发命令

### 前端
```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run preview      # 预览生产构建
```

### 后端
```bash
npm run start:dev    # 开发服务器
npm run build        # 生产构建
npm run start:prod   # 生产服务器
```
