"use client";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { User } from "@/lib/types";

/**
 * 认证 API
 * 使用 Supabase Auth + profiles 表
 */

export interface AuthUser extends User {
  id: string;
}

/**
 * 登录
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!supabase) {
    return { user: null, error: "Supabase 未配置" };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: "登录失败" };
    }

    // 获取 profile 信息
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      // 如果没有 profile，创建一个默认的
      const newProfile = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.email?.split("@")[0] || "用户",
        role: "admin" as const,
        status: "active" as const,
      };
      await supabase.from("profiles").insert(newProfile);
      const authUser: AuthUser = {
        ...newProfile,
        avatar: undefined,
        created_at: new Date().toISOString(),
      };
      return { user: authUser, error: null };
    }

    const authUser: AuthUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar_url,
      status: profile.status,
      created_at: profile.created_at,
    };

    return { user: authUser, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || "登录异常" };
  }
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar_url,
      status: profile.status,
      created_at: profile.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * 注册新用户（管理员功能）
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: User["role"] = "sales",
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!supabase) {
    return { user: null, error: "Supabase 未配置" };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: "注册失败" };
    }

    // 创建 profile
    const newProfile = {
      id: data.user.id,
      email,
      name,
      role,
      status: "active" as const,
    };
    await supabase.from("profiles").insert(newProfile);

    const authUser: AuthUser = {
      ...newProfile,
      avatar: undefined,
      created_at: new Date().toISOString(),
    };

    return { user: authUser, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || "注册异常" };
  }
}
