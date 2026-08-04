-- ============================================================
-- RCA6.0 ERP - Supabase 建表 SQL
-- 在 Supabase Dashboard → SQL Editor 中执行此文件
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 系统配置
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 汇率
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL,
  rate_to_cny NUMERIC(10,4) NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON public.exchange_rates(currency, effective_date DESC);

-- 3. 客户
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  contact_person TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  country TEXT NOT NULL,
  address TEXT,
  website TEXT,
  level TEXT DEFAULT 'normal' CHECK (level IN ('normal', 'vip', 'strategic')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'silent', 'lost')),
  credit_limit NUMERIC(18,2) DEFAULT 0,
  payment_terms TEXT DEFAULT 'T/T',
  preferred_currency TEXT DEFAULT 'USD',
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status) WHERE deleted_at IS NULL;

-- 4. 供应商
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  contact_person TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  country TEXT NOT NULL,
  address TEXT,
  level TEXT DEFAULT 'normal' CHECK (level IN ('normal', 'preferred', 'strategic')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blacklisted')),
  main_category TEXT[] DEFAULT '{}',
  lead_time_days INT DEFAULT 15,
  quality_rating INT DEFAULT 3 CHECK (quality_rating BETWEEN 1 AND 5),
  payment_terms TEXT DEFAULT 'T/T 30天',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);

-- 5. 产品分类
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON public.product_categories(parent_id);

-- 6. 产品
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  oem_number TEXT,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  brand TEXT,
  image_urls TEXT[] DEFAULT '{}',
  cost_price NUMERIC(18,2) DEFAULT 0,
  sale_price NUMERIC(18,2) DEFAULT 0,
  unit TEXT DEFAULT '个',
  weight_kg NUMERIC(10,2),
  package_length_cm NUMERIC(10,1),
  package_width_cm NUMERIC(10,1),
  package_height_cm NUMERIC(10,1),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  applicable_models TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_oem ON public.products(oem_number);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status) WHERE deleted_at IS NULL;

-- 7. 询盘
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  source TEXT CHECK (source IN ('email', 'phone', 'exhibition', 'website', 'wechat')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'quoted', 'closed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer ON public.inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

CREATE TABLE IF NOT EXISTS public.inquiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT '个',
  target_price NUMERIC(18,2),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiry ON public.inquiry_items(inquiry_id);

-- 8. 报价
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  pricing_status TEXT DEFAULT 'pending' CHECK (pricing_status IN ('pending', 'priced')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  total_amount NUMERIC(18,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  valid_until DATE,
  trade_terms TEXT DEFAULT 'FOB',
  payment_terms TEXT DEFAULT 'T/T',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON public.quotations(customer_id);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT '个',
  unit_price NUMERIC(18,2) DEFAULT 0,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.quotation_items(quotation_id);

-- 9. 订单
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  currency TEXT DEFAULT 'USD',
  total_amount NUMERIC(18,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'producing', 'shipped', 'completed', 'cancelled')),
  trade_terms TEXT DEFAULT 'FOB',
  payment_terms TEXT DEFAULT 'T/T',
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(10,2) NOT NULL,
  shipped_quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT '个',
  unit_price NUMERIC(18,2) NOT NULL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 10. 采购
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_order ON public.purchase_requests(order_id);

CREATE TABLE IF NOT EXISTS public.purchase_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT '个',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  purchase_request_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
  order_date DATE NOT NULL,
  currency TEXT DEFAULT 'CNY',
  total_amount NUMERIC(18,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'partial_arrived', 'arrived', 'warehoused', 'paid')),
  trade_terms TEXT DEFAULT 'EXW',
  payment_terms TEXT DEFAULT 'T/T 30天',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(10,2) NOT NULL,
  arrived_quantity NUMERIC(10,2) DEFAULT 0,
  warehoused_quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT '个',
  unit_price NUMERIC(18,2) NOT NULL
);

-- 11. 仓库 + 库存
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) DEFAULT 0,
  frozen_quantity NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) NOT NULL,
  before_quantity NUMERIC(10,2),
  after_quantity NUMERIC(10,2),
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type);

-- 12. 发货
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shipment_date DATE NOT NULL,
  shipping_method TEXT CHECK (shipping_method IN ('sea', 'air', 'express', 'land')),
  tracking_number TEXT,
  container_number TEXT,
  bl_number TEXT,
  total_weight NUMERIC(10,2),
  total_cartons INT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'shipped', 'in_transit', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  quantity NUMERIC(10,2) NOT NULL,
  cartons INT,
  weight_kg NUMERIC(10,2)
);

