import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 管理员 Supabase 客户端（绕过 RLS）
 * 仅在服务端使用，使用 service_role key
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 未配置，请在 Vercel 环境变量中添加");
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}
