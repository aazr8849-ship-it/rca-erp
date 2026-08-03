// ============================================================
// Mock 数据存储 - 使用 zustand 管理内存数据，localStorage 持久化
// ============================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  Customer,
  Supplier,
  Product,
  ProductCategory,
  Inquiry,
  Quotation,
  Order,
  PurchaseRequest,
  PurchaseOrder,
  Warehouse,
  Inventory,
  StockMovement,
  Shipment,
  Receivable,
  Payable,
  Document,
  AuditLog,
  SystemSettings,
  ExchangeRate,
  Notification,
  User,
} from "./types";
import { uuid } from "./utils";

// 当前日期工具
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const daysLater = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
const today = () => new Date().toISOString();

// 种子数据生成
const seedUsers: User[] = [
  { id: "u-admin", email: "admin@rca-erp.com", name: "管理员", role: "admin", status: "active", created_at: daysAgo(180) },
  { id: "u-sales", email: "sales@rca-erp.com", name: "李销售", role: "sales", status: "active", created_at: daysAgo(120) },
  { id: "u-purchaser", email: "purchaser@rca-erp.com", name: "王采购", role: "purchaser", status: "active", created_at: daysAgo(100) },
  { id: "u-warehouse", email: "warehouse@rca-erp.com", name: "张仓管", role: "warehouse", status: "active", created_at: daysAgo(80) },
  { id: "u-finance", email: "finance@rca-erp.com", name: "赵财务", role: "finance", status: "active", created_at: daysAgo(60) },
];

const seedCategories: ProductCategory[] = [
  { id: "cat-1", code: "CAT001", name: "制动系统", parent_id: null, sort_order: 1 },
  { id: "cat-2", code: "CAT002", name: "发动机配件", parent_id: null, sort_order: 2 },
  { id: "cat-3", code: "CAT003", name: "密封件", parent_id: null, sort_order: 3 },
  { id: "cat-4", code: "CAT004", name: "轴承", parent_id: null, sort_order: 4 },
  { id: "cat-5", code: "CAT005", name: "电气系统", parent_id: null, sort_order: 5 },
  { id: "cat-1-1", code: "CAT001-1", name: "刹车片", parent_id: "cat-1", sort_order: 1 },
  { id: "cat-1-2", code: "CAT001-2", name: "刹车盘", parent_id: "cat-1", sort_order: 2 },
];

