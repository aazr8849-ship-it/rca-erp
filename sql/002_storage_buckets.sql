-- ============================================================
-- RCA6.0 ERP - Storage Bucket 配置
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 创建产品图片 bucket（公开可读）
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 创建单证文件 bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage 策略：产品图片（开发阶段允许所有操作）
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images insert" ON storage.objects;
CREATE POLICY "Product images insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images update" ON storage.objects;
CREATE POLICY "Product images update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images delete" ON storage.objects;
CREATE POLICY "Product images delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

-- Storage 策略：单证文件（仅认证用户可访问）
DROP POLICY IF EXISTS "Documents authenticated access" ON storage.objects;
CREATE POLICY "Documents authenticated access" ON storage.objects
  FOR ALL USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
