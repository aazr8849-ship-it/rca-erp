"use client";
import { useState, useEffect } from "react";
import { UserCog, Plus, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/common/page-header";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
  created_at: string;
}

const useSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !key.includes("REPLACE_WITH") && url.startsWith("https://") && key.length > 30);
};

export default function UsersPage() {
  const supabaseEnabled = useSupabase();
  const { currentUser } = useStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "sales" as UserRole });

  useEffect(() => {
    if (supabaseEnabled) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [supabaseEnabled]);

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error("获取用户列表失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!supabase) return;
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error("请填写所有必填项");
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("创建用户失败");

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: "active",
      });

      if (profileError) throw profileError;

      toast.success(`用户 ${newUser.name} 创建成功`);
      setCreateOpen(false);
      setNewUser({ email: "", password: "", name: "", role: "sales" });
      fetchUsers();
    } catch (err: any) {
      toast.error("创建失败: " + err.message);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      toast.success("角色已更新");
      fetchUsers();
    } catch (err: any) {
      toast.error("更新失败: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !supabase) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("用户已删除");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast.error("删除失败: " + err.message);
    }
  };

  const columns: Column<UserProfile>[] = [
    {
      key: "name",
      header: "姓名",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#38BDF8] text-white flex items-center justify-center text-xs font-semibold">
            {r.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium">{r.name}</span>
        </div>
      ),
    },
    { key: "email", header: "邮箱", render: (r) => <span className="text-sm text-slate-600">{r.email}</span> },
    {
      key: "role",
      header: "角色",
      width: "140px",
      render: (r) => (
        <Select value={r.role} onValueChange={(v) => handleUpdateRole(r.id, v as UserRole)}>
          <SelectTrigger className="h-7 w-32 text-xs">
            <span className={`px-2 py-0.5 rounded text-xs ${ROLE_COLORS[r.role as UserRole] || "bg-gray-100"}`}>
              {ROLE_LABELS[r.role as UserRole] || r.role}
            </span>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "status",
      header: "状态",
      width: "80px",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-xs ${r.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {r.status === "active" ? "启用" : "禁用"}
        </span>
      ),
    },
    { key: "created_at", header: "创建时间", width: "120px", render: (r) => <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span> },
    {
      key: "actions",
      header: "操作",
      width: "80px",
      align: "center",
      render: (r) => (
        r.id !== currentUser?.id ? (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : <span className="text-xs text-slate-400">当前用户</span>
      ),
    },
  ];

  if (!supabaseEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <UserCog className="h-16 w-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">需要连接 Supabase</h3>
        <p className="text-sm text-slate-500 mt-1">用户管理功能需要 Supabase 认证系统支持</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="用户管理"
        description={`共 ${users.length} 个用户 · 管理员可创建员工账号并分配角色`}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">
            <Plus className="h-3.5 w-3.5 mr-1" />
            创建用户
          </Button>
        }
      />

      {/* 权限说明卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        {Object.entries(ROLE_LABELS).map(([key, label]) => (
          <div key={key} className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span className={`px-2 py-0.5 rounded text-xs ${ROLE_COLORS[key as UserRole]}`}>{label}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {key === "admin" && "全部功能 + 用户管理"}
              {key === "sales" && "客户/询盘/报价/订单/单证"}
              {key === "purchaser" && "供应商/采购/库存"}
              {key === "warehouse" && "产品/库存/发货/单证"}
              {key === "finance" && "订单/财务/单证"}
            </p>
          </div>
        ))}
      </div>

      <GenericDataTable
        data={users}
        columns={columns}
        loading={loading}
        rowKey={(r) => r.id}
        emptyTitle="暂无用户"
        emptyDescription="点击右上角「创建用户」添加员工账号"
      />

      {/* 创建用户弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新用户</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <Field label="姓名" required>
              <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="如：张三" />
            </Field>
            <Field label="角色" required>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="邮箱" required full>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@company.com" />
            </Field>
            <Field label="密码" required full>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="至少6位" />
            </Field>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-md p-3 text-xs text-sky-800">
            创建后，员工可用邮箱密码登录系统。角色决定了可访问的模块。
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">创建用户</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除用户"
        description={`确定要删除用户「${deleteTarget?.name}」吗？此操作不可撤销。`}
        variant="destructive"
        confirmText="确认删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}