const seedProducts: Product[] = [
  {
    id: "p-001", code: "PD001", name: "前制动片", name_en: "Front Brake Pad", oem_number: "OEM-TOYOTA-001",
    category_id: "cat-1-1", category_name: "刹车片", brand: "Bosch",
    image_urls: ["https://images.unsplash.com/photo-1614026480209-cf5a8e0a0a8e?w=400&h=400&fit=crop"], cost_price: 35.00, sale_price: 58.00, unit: "套", weight_kg: 1.2, package_length_cm: 25, package_width_cm: 18, package_height_cm: 5,
    status: "active", applicable_models: ["Toyota Camry", "Toyota Corolla"],
    description: "适用于丰田卡罗拉/凯美瑞的前制动片", created_at: daysAgo(90), updated_at: daysAgo(10),
  },
  {
    id: "p-002", code: "PD002", name: "后制动片", name_en: "Rear Brake Pad", oem_number: "OEM-TOYOTA-002",
    category_id: "cat-1-1", category_name: "刹车片", brand: "Bosch",
    image_urls: ["https://images.unsplash.com/photo-1611821065448-6f7d2c5b5b5b?w=400&h=400&fit=crop"], cost_price: 32.00, sale_price: 52.00, unit: "套", weight_kg: 1.0, package_length_cm: 22, package_width_cm: 16, package_height_cm: 4,
    status: "active", applicable_models: ["Toyota Camry"], created_at: daysAgo(85), updated_at: daysAgo(8),
  },
  {
    id: "p-003", code: "PD003", name: "机油滤芯", name_en: "Oil Filter", oem_number: "OEM-HONDA-003",
    category_id: "cat-2", category_name: "发动机配件", brand: "Mann",
    image_urls: ["https://images.unsplash.com/photo-1621697789032-45ad6dba37e2?w=400&h=400&fit=crop"], cost_price: 12.00, sale_price: 22.00, unit: "个", weight_kg: 0.3, package_length_cm: 12, package_width_cm: 8, package_height_cm: 3,
    status: "active", applicable_models: ["Honda Civic", "Honda Accord"],
    created_at: daysAgo(80), updated_at: daysAgo(5),
  },
  {
    id: "p-004", code: "PD004", name: "气门室垫片", name_en: "Valve Cover Gasket", oem_number: "OEM-VW-004",
    category_id: "cat-3", category_name: "密封件", brand: "Elring",
    image_urls: [], cost_price: 18.00, sale_price: 35.00, unit: "个", weight_kg: 0.2, package_length_cm: 15, package_width_cm: 10, package_height_cm: 2,
    status: "active", applicable_models: ["VW Golf", "Audi A4"],
    created_at: daysAgo(75), updated_at: daysAgo(12),
  },
  {
    id: "p-005", code: "PD005", name: "深沟球轴承6203", name_en: "Deep Groove Ball Bearing 6203",
    oem_number: "OEM-SKF-005", category_id: "cat-4", category_name: "轴承", brand: "SKF",
    image_urls: [], cost_price: 8.00, sale_price: 16.00, unit: "个", weight_kg: 0.15, package_length_cm: 8, package_width_cm: 8, package_height_cm: 2,
    status: "active", applicable_models: ["Universal"], created_at: daysAgo(70), updated_at: daysAgo(15),
  },
  {
    id: "p-006", code: "PD006", name: "发电机", name_en: "Alternator", oem_number: "OEM-BOSCH-006",
    category_id: "cat-5", category_name: "电气系统", brand: "Bosch",
    image_urls: [], cost_price: 120.00, sale_price: 195.00, unit: "台", weight_kg: 5.5, package_length_cm: 35, package_width_cm: 25, package_height_cm: 20,
    status: "active", applicable_models: ["BMW 3 Series", "BMW 5 Series"],
    created_at: daysAgo(65), updated_at: daysAgo(20),
  },
  {
    id: "p-007", code: "PD007", name: "刹车盘", name_en: "Brake Disc", oem_number: "OEM-BREMBO-007",
    category_id: "cat-1-2", category_name: "刹车盘", brand: "Brembo",
    image_urls: [], cost_price: 45.00, sale_price: 78.00, unit: "个", weight_kg: 4.5, package_length_cm: 30, package_width_cm: 30, package_height_cm: 5,
    status: "active", applicable_models: ["Mercedes C-Class"],
    created_at: daysAgo(60), updated_at: daysAgo(18),
  },
  {
    id: "p-008", code: "PD008", name: "空气滤芯", name_en: "Air Filter", oem_number: "OEM-MANN-008",
    category_id: "cat-2", category_name: "发动机配件", brand: "Mann",
    image_urls: [], cost_price: 10.00, sale_price: 19.00, unit: "个", weight_kg: 0.25, package_length_cm: 25, package_width_cm: 15, package_height_cm: 3,
    status: "active", applicable_models: ["VW Passat", "Audi A6"],
    created_at: daysAgo(55), updated_at: daysAgo(7),
  },
  {
    id: "p-009", code: "PD009", name: "火花塞", name_en: "Spark Plug", oem_number: "OEM-NGK-009",
    category_id: "cat-2", category_name: "发动机配件", brand: "NGK",
    image_urls: [], cost_price: 6.00, sale_price: 12.00, unit: "个", weight_kg: 0.05, package_length_cm: 10, package_width_cm: 5, package_height_cm: 2,
    status: "active", applicable_models: ["Universal"],
    created_at: daysAgo(50), updated_at: daysAgo(3),
  },
  {
    id: "p-010", code: "PD010", name: "起动机", name_en: "Starter Motor", oem_number: "OEM-VALEO-010",
    category_id: "cat-5", category_name: "电气系统", brand: "Valeo",
    image_urls: [], cost_price: 95.00, sale_price: 165.00, unit: "台", weight_kg: 4.2, package_length_cm: 32, package_width_cm: 22, package_height_cm: 18,
    status: "active", applicable_models: ["Peugeot 308", "Citroen C4"],
    created_at: daysAgo(45), updated_at: daysAgo(25),
  },
];

