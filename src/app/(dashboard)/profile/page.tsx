"use client";
import { useState, useEffect } from "react";
import { User, Save } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/common/page-header";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

const useSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !key.includes("REPLACE_WITH") && url.startsWith("https://") && key.length > 30);
};

export default function ProfilePage() {
  const supabaseEnabled = useSupabase();
  const { currentUser, setCurrentUser } = useStore() as any;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
  });

  useEffect(() => {
    setForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    });
  }, [currentUser]);

  const handleSave = async () => {
    if (!supabaseEnabled || !supabase) {
      // Mock模式 - 直接更新store
      setCurrentUser({ ...currentUser, name: form.name });
      toast.success("个人信息已更新");
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      // 更新profiles表
      const { error } = await supabase
        .from("profiles")
        .update({ name: form.name, updated_at: new Date().toISOString() })
        .eq("id", currentUser.id);

      if (error) throw error;

      // 更新store
      setCurrentUser({ ...currentUser, name: form.name });
      toast.success("个人信息已更新");
      setEditing(false);
    } catch (err: any) {
      toast.error("更新失败: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const role = (currentUser?.role as UserRole) || "admin";

  return (
    <div>
      <PageHeader
        title="个人信息"
        description="查看和编辑您的个人资料"
        actions={
          !editing ? (
            <Button onClick={() => setEditing(true)} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">
              <User className="h-3.5 w-3.5 mr-1" />
              编辑信息
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setForm({ name: currentUser?.name || "", email: currentUser?.email || "" }); }}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">
                <Save className="h-3.5 w-3.5 mr-1" />
                {saving ? "保存中..." : "保存"}
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 头像和基本信息 */}
        <InfoCard title="账户信息">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 rounded-full bg-[#38BDF8] text-white flex items-center justify-center text-2xl font-bold mb-3">
              {currentUser?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="text-lg font-semibold text-slate-800">{currentUser?.name}</div>
            <div className="text-sm text-slate-500">{currentUser?.email}</div>
            <div className={`mt-2 px-3 py-1 rounded-full text-xs ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </div>
          </div>
        </InfoCard>

        {/* 编辑表单 */}
        <InfoCard title="详细资料" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700">姓名</Label>
              {editing ? (
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              ) : (
                <div className="text-sm font-medium">{currentUser?.name}</div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700">邮箱</Label>
              <div className="text-sm text-slate-500">{currentUser?.email}</div>
              <p className="text-[10px] text-slate-400">邮箱不可修改</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700">角色</Label>
              <div className={`inline-block px-2 py-0.5 rounded text-xs ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </div>
              <p className="text-[10px] text-slate-400">角色由管理员分配</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700">状态</Label>
              <div className="text-sm">
                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">启用</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700">注册时间</Label>
              <div className="text-sm text-slate-500">{formatDate(currentUser?.created_at)}</div>
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
