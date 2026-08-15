import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    // 1. 检查用户是否已存在
    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const existing = existingUser?.users?.find((u: any) => u.email === email);
    
    let userId: string;

    if (existing) {
      // 用户已存在，更新密码
      userId = existing.id;
      await adminClient.auth.admin.updateUserById(userId, { password });
    } else {
      // 创建新用户
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
      userId = authData.user!.id;
    }

    // 2. 用upsert创建或更新profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: userId,
        email,
        name,
        role: role || "sales",
        status: "active",
      });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `用户 ${name} 创建成功`,
      userId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