const seedCustomers: Customer[] = [
  {
    id: "c-001", code: "CU001", name: "上海汽车配件有限公司", name_en: "Shanghai Auto Parts Co., Ltd",
    contact_person: "张经理", contact_email: "zhang@shauto.com", contact_phone: "13800138001",
    country: "中国", address: "上海市浦东新区张江高科技园区", website: "www.shauto.com",
    level: "strategic", status: "active", credit_limit: 500000, payment_terms: "T/T 30天",
    preferred_currency: "CNY", notes: "战略客户，年采购额超500万",
    created_at: daysAgo(120), updated_at: daysAgo(5),
  },
  {
    id: "c-002", code: "CU002", name: "AutoZone USA Inc.", name_en: "AutoZone USA Inc.",
    contact_person: "John Smith", contact_email: "john@autozone.com", contact_phone: "+1-555-0102",
    country: "美国", address: "1234 Memphis, Tennessee, USA", website: "www.autozone.com",
    level: "vip", status: "active", credit_limit: 200000, payment_terms: "T/T 60天",
    preferred_currency: "USD", notes: "美国最大汽配零售商之一",
    created_at: daysAgo(100), updated_at: daysAgo(10),
  },
  {
    id: "c-003", code: "CU003", name: "Bosch Germany GmbH", name_en: "Bosch Germany GmbH",
    contact_person: "Hans Mueller", contact_email: "hans@bosch.de", contact_phone: "+49-30-1234",
    country: "德国", address: "Gerlingen, Stuttgart, Germany", website: "www.bosch.de",
    level: "strategic", status: "active", credit_limit: 800000, payment_terms: "L/C 90天",
    preferred_currency: "EUR", notes: "德国博世总部直供",
    created_at: daysAgo(80), updated_at: daysAgo(15),
  },
  {
    id: "c-004", code: "CU004", name: "Toyota Japan Co.", name_en: "Toyota Japan Co.",
    contact_person: "Tanaka-san", contact_email: "tanaka@toyota.jp", contact_phone: "+81-3-1234",
    country: "日本", address: "Toyota City, Aichi, Japan", website: "www.toyota.jp",
    level: "vip", status: "active", credit_limit: 600000, payment_terms: "T/T 45天",
    preferred_currency: "USD", notes: "丰田汽车总部",
    created_at: daysAgo(60), updated_at: daysAgo(20),
  },
  {
    id: "c-005", code: "CU005", name: "Al Futtaim Motors UAE", name_en: "Al Futtaim Motors UAE",
    contact_person: "Ahmed Ali", contact_email: "ahmed@alfuttaim.ae", contact_phone: "+971-4-1234",
    country: "阿联酋", address: "Dubai, UAE", website: "www.alfuttaim.ae",
    level: "normal", status: "active", credit_limit: 150000, payment_terms: "T/T 30天",
    preferred_currency: "USD", notes: "中东区域合作伙伴",
    created_at: daysAgo(40), updated_at: daysAgo(2),
  },
  {
    id: "c-006", code: "CU006", name: "北京现代汽配", name_en: "Beijing Hyundai Parts",
    contact_person: "刘总", contact_email: "liu@bjhyundai.com", contact_phone: "13900139001",
    country: "中国", address: "北京市朝阳区建国路", website: "www.bjhyundai.com",
    level: "normal", status: "silent", credit_limit: 80000, payment_terms: "T/T 30天",
    preferred_currency: "CNY", notes: "近半年无采购",
    created_at: daysAgo(150), updated_at: daysAgo(90),
  },
];

