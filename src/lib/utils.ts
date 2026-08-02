// ============================================================
// 工具函数库
// ============================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 类名合并
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化金额
export function formatCurrency(amount: number, currency: string = "USD"): string {
  const symbols: Record<string, string> = {
    USD: "$",
    CNY: "¥",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbols[currency] || "";
  return `${symbol}${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// 格式化日期
export function formatDate(date: string | Date, format: string = "YYYY-MM-DD"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

// 相对时间
export function formatRelativeTime(date: string | Date): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(d);
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return "刚刚";
}

// 生成业务编码
let codeCounter: Record<string, number> = {};
export function generateCode(prefix: string): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const key = `${prefix}-${dateStr}`;
  codeCounter[key] = (codeCounter[key] || 0) + 1;
  return `${prefix}${dateStr}${String(codeCounter[key]).padStart(4, "0")}`;
}

export function generateFormattedCode(prefix: string): string {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  codeCounter[key] = (codeCounter[key] || 0) + 1;
  return `${prefix}-${year}-${String(codeCounter[key]).padStart(4, "0")}`;
}

// 生成UUID（简易版）
export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 深拷贝
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as any;
  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as any)[key]);
    }
  }
  return cloned;
}

// 获取姓名首字母
export function getInitials(name: string): string {
  if (!name) return "?";
  // 中文取第一个字
  if (/[\u4e00-\u9fa5]/.test(name)) return name.charAt(0);
  // 英文取每个单词首字母
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// 防抖
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// 节流
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

// 状态显示映射
export const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  processing: "处理中",
  confirmed: "已确认",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  rejected: "已拒绝",
  overdue: "已逾期",
  expired: "已过期",
  active: "活跃",
  silent: "沉默",
  lost: "流失",
  draft: "草稿",
  sent: "已发送",
  accepted: "已接受",
  priced: "已定价",
  producing: "生产中",
  blacklisted: "黑名单",
  partial: "部分",
  received: "已收款",
  paid: "已付款",
  partial_arrived: "部分到货",
  arrived: "已到货",
  warehoused: "已入库",
  in_transit: "运输中",
  delivered: "已送达",
  void: "已作废",
  issued: "已签发",
  approved: "已批准",
  converted: "已转换",
  discontinued: "已停产",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

// 状态颜色映射
export const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
> = {
  pending: "secondary",
  processing: "info",
  confirmed: "info",
  shipped: "info",
  completed: "success",
  cancelled: "destructive",
  rejected: "destructive",
  overdue: "destructive",
  expired: "warning",
  active: "success",
  silent: "secondary",
  lost: "destructive",
  draft: "secondary",
  sent: "info",
  accepted: "success",
  priced: "info",
  producing: "info",
  blacklisted: "destructive",
  partial: "warning",
  received: "success",
  paid: "success",
  partial_arrived: "warning",
  arrived: "info",
  warehoused: "success",
  in_transit: "info",
  delivered: "success",
  void: "destructive",
  issued: "success",
  approved: "success",
  converted: "success",
  discontinued: "destructive",
};

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] || "default";
}

// 等级颜色映射
export const LEVEL_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  normal: "secondary",
  vip: "default",
  strategic: "default",
  preferred: "default",
};

// 优先级颜色
export const PRIORITY_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

// 优先级标签
export const PRIORITY_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

// 客户/供应商等级标签
export const LEVEL_LABELS: Record<string, string> = {
  normal: "普通",
  vip: "VIP",
  strategic: "战略",
  preferred: "优选",
};

// 来源标签
export const SOURCE_LABELS: Record<string, string> = {
  email: "邮件",
  phone: "电话",
  exhibition: "展会",
  website: "网站",
  wechat: "微信",
};

// 运输方式标签
export const SHIPPING_METHOD_LABELS: Record<string, string> = {
  sea: "海运",
  air: "空运",
  express: "快递",
  land: "陆运",
};

// 单证类型标签
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  commercial_invoice: "商业发票",
  packing_list: "装箱单",
  bill_of_lading: "提单",
  certificate_of_origin: "原产地证",
  customs_declaration: "报关单",
  insurance: "保险单",
};

// 模块标签
export const MODULE_LABELS: Record<string, string> = {
  customers: "客户管理",
  suppliers: "供应商管理",
  products: "产品管理",
  inquiries: "询盘管理",
  quotations: "报价管理",
  orders: "订单管理",
  purchases: "采购管理",
  inventory: "库存管理",
  shipments: "发货管理",
  finance: "财务管理",
  documents: "单证管理",
  system_settings: "系统设置",
  audit_logs: "操作日志",
};

// 操作类型标签
export const ACTION_LABELS: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
  approve: "审批",
  reject: "拒绝",
  status_change: "状态变更",
};

// 库存操作类型标签
export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  inbound_purchase: "采购入库",
  inbound_adjust_gain: "盘盈入库",
  outbound_sale: "销售出库",
  outbound_adjust_loss: "盘亏出库",
  freeze: "冻结",
  unfreeze: "解冻",
  return_in: "退货入库",
  return_out: "退货出库",
};
