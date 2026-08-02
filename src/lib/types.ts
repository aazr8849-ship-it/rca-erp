// ============================================================
// RCA6.0 ERP - 类型定义
// ============================================================

// 通用基础类型
export type UUID = string;
export type ISODate = string;

// 用户角色
export type UserRole = "admin" | "sales" | "purchaser" | "warehouse" | "finance";

// 通用状态枚举
export type StatusLevel =
  | "pending"
  | "processing"
  | "confirmed"
  | "shipped"
  | "completed"
  | "cancelled"
  | "rejected"
  | "overdue"
  | "expired"
  | "active"
  | "silent"
  | "lost"
  | "draft"
  | "sent"
  | "accepted"
  | "priced"
  | "producing"
  | "blacklisted";

// 用户
export interface User {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status: "active" | "disabled";
  created_at: ISODate;
}

// 客户
export interface Customer {
  id: UUID;
  code: string;
  name: string;
  name_en?: string;
  contact_person: string;
  contact_email?: string;
  contact_phone?: string;
  country: string;
  address?: string;
  website?: string;
  level: "normal" | "vip" | "strategic";
  status: "active" | "silent" | "lost";
  credit_limit: number;
  payment_terms: string;
  preferred_currency: string;
  notes?: string;
  assigned_to?: string;
  created_at: ISODate;
  updated_at: ISODate;
  deleted_at?: ISODate | null;
}

// 供应商
export interface Supplier {
  id: UUID;
  code: string;
  name: string;
  name_en?: string;
  contact_person: string;
  contact_email?: string;
  contact_phone?: string;
  country: string;
  address?: string;
  level: "normal" | "preferred" | "strategic";
  status: "active" | "blacklisted";
  main_category: string[];
  lead_time_days: number;
  quality_rating: number; // 1-5
  payment_terms: string;
  notes?: string;
  created_at: ISODate;
  updated_at: ISODate;
  deleted_at?: ISODate | null;
}

// 产品分类
export interface ProductCategory {
  id: UUID;
  code: string;
  name: string;
  parent_id?: UUID | null;
  sort_order?: number;
}

// 产品
export interface Product {
  id: UUID;
  code: string;
  name: string;
  name_en?: string;
  oem_number?: string;
  category_id?: UUID;
  category_name?: string;
  brand?: string;
  image_urls?: string[];
  cost_price: number;
  sale_price: number;
  unit: string;
  weight_kg?: number;
  status: "active" | "discontinued";
  applicable_models?: string[];
  description?: string;
  created_at: ISODate;
  updated_at: ISODate;
  deleted_at?: ISODate | null;
}