const seedSuppliers: Supplier[] = [
  {
    id: "s-001", code: "SU001", name: "宁波华翔汽配厂", name_en: "Ningbo Huaxiang Auto Parts",
    contact_person: "王厂长", contact_email: "wang@huaxiang.com", contact_phone: "13700137001",
    country: "中国", address: "浙江省宁波市鄞州区", level: "preferred", status: "active",
    main_category: ["制动系统", "刹车片"], lead_time_days: 15, quality_rating: 5,
    payment_terms: "T/T 30天", notes: "制动片主力供应商",
    created_at: daysAgo(120), updated_at: daysAgo(8),
  },
  {
    id: "s-002", code: "SU002", name: "温州东方轴承厂", name_en: "Wenzhou Dongfang Bearing",
    contact_person: "李经理", contact_email: "li@dongfang.com", contact_phone: "13700137002",
    country: "中国", address: "浙江省温州市瓯海区", level: "normal", status: "active",
    main_category: ["轴承"], lead_time_days: 20, quality_rating: 4,
    payment_terms: "T/T 30天", notes: "轴承类产品供应商",
    created_at: daysAgo(100), updated_at: daysAgo(12),
  },
  {
    id: "s-003", code: "SU003", name: "广州鸿图密封件", name_en: "Guangzhou Hongtu Seals",
    contact_person: "陈总", contact_email: "chen@hongtu.com", contact_phone: "13700137003",
    country: "中国", address: "广东省广州市黄埔区", level: "strategic", status: "active",
    main_category: ["密封件", "发动机配件"], lead_time_days: 10, quality_rating: 5,
    payment_terms: "T/T 45天", notes: "密封件战略供应商",
    created_at: daysAgo(80), updated_at: daysAgo(5),
  },
];

const seedWarehouses: Warehouse[] = [
  { id: "wh-001", code: "WH001", name: "主仓库", address: "上海市浦东新区主仓库" },
  { id: "wh-002", code: "WH002", name: "华东分仓", address: "杭州市余杭区分仓" },
];

const seedInventory: Inventory[] = seedProducts.map((p, i) => ({
  id: `inv-${i + 1}`,
  product_id: p.id,
  product_name: p.name,
  product_code: p.code,
  warehouse_id: "wh-001",
  warehouse_name: "主仓库",
  quantity: 100 + Math.floor(Math.random() * 400),
  frozen_quantity: Math.floor(Math.random() * 50),
  available_quantity: 0, // computed
  updated_at: daysAgo(Math.floor(Math.random() * 30)),
})).map(inv => ({ ...inv, available_quantity: inv.quantity - inv.frozen_quantity }));

const seedInquiries: Inquiry[] = [
  {
    id: "inq-001", code: "IN-2026-0001", customer_id: "c-002", customer_name: "AutoZone USA Inc.",
    customer_country: "美国", subject: "前制动片紧急询价", source: "email", priority: "high",
    status: "quoted", notes: "客户希望尽快报价，预计每月500套需求",
    items: [
      { id: "ii-1", inquiry_id: "inq-001", product_id: "p-001", product_name: "前制动片", oem_number: "OEM-TOYOTA-001", quantity: 500, unit: "套", target_price: 55 },
    ],
    created_at: daysAgo(25), updated_at: daysAgo(20),
  },
  {
    id: "inq-002", code: "IN-2026-0002", customer_id: "c-003", customer_name: "Bosch Germany GmbH",
    customer_country: "德国", subject: "Bosch OEM火花塞询价", source: "email", priority: "medium",
    status: "processing", notes: "年度采购合同",
    items: [
      { id: "ii-2", inquiry_id: "inq-002", product_id: "p-009", product_name: "火花塞", oem_number: "OEM-NGK-009", quantity: 2000, unit: "个", target_price: 10 },
    ],
    created_at: daysAgo(15), updated_at: daysAgo(5),
  },
  {
    id: "inq-003", code: "IN-2026-0003", customer_id: "c-004", customer_name: "Toyota Japan Co.",
    customer_country: "日本", subject: "丰田卡罗拉刹车系统询价", source: "wechat", priority: "high",
    status: "pending", notes: "新项目需求",
    items: [
      { id: "ii-3", inquiry_id: "inq-003", product_id: "p-001", product_name: "前制动片", quantity: 300, unit: "套", target_price: 50 },
      { id: "ii-4", inquiry_id: "inq-003", product_id: "p-002", product_name: "后制动片", quantity: 300, unit: "套", target_price: 45 },
    ],
    created_at: daysAgo(5), updated_at: daysAgo(2),
  },
  {
    id: "inq-004", code: "IN-2026-0004", customer_id: "c-005", customer_name: "Al Futtaim Motors UAE",
    customer_country: "阿联酋", subject: "中东市场发动机配件询价", source: "exhibition", priority: "medium",
    status: "pending", notes: "迪拜汽配展获取",
    items: [
      { id: "ii-5", inquiry_id: "inq-004", product_id: "p-003", product_name: "机油滤芯", quantity: 1000, unit: "个", target_price: 18 },
    ],
    created_at: daysAgo(3), updated_at: daysAgo(1),
  },
  {
    id: "inq-005", code: "IN-2026-0005", customer_id: "c-001", customer_name: "上海汽车配件有限公司",
    customer_country: "中国", subject: "国内采购深沟球轴承", source: "phone", priority: "low",
    status: "closed", notes: "已成交",
    items: [
      { id: "ii-6", inquiry_id: "inq-005", product_id: "p-005", product_name: "深沟球轴承6203", quantity: 500, unit: "个", target_price: 14 },
    ],
    created_at: daysAgo(60), updated_at: daysAgo(50),
  },
];

