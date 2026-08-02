"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Eye, Pencil, Trash2, Star, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader, ActionButton } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { Supplier } from "@/lib/types";
import { formatDate, generateCode, cn } from "@/lib/utils";

export default function SuppliersPage() {
  const router = useRouter();
  const { suppliers, addAuditLog } = useStore();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    let list = suppliers.filter((s) => !s.deleted_at);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.contact_person.toLowerCase().includes(q));
    }
    if (levelFilter && levelFilter !== "__all__") list = list.filter((s) => s.level === levelFilter);
    if (statusFilter && statusFilter !== "__all__") list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [suppliers, search, levelFilter, statusFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Supplier>[] = [
    { key: "code", header: "编码", width: "120px", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "name", header: "供应商名称", render: (r) => <Link href={`/suppliers/${r.id}`} className="text-sm font-medium text-[#3298cb] hover:underline">{r.name}</Link> },
    { key: "contact_person", header: "联系人", width: "100px", render: (r) => <div><div className="text-sm">{r.contact_person}</div><div className="text-xs text-gray-500">{r.contact_phone || "-"}</div></div> },
    { key: "country", header: "国家", width: "80px" },
    { key: "main_category", header: "主营品类", render: (r) => <div className="flex flex-wrap gap-1">{(r.main_category || []).slice(0, 3).map((c, i) => <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>)}{(r.main_category || []).length > 3 && <Badge variant="outline" className="text-[10px]">+{r.main_category.length - 3}</Badge>}</div> },
    { key: "level", header: "等级", width: "80px", render: (r) => <StatusBadge type="level" status={r.level} /> },
    { key: "quality_rating", header: "评级", width: "120px", render: (r) => <StarRating value={r.quality_rating} readOnly size={14} /> },
    { key: "lead_time_days", header: "交期", width: "80px", align: "right", render: (r) => <span className="text-xs">{r.lead_time_days}天</span> },
    { key: "status", header: "状态", width: "80px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "操作", width: "120px", align: "center", render: (r) => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/suppliers/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditing(r); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    ) },
  ];

  const handleSave = (data: Partial<Supplier>) => {
    if (editing) {
      useStore.setState((state) => ({ suppliers: state.suppliers.map((s) => s.id === editing.id ? { ...s, ...data, updated_at: new Date().toISOString() } : s) }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "suppliers", action: "update", record_id: editing.id, record_code: editing.code, before_data: editing as any, after_data: data as any, description: `更新供应商 ${editing.name} (${editing.code})` });
      toast.success("供应商信息已更新");
    } else {
      const newSup: Supplier = {
        id: crypto.randomUUID(), code: generateCode("SU"),
        name: data.name || "", name_en: data.name_en, contact_person: data.contact_person || "",
        contact_email: data.contact_email, contact_phone: data.contact_phone,
        country: data.country || "", address: data.address,
        level: data.level || "normal", status: data.status || "active",
        main_category: data.main_category || [], lead_time_days: data.lead_time_days || 15,
        quality_rating: data.quality_rating || 3, payment_terms: data.payment_terms || "T/T 30天",
        notes: data.notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as Supplier;
      useStore.setState((state) => ({ suppliers: [newSup, ...state.suppliers] }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "suppliers", action: "create", record_id: newSup.id, record_code: newSup.code, after_data: newSup as any, description: `创建供应商 ${newSup.name} (${newSup.code})` });
      toast.success("供应商创建成功");
    }
    setFormOpen(false); setEditing(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const now = new Date().toISOString();
    useStore.setState((state) => ({ suppliers: state.suppliers.map((s) => s.id === deleteTarget.id ? { ...s, deleted_at: now } : s) }));
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "suppliers", action: "delete", record_id: deleteTarget.id, record_code: deleteTarget.code, description: `删除供应商 ${deleteTarget.name} (${deleteTarget.code})` });
    toast.success("供应商已删除");
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader title="供应商管理" description={`共 ${filtered.length} 条供应商记录`} actions={
        <>
          <ActionButton icon="add" onClick={() => { setEditing(null); setFormOpen(true); }}>新建供应商</ActionButton>
        </>
      } />
      <FilterBar onReset={() => { setSearch(""); setLevelFilter("__all__"); setStatusFilter("__all__"); setPage(1); }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索供应商..." className="w-64" />
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部等级" /></SelectTrigger>
          <SelectContent><SelectItem value="__all__">全部等级</SelectItem><SelectItem value="normal">普通</SelectItem><SelectItem value="preferred">优选</SelectItem><SelectItem value="strategic">战略</SelectItem></SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="active">活跃</SelectItem><SelectItem value="blacklisted">黑名单</SelectItem></SelectContent>
        </Select>
      </FilterBar>
      <GenericDataTable data={paged} columns={columns} pagination={{ page, pageSize, total: filtered.length, onPageChange: setPage, onPageSizeChange: setPageSize }} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/suppliers/${r.id}`)} emptyTitle="暂无供应商" emptyDescription="点击右上角「新建供应商」添加" />
      <SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} supplier={editing} onSave={handleSave} />
      <ConfirmDialog open={!!deleteTarget} title="删除供应商" description={`确定要删除供应商「${deleteTarget?.name}」吗？`} variant="destructive" confirmText="确认删除" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

export function StarRating({ value, onChange, readOnly, size = 20 }: { value: number; onChange?: (v: number) => void; readOnly?: boolean; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={readOnly} onClick={() => onChange?.(star)} onMouseEnter={() => !readOnly && setHover(star)} onMouseLeave={() => !readOnly && setHover(0)} className={cn(!readOnly && "cursor-pointer")}>
          <Star size={size} className={cn("transition", (hover || value) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
        </button>
      ))}
    </div>
  );
}

function SupplierFormDialog({ open, onOpenChange, supplier, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; supplier: Supplier | null; onSave: (d: Partial<Supplier>) => void }) {
  const [form, setForm] = useState<Partial<Supplier>>({});
  const [categoryInput, setCategoryInput] = useState("__all__");

  useEffect(() => {
    if (open) {
      setForm(supplier ? { ...supplier } : { name: "", name_en: "", contact_person: "", contact_email: "", contact_phone: "", country: "", address: "", level: "normal", status: "active", main_category: [], lead_time_days: 15, quality_rating: 3, payment_terms: "T/T 30天", notes: "" });
      setCategoryInput("");
    }
  }, [open, supplier]);

  const addCategory = () => {
    if (!categoryInput.trim()) return;
    setForm({ ...form, main_category: [...(form.main_category || []), categoryInput.trim()] });
    setCategoryInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{supplier ? "编辑供应商" : "新建供应商"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="供应商名称" required><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="英文名称"><Input value={form.name_en || ""} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></Field>
          <Field label="联系人" required><Input value={form.contact_person || ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} required /></Field>
          <Field label="联系邮箱"><Input type="email" value={form.contact_email || ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></Field>
          <Field label="联系电话"><Input value={form.contact_phone || ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></Field>
          <Field label="国家" required><Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} required /></Field>
          <Field label="地址" full><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="主营品类" full>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }} placeholder="输入品类后回车添加" />
                <Button type="button" size="sm" onClick={addCategory}>添加</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(form.main_category || []).map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {c}
                    <button type="button" onClick={() => setForm({ ...form, main_category: (form.main_category || []).filter((_, idx) => idx !== i) })} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </Field>
          <Field label="等级">
            <Select value={form.level || "normal"} onValueChange={(v) => setForm({ ...form, level: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="normal">普通</SelectItem><SelectItem value="preferred">优选</SelectItem><SelectItem value="strategic">战略</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="状态">
            <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">活跃</SelectItem><SelectItem value="blacklisted">黑名单</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="平均交期(天)"><Input type="number" value={form.lead_time_days || 0} onChange={(e) => setForm({ ...form, lead_time_days: Number(e.target.value) })} min={0} /></Field>
          <Field label="付款条件"><Input value={form.payment_terms || ""} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} /></Field>
          <Field label="质量评级" full>
            <StarRating value={form.quality_rating || 0} onChange={(v) => setForm({ ...form, quality_rating: v })} size={22} />
          </Field>
          <Field label="备注" full><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => { if (!form.name || !form.contact_person || !form.country) { toast.error("请填写必填项"); return; } onSave(form); }} className="bg-[#3298cb] hover:bg-[#2c87b3]">{supplier ? "保存修改" : "创建供应商"}</Button>
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
