import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 服务端 Supabase 客户端（用于 Server Components 和 API Routes）
 * 使用 publishable key (anon key)，受 RLS 限制
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 在 Server Component 中调用 setAll 会抛错（只读 cookies）
          }
        },
      },
    },
  );
}