const seedQuotations: Quotation[] = [
  {
    id: "q-001", code: "QT-2026-0001", customer_id: "c-002", customer_name: "AutoZone USA Inc.",
    inquiry_id: "inq-001", pricing_status: "priced", status: "sent",
    total_amount: 29000, currency: "USD", valid_until: daysLater(15),
    trade_terms: "FOB", payment_terms: "T/T 30天",
    items: [
      { id: "qi-1", quotation_id: "q-001", product_id: "p-001", product_name: "前制动片", oem_number: "OEM-TOYOTA-001", quantity: 500, unit: "套", unit_price: 58, total_price: 29000 },
    ],
    created_at: daysAgo(22), updated_at: daysAgo(18),
  },
  {
    id: "q-002", code: "QT-2026-0002", customer_id: "c-003", customer_name: "Bosch Germany GmbH",
    inquiry_id: "inq-002", pricing_status: "priced", status: "accepted",
    total_amount: 22000, currency: "EUR", valid_until: daysLater(5),
    trade_terms: "CIF", payment_terms: "L/C 90天",
    items: [
      { id: "qi-2", quotation_id: "q-002", product_id: "p-009", product_name: "火花塞", oem_number: "OEM-NGK-009", quantity: 2000, unit: "个", unit_price: 11, total_price: 22000 },
    ],
    created_at: daysAgo(14), updated_at: daysAgo(7),
  },
  {
    id: "q-003", code: "QT-2026-0003", customer_id: "c-004", customer_name: "Toyota Japan Co.",
    inquiry_id: "inq-003", pricing_status: "pending", status: "draft",
    total_amount: 0, currency: "USD", valid_until: daysLater(30),
    trade_terms: "FOB", payment_terms: "T/T 45天",
    items: [
      { id: "qi-3", quotation_id: "q-003", product_id: "p-001", product_name: "前制动片", quantity: 300, unit: "套", unit_price: 0, total_price: 0 },
      { id: "qi-4", quotation_id: "q-003", product_id: "p-002", product_name: "后制动片", quantity: 300, unit: "套", unit_price: 0, total_price: 0 },
    ],
    created_at: daysAgo(3), updated_at: daysAgo(1),
  },
];

