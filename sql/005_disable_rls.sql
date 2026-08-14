-- ============================================================
-- RCA6.0 ERP - 关闭所有表的 RLS（开发阶段）
-- 在 Supabase SQL Editor 执行此文件
-- ============================================================

-- 关闭所有业务表的 RLS
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✅ 所有表的 RLS 已关闭，现在可以正常读写数据了';
END$$;
