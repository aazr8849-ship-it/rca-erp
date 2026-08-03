"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Eye, Pencil, Trash2, Package, Search, ImagePlus, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Product } from "@/lib/types";
import { formatCurrency, formatDate, generateCode } from "@/lib/utils";

export default function ProductsPage() {
  const router = useRouter();
  const { products, categories, inventory, addAuditLog } = useStore();
  const [search, setSearch] = useState("");
  const [exactMatch, setExactMatch] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter((p) => !p.deleted_at);
    if (search) {
      if (exactMatch) {
        list = list.filter((p) => p.oem_number === search);
      } else {
        const q = search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.oem_number || "").toLowerCase().includes(q));
      }
    }
    if (categoryFilter && categoryFilter !== "__all__") list = list.filter((p) => p.category_id === categoryFilter);
    if (statusFilter && statusFilter !== "__all__") list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [products, search, exactMatch, categoryFilter, statusFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getStock = (productId: string) => inventory.find((i) => i.product_id === productId);

  const columns: Column<Product>[] = [
    { key: "code", header: "编码", width: "100px", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "name", header: "产品名称", render: (r) => (
      <Link href={`/products/${r.id}`} className="flex items-center gap-2">
        {r.image_urls && r.image_urls.length > 0 ? (
          <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 shrink-0">
            <img src={r.image_urls[0]} alt={r.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0"><Package className="h-4 w-4" /></div>
        )}
        <div><div className="text-sm font-medium text-slate-800 hover:text-[#38BDF8] hover:underline">{r.name}</div>{r.name_en && <div className="text-xs text-slate-500">{r.name_en}</div>}</div>
      </Link>
    ) },
    { key: "oem_number", header: "OEM号", width: "140px", render: (r) => <span className="text-xs font-mono">{r.oem_number || "-"}</span> },
    { key: "category_name", header: "分类", width: "100px" },
    { key: "brand", header: "品牌", width: "80px" },
    { key: "cost_price", header: "成本价", width: "100px", align: "right", render: (r) => <span className="text-xs">{formatCurrency(r.cost_price, "CNY")}</span> },
    { key: "sale_price", header: "销售价", width: "100px", align: "right", render: (r) => <span className="text-xs font-medium text-[#38BDF8]">{formatCurrency(r.sale_price, "USD")}</span> },
    { key: "stock", header: "库存", width: "100px", align: "right", render: (r) => { const s = getStock(r.id); return s ? <span className={s.available_quantity < 50 ? "text-red-500 text-xs font-medium" : "text-xs"}>{s.available_quantity} {r.unit}</span> : <span className="text-xs text-gray-400">无库存</span>; } },
    { key: "status", header: "状态", width: "80px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "操作", width: "120px", align: "center", render: (r) => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/products/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditing(r); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    ) },
  ];

  const handleSave = (data: Partial<Product>) => {
    const cat = categories.find((c) => c.id === data.category_id);
    if (editing) {
      useStore.setState((state) => ({ products: state.products.map((p) => p.id === editing.id ? { ...p, ...data, category_name: cat?.name, updated_at: new Date().toISOString() } : p) }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "products", action: "update", record_id: editing.id, record_code: editing.code, description: `更新产品 ${editing.name} (${editing.code})` });
      toast.success("产品信息已更新");
    } else {
      const newProd: Product = {
        id: crypto.randomUUID(), code: generateCode("PD"),
        ...data, category_name: cat?.name,
        cost_price: data.cost_price || 0, sale_price: data.sale_price || 0,
        unit: data.unit || "个", status: data.status || "active",
        image_urls: data.image_urls || [], applicable_models: data.applicable_models || [],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as Product;
      useStore.setState((state) => ({ products: [newProd, ...state.products] }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "products", action: "create", record_id: newProd.id, record_code: newProd.code, after_data: newProd as any, description: `创建产品 ${newProd.name} (${newProd.code})` });
      toast.success("产品创建成功");
    }
    setFormOpen(false); setEditing(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const now = new Date().toISOString();
    useStore.setState((state) => ({ products: state.products.map((p) => p.id === deleteTarget.id ? { ...p, deleted_at: now } : p) }));
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "products", action: "delete", record_id: deleteTarget.id, record_code: deleteTarget.code, description: `删除产品 ${deleteTarget.name} (${deleteTarget.code})` });
    toast.success("产品已删除");
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader title="产品管理" description={`共 ${filtered.length} 条产品记录`} actions={
        <>
          <ActionButton icon="export" onClick={async () => { const { exportProductsWithImages } = await import("@/lib/product-excel"); exportProductsWithImages(filtered); }}>导出Excel</ActionButton>
          <ActionButton icon="import" onClick={() => setImportOpen(true)}>导入Excel</ActionButton>
          <ActionButton icon="add" onClick={() => { setEditing(null); setFormOpen(true); }}>新建产品</ActionButton>
        </>
      } />
      <FilterBar onReset={() => { setSearch(""); setExactMatch(false); setCategoryFilter("__all__"); setStatusFilter("__all__"); setPage(1); }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索产品名/OEM号..." className="w-64" />
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Switch checked={exactMatch} onCheckedChange={setExactMatch} />
          <span>OEM精确匹配</span>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="全部分类" /></SelectTrigger>
          <SelectContent><SelectItem value="__all__">全部分类</SelectItem>{categories.filter((c) => !c.parent_id).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="active">在售</SelectItem><SelectItem value="discontinued">停产</SelectItem></SelectContent>
        </Select>
      </FilterBar>
      <GenericDataTable data={paged} columns={columns} pagination={{ page, pageSize, total: filtered.length, onPageChange: setPage, onPageSizeChange: setPageSize }} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/products/${r.id}`)} emptyTitle="暂无产品" />
      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} onSave={handleSave} />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        moduleName="产品"
        templateFilename="产品导入模板"
        fileAccept=".zip,.xlsx,.xls,.csv"
        extraHint="💡 导出时会生成 ZIP 包（Excel + images/ 文件夹）。导入时上传 ZIP 包可自动还原图片，上传 Excel 则不带图片。"
        customDownloadTemplate={async () => { const { downloadProductTemplate } = await import("@/lib/product-excel"); downloadProductTemplate(); }}
        customParse={async (file) => {
          if (file.name.endsWith(".zip")) {
            const { parseProductZipFile } = await import("@/lib/product-excel");
            return await parseProductZipFile(file);
          } else {
            // 普通 Excel 文件，用标准解析
            const { parseExcelFile } = await import("@/lib/excel-utils");
            const headerMap: Record<string, string> = {
              "编码": "code", "产品名称": "name", "英文名称": "name_en", "OEM号": "oem_number",
              "分类": "category_name", "品牌": "brand", "单位": "unit", "重量(kg)": "weight_kg",
              "包装长(cm)": "package_length_cm", "包装宽(cm)": "package_width_cm", "包装高(cm)": "package_height_cm",
              "成本价": "cost_price", "销售价": "sale_price", "适用车型": "applicable_models",
              "状态": "status", "图片文件": "image_files", "描述": "description",
            };
            return await parseExcelFile(file, headerMap);
          }
        }}
        columns={[
          { key: "code", label: "编码", example: "留空则自动生成" },
          { key: "name", label: "产品名称", required: true, example: "前制动片" },
          { key: "name_en", label: "英文名称", example: "Front Brake Pad" },
          { key: "oem_number", label: "OEM号", example: "OEM-TOYOTA-001" },
          { key: "category_name", label: "分类", example: "制动系统" },
          { key: "brand", label: "品牌", example: "Bosch" },
          { key: "unit", label: "单位", required: true, example: "套" },
          { key: "weight_kg", label: "重量(kg)", example: "1.2" },
          { key: "package_length_cm", label: "包装长(cm)", example: "25" },
          { key: "package_width_cm", label: "包装宽(cm)", example: "18" },
          { key: "package_height_cm", label: "包装高(cm)", example: "5" },
          { key: "cost_price", label: "成本价", example: "35.00" },
          { key: "sale_price", label: "销售价", required: true, example: "58.00" },
          { key: "applicable_models", label: "适用车型", example: "Toyota Camry,Corolla" },
          { key: "status", label: "状态", example: "active/discontinued" },
          { key: "image_files", label: "图片文件", example: "PD001-1.jpg,PD001-2.png" },
          { key: "description", label: "描述", example: "适用于丰田卡罗拉" },
        ]}
        onImport={async (data) => {
          const errors: { row: number; message: string }[] = [];
          let success = 0;
          const existingCodes = new Set(useStore.getState().products.map((p) => p.code));

          data.forEach((row, idx) => {
            if (!row.name) { errors.push({ row: idx + 2, message: `第${idx + 2}行：产品名称不能为空` }); return; }
            if (!row.unit) { errors.push({ row: idx + 2, message: `第${idx + 2}行：单位不能为空` }); return; }
            if (!row.sale_price) { errors.push({ row: idx + 2, message: `第${idx + 2}行：销售价不能为空` }); return; }

            const code = row.code || generateCode("PD");
            if (existingCodes.has(code)) { errors.push({ row: idx + 2, message: `第${idx + 2}行：编码 ${code} 已存在，已跳过` }); return; }
            existingCodes.add(code);

            const cat = useStore.getState().categories.find((c) => c.name === row.category_name);

            const newProd: Product = {
              id: crypto.randomUUID(), code,
              name: row.name, name_en: row.name_en || "",
              oem_number: row.oem_number || "",
              category_id: cat?.id, category_name: cat?.name || row.category_name || "",
              brand: row.brand || "",
              image_urls: row.image_urls || [],
              cost_price: Number(row.cost_price) || 0,
              sale_price: Number(row.sale_price) || 0,
              unit: row.unit,
              weight_kg: Number(row.weight_kg) || 0,
              package_length_cm: Number(row.package_length_cm) || 0,
              package_width_cm: Number(row.package_width_cm) || 0,
              package_height_cm: Number(row.package_height_cm) || 0,
              status: ["active", "discontinued"].includes(row.status) ? row.status : "active",
              applicable_models: row.applicable_models ? (Array.isArray(row.applicable_models) ? row.applicable_models : String(row.applicable_models).split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)) : [],
              description: row.description || "",
              created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            };
            useStore.setState((state) => ({ products: [newProd, ...state.products] }));
            addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "products", action: "create", record_id: newProd.id, record_code: newProd.code, after_data: newProd as any, description: `Excel导入创建产品 ${newProd.name} (${newProd.code})` });
            success++;
          });
          return { success, errors };
        }}
      />
      <ConfirmDialog open={!!deleteTarget} title="删除产品" description={`确定要删除产品「${deleteTarget?.name}」吗？`} variant="destructive" confirmText="确认删除" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function ProductFormDialog({ open, onOpenChange, product, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; product: Product | null; onSave: (d: Partial<Product>) => void }) {
  const { categories } = useStore();
  const [form, setForm] = useState<Partial<Product>>({});
  const [modelInput, setModelInput] = useState("");

  useEffect(() => {
    if (open) {
      setForm(product ? { ...product } : { name: "", name_en: "", oem_number: "", category_id: "", brand: "", cost_price: 0, sale_price: 0, unit: "个", weight_kg: 0, package_length_cm: 0, package_width_cm: 0, package_height_cm: 0, status: "active", applicable_models: [], description: "" });
      setModelInput("");
    }
  }, [open, product]);

  const addModel = () => {
    if (!modelInput.trim()) return;
    setForm({ ...form, applicable_models: [...(form.applicable_models || []), modelInput.trim()] });
    setModelInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product ? "编辑产品" : "新建产品"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="产品名称" required><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="英文名称"><Input value={form.name_en || ""} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></Field>
          <Field label="OEM号"><Input value={form.oem_number || ""} onChange={(e) => setForm({ ...form, oem_number: e.target.value })} placeholder="如 OEM-TOYOTA-001" /></Field>
          <Field label="品牌"><Input value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
          <Field label="分类">
            <Select value={form.category_id || ""} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.parent_id ? "  └ " : ""}{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="单位"><Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="个/套/台..." /></Field>
          <Field label="成本价(CNY)"><Input type="number" step="0.01" value={form.cost_price || 0} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} min={0} /></Field>
          <Field label="销售价(USD)"><Input type="number" step="0.01" value={form.sale_price || 0} onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })} min={0} /></Field>
          <Field label="重量(kg)"><Input type="number" step="0.01" value={form.weight_kg || 0} onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })} min={0} /></Field>
          <Field label="包装尺寸(长×宽×高 cm)">
            <div className="flex items-center gap-1">
              <Input type="number" step="0.1" value={form.package_length_cm || 0} onChange={(e) => setForm({ ...form, package_length_cm: Number(e.target.value) })} min={0} placeholder="长" className="text-center" />
              <span className="text-slate-400 text-xs">×</span>
              <Input type="number" step="0.1" value={form.package_width_cm || 0} onChange={(e) => setForm({ ...form, package_width_cm: Number(e.target.value) })} min={0} placeholder="宽" className="text-center" />
              <span className="text-slate-400 text-xs">×</span>
              <Input type="number" step="0.1" value={form.package_height_cm || 0} onChange={(e) => setForm({ ...form, package_height_cm: Number(e.target.value) })} min={0} placeholder="高" className="text-center" />
            </div>
          </Field>
          <Field label="状态">
            <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">在售</SelectItem><SelectItem value="discontinued">停产</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="适用车型" full>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={modelInput} onChange={(e) => setModelInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addModel(); } }} placeholder="输入车型后回车添加" />
                <Button type="button" size="sm" onClick={addModel}>添加</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">{(form.applicable_models || []).map((m, i) => <Badge key={i} variant="secondary" className="text-xs">{m}<button type="button" onClick={() => setForm({ ...form, applicable_models: (form.applicable_models || []).filter((_, idx) => idx !== i) })} className="ml-1 hover:text-red-500">×</button></Badge>)}</div>
            </div>
          </Field>
          <Field label="产品图片" full>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                {(form.image_urls || []).map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden border border-slate-200 group">
                    <img src={url} alt={`产品图片${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_urls: (form.image_urls || []).filter((_, idx) => idx !== i) })}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label="删除图片"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-sky-500/90 text-white text-[9px] text-center py-0.5">主图</span>}
                  </div>
                ))}
                <label className="w-24 h-24 rounded-md border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/40 cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-sky-500 transition-colors">
                  <ImagePlus className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">添加图片</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      // 校验大小（≤2MB）和类型
                      const valid = files.filter((f) => {
                        if (!f.type.startsWith("image/")) { toast.error(`${f.name} 不是图片文件`); return false; }
                        if (f.size > 2 * 1024 * 1024) { toast.error(`${f.name} 超过 2MB`); return false; }
                        return true;
                      });
                      // 转 base64 data URL（mock 数据存储，不实际上传）
                      const dataUrls = await Promise.all(valid.map((f) => new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(f);
                      })));
                      setForm({ ...form, image_urls: [...(form.image_urls || []), ...dataUrls] });
                      toast.success(`已添加 ${dataUrls.length} 张图片`);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400">支持 JPG/PNG/WEBP/GIF，单张≤2MB，可选填，第一张为产品主图</p>
            </div>
          </Field>
          <Field label="产品描述" full><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => { if (!form.name) { toast.error("请填写产品名称"); return; } onSave(form); }} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">{product ? "保存修改" : "创建产品"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}><Label className="text-xs text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>{children}</div>;
}