// 询盘
export interface Inquiry {
  id: UUID;
  code: string;
  customer_id: UUID;
  customer_name?: string;
  customer_country?: string;
  subject: string;
  source: "email" | "phone" | "exhibition" | "website" | "wechat";
  priority: "high" | "medium" | "low";
  status: "pending" | "processing" | "quoted" | "closed" | "cancelled";
  items?: InquiryItem[];
  notes?: string;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface InquiryItem {
  id?: UUID;
  inquiry_id?: UUID;
  product_id: UUID;
  product_name?: string;
  oem_number?: string;
  quantity: number;
  unit: string;
  target_price?: number;
  notes?: string;
}

// 报价
export interface Quotation {
  id: UUID;
  code: string;
  customer_id: UUID;
  customer_name?: string;
  inquiry_id?: UUID;
  pricing_status: "pending" | "priced";
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  total_amount: number;
  currency: string;
  valid_until: ISODate;
  trade_terms?: string;
  payment_terms?: string;
  items?: QuotationItem[];
  created_at: ISODate;
  updated_at: ISODate;
}

export interface QuotationItem {
  id?: UUID;
  quotation_id?: UUID;
  product_id: UUID;
  product_name?: string;
  oem_number?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price?: number;
  notes?: string;
}

// 订单
export interface Order {
  id: UUID;
  code: string;
  customer_id: UUID;
  customer_name?: string;
  quotation_id?: UUID;
  order_date: ISODate;
  delivery_date: ISODate;
  currency: string;
  total_amount: number;
  status: "pending" | "confirmed" | "producing" | "shipped" | "completed" | "cancelled";
  trade_terms?: string;
  payment_terms?: string;
  items?: OrderItem[];
  confirmed_at?: ISODate;
  shipped_at?: ISODate;
  completed_at?: ISODate;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface OrderItem {
  id?: UUID;
  order_id?: UUID;
  product_id: UUID;
  product_name?: string;
  oem_number?: string;
  quantity: number;
  shipped_quantity?: number;
  unit: string;
  unit_price: number;
  notes?: string;
}

// 请购单
export interface PurchaseRequest {
  id: UUID;
  code: string;
  order_id?: UUID;
  order_code?: string;
  status: "pending" | "approved" | "rejected" | "converted";
  items?: PurchaseRequestItem[];
  created_at: ISODate;
  updated_at: ISODate;
}

export interface PurchaseRequestItem {
  id?: UUID;
  product_id: UUID;
  product_name?: string;
  quantity: number;
  unit: string;
  notes?: string;
}

// 采购订单
export interface PurchaseOrder {
  id: UUID;
  code: string;
  supplier_id: UUID;
  supplier_name?: string;
  purchase_request_id?: UUID;
  order_date: ISODate;
  currency: string;
  total_amount: number;
  status: "pending" | "approved" | "sent" | "partial_arrived" | "arrived" | "warehoused" | "paid";
  trade_terms?: string;
  payment_terms?: string;
  items?: PurchaseOrderItem[];
  created_at: ISODate;
  updated_at: ISODate;
}

export interface PurchaseOrderItem {
  id?: UUID;
  purchase_order_id?: UUID;
  product_id: UUID;
  product_name?: string;
  quantity: number;
  arrived_quantity?: number;
  warehoused_quantity?: number;
  unit: string;
  unit_price: number;
}

// 仓库
export interface Warehouse {
  id: UUID;
  code: string;
  name: string;
  address?: string;
}

// 库存
export interface Inventory {
  id: UUID;
  product_id: UUID;
  product_name?: string;
  product_code?: string;
  warehouse_id: UUID;
  warehouse_name?: string;
  quantity: number;
  frozen_quantity: number;
  available_quantity: number;
  updated_at: ISODate;
}

// 库存流水
export interface StockMovement {
  id: UUID;
  movement_type:
    | "inbound_purchase"
    | "inbound_adjust_gain"
    | "outbound_sale"
    | "outbound_adjust_loss"
    | "freeze"
    | "unfreeze"
    | "return_in"
    | "return_out";
  product_id: UUID;
  product_name?: string;
  warehouse_id: UUID;
  warehouse_name?: string;
  quantity: number;
  before_quantity?: number;
  after_quantity?: number;
  reference_type?: string;
  reference_id?: UUID;
  notes?: string;
  created_at: ISODate;
}

// 发货单
export interface Shipment {
  id: UUID;
  code: string;
  order_id: UUID;
  order_code?: string;
  customer_name?: string;
  shipment_date: ISODate;
  shipping_method: "sea" | "air" | "express" | "land";
  tracking_number?: string;
  container_number?: string;
  bl_number?: string;
  status: "draft" | "shipped" | "in_transit" | "delivered" | "cancelled";
  total_weight?: number;
  total_cartons?: number;
  items?: ShipmentItem[];
  created_at: ISODate;
}

export interface ShipmentItem {
  id?: UUID;
  shipment_id?: UUID;
  order_item_id?: UUID;
  product_name?: string;
  quantity: number;
  cartons: number;
  weight_kg: number;
}

// 应收/应付
export interface Receivable {
  id: UUID;
  code: string;
  customer_id: UUID;
  customer_name?: string;
  order_id?: UUID;
  order_code?: string;
  category: string;
  amount: number;
  received_amount: number;
  currency: string;
  due_date: ISODate;
  status: "pending" | "partial" | "received" | "overdue" | "cancelled";
  created_at: ISODate;
}

export interface Payable {
  id: UUID;
  code: string;
  supplier_id: UUID;
  supplier_name?: string;
  purchase_order_id?: UUID;
  category: string;
  amount: number;
  paid_amount: number;
  currency: string;
  due_date: ISODate;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  created_at: ISODate;
}

// 单证
export interface Document {
  id: UUID;
  code: string;
  order_id?: UUID;
  order_code?: string;
  shipment_id?: UUID;
  document_type:
    | "commercial_invoice"
    | "packing_list"
    | "bill_of_lading"
    | "certificate_of_origin"
    | "customs_declaration"
    | "insurance";
  status: "draft" | "issued" | "void";
  file_url?: string;
  issued_date?: ISODate;
  notes?: string;
  created_at: ISODate;
}

// 操作日志
export interface AuditLog {
  id: UUID;
  user_id: UUID;
  user_name?: string;
  module: string;
  action: "create" | "update" | "delete" | "approve" | "reject" | "status_change";
  record_id?: UUID;
  record_code?: string;
  before_data?: Record<string, any> | null;
  after_data?: Record<string, any> | null;
  description: string;
  created_at: ISODate;
}

// 系统设置
export interface SystemSettings {
  company_name: string;
  company_name_en: string;
  address: string;
  email: string;
  phone: string;
  default_currency: string;
  default_trade_terms: string;
  default_payment_terms: string;
}

// 汇率
export interface ExchangeRate {
  id: UUID;
  currency: string;
  rate_to_cny: number;
  effective_date: ISODate;
}

// 通知
export interface Notification {
  id: UUID;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: ISODate;
}

// Dashboard 数据
export interface DashboardData {
  kpis: {
    customers_count: number;
    inquiries_count: number;
    quotations_count: number;
    orders_count: number;
    purchase_requests_count: number;
    purchase_orders_count: number;
    shipments_count: number;
    documents_count: number;
  };
  todos: {
    overdue_receivables: { count: number; amount: number };
    overdue_payables: { count: number; amount: number };
    pending_orders: number;
    pending_purchase_requests: number;
    expiring_quotations: number;
  };
  charts: {
    order_trend: { month: string; count: number; amount: number }[];
    customer_distribution: { country: string; count: number }[];
  };
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