const seedOrders: Order[] = [
  {
    id: "o-001", code: "OD-2026-0001", customer_id: "c-003", customer_name: "Bosch Germany GmbH",
    quotation_id: "q-002", order_date: daysAgo(7), delivery_date: daysLater(53),
    currency: "EUR", total_amount: 22000, status: "confirmed",
    trade_terms: "CIF", payment_terms: "L/C 90天",
    items: [
      { id: "oi-1", order_id: "o-001", product_id: "p-009", product_name: "火花塞", oem_number: "OEM-NGK-009", quantity: 2000, shipped_quantity: 0, unit: "个", unit_price: 11 },
    ],
    confirmed_at: daysAgo(5), created_at: daysAgo(7), updated_at: daysAgo(5),
  },
  {
    id: "o-002", code: "OD-2026-0002", customer_id: "c-001", customer_name: "上海汽车配件有限公司",
    order_date: daysAgo(50), delivery_date: daysAgo(10),
    currency: "CNY", total_amount: 7000, status: "completed",
    trade_terms: "EXW", payment_terms: "T/T 30天",
    items: [
      { id: "oi-2", order_id: "o-002", product_id: "p-005", product_name: "深沟球轴承6203", oem_number: "OEM-SKF-005", quantity: 500, shipped_quantity: 500, unit: "个", unit_price: 14 },
    ],
    confirmed_at: daysAgo(48), shipped_at: daysAgo(15), completed_at: daysAgo(5),
    created_at: daysAgo(50), updated_at: daysAgo(5),
  },
  {
    id: "o-003", code: "OD-2026-0003", customer_id: "c-002", customer_name: "AutoZone USA Inc.",
    order_date: daysAgo(2), delivery_date: daysLater(58),
    currency: "USD", total_amount: 29000, status: "pending",
    trade_terms: "FOB", payment_terms: "T/T 30天",
    items: [
      { id: "oi-3", order_id: "o-003", product_id: "p-001", product_name: "前制动片", oem_number: "OEM-TOYOTA-001", quantity: 500, shipped_quantity: 0, unit: "套", unit_price: 58 },
    ],
    created_at: daysAgo(2), updated_at: daysAgo(2),
  },
];

const seedPurchaseRequests: PurchaseRequest[] = [
  {
    id: "pr-001", code: "PR-2026-0001", order_id: "o-001", order_code: "OD-2026-0001",
    status: "approved",
    items: [
      { id: "pri-1", product_id: "p-009", product_name: "火花塞", quantity: 2000, unit: "个" },
    ],
    created_at: daysAgo(6), updated_at: daysAgo(5),
  },
  {
    id: "pr-002", code: "PR-2026-0002", order_id: "o-003", order_code: "OD-2026-0003",
    status: "pending",
    items: [
      { id: "pri-2", product_id: "p-001", product_name: "前制动片", quantity: 500, unit: "套" },
    ],
    created_at: daysAgo(2), updated_at: daysAgo(2),
  },
];

const seedPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po-001", code: "PO-2026-0001", supplier_id: "s-001", supplier_name: "宁波华翔汽配厂",
    purchase_request_id: "pr-001", order_date: daysAgo(5),
    currency: "CNY", total_amount: 12000, status: "sent",
    trade_terms: "EXW", payment_terms: "T/T 30天",
    items: [
      { id: "poi-1", purchase_order_id: "po-001", product_id: "p-009", product_name: "火花塞", quantity: 2000, arrived_quantity: 0, warehoused_quantity: 0, unit: "个", unit_price: 6 },
    ],
    created_at: daysAgo(5), updated_at: daysAgo(3),
  },
];

const seedShipments: Shipment[] = [
  {
    id: "sh-001", code: "SH-2026-0001", order_id: "o-002", order_code: "OD-2026-0002",
    customer_name: "上海汽车配件有限公司",
    shipment_date: daysAgo(15), shipping_method: "land",
    tracking_number: "YT1234567890", container_number: "",
    bl_number: "", status: "delivered",
    total_weight: 75, total_cartons: 10,
    items: [
      { id: "shi-1", shipment_id: "sh-001", product_name: "深沟球轴承6203", quantity: 500, cartons: 10, weight_kg: 75 },
    ],
    created_at: daysAgo(15),
  },
];

const seedReceivables: Receivable[] = [
  {
    id: "r-001", code: "FIN-2026-0001", customer_id: "c-003", customer_name: "Bosch Germany GmbH",
    order_id: "o-001", order_code: "OD-2026-0001", category: "order_payment",
    amount: 22000, received_amount: 0, currency: "EUR",
    due_date: daysLater(83), status: "pending",
    created_at: daysAgo(7),
  },
  {
    id: "r-002", code: "FIN-2026-0002", customer_id: "c-001", customer_name: "上海汽车配件有限公司",
    order_id: "o-002", order_code: "OD-2026-0002", category: "order_payment",
    amount: 7000, received_amount: 0, currency: "CNY",
    due_date: daysAgo(20), status: "overdue",
    created_at: daysAgo(50),
  },
];

