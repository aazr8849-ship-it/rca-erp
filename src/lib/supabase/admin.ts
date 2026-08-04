import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 管理员 Supabase 客户端（绕过 RLS）
 * 仅在服务端使用，使用 service_role key
 * ⚠️ 此密钥绝对不能暴露到前端
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
