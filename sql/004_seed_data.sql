-- ============================================================
-- RCA6.0 ERP - 完整种子数据
-- 在 Supabase SQL Editor 执行此文件
-- ============================================================

-- 清空旧数据（保留表结构）
TRUNCATE public.customers, public.suppliers, public.products, public.product_categories,
  public.inquiries, public.inquiry_items, public.quotations, public.quotation_items,
  public.orders, public.order_items, public.purchase_requests, public.purchase_request_items,
  public.purchase_orders, public.purchase_order_items, public.warehouses, public.inventory,
  public.stock_movements, public.shipments, public.shipment_items,
  public.receivables, public.payables, public.documents, public.audit_logs, public.notifications
CASCADE;

-- 产品分类
INSERT INTO public.product_categories (code, name, parent_id, sort_order) VALUES
  ('CAT001', '制动系统', NULL, 1), ('CAT002', '发动机配件', NULL, 2),
  ('CAT003', '密封件', NULL, 3), ('CAT004', '轴承', NULL, 4), ('CAT005', '电气系统', NULL, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.product_categories (code, name, parent_id, sort_order) VALUES
  ('CAT001-1', '刹车片', (SELECT id FROM public.product_categories WHERE code='CAT001'), 1),
  ('CAT001-2', '刹车盘', (SELECT id FROM public.product_categories WHERE code='CAT001'), 2)
ON CONFLICT (code) DO NOTHING;

-- 仓库
INSERT INTO public.warehouses (code, name, address) VALUES
  ('WH001', '主仓库', '上海市浦东新区'), ('WH002', '华东分仓', '杭州市余杭区')
ON CONFLICT (code) DO NOTHING;

-- 客户
INSERT INTO public.customers (code, name, name_en, contact_person, contact_email, contact_phone, country, address, website, level, status, credit_limit, payment_terms, preferred_currency, notes) VALUES
  ('CU001', '上海汽车配件有限公司', 'Shanghai Auto Parts', '张经理', 'zhang@shauto.com', '13800138001', '中国', '上海市浦东新区', 'www.shauto.com', 'strategic', 'active', 500000, 'T/T 30天', 'CNY', '战略客户'),
  ('CU002', 'AutoZone USA Inc.', 'AutoZone USA', 'John Smith', 'john@autozone.com', '+1-555-0102', '美国', 'Memphis, TN', 'www.autozone.com', 'vip', 'active', 200000, 'T/T 60天', 'USD', '美国零售商'),
  ('CU003', 'Bosch Germany GmbH', 'Bosch Germany', 'Hans Mueller', 'hans@bosch.de', '+49-30-1234', '德国', 'Stuttgart', 'www.bosch.de', 'strategic', 'active', 800000, 'L/C 90天', 'EUR', '博世总部'),
  ('CU004', 'Toyota Japan Co.', 'Toyota Japan', 'Tanaka-san', 'tanaka@toyota.jp', '+81-3-1234', '日本', 'Aichi', 'www.toyota.jp', 'vip', 'active', 600000, 'T/T 45天', 'USD', '丰田总部'),
  ('CU005', 'Al Futtaim UAE', 'Al Futtaim', 'Ahmed Ali', 'ahmed@alfuttaim.ae', '+971-4-1234', '阿联酋', 'Dubai', 'www.alfuttaim.ae', 'normal', 'active', 150000, 'T/T 30天', 'USD', '中东伙伴')
ON CONFLICT (code) DO NOTHING;

-- 供应商
INSERT INTO public.suppliers (code, name, name_en, contact_person, contact_email, contact_phone, country, address, level, status, main_category, lead_time_days, quality_rating, payment_terms, notes) VALUES
  ('SU001', '宁波华翔汽配厂', 'Ningbo Huaxiang', '王厂长', 'wang@huaxiang.com', '13700137001', '中国', '宁波市', 'preferred', 'active', ARRAY['制动系统'], 15, 5, 'T/T 30天', '主力供应商'),
  ('SU002', '温州东方轴承厂', 'Wenzhou Dongfang', '李经理', 'li@dongfang.com', '13700137002', '中国', '温州市', 'normal', 'active', ARRAY['轴承'], 20, 4, 'T/T 30天', '轴承供应商'),
  ('SU003', '广州鸿图密封件', 'Guangzhou Hongtu', '陈总', 'chen@hongtu.com', '13700137003', '中国', '广州市', 'strategic', 'active', ARRAY['密封件'], 10, 5, 'T/T 45天', '战略供应商')
ON CONFLICT (code) DO NOTHING;

-- 产品
INSERT INTO public.products (code, name, name_en, oem_number, category_id, category_name, brand, cost_price, sale_price, unit, weight_kg, package_length_cm, package_width_cm, package_height_cm, status, applicable_models, description) VALUES
  ('PD001', '前制动片', 'Front Brake Pad', 'OEM-TOYOTA-001', (SELECT id FROM public.product_categories WHERE code='CAT001-1'), '刹车片', 'Bosch', 35.00, 58.00, '套', 1.2, 25, 18, 5, 'active', ARRAY['Toyota Camry'], '前制动片'),
  ('PD002', '后制动片', 'Rear Brake Pad', 'OEM-TOYOTA-002', (SELECT id FROM public.product_categories WHERE code='CAT001-1'), '刹车片', 'Bosch', 32.00, 52.00, '套', 1.0, 22, 16, 4, 'active', ARRAY['Toyota Camry'], '后制动片'),
  ('PD003', '机油滤芯', 'Oil Filter', 'OEM-HONDA-003', (SELECT id FROM public.product_categories WHERE code='CAT002'), '发动机配件', 'Mann', 12.00, 22.00, '个', 0.3, 12, 8, 3, 'active', ARRAY['Honda Civic'], '机油滤芯'),
  ('PD004', '气门室垫片', 'Valve Cover Gasket', 'OEM-VW-004', (SELECT id FROM public.product_categories WHERE code='CAT003'), '密封件', 'Elring', 18.00, 35.00, '个', 0.2, 15, 10, 2, 'active', ARRAY['VW Golf'], '气门室垫片'),
  ('PD005', '深沟球轴承6203', 'Ball Bearing 6203', 'OEM-SKF-005', (SELECT id FROM public.product_categories WHERE code='CAT004'), '轴承', 'SKF', 8.00, 16.00, '个', 0.15, 8, 8, 2, 'active', ARRAY['Universal'], '深沟球轴承'),
  ('PD006', '发电机', 'Alternator', 'OEM-BOSCH-006', (SELECT id FROM public.product_categories WHERE code='CAT005'), '电气系统', 'Bosch', 120.00, 195.00, '台', 5.5, 35, 25, 20, 'active', ARRAY['BMW 3 Series'], '发电机'),
  ('PD007', '刹车盘', 'Brake Disc', 'OEM-BREMBO-007', (SELECT id FROM public.product_categories WHERE code='CAT001-2'), '刹车盘', 'Brembo', 45.00, 78.00, '个', 4.5, 30, 30, 5, 'active', ARRAY['Mercedes C-Class'], '刹车盘'),
  ('PD008', '空气滤芯', 'Air Filter', 'OEM-MANN-008', (SELECT id FROM public.product_categories WHERE code='CAT002'), '发动机配件', 'Mann', 10.00, 19.00, '个', 0.25, 25, 15, 3, 'active', ARRAY['VW Passat'], '空气滤芯'),
  ('PD009', '火花塞', 'Spark Plug', 'OEM-NGK-009', (SELECT id FROM public.product_categories WHERE code='CAT002'), '发动机配件', 'NGK', 6.00, 12.00, '个', 0.05, 10, 5, 2, 'active', ARRAY['Universal'], '火花塞'),
  ('PD010', '起动机', 'Starter Motor', 'OEM-VALEO-010', (SELECT id FROM public.product_categories WHERE code='CAT005'), '电气系统', 'Valeo', 95.00, 165.00, '台', 4.2, 32, 22, 18, 'active', ARRAY['Peugeot 308'], '起动机')
ON CONFLICT (code) DO NOTHING;

-- 库存
INSERT INTO public.inventory (product_id, warehouse_id, quantity, frozen_quantity)
SELECT p.id, w.id, 100 + floor(random() * 400)::INT, floor(random() * 50)::INT
FROM public.products p, public.warehouses w
WHERE w.code = 'WH001'
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- 询盘
INSERT INTO public.inquiries (code, customer_id, subject, source, priority, status, notes) VALUES
  ('IN-2026-0001', (SELECT id FROM public.customers WHERE code='CU002'), '前制动片询价', 'email', 'high', 'quoted', '紧急'),
  ('IN-2026-0002', (SELECT id FROM public.customers WHERE code='CU003'), '火花塞询价', 'email', 'medium', 'processing', '年度采购'),
  ('IN-2026-0003', (SELECT id FROM public.customers WHERE code='CU004'), '刹车系统询价', 'wechat', 'high', 'pending', '新项目')
ON CONFLICT (code) DO NOTHING;

-- 询盘明细
INSERT INTO public.inquiry_items (inquiry_id, product_id, quantity, unit, target_price) VALUES
  ((SELECT id FROM public.inquiries WHERE code='IN-2026-0001'), (SELECT id FROM public.products WHERE code='PD001'), 500, '套', 55),
  ((SELECT id FROM public.inquiries WHERE code='IN-2026-0002'), (SELECT id FROM public.products WHERE code='PD009'), 2000, '个', 10),
  ((SELECT id FROM public.inquiries WHERE code='IN-2026-0003'), (SELECT id FROM public.products WHERE code='PD001'), 300, '套', 50);

-- 报价
INSERT INTO public.quotations (code, customer_id, inquiry_id, pricing_status, status, total_amount, currency, valid_until, trade_terms, payment_terms) VALUES
  ('QT-2026-0001', (SELECT id FROM public.customers WHERE code='CU002'), (SELECT id FROM public.inquiries WHERE code='IN-2026-0001'), 'priced', 'sent', 29000, 'USD', CURRENT_DATE + 15, 'FOB', 'T/T 30天'),
  ('QT-2026-0002', (SELECT id FROM public.customers WHERE code='CU003'), (SELECT id FROM public.inquiries WHERE code='IN-2026-0002'), 'priced', 'accepted', 22000, 'EUR', CURRENT_DATE + 5, 'CIF', 'L/C 90天'),
  ('QT-2026-0003', (SELECT id FROM public.customers WHERE code='CU004'), (SELECT id FROM public.inquiries WHERE code='IN-2026-0003'), 'pending', 'draft', 0, 'USD', CURRENT_DATE + 30, 'FOB', 'T/T 45天')
ON CONFLICT (code) DO NOTHING;

-- 报价明细
INSERT INTO public.quotation_items (quotation_id, product_id, quantity, unit, unit_price) VALUES
  ((SELECT id FROM public.quotations WHERE code='QT-2026-0001'), (SELECT id FROM public.products WHERE code='PD001'), 500, '套', 58),
  ((SELECT id FROM public.quotations WHERE code='QT-2026-0002'), (SELECT id FROM public.products WHERE code='PD009'), 2000, '个', 11);

-- 订单
INSERT INTO public.orders (code, customer_id, quotation_id, order_date, delivery_date, currency, total_amount, status, trade_terms, payment_terms) VALUES
  ('OD-2026-0001', (SELECT id FROM public.customers WHERE code='CU003'), (SELECT id FROM public.quotations WHERE code='QT-2026-0002'), CURRENT_DATE - 7, CURRENT_DATE + 53, 'EUR', 22000, 'confirmed', 'CIF', 'L/C 90天'),
  ('OD-2026-0002', (SELECT id FROM public.customers WHERE code='CU001'), NULL, CURRENT_DATE - 50, CURRENT_DATE - 10, 'CNY', 7000, 'completed', 'EXW', 'T/T 30天'),
  ('OD-2026-0003', (SELECT id FROM public.customers WHERE code='CU002'), NULL, CURRENT_DATE - 2, CURRENT_DATE + 58, 'USD', 29000, 'pending', 'FOB', 'T/T 30天')
ON CONFLICT (code) DO NOTHING;

-- 订单明细
INSERT INTO public.order_items (order_id, product_id, quantity, unit, unit_price) VALUES
  ((SELECT id FROM public.orders WHERE code='OD-2026-0001'), (SELECT id FROM public.products WHERE code='PD009'), 2000, '个', 11),
  ((SELECT id FROM public.orders WHERE code='OD-2026-0002'), (SELECT id FROM public.products WHERE code='PD005'), 500, '个', 14),
  ((SELECT id FROM public.orders WHERE code='OD-2026-0003'), (SELECT id FROM public.products WHERE code='PD001'), 500, '套', 58);

-- 请购单
INSERT INTO public.purchase_requests (code, order_id, status) VALUES
  ('PR-2026-0001', (SELECT id FROM public.orders WHERE code='OD-2026-0001'), 'approved'),
  ('PR-2026-0002', (SELECT id FROM public.orders WHERE code='OD-2026-0003'), 'pending')
ON CONFLICT (code) DO NOTHING;

-- 采购订单
INSERT INTO public.purchase_orders (code, supplier_id, purchase_request_id, order_date, currency, total_amount, status) VALUES
  ('PO-2026-0001', (SELECT id FROM public.suppliers WHERE code='SU001'), (SELECT id FROM public.purchase_requests WHERE code='PR-2026-0001'), CURRENT_DATE - 5, 'CNY', 12000, 'sent')
ON CONFLICT (code) DO NOTHING;

-- 发货
INSERT INTO public.shipments (code, order_id, shipment_date, shipping_method, tracking_number, total_weight, total_cartons, status) VALUES
  ('SH-2026-0001', (SELECT id FROM public.orders WHERE code='OD-2026-0002'), CURRENT_DATE - 15, 'land', 'YT1234567890', 75, 10, 'delivered')
ON CONFLICT (code) DO NOTHING;

-- 应收账款
INSERT INTO public.receivables (code, customer_id, order_id, category, amount, received_amount, currency, due_date, status) VALUES
  ('FIN-2026-0001', (SELECT id FROM public.customers WHERE code='CU003'), (SELECT id FROM public.orders WHERE code='OD-2026-0001'), 'order_payment', 22000, 0, 'EUR', CURRENT_DATE + 83, 'pending'),
  ('FIN-2026-0002', (SELECT id FROM public.customers WHERE code='CU001'), (SELECT id FROM public.orders WHERE code='OD-2026-0002'), 'order_payment', 7000, 0, 'CNY', CURRENT_DATE - 20, 'overdue')
ON CONFLICT (code) DO NOTHING;

-- 应付账款
INSERT INTO public.payables (code, supplier_id, purchase_order_id, category, amount, paid_amount, currency, due_date, status) VALUES
  ('PAY-2026-0001', (SELECT id FROM public.suppliers WHERE code='SU001'), (SELECT id FROM public.purchase_orders WHERE code='PO-2026-0001'), 'purchase_payment', 12000, 0, 'CNY', CURRENT_DATE + 25, 'pending')
ON CONFLICT (code) DO NOTHING;

-- 单证
INSERT INTO public.documents (code, order_id, document_type, status, issued_date) VALUES
  ('DOC-2026-0001', (SELECT id FROM public.orders WHERE code='OD-2026-0002'), 'commercial_invoice', 'issued', CURRENT_DATE - 15),
  ('DOC-2026-0002', (SELECT id FROM public.orders WHERE code='OD-2026-0002'), 'packing_list', 'issued', CURRENT_DATE - 15),
  ('DOC-2026-0003', (SELECT id FROM public.orders WHERE code='OD-2026-0001'), 'commercial_invoice', 'draft', NULL)
ON CONFLICT (code) DO NOTHING;

-- 系统设置
INSERT INTO public.system_settings (key, value) VALUES
  ('company_name', '"RCA汽配贸易有限公司"'),
  ('company_name_en', '"RCA Auto Parts Trading Co., Ltd"'),
  ('address', '"上海市浦东新区"'),
  ('email', '"info@rca-auto.com"'),
  ('phone', '"+86-21-1234-5678"'),
  ('default_currency', '"USD"'),
  ('default_trade_terms', '"FOB"'),
  ('default_payment_terms', '"T/T"')
ON CONFLICT (key) DO NOTHING;

-- 汇率
INSERT INTO public.exchange_rates (currency, rate_to_cny, effective_date) VALUES
  ('USD', 7.25, CURRENT_DATE), ('EUR', 7.85, CURRENT_DATE), ('GBP', 9.15, CURRENT_DATE), ('JPY', 0.048, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 审计日志
INSERT INTO public.audit_logs (user_name, module, action, description) VALUES
  ('系统', 'system', 'create', '系统初始化完成');

-- 通知
INSERT INTO public.notifications (type, title, content, link, category, is_read) VALUES
  ('warning', '应收账款逾期', 'FIN-2026-0002 已逾期20天', '/finance', 'receivable', false),
  ('info', '新询盘提醒', 'IN-2026-0003 来自Toyota Japan', '/inquiries', 'inquiry', false),
  ('success', '订单已完成', 'OD-2026-0002 已完成全部流程', '/orders', 'order', true);

DO $$
BEGIN
  RAISE NOTICE '✅ 种子数据插入完成！';
END$$;
