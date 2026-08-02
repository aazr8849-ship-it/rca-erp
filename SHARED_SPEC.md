# RCA6.0 ERP - 共享规格文档

## 设计规范
- 主色：#3298cb (蓝色)
- 侧边栏背景：#364e5b (深蓝灰)
- 警告色：#c76747 (橙红色)
- 表头背景：#364e5b 白色文字
- 奇偶行：白色 / #eeeff0
- 悬停：#eaf4fa

## 已有的通用组件 (在 src/components/common/ 目录下)
- `PageHeader` - 页面标题组件，支持 actions
- `ActionButton` - 操作按钮，支持 icon="add"|"export"|"import"|"refresh"
- `FilterBar` - 筛选栏容器
- `SearchInput` - 搜索框
- `GenericDataTable` - 泛型表格 (使用方式见 customers/page.tsx)
- `StatusBadge` - 状态标签 (支持 status / type="level" / type="priority")
- `ConfirmDialog` - 确认弹窗
- `EmptyState` - 空状态
- `InfoCard`, `InfoItem` - 信息卡片

## 工具函数 (在 src/lib/utils.ts)
- cn, formatCurrency, formatDate, formatRelativeTime
- generateCode(prefix), generateFormattedCode(prefix), uuid
- getStatusColor, getStatusLabel, LEVEL_LABELS, PRIORITY_LABELS
- SOURCE_LABELS, SHIPPING_METHOD_LABELS, DOCUMENT_TYPE_LABELS
- MODULE_LABELS, ACTION_LABELS, MOVEMENT_TYPE_LABELS

## 状态管理
所有数据在 `src/lib/store.ts` 中的 zustand store
- 读取: `const { customers } = useStore();`
- 修改: `useStore.setState((state) => ({ customers: [...] }))`
- 添加审计日志: `const { addAuditLog } = useStore(); addAuditLog({...})`

## 已实现模块
- src/app/(dashboard)/page.tsx - Dashboard 工作台 (完成)
- src/app/(dashboard)/layout.tsx - 共享布局 (含Sidebar/Header) (完成)
- src/app/(dashboard)/customers/page.tsx - 客户列表 (完成，参考此文件作为模板)
- src/app/(dashboard)/customers/[id]/page.tsx - 客户详情 (完成)
- src/app/login/page.tsx - 登录页 (完成)

## 重要约束
1. 所有页面必须是 "use client" 组件
2. 布局layout.tsx 也必须是 "use client" (Next.js 16 + Turbopack 限制)
3. 路径别名 @/ 指向 src/
4. 文件路径必须在 /home/z/my-project/ 下
5. 不能使用真实数据库，所有数据从 useStore 读取
