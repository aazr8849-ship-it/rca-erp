import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. 创建Auth用户
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 自动确认邮箱
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
    }

    // 2. 创建profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        email,
        name,
        role: role || "sales",
        status: "active",
      });

    if (profileError) {
      // 如果profile创建失败，删除已创建的auth用户
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `用户 ${name} 创建成功`,
      userId: authData.user.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
