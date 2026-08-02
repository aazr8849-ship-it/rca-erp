# RCA6.0 ERP - 汽配外贸企业资源计划系统

基于 **「用Trae从零搭建ERP系统（完整版）」** 教程搭建的可部署前端系统。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4 + shadcn/ui
- **图表**: Recharts
- **表单**: react-hook-form + zod
- **状态管理**: Zustand (持久化到 localStorage)
- **图标**: lucide-react
- **通知**: sonner

## 功能模块（14个）

| 模块 | 路径 | 功能 |
|------|------|------|
| 工作台 | `/` | KPI 卡片、订单趋势图、客户分布饼图、待办提醒 |
| 客户管理 | `/customers` | 客户 CRUD、等级管理、关联询盘/报价/订单 |
| 供应商管理 | `/suppliers` | 供应商 CRUD、星级评分、品类标签 |
| 产品管理 | `/products` | 产品 CRUD、OEM 精确搜索、分类筛选 |
| 询盘管理 | `/inquiries` | 询盘状态机、转报价单 |
| 报价管理 | `/quotations` | 报价定价、发送客户、接受转订单 |
| 订单管理 | `/orders` | 5 节点状态机、库存副作用、状态时间轴 |
| 采购管理 | `/purchases` | 请购单 + 采购订单双 Tab、审批流 |
| 库存管理 | `/inventory` | 库存查询、入库/出库流水、冻结/解冻/调整 |
| 发货计划 | `/shipments` | 发货单管理、运输方式、运单追踪 |
| 财务管理 | `/finance` | 应收/应付账款、收款/付款操作 |
| 单证管理 | `/documents` | 商业发票、装箱单等单证生成 |
| 操作日志 | `/audit-logs` | 全模块审计日志、数据变更对比 |
| 系统设置 | `/settings` | 公司信息、汇率、业务规则 |

## 设计规范

- 主色：`#3298cb` (蓝色)
- 侧边栏背景：`#364e5b` (深蓝灰)
- 表头背景：`#364e5b` 白色文字
- 表格奇偶行：白色 / `#eeeff0`
- 表格悬停：`#eaf4fa`

## 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@rca-erp.com | admin123 |
| 销售 | sales@rca-erp.com | sales123 |
| 采购 | purchaser@rca-erp.com | purchase123 |
| 仓管 | warehouse@rca-erp.com | warehouse123 |
| 财务 | finance@rca-erp.com | finance123 |

## 本地开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev
# 访问 http://localhost:3000

# 构建生产版本
bun run build

# 启动生产服务器
bun run start
```

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. Vercel 会自动识别 Next.js 项目并配置构建
4. 点击 "Deploy"，等待 2-3 分钟即可访问

**无需配置任何环境变量** - 系统使用 Mock 数据，开箱即用。

## 数据存储

所有数据使用 zustand store 管理并持久化到浏览器 localStorage（key: `rca-erp-store`）。

- 首次访问会自动加载种子数据（5 个客户、3 个供应商、10 个产品、5 个询盘、3 个报价、3 个订单等）
- 在「系统设置」页面可以一键重置数据
- 清除浏览器 localStorage 即可恢复初始状态

## 业务流程

### 询盘 → 报价 → 订单 全流程

1. **创建询盘** (`/inquiries`) - 客户询价
2. **转报价单** - 在询盘详情页点击「转为报价单」按钮
3. **报价定价** (`/quotations/[id]`) - 在报价详情页填写单价后「标记已定价」
4. **发送客户** - 「发送给客户」按钮
5. **客户接受** - 「客户接受」按钮自动生成订单
6. **订单状态机** (`/orders/[id]`):
   - pending → confirmed（冻结库存 + 生成应收账款）
   - confirmed → producing（开始生产）
   - producing → shipped（扣减库存）
   - shipped → completed（订单完成）
   - 任意状态 → cancelled（释放冻结 + 取消关联）

### 采购全流程

1. 订单确认后系统自动生成请购单
2. 请购单审批（`/purchases` - 请购单 Tab）
3. 转采购订单
4. 采购订单：pending → approved → sent → arrived → warehoused → paid
5. 入库自动增加库存，付款自动生成应付账款

## 文件结构

```
src/
├── app/
│   ├── (dashboard)/          # 受保护路由组（需登录）
│   │   ├── layout.tsx        # 共享布局（Sidebar + Header）
│   │   ├── page.tsx          # 工作台
│   │   ├── customers/        # 客户管理
│   │   ├── suppliers/        # 供应商管理
│   │   ├── products/         # 产品管理
│   │   ├── inquiries/        # 询盘管理
│   │   ├── quotations/       # 报价管理
│   │   ├── orders/           # 订单管理
│   │   ├── purchases/        # 采购管理
│   │   ├── inventory/        # 库存管理
│   │   ├── shipments/        # 发货管理
│   │   ├── finance/          # 财务管理
│   │   ├── documents/        # 单证管理
│   │   ├── audit-logs/       # 操作日志
│   │   └── settings/         # 系统设置
│   ├── login/                # 登录页
│   ├── layout.tsx            # 根布局
│   └── globals.css           # 全局样式
├── components/
│   ├── common/               # 通用组件
│   │   ├── data-table.tsx
│   │   ├── status-badge.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── page-header.tsx
│   │   ├── filter-bar.tsx
│   │   ├── search-input.tsx
│   │   ├── empty-state.tsx
│   │   └── info-card.tsx
│   ├── layout/
│   │   ├── sidebar.tsx       # 14 项侧边栏
│   │   └── header.tsx        # 顶栏（搜索/通知/用户）
│   ├── orders/
│   │   └── order-status-timeline.tsx
│   └── ui/                   # shadcn/ui 组件
└── lib/
    ├── types.ts              # TypeScript 类型定义
    ├── utils.ts              # 工具函数
    └── store.ts              # Zustand 状态管理
```

## 后续扩展方向

如果要接入真实后端（如教程所述的 Supabase）：

1. 创建 Supabase 项目，执行 SQL 建表（参考教程第 3 章）
2. 替换 `src/lib/store.ts` 中的 Mock 数据为 Supabase 客户端调用
3. 创建 `src/lib/supabase/client.ts`、`server.ts`、`admin.ts`
4. 添加 `src/middleware.ts` 做 Supabase Auth 认证
5. 将 `useStore` 的 state 操作改为 API 调用 + React Query 缓存

教程中的所有 SQL、API Routes、组件代码均可作为参考。

## License

MIT - 仅用于学习演示