const seedPayables: Payable[] = [
  {
    id: "pay-001", code: "PAY-2026-0001", supplier_id: "s-001", supplier_name: "宁波华翔汽配厂",
    purchase_order_id: "po-001", category: "purchase_payment",
    amount: 12000, paid_amount: 0, currency: "CNY",
    due_date: daysLater(25), status: "pending",
    created_at: daysAgo(5),
  },
];

const seedDocuments: Document[] = [
  {
    id: "d-001", code: "DOC-2026-0001", order_id: "o-002", order_code: "OD-2026-0002",
    shipment_id: "sh-001", document_type: "commercial_invoice", status: "issued",
    file_url: "#", issued_date: daysAgo(15), notes: "商业发票已签发",
    created_at: daysAgo(15),
  },
  {
    id: "d-002", code: "DOC-2026-0002", order_id: "o-002", order_code: "OD-2026-0002",
    shipment_id: "sh-001", document_type: "packing_list", status: "issued",
    file_url: "#", issued_date: daysAgo(15), notes: "装箱单已签发",
    created_at: daysAgo(15),
  },
  {
    id: "d-003", code: "DOC-2026-0003", order_id: "o-001", order_code: "OD-2026-0001",
    document_type: "commercial_invoice", status: "draft",
    notes: "等待订单完成发货", created_at: daysAgo(3),
  },
];

const seedExchangeRates: ExchangeRate[] = [
  { id: "er-1", currency: "USD", rate_to_cny: 7.25, effective_date: daysAgo(1) },
  { id: "er-2", currency: "EUR", rate_to_cny: 7.85, effective_date: daysAgo(1) },
  { id: "er-3", currency: "GBP", rate_to_cny: 9.15, effective_date: daysAgo(1) },
  { id: "er-4", currency: "JPY", rate_to_cny: 0.048, effective_date: daysAgo(1) },
];

const seedNotifications: Notification[] = [
  { id: "n-1", type: "warning", title: "应收账款逾期", content: "FIN-2026-0002 已逾期20天，金额 ¥7,000.00", is_read: false, created_at: daysAgo(1), link: "/finance?tab=receivables&status=overdue", category: "receivable" },
  { id: "n-2", type: "info", title: "新询盘提醒", content: "IN-2026-0004 来自Al Futtaim Motors UAE", is_read: false, created_at: daysAgo(2), link: "/inquiries/inq-004", category: "inquiry" },
  { id: "n-3", type: "success", title: "订单已完成", content: "OD-2026-0002 已完成全部流程", is_read: true, created_at: daysAgo(5), link: "/orders/o-002", category: "order" },
  { id: "n-4", type: "warning", title: "报价即将过期", content: "QT-2026-0002 还剩5天到期", is_read: false, created_at: daysAgo(3), link: "/quotations/q-002", category: "quotation" },
];

const seedSystemSettings: SystemSettings = {
  company_name: "RCA汽配贸易有限公司",
  company_name_en: "RCA Auto Parts Trading Co., Ltd",
  address: "上海市浦东新区张江高科技园区",
  email: "info@rca-auto.com",
  phone: "+86-21-1234-5678",
  default_currency: "USD",
  default_trade_terms: "FOB",
  default_payment_terms: "T/T",
};

const seedAuditLogs: AuditLog[] = [
  {
    id: "al-1", user_id: "u-admin", user_name: "管理员", module: "orders", action: "status_change",
    record_id: "o-001", record_code: "OD-2026-0001",
    before_data: { status: "pending" }, after_data: { status: "confirmed" },
    description: "订单状态变更：pending → confirmed", created_at: daysAgo(5),
  },
  {
    id: "al-2", user_id: "u-admin", user_name: "管理员", module: "customers", action: "create",
    record_id: "c-005", record_code: "CU005",
    after_data: { name: "Al Futtaim Motors UAE", country: "阿联酋" },
    description: "创建客户 Al Futtaim Motors UAE (CU005)", created_at: daysAgo(40),
  },
  {
    id: "al-3", user_id: "u-sales", user_name: "李销售", module: "quotations", action: "status_change",
    record_id: "q-002", record_code: "QT-2026-0002",
    before_data: { status: "sent" }, after_data: { status: "accepted" },
    description: "报价单状态变更：sent → accepted", created_at: daysAgo(7),
  },
  {
    id: "al-4", user_id: "u-purchaser", user_name: "王采购", module: "purchase_orders", action: "create",
    record_id: "po-001", record_code: "PO-2026-0001",
    after_data: { supplier: "宁波华翔汽配厂", amount: 12000 },
    description: "创建采购订单 PO-2026-0001", created_at: daysAgo(5),
  },
  {
    id: "al-5", user_id: "u-admin", user_name: "管理员", module: "orders", action: "status_change",
    record_id: "o-002", record_code: "OD-2026-0002",
    before_data: { status: "shipped" }, after_data: { status: "completed" },
    description: "订单状态变更：shipped → completed", created_at: daysAgo(5),
  },
];

