"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端 Supabase 客户端
 * 安全初始化：环境变量缺失或无效时返回 null
 */
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

function initClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("⚠️ Supabase 环境变量未配置，将使用 Mock 模式");
    return null;
  }

  // 验证 key 长度（publishable key 通常 > 50 字符）
  if (key.length < 50) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 长度异常(" + key.length + "字符)，可能被截断。请检查 Vercel 环境变量配置。");
    return null;
  }

  // 验证 URL 格式
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL 格式错误:", url);
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
