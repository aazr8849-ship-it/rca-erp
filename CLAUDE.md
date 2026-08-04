# RCA6.0 ERP - 项目说明（给 AI 助手看）

> 这个文件是给 Claude Code / Cursor / Trae 等 AI 助手看的，帮助 AI 快速理解项目结构，从而准确修改代码。

## 项目概述

RCA6.0 ERP 是一个汽配外贸企业资源计划系统，覆盖客户、产品、询盘、报价、订单、采购、库存、发货、财务、单证等14个核心业务模块。

**线上地址**: https://rca-erp.vercel.app
**技术栈**: Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + Supabase + React Query

## 技术栈

- **框架**: Next.js 16 (App Router, Turbopack)
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4 + shadcn/ui (New York 风格)
- **数据库**: Supabase (PostgreSQL + Auth + Storage)
- **状态管理**: React Query (服务端状态) + Zustand (本地状态/降级方案)
- **图表**: Recharts
- **表单**: react-hook-form + zod
- **图标**: lucide-react
- **通知**: sonner
- **Excel**: xlsx + jszip (支持图片导入导出)

## 项目结构

```
src/
├── app/
│   ├── (dashboard)/          # 受保护路由组（需登录）
│   │   ├── layout.tsx        # 共享布局（Sidebar + Header）
│   │   ├── page.tsx          # 工作台
│   │   ├── customers/        # 客户管理 ✅已对接Supabase
│   │   ├── products/         # 产品管理 ✅已对接Supabase
│   │   ├── suppliers/        # 供应商管理 (Mock)
│   │   ├── inquiries/        # 询盘管理 (Mock)
│   │   ├── quotations/       # 报价管理 (Mock)
│   │   ├── orders/           # 订单管理 (Mock)
│   │   ├── purchases/        # 采购管理 (Mock)
│   │   ├── inventory/        # 库存管理 (Mock)
│   │   ├── shipments/        # 发货管理 (Mock)
│   │   ├── finance/          # 财务管理 (Mock)
│   │   ├── documents/        # 单证管理 (Mock)
│   │   ├── audit-logs/       # 操作日志 (Mock)
│   │   └── settings/         # 系统设置 (Mock)
│   ├── login/                # 登录页 ✅已对接Supabase Auth
│   ├── layout.tsx            # 根布局（含QueryProvider）
│   └── globals.css           # 全局样式
├── components/
│   ├── common/               # 通用组件
│   │   ├── data-table.tsx    # 泛型表格
│   │   ├── status-badge.tsx  # 状态标签
│   │   ├── confirm-dialog.tsx
│   │   ├── import-dialog.tsx # Excel导入弹窗
│   │   └── ...
│   ├── layout/               # 布局组件
│   │   ├── sidebar.tsx       # 14项侧边栏
│   │   └── header.tsx        # 顶栏（搜索/通知/用户）
│   ├── providers/
│   │   └── query-provider.tsx # React Query Provider
│   └── ui/                   # shadcn/ui 组件
├── lib/
│   ├── api/                  # Supabase 数据访问层
│   │   ├── customers.ts      # 客户API ✅
│   │   ├── products.ts       # 产品API ✅
│   │   └── auth.ts           # 认证API ✅
│   ├── supabase/
│   │   ├── client.ts         # 浏览器端客户端
│   │   ├── server.ts         # 服务端客户端
│   │   └── admin.ts          # 管理员客户端（绕过RLS）
│   ├── types.ts              # TypeScript 类型定义
│   ├── utils.ts              # 工具函数
│   ├── store.ts              # Zustand Mock数据存储（降级方案）
│   ├── excel-utils.ts        # Excel导入导出工具
│   └── product-excel.ts      # 产品Excel工具（含图片ZIP）
└── middleware.ts             # 认证中间件 ✅

sql/
└── 001_init_supabase.sql     # 建表SQL + 种子数据
```

## 数据库 Schema

29张表，定义在 `sql/001_init_supabase.sql`：

### 核心表
- `customers` - 客户
- `suppliers` - 供应商
- `products` - 产品（含包装尺寸、图片URL数组）
- `product_categories` - 产品分类（树形）
- `orders` / `order_items` - 订单 + 明细
- `quotations` / `quotation_items` - 报价 + 明细
- `inquiries` / `inquiry_items` - 询盘 + 明细
- `purchase_orders` / `purchase_order_items` - 采购订单
- `purchase_requests` / `purchase_request_items` - 请购单
- `inventory` - 库存
- `stock_movements` - 出入库流水
- `shipments` / `shipment_items` - 发货
- `receivables` / `payables` - 应收/应付
- `documents` - 单证
- `audit_logs` - 审计日志
- `notifications` - 通知
- `system_settings` - 系统配置
- `exchange_rates` - 汇率
- `warehouses` - 仓库

### 所有表的通用字段
- `id` UUID 主键 (gen_random_uuid)
- `code` 业务编码 (唯一)
- `created_at` / `updated_at` 时间戳
- `deleted_at` 软删除标记 (NULL = 未删除)

