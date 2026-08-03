"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端 Supabase 客户端
 * 使用 anon/publishable key，受 RLS 限制
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
