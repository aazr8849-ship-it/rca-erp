-- ============================================================
-- RCA6.0 ERP - 认证用户配置
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 创建 profiles 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales', 'purchaser', 'warehouse', 'finance')),
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能看自己的 profile
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 策略：用户可以更新自己的 profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 策略：注册时可以创建自己的 profile（通过 trigger 自动处理）
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 自动创建 profile 的触发器（用户注册时自动创建）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1),
    'admin',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 创建演示用户
-- ⚠️ 需要在 Supabase Dashboard → Authentication → Users → Add user
--    手动创建，这里只是说明
-- ============================================================
-- 以下用户需要在 Supabase Dashboard 手动创建：
-- 1. admin@rca-erp.com / admin123 (管理员)
-- 2. sales@rca-erp.com / sales123 (销售)
-- 3. purchaser@rca-erp.com / purchase123 (采购)
-- 4. warehouse@rca-erp.com / warehouse123 (仓管)
-- 5. finance@rca-erp.com / finance123 (财务)

-- 创建完成后，执行以下 SQL 更新角色：
-- UPDATE public.profiles SET role = 'sales' WHERE email = 'sales@rca-erp.com';
-- UPDATE public.profiles SET role = 'purchaser' WHERE email = 'purchaser@rca-erp.com';
-- UPDATE public.profiles SET role = 'warehouse' WHERE email = 'warehouse@rca-erp.com';
-- UPDATE public.profiles SET role = 'finance' WHERE email = 'finance@rca-erp.com';

DO $$
BEGIN
  RAISE NOTICE '✅ 认证系统配置完成！';
  RAISE NOTICE '⚠️ 请到 Supabase Dashboard → Authentication → Users 创建用户';
  RAISE NOTICE '   每个用户创建后，profile 会自动生成';
END$$;
