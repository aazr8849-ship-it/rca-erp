"use client";
import { createBrowserClient } from "@supabase/ssr";

// 后备配置（publishable key是公开的）
const FALLBACK_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const FALLBACK_KEY = "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

function initClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

  if (!url || !key) {
    console.warn("Supabase 环境变量未配置，使用后备配置");
  }

  try {
    return createBrowserClient(url, key);
  } catch (err) {
    console.error("Supabase 客户端初始化失败:", err);
    return null;
  }
}

export const supabase = initClient();
