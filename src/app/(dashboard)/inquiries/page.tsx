"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Eye, FileText, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader, ActionButton } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Inquiry } from "@/lib/types";
import { formatDate, generateFormattedCode, SOURCE_LABELS } from "@/lib/utils";

export default function InquiriesPage() {
  const router = useRouter();
  const { inquiries, customers, addAuditLog } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [priorityFilter, setPriorityFilter] = useState("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    let list = [...inquiries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((i) => i.code.toLowerCase().includes(q) || i.subject.toLowerCase().includes(q) || (i.customer_name || "").toLowerCase().includes(q)); }
    if (statusFilter && statusFilter !== "__all__") list = list.filter((i) => i.status === statusFilter);
    if (priorityFilter && priorityFilter !== "__all__") list = list.filter((i) => i.priority === priorityFilter);
    return list;
  }, [inquiries, search, statusFilter, priorityFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Inquiry>[] = [
    { key: "code", header: "询盘号", width: "140px", render: (r) => <Link href={`/inquiries/${r.id}`} className="text-xs font-mono text-[#3298cb] hover:underline">{r.code}</Link> },
    { key: "customer_name", header: "客户", width: "180px", render: (r) => <Link href={`/customers/${r.customer_id}`} className="text-sm hover:underline">{r.customer_name}</Link> },
    { key: "subject", header: "主题", render: (r) => <span className="text-sm">{r.subject}</span> },
    { key: "source", header: "来源", width: "80px", render: (r) => <span className="text-xs">{SOURCE_LABELS[r.source]}</span> },
    { key: "priority", header: "优先级", width: "80px", render: (r) => <StatusBadge type="priority" status={r.priority} /> },
    { key: "items_count", header: "明细", width: "60px", align: "center", render: (r) => <span className="text-xs">{(r.items || []).length}</span> },
    { key: "status", header: "状态", width: "80px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "created_at", header: "创建时间", width: "120px", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
    { key: "actions", header: "操作", width: "80px", align: "center", render: (r) => (
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/inquiries/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button>
    ) },
  ];

  // 状态变更
  const STATUS_FLOW: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["quoted", "cancelled"],
    quoted: ["closed", "cancelled"],
    closed: [],
    cancelled: [],
  };
  const STATUS_LABELS: Record<string, string> = { pending: "处理中", processing: "已报价", quoted: "已关闭", closed: "已关闭", cancelled: "已取消" };

  return (
    <div>
      <PageHeader title="询盘管理" description={`共 ${filtered.length} 条询盘记录`} actions={<ActionButton icon="add" onClick={() => toast.info("询盘创建功能：请通过客户详情页或新建询盘按钮创建")}>新建询盘</ActionButton>} />
      <FilterBar onReset={() => { setSearch(""); setStatusFilter("__all__"); setPriorityFilter("__all__"); setPage(1); }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索询盘号/主题/客户..." className="w-64" />
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="pending">待处理</SelectItem><SelectItem value="processing">处理中</SelectItem><SelectItem value="quoted">已报价</SelectItem><SelectItem value="closed">已关闭</SelectItem><SelectItem value="cancelled">已取消</SelectItem></SelectContent></Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部优先级" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部优先级</SelectItem><SelectItem value="high">高</SelectItem><SelectItem value="medium">中</SelectItem><SelectItem value="low">低</SelectItem></SelectContent></Select>
      </FilterBar>
      <GenericDataTable data={paged} columns={columns} pagination={{ page, pageSize, total: filtered.length, onPageChange: setPage, onPageSizeChange: setPageSize }} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/inquiries/${r.id}`)} emptyTitle="暂无询盘" />
    </div>
  );
}
