import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 删除auth用户（profile会通过外键级联删除）
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      // 如果auth删除失败，尝试只删profile
      await adminClient.from("profiles").delete().eq("id", userId);
    }

    return NextResponse.json({ success: true, message: "用户已删除" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