-- 13. 应收/应付
CREATE TABLE IF NOT EXISTS public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  category TEXT,
  amount NUMERIC(18,2) NOT NULL,
  received_amount NUMERIC(18,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'received', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receivables_customer ON public.receivables(customer_id);

CREATE TABLE IF NOT EXISTS public.payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  category TEXT,
  amount NUMERIC(18,2) NOT NULL,
  paid_amount NUMERIC(18,2) DEFAULT 0,
  currency TEXT DEFAULT 'CNY',
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. 单证
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'void')),
  file_url TEXT,
  issued_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. 审计日志
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id UUID,
  record_code TEXT,
  before_data JSONB,
  after_data JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 16. 通知
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  type TEXT,
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  category TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_%s_updated ON public.%s;', t, t);
    EXECUTE format('CREATE TRIGGER trigger_%s_updated BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();', t, t);
  END LOOP;
END$$;

-- 临时关闭 RLS（开发阶段）
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END$$;

-- ====== 种子数据 ======

INSERT INTO public.system_settings (key, value) VALUES
  ('company_name', '"RCA汽配贸易有限公司"'),
  ('company_name_en', '"RCA Auto Parts Trading Co., Ltd"'),
  ('address', '"上海市浦东新区张江高科技园区"'),
  ('email', '"info@rca-auto.com"'),
  ('phone', '"+86-21-1234-5678"'),
  ('default_currency', '"USD"'),
  ('default_trade_terms', '"FOB"'),
  ('default_payment_terms', '"T/T"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.exchange_rates (currency, rate_to_cny, effective_date) VALUES
  ('USD', 7.25, CURRENT_DATE), ('EUR', 7.85, CURRENT_DATE), ('GBP', 9.15, CURRENT_DATE), ('JPY', 0.048, CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO public.warehouses (code, name, address) VALUES
  ('WH001', '主仓库', '上海市浦东新区'), ('WH002', '华东分仓', '杭州市余杭区')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.product_categories (code, name, parent_id, sort_order) VALUES
  ('CAT001', '制动系统', NULL, 1), ('CAT002', '发动机配件', NULL, 2),
  ('CAT003', '密封件', NULL, 3), ('CAT004', '轴承', NULL, 4), ('CAT005', '电气系统', NULL, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.product_categories (code, name, parent_id, sort_order) VALUES
  ('CAT001-1', '刹车片', (SELECT id FROM public.product_categories WHERE code='CAT001'), 1),
  ('CAT001-2', '刹车盘', (SELECT id FROM public.product_categories WHERE code='CAT001'), 2)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.products (code, name, name_en, oem_number, category_id, category_name, brand, cost_price, sale_price, unit, weight_kg, package_length_cm, package_width_cm, package_height_cm, status, applicable_models, description) VALUES
  ('PD001', '前制动片', 'Front Brake Pad', 'OEM-TOYOTA-001', (SELECT id FROM public.product_categories WHERE code='CAT001-1'), '刹车片', 'Bosch', 35.00, 58.00, '套', 1.2, 25, 18, 5, 'active', ARRAY['Toyota Camry','Toyota Corolla'], '适用于丰田卡罗拉/凯美瑞'),
  ('PD002', '后制动片', 'Rear Brake Pad', 'OEM-TOYOTA-002', (SELECT id FROM public.product_categories WHERE code='CAT001-1'), '刹车片', 'Bosch', 32.00, 52.00, '套', 1.0, 22, 16, 4, 'active', ARRAY['Toyota Camry'], ''),
  ('PD003', '机油滤芯', 'Oil Filter', 'OEM-HONDA-003', (SELECT id FROM public.product_categories WHERE code='CAT002'), '发动机配件', 'Mann', 12.00, 22.00, '个', 0.3, 12, 8, 3, 'active', ARRAY['Honda Civic','Honda Accord'], ''),
  ('PD004', '气门室垫片', 'Valve Cover Gasket', 'OEM-VW-004', (SELECT id FROM public.product_categories WHERE code='CAT003'), '密封件', 'Elring', 18.00, 35.00, '个', 0.2, 15, 10, 2, 'active', ARRAY['VW Golf','Audi A4'], ''),
  ('PD005', '深沟球轴承6203', 'Deep Groove Ball Bearing 6203', 'OEM-SKF-005', (SELECT id FROM public.product_categories WHERE code='CAT004'), '轴承', 'SKF', 8.00, 16.00, '个', 0.15, 8, 8, 2, 'active', ARRAY['Universal'], ''),
  ('PD006', '发电机', 'Alternator', 'OEM-BOSCH-006', (SELECT id FROM public.product_categories WHERE code='CAT005'), '电气系统', 'Bosch', 120.00, 195.00, '台', 5.5, 35, 25, 20, 'active', ARRAY['BMW 3 Series','BMW 5 Series'], ''),
  ('PD007', '刹车盘', 'Brake Disc', 'OEM-BREMBO-007', (SELECT id FROM public.product_categories WHERE code='CAT001-2'), '刹车盘', 'Brembo', 45.00, 78.00, '个', 4.5, 30, 30, 5, 'active', ARRAY['Mercedes C-Class'], ''),
  ('PD008', '空气滤芯', 'Air Filter', 'OEM-MANN-008', (SELECT id FROM public.product_categories WHERE code='CAT002'), '发动机配件', 'Mann', 10.00, 19.00, '个', 0.25, 25, 15, 3, 'active', ARRAY['VW Passat','Audi A6'], ''),
  ('PD009', '火花塞', 'Spark Plug', 'OEM-NGK-009', (SELECT id FROM public.product_categories WHERE code='CAT002'), '发动机配件', 'NGK', 6.00, 12.00, '个', 0.05, 10, 5, 2, 'active', ARRAY['Universal'], ''),
  ('PD010', '起动机', 'Starter Motor', 'OEM-VALEO-010', (SELECT id FROM public.product_categories WHERE code='CAT005'), '电气系统', 'Valeo', 95.00, 165.00, '台', 4.2, 32, 22, 18, 'active', ARRAY['Peugeot 308','Citroen C4'], '')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.customers (code, name, name_en, contact_person, contact_email, contact_phone, country, address, website, level, status, credit_limit, payment_terms, preferred_currency, notes) VALUES
  ('CU001', '上海汽车配件有限公司', 'Shanghai Auto Parts Co., Ltd', '张经理', 'zhang@shauto.com', '13800138001', '中国', '上海市浦东新区张江高科技园区', 'www.shauto.com', 'strategic', 'active', 500000, 'T/T 30天', 'CNY', '战略客户'),
  ('CU002', 'AutoZone USA Inc.', 'AutoZone USA Inc.', 'John Smith', 'john@autozone.com', '+1-555-0102', '美国', '1234 Memphis, Tennessee, USA', 'www.autozone.com', 'vip', 'active', 200000, 'T/T 60天', 'USD', '美国最大汽配零售商'),
  ('CU003', 'Bosch Germany GmbH', 'Bosch Germany GmbH', 'Hans Mueller', 'hans@bosch.de', '+49-30-1234', '德国', 'Gerlingen, Stuttgart, Germany', 'www.bosch.de', 'strategic', 'active', 800000, 'L/C 90天', 'EUR', '德国博世总部直供'),
  ('CU004', 'Toyota Japan Co.', 'Toyota Japan Co.', 'Tanaka-san', 'tanaka@toyota.jp', '+81-3-1234', '日本', 'Toyota City, Aichi, Japan', 'www.toyota.jp', 'vip', 'active', 600000, 'T/T 45天', 'USD', '丰田汽车总部'),
  ('CU005', 'Al Futtaim Motors UAE', 'Al Futtaim Motors UAE', 'Ahmed Ali', 'ahmed@alfuttaim.ae', '+971-4-1234', '阿联酋', 'Dubai, UAE', 'www.alfuttaim.ae', 'normal', 'active', 150000, 'T/T 30天', 'USD', '中东区域合作伙伴')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.suppliers (code, name, name_en, contact_person, contact_email, contact_phone, country, address, level, status, main_category, lead_time_days, quality_rating, payment_terms, notes) VALUES
  ('SU001', '宁波华翔汽配厂', 'Ningbo Huaxiang Auto Parts', '王厂长', 'wang@huaxiang.com', '13700137001', '中国', '浙江省宁波市鄞州区', 'preferred', 'active', ARRAY['制动系统','刹车片'], 15, 5, 'T/T 30天', '制动片主力供应商'),
  ('SU002', '温州东方轴承厂', 'Wenzhou Dongfang Bearing', '李经理', 'li@dongfang.com', '13700137002', '中国', '浙江省温州市瓯海区', 'normal', 'active', ARRAY['轴承'], 20, 4, 'T/T 30天', '轴承类产品供应商'),
  ('SU003', '广州鸿图密封件', 'Guangzhou Hongtu Seals', '陈总', 'chen@hongtu.com', '13700137003', '中国', '广东省广州市黄埔区', 'strategic', 'active', ARRAY['密封件','发动机配件'], 10, 5, 'T/T 45天', '密封件战略供应商')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.inventory (product_id, warehouse_id, quantity, frozen_quantity)
SELECT p.id, w.id, 100 + floor(random() * 400)::INT, floor(random() * 50)::INT
FROM public.products p, public.warehouses w
WHERE w.code = 'WH001' AND p.deleted_at IS NULL
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

INSERT INTO public.audit_logs (user_name, module, action, description) VALUES ('系统', 'system', 'create', '系统初始化完成')
ON CONFLICT DO NOTHING;
