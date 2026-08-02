"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FolderOpen, FileText } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader, ActionButton } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Document } from "@/lib/types";
import { formatDate, DOCUMENT_TYPE_LABELS, generateCode } from "@/lib/utils";

export default function DocumentsPage() {
  const router = useRouter();
  const { documents, orders, addAuditLog } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");

  const filtered = useMemo(() => {
    let list = [...documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((d) => d.code.toLowerCase().includes(q) || (d.order_code || "").toLowerCase().includes(q)); }
    if (typeFilter && typeFilter !== "__all__") list = list.filter((d) => d.document_type === typeFilter);
    if (statusFilter && statusFilter !== "__all__") list = list.filter((d) => d.status === statusFilter);
    return list;
  }, [documents, search, typeFilter, statusFilter]);

  const handleGenerate = (doc: Document) => {
    useStore.setState((state) => ({ documents: state.documents.map((d) => d.id === doc.id ? { ...d, status: "issued" as const, file_url: `#/documents/${doc.id}/preview`, issued_date: new Date().toISOString(), updated_at: new Date().toISOString() } : d) }));
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "documents", action: "status_change", record_id: doc.id, record_code: doc.code, after_data: { status: "issued" }, description: `生成${DOCUMENT_TYPE_LABELS[doc.document_type]} ${doc.code}` });
    toast.success("单证已生成");
  };

  const columns: Column<Document>[] = [
    { key: "code", header: "单证编号", width: "140px", render: (r) => <Link href={`/documents/${r.id}`} className="text-xs font-mono text-[#3298cb] hover:underline">{r.code}</Link> },
    { key: "order_code", header: "关联订单", width: "140px", render: (r) => r.order_code ? <Link href={`/orders/${r.order_id}`} className="text-xs font-mono text-[#3298cb] hover:underline">{r.order_code}</Link> : "-" },
    { key: "document_type", header: "单证类型", width: "120px", render: (r) => <span className="text-xs">{DOCUMENT_TYPE_LABELS[r.document_type]}</span> },
    { key: "status", header: "状态", width: "100px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "issued_date", header: "签发日期", width: "120px", render: (r) => <span className="text-xs">{r.issued_date ? formatDate(r.issued_date) : "-"}</span> },
    { key: "created_at", header: "创建时间", width: "120px", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
    { key: "actions", header: "操作", width: "180px", align: "center", render: (r) => (
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/documents/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button>
        {r.status === "draft" && <Button size="sm" className="h-7 bg-[#3298cb] hover:bg-[#2c87b3] text-xs" onClick={(e) => { e.stopPropagation(); handleGenerate(r); }}>生成PDF</Button>}
        {r.status === "issued" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast.info("PDF预览功能：实际项目中会打开PDF文件"); }}>预览</Button>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="单证管理" description={`共 ${filtered.length} 条单证记录`} actions={<ActionButton icon="add" onClick={() => { const order = orders[0]; if (!order) { toast.error("没有订单可创建单证"); return; } const newDoc: Document = { id: crypto.randomUUID(), code: generateCode("DOC"), order_id: order.id, order_code: order.code, document_type: "commercial_invoice", status: "draft", created_at: new Date().toISOString() } as Document; useStore.setState((state) => ({ documents: [newDoc, ...state.documents] })); toast.success("已创建单证草稿"); }}>新建单证</ActionButton>} />
      <FilterBar onReset={() => { setSearch(""); setTypeFilter("__all__"); setStatusFilter("__all__"); }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索单证编号/订单号..." className="w-64" />
        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="全部类型" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部类型</SelectItem>{Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="draft">草稿</SelectItem><SelectItem value="issued">已签发</SelectItem><SelectItem value="void">已作废</SelectItem></SelectContent></Select>
      </FilterBar>
      <GenericDataTable data={filtered} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/documents/${r.id}`)} emptyTitle="暂无单证" />
    </div>
  );
}
