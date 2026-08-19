// ============================================================
// 角色权限配置
// ============================================================

export type UserRole = "admin" | "sales" | "purchaser" | "warehouse" | "finance";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "管理员",
  sales: "销售",
  purchaser: "采购",
  warehouse: "仓管",
  finance: "财务",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700",
  sales: "bg-blue-100 text-blue-700",
  purchaser: "bg-green-100 text-green-700",
  warehouse: "bg-orange-100 text-orange-700",
  finance: "bg-purple-100 text-purple-700",
};

/**
 * 各角色可访问的模块
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "/", "/customers", "/suppliers", "/products", "/inquiries", "/quotations",
    "/orders", "/purchases", "/inventory", "/shipments", "/finance", "/documents",
    "/audit-logs", "/settings", "/users", "/profile",
  ],
  sales: [
    "/", "/customers", "/products", "/inquiries", "/quotations", "/orders", "/documents", "/profile",
  ],
  purchaser: [
    "/", "/suppliers", "/products", "/purchases", "/inventory", "/profile",
  ],
  warehouse: [
    "/", "/products", "/inventory", "/shipments", "/documents", "/profile",
  ],
  finance: [
    "/", "/orders", "/finance", "/documents", "/profile",
  ],
};

/**
 * 侧边栏导航项配置
 */
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "工作台", path: "/", icon: "LayoutDashboard", roles: ["admin", "sales", "purchaser", "warehouse", "finance"] },
  { label: "客户管理", path: "/customers", icon: "Users", roles: ["admin", "sales"] },
  { label: "供应商管理", path: "/suppliers", icon: "Truck", roles: ["admin", "purchaser"] },
  { label: "产品管理", path: "/products", icon: "Package", roles: ["admin", "sales", "purchaser", "warehouse"] },
  { label: "询盘管理", path: "/inquiries", icon: "MessageSquare", roles: ["admin", "sales"] },
  { label: "报价管理", path: "/quotations", icon: "FileText", roles: ["admin", "sales"] },
  { label: "订单管理", path: "/orders", icon: "ShoppingCart", roles: ["admin", "sales", "finance"] },
  { label: "采购管理", path: "/purchases", icon: "ClipboardList", roles: ["admin", "purchaser"] },
  { label: "库存管理", path: "/inventory", icon: "Warehouse", roles: ["admin", "purchaser", "warehouse"] },
  { label: "发货计划", path: "/shipments", icon: "Ship", roles: ["admin", "warehouse"] },
  { label: "财务管理", path: "/finance", icon: "DollarSign", roles: ["admin", "finance"] },
  { label: "单证管理", path: "/documents", icon: "FolderOpen", roles: ["admin", "sales", "warehouse", "finance"] },
  { label: "操作日志", path: "/audit-logs", icon: "History", roles: ["admin"] },
  { label: "用户管理", path: "/users", icon: "UserCog", roles: ["admin"] },
  { label: "系统设置", path: "/settings", icon: "Settings", roles: ["admin"] },
  { label: "个人信息", path: "/profile", icon: "User", roles: ["admin", "sales", "purchaser", "warehouse", "finance"] },
];

/**
 * 检查角色是否有权限访问某路径
 */
export function hasPermission(role: UserRole, path: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes(path)) return true;
  // 检查子路径（如 /customers/xxx）
  for (const perm of permissions) {
    if (perm !== "/" && path.startsWith(perm + "/")) return true;
  }
  return false;
}

/**
 * 获取角色可见的导航项
 */
export function getVisibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
