"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端 Supabase 客户端
 * 使用 publishable key (anon key)，受 RLS 限制
 *
 * 安全初始化：如果环境变量缺失，返回 null 而不是崩溃
 */
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

function initClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("⚠️ Supabase 环境变量未配置，客户管理将使用 Mock 模式");
    return null;
  }

  try {
    return createBrowserClient(url, key);
  } catch (err) {
    console.error("❌ Supabase 客户端初始化失败:", err);
    return null;
  }
}

export const supabase = initClient();