const seedStockMovements: StockMovement[] = [
  {
    id: "sm-1", movement_type: "outbound_sale", product_id: "p-005", product_name: "深沟球轴承6203",
    warehouse_id: "wh-001", warehouse_name: "主仓库", quantity: -500,
    before_quantity: 600, after_quantity: 100,
    reference_type: "order", reference_id: "o-002",
    notes: "订单 OD-2026-0002 销售出库", created_at: daysAgo(15),
  },
  {
    id: "sm-2", movement_type: "freeze", product_id: "p-009", product_name: "火花塞",
    warehouse_id: "wh-001", warehouse_name: "主仓库", quantity: 2000,
    before_quantity: 300, after_quantity: 300,
    reference_type: "order", reference_id: "o-001",
    notes: "订单 OD-2026-0001 确认冻结", created_at: daysAgo(5),
  },
];

// Store接口
interface StoreState {
  // 当前用户
  currentUser: User | null;
  // 数据集
  users: User[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  categories: ProductCategory[];
  inquiries: Inquiry[];
  quotations: Quotation[];
  orders: Order[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  warehouses: Warehouse[];
  inventory: Inventory[];
  stockMovements: StockMovement[];
  shipments: Shipment[];
  receivables: Receivable[];
  payables: Payable[];
  documents: Document[];
  auditLogs: AuditLog[];
  systemSettings: SystemSettings;
  exchangeRates: ExchangeRate[];
  notifications: Notification[];

  // Actions
  login: (email: string, _password: string) => User | null;
  logout: () => void;
  addAuditLog: (log: Omit<AuditLog, "id" | "created_at">) => void;
  // Reset（开发用）
  reset: () => void;
}

const initialState = {
  currentUser: null as User | null,
  users: seedUsers,
  customers: seedCustomers,
  suppliers: seedSuppliers,
  products: seedProducts,
  categories: seedCategories,
  inquiries: seedInquiries,
  quotations: seedQuotations,
  orders: seedOrders,
  purchaseRequests: seedPurchaseRequests,
  purchaseOrders: seedPurchaseOrders,
  warehouses: seedWarehouses,
  inventory: seedInventory,
  stockMovements: seedStockMovements,
  shipments: seedShipments,
  receivables: seedReceivables,
  payables: seedPayables,
  documents: seedDocuments,
  auditLogs: seedAuditLogs,
  systemSettings: seedSystemSettings,
  exchangeRates: seedExchangeRates,
  notifications: seedNotifications,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (email, _password) => {
        const user = get().users.find((u) => u.email === email);
        if (user) {
          set({ currentUser: user });
          return user;
        }
        return null;
      },

      logout: () => set({ currentUser: null }),

      addAuditLog: (log) =>
        set((state) => ({
          auditLogs: [
            { ...log, id: uuidv4(), created_at: today() },
            ...state.auditLogs,
          ],
        })),

      reset: () => {
        // 重新生成种子数据
        set({ ...initialState, currentUser: null });
        // 强制重新加载以重置localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("rca-erp-store");
          window.location.reload();
        }
      },
    }),
    {
      name: "rca-erp-store",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return window.localStorage;
        }
        // SSR-safe fallback: in-memory storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as any;
      }),
      version: 4,
      skipHydration: false,
      // 版本不匹配时直接重置为初始数据
      migrate: (_persistedState: any, version: number) => {
        if (version < 4) {
          return { ...initialState };
        }
        return _persistedState;
      },
    },
  ),
);
