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

  // 验证 key 格式（新版 sb_publishable_ 格式约46字符，旧版JWT格式100+字符）
  if (!key.startsWith("sb_publishable_") && !key.startsWith("eyJ")) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 格式错误，应以 sb_publishable_ 或 eyJ 开头");
    return null;
  }
  if (key.length < 40) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 长度异常(" + key.length + "字符)，可能被截断");
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
