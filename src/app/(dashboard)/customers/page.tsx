"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader, ActionButton } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ImportDialog } from "@/components/common/import-dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Customer } from "@/lib/types";
import { formatDate, formatCurrency, generateCode } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomers, createCustomer, updateCustomer, deleteCustomer,
} from "@/lib/api/customers";

// 检测是否配置了 Supabase
const useSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // 检查环境变量是否存在且不是占位符
  return !!(url && key && !key.includes("REPLACE_WITH") && url.startsWith("https://"));
};

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabaseEnabled = useSupabase();
  const { customers: mockCustomers, addAuditLog } = useStore();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // ====== Supabase 模式 ======
  const { data: supabaseData, isLoading: supabaseLoading, error: supabaseError } = useQuery({
    queryKey: ["customers", { page, pageSize, search, levelFilter, statusFilter, countryFilter }],
    queryFn: () => fetchCustomers({
      page, pageSize, search, level: levelFilter, status: statusFilter, country: countryFilter,
    }),
    enabled: supabaseEnabled,
    retry: 1, // 失败只重试1次
    staleTime: 30 * 1000, // 30秒内不重新请求
  });

  // 如果 Supabase 出错，自动降级到 Mock 模式
  const useMockMode = !supabaseEnabled || !!supabaseError;

  // ====== Mock 模式（降级） ======
  const mockFiltered = useMemo(() => {
    let list = mockCustomers.filter((c) => !c.deleted_at);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s) ||
        c.contact_person.toLowerCase().includes(s)
      );
    }
    if (levelFilter !== "__all__") list = list.filter((c) => c.level === levelFilter);
    if (statusFilter !== "__all__") list = list.filter((c) => c.status === statusFilter);
    if (countryFilter) list = list.filter((c) => c.country.includes(countryFilter));
    return list;
  }, [mockCustomers, search, levelFilter, statusFilter, countryFilter]);

  // 统一数据源：Supabase 出错或未配置时用 Mock
  const displayData = useMockMode ? mockFiltered : (supabaseData?.data || []);
  const total = useMockMode ? mockFiltered.length : (supabaseData?.total || 0);
  const loading = !useMockMode && supabaseLoading;

  // ====== CRUD 操作 ======
  const handleSave = async (data: Partial<Customer>) => {
    if (!useMockMode) {
      try {
        if (editingCustomer) {
          await updateCustomer(editingCustomer.id, data);
          toast.success("客户信息已更新");
        } else {
          await createCustomer(data);
          toast.success("客户创建成功");
        }
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      } catch (err: any) {
        toast.error(err.message || "操作失败");
      }
    } else {
      // Mock 模式
      if (editingCustomer) {
        useStore.setState((state) => ({
          customers: state.customers.map((c) =>
            c.id === editingCustomer.id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
          ),
        }));
        addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "customers", action: "update", record_id: editingCustomer.id, record_code: editingCustomer.code, description: `更新客户 ${editingCustomer.name}` });
        toast.success("客户信息已更新");
      } else {
        const newCustomer: Customer = {
          id: crypto.randomUUID(), code: generateCode("CU"),
          ...data, level: data.level || "normal", status: data.status || "active",
          credit_limit: data.credit_limit || 0, payment_terms: data.payment_terms || "T/T",
          preferred_currency: data.preferred_currency || "USD",
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        } as Customer;
        useStore.setState((state) => ({ customers: [newCustomer, ...state.customers] }));
        toast.success("客户创建成功");
      }
    }
    setFormOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!useMockMode) {
      try {
        await deleteCustomer(deleteTarget.id);
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        toast.success("客户已删除");
      } catch (err: any) {
        toast.error(err.message || "删除失败");
      }
    } else {
      const now = new Date().toISOString();
      useStore.setState((state) => ({
        customers: state.customers.map((c) => c.id === deleteTarget.id ? { ...c, deleted_at: now } : c),
      }));
      toast.success("客户已删除");
    }
    setDeleteTarget(null);
  };

  const handleReset = () => {
    setSearch(""); setLevelFilter("__all__"); setStatusFilter("__all__");
    setCountryFilter(""); setPage(1);
  };

  const handleExport = async () => {
    const { exportToExcel } = await import("@/lib/excel-utils");
    exportToExcel(displayData, "客户列表", "客户", [
      { key: "code", label: "编码" }, { key: "name", label: "客户名称" },
      { key: "name_en", label: "英文名称" }, { key: "contact_person", label: "联系人" },
      { key: "contact_email", label: "邮箱" }, { key: "contact_phone", label: "电话" },
      { key: "country", label: "国家" }, { key: "address", label: "地址" },
      { key: "website", label: "官网" }, { key: "level", label: "等级" },
      { key: "status", label: "状态" }, { key: "credit_limit", label: "信用额度" },
      { key: "payment_terms", label: "付款条件" }, { key: "preferred_currency", label: "偏好币种" },
      { key: "notes", label: "备注" }, { key: "created_at", label: "创建时间" },
    ]);
  };

  const columns: Column<Customer>[] = [
    { key: "code", header: "客户编码", width: "120px", render: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { key: "name", header: "客户名称", render: (row) => (
      <Link href={`/customers/${row.id}`} className="text-sm font-medium text-[#38BDF8] hover:underline">{row.name}</Link>
    ) },
    { key: "contact_person", header: "联系人", width: "100px", render: (row) => (
      <div><div className="text-sm">{row.contact_person}</div><div className="text-xs text-gray-500">{row.contact_phone || "-"}</div></div>
    ) },
    { key: "country", header: "国家", width: "100px" },
    { key: "level", header: "等级", width: "80px", render: (row) => <StatusBadge type="level" status={row.level} /> },
    { key: "status", header: "状态", width: "80px", render: (row) => <StatusBadge status={row.status} /> },
    { key: "credit_limit", header: "信用额度", width: "120px", align: "right", render: (row) => <span className="text-sm">{formatCurrency(row.credit_limit, row.preferred_currency)}</span> },
    { key: "created_at", header: "创建时间", width: "120px", render: (row) => <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span> },
    { key: "actions", header: "操作", width: "120px", align: "center", render: (row) => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/customers/${row.id}`); }}><Eye className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingCustomer(row); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="客户管理"
        description={
          useMockMode
            ? `共 ${total} 条客户记录 · Mock 模式（未连接数据库）`
            : `共 ${total} 条客户记录 · 已连接 Supabase`
        }
        actions={
          <>
            <ActionButton icon="export" onClick={handleExport}>导出Excel</ActionButton>
            <ActionButton icon="import" onClick={() => setImportOpen(true)}>导入Excel</ActionButton>
            <ActionButton icon="add" onClick={() => { setEditingCustomer(null); setFormOpen(true); }}>新建客户</ActionButton>
          </>
        }
      />

      <FilterBar onReset={handleReset}>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="搜索客户名称/编码/联系人..." className="w-64" />
        <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部等级" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部等级</SelectItem>
            <SelectItem value="normal">普通</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="strategic">战略</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部状态</SelectItem>
            <SelectItem value="active">活跃</SelectItem>
            <SelectItem value="silent">沉默</SelectItem>
            <SelectItem value="lost">流失</SelectItem>
          </SelectContent>
        </Select>
        <Input value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }} placeholder="国家" className="w-32 h-8 text-xs" />
      </FilterBar>

      <GenericDataTable
        data={displayData}
        columns={columns}
        loading={loading}
        pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: setPageSize }}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/customers/${row.id}`)}
        emptyTitle="暂无客户"
        emptyDescription="点击右上角「新建客户」按钮添加第一条客户记录"
      />

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editingCustomer} onSave={handleSave} />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        moduleName="客户"
        templateFilename="客户导入模板"
        columns={[
          { key: "code", label: "编码", example: "留空则自动生成" },
          { key: "name", label: "客户名称", required: true, example: "上海汽车配件有限公司" },
          { key: "name_en", label: "英文名称", example: "Shanghai Auto Parts" },
          { key: "contact_person", label: "联系人", required: true, example: "张经理" },
          { key: "contact_email", label: "邮箱", example: "zhang@example.com" },
          { key: "contact_phone", label: "电话", example: "13800138001" },
          { key: "country", label: "国家", required: true, example: "中国" },
          { key: "address", label: "地址", example: "上海市浦东新区" },
          { key: "website", label: "官网", example: "www.example.com" },
          { key: "level", label: "等级", example: "normal/vip/strategic" },
          { key: "status", label: "状态", example: "active/silent/lost" },
          { key: "credit_limit", label: "信用额度", example: "100000" },
          { key: "payment_terms", label: "付款条件", example: "T/T 30天" },
          { key: "preferred_currency", label: "偏好币种", example: "USD/CNY/EUR" },
          { key: "notes", label: "备注", example: "战略客户" },
        ]}
        onImport={async (data) => {
          const errors: { row: number; message: string }[] = [];
          let success = 0;
          for (const row of data) {
            try {
              if (!useMockMode) {
                await createCustomer({
                  name: row.name, name_en: row.name_en, contact_person: row.contact_person,
                  contact_email: row.contact_email, contact_phone: row.contact_phone,
                  country: row.country, address: row.address, website: row.website,
                  level: row.level, status: row.status,
                  credit_limit: Number(row.credit_limit) || 0,
                  payment_terms: row.payment_terms, preferred_currency: row.preferred_currency,
                  notes: row.notes,
                });
              } else {
                const newCustomer: Customer = {
                  id: crypto.randomUUID(), code: row.code || generateCode("CU"),
                  name: row.name, name_en: row.name_en, contact_person: row.contact_person,
                  contact_email: row.contact_email, contact_phone: row.contact_phone,
                  country: row.country, address: row.address, website: row.website,
                  level: row.level || "normal", status: row.status || "active",
                  credit_limit: Number(row.credit_limit) || 0,
                  payment_terms: row.payment_terms || "T/T",
                  preferred_currency: row.preferred_currency || "USD",
                  notes: row.notes,
                  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                } as Customer;
                useStore.setState((state) => ({ customers: [newCustomer, ...state.customers] }));
              }
              success++;
            } catch (err: any) {
              errors.push({ row: data.indexOf(row) + 2, message: err.message || "导入失败" });
            }
          }
          if (!useMockMode) queryClient.invalidateQueries({ queryKey: ["customers"] });
          return { success, errors };
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除客户"
        description={`确定要删除客户「${deleteTarget?.name}」吗？此操作为软删除。`}
        variant="destructive"
        confirmText="确认删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// =================== 客户表单弹窗 ===================
function CustomerFormDialog({ open, onOpenChange, customer, onSave }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer: Customer | null;
  onSave: (data: Partial<Customer>) => void;
}) {
  const [form, setForm] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (open) {
      setForm(customer ? { ...customer } : {
        name: "", name_en: "", contact_person: "", contact_email: "", contact_phone: "",
        country: "", address: "", website: "", level: "normal", status: "active",
        credit_limit: 0, payment_terms: "T/T", preferred_currency: "USD", notes: "",
      });
    }
  }, [open, customer]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{customer ? "编辑客户" : "新建客户"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="客户名称" required><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="英文名称"><Input value={form.name_en || ""} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></Field>
          <Field label="联系人" required><Input value={form.contact_person || ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} required /></Field>
          <Field label="联系邮箱"><Input type="email" value={form.contact_email || ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></Field>
          <Field label="联系电话"><Input value={form.contact_phone || ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></Field>
          <Field label="国家" required><Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} required /></Field>
          <Field label="地址" full><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="官网"><Input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
          <Field label="等级">
            <Select value={form.level || "normal"} onValueChange={(v) => setForm({ ...form, level: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="normal">普通</SelectItem><SelectItem value="vip">VIP</SelectItem><SelectItem value="strategic">战略</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="状态">
            <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">活跃</SelectItem><SelectItem value="silent">沉默</SelectItem><SelectItem value="lost">流失</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="信用额度"><Input type="number" value={form.credit_limit || 0} onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })} min={0} /></Field>
          <Field label="付款条件"><Input value={form.payment_terms || ""} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} /></Field>
          <Field label="偏好币种">
            <Select value={form.preferred_currency || "USD"} onValueChange={(v) => setForm({ ...form, preferred_currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD 美元</SelectItem><SelectItem value="CNY">CNY 人民币</SelectItem><SelectItem value="EUR">EUR 欧元</SelectItem><SelectItem value="GBP">GBP 英镑</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="备注" full><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => { if (!form.name || !form.contact_person || !form.country) { toast.error("请填写必填项"); return; } onSave(form); }} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">{customer ? "保存修改" : "创建客户"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}