## 业务编码规则

- 客户: `CU` + YYYYMMDD + 4位序号 (如 CU202608040001)
- 供应商: `SU` + YYYYMMDD + 4位序号
- 产品: `PD` + YYYYMMDD + 4位序号
- 询盘: `IN-` + 年份 + `-` + 4位序号 (如 IN-2026-0001)
- 报价: `QT-` + 年份 + `-` + 4位序号
- 订单: `OD-` + 年份 + `-` + 4位序号
- 采购: `PO-` + 年份 + `-` + 4位序号

## 状态机

### 订单状态机
```
pending → confirmed → producing → shipped → completed
    ↓         ↓           ↓
    └─────────┴───────────┴──→ cancelled
```
- confirmed: 冻结库存 + 生成应收账款
- shipped: 扣减库存
- cancelled: 释放冻结库存

### 询盘状态机
```
pending → processing → quoted → closed
```

### 报价状态机
```
draft → sent → accepted (自动转订单) / rejected / expired
```

### 采购订单状态机
```
pending → approved → sent → partial_arrived/arrived → warehoused → paid
```

## 设计规范

### 配色（Tech Blue Slate 方案）
- 主色: `#38BDF8` (sky blue)
- 主色hover: `#0EA5E9`
- 侧边栏背景: `#0F172A` (slate-900)
- 侧边栏hover: `#1E293B` (slate-800)
- 页面背景: `#F8F6F1` (warm off-white)
- 表头背景: `#0F172A` 白字
- 表格斑马行: `#F8FAFC`
- 表格悬停: `#F1F5F9`
- 辅助色: `#C4654A` (terracotta), `#87A878` (sage), `#E8A87C` (peach)

### CSS变量
在 `src/app/globals.css` 的 `:root` 中定义，使用 Tailwind 的 `bg-primary`、`text-foreground` 等。

## 数据访问模式

### Supabase 优先 + Mock 降级

每个模块的页面都实现了**智能降级**：
1. 检测 Supabase 环境变量是否配置
2. 如果配置了 → 用 React Query + Supabase API
3. 如果没配置或出错 → 自动降级到 Zustand Mock 数据
4. 页面标题会显示 "已连接 Supabase" 或 "Mock 模式"

### 添加新模块的标准流程

1. 在 `src/lib/api/` 创建 `xxx.ts`，实现 CRUD 函数
2. 在页面组件中用 `useQuery` + API 函数替换 `useStore()`
3. 用 `useMutation` 或直接调用 API 替换 `useStore.setState()`
4. 保留 Mock 降级逻辑

```typescript
// 标准模式示例
const supabaseEnabled = useSupabase();
const { data, error } = useQuery({
  queryKey: ["xxx", params],
  queryFn: () => fetchXxx(params),
  enabled: supabaseEnabled,
});
const useMockMode = !supabaseEnabled || !!error;
const displayData = useMockMode ? mockData : (data?.data || []);
```

## 环境变量

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx    # 前端可见
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx              # 仅服务端，保密！
```

⚠️ `NEXT_PUBLIC_SUPABASE_ANON_KEY` 必须是完整的（100+字符），否则会被截断校验拦截。

## 部署

- **平台**: Vercel
- **仓库**: https://github.com/aazr8849-ship-it/rca-erp
- **自动部署**: push 到 main 分支后 Vercel 自动重新部署

## 认证系统

- 使用 Supabase Auth
- 登录页: `/login`
- 认证中间件: `src/middleware.ts` 保护所有 `/dashboard` 路由
- 用户角色: admin / sales / purchaser / warehouse / finance
- 演示账号: admin@rca-erp.com / admin123

## Excel 导入导出

- **导出**: 每个列表页都有"导出Excel"按钮，使用 xlsx 库
- **导入**: 客户/供应商/产品支持导入，使用 ImportDialog 组件
- **产品图片**: 导出为 ZIP 包（Excel + images/文件夹），导入支持 ZIP 还原图片

## 常用命令

```bash
bun run dev       # 开发
bun run build     # 构建
bun run lint      # 检查代码
bun run start     # 生产模式运行
```

## 给 AI 的修改建议

1. **修改数据库结构**: 在 `sql/` 目录创建新的 migration SQL，在 Supabase SQL Editor 执行
2. **添加新模块**: 参照 `customers` 的模式，创建 api 文件 + 页面组件
3. **修改UI**: 保持 Tech Blue Slate 配色，使用 shadcn/ui 组件
4. **添加新功能**: 优先用 React Query + Supabase，保留 Mock 降级
5. **注意**: 所有页面必须是 `"use client"` 组件（Next.js 16 + Turbopack 限制）
6. **类型安全**: 修改类型定义后运行 `bunx tsc --noEmit --skipLibCheck` 检查

## 已知问题

- 其他13个模块仍在 Mock 模式，需要逐步迁移
- RLS 已临时关闭，上线前需重新启用并配置策略
- 产品图片目前存 base64 在数据库，建议迁移到 Supabase Storage
