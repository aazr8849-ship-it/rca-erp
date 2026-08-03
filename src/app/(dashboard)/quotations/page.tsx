"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader, ActionButton } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Quotation } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function QuotationsPage() {
  const router = useRouter();
  const { quotations } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    let list = [...quotations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.code.toLowerCase().includes(q) || (r.customer_name || "").toLowerCase().includes(q)); }
    if (statusFilter && statusFilter !== "__all__") list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [quotations, search, statusFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Quotation>[] = [
    { key: "code", header: "报价号", width: "140px", render: (r) => <Link href={`/quotations/${r.id}`} className="text-xs font-mono text-[#38BDF8] hover:underline">{r.code}</Link> },
    { key: "customer_name", header: "客户", render: (r) => <Link href={`/customers/${r.customer_id}`} className="text-sm hover:underline">{r.customer_name}</Link> },
    { key: "pricing_status", header: "定价状态", width: "100px", render: (r) => <StatusBadge status={r.pricing_status} /> },
    { key: "status", header: "状态", width: "100px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "total_amount", header: "金额", width: "120px", align: "right", render: (r) => <span className="text-sm font-medium text-[#38BDF8]">{formatCurrency(r.total_amount, r.currency)}</span> },
    { key: "currency", header: "币种", width: "60px" },
    { key: "valid_until", header: "有效期至", width: "120px", render: (r) => { const expiring = new Date(r.valid_until).getTime() - Date.now() < 7 * 86400000; const expired = new Date(r.valid_until).getTime() < Date.now(); return <span className={`text-xs ${expired ? "text-red-500" : expiring ? "text-orange-500" : "text-gray-500"}`}>{formatDate(r.valid_until)}</span>; } },
    { key: "created_at", header: "创建时间", width: "120px", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
    { key: "actions", header: "操作", width: "80px", align: "center", render: (r) => <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/quotations/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div>
      <PageHeader title="报价管理" description={`共 ${filtered.length} 条报价记录`} actions={
        <ActionButton icon="export" onClick={async () => { const { exportToExcel } = await import("@/lib/excel-utils"); exportToExcel(filtered, "报价列表", "报价", [
          { key: "code", label: "报价号" },
          { key: "customer_name", label: "客户" },
          { key: "pricing_status", label: "定价状态" },
          { key: "status", label: "状态" },
          { key: "total_amount", label: "总金额" },
          { key: "currency", label: "币种" },
          { key: "valid_until", label: "有效期至" },
          { key: "trade_terms", label: "贸易条款" },
          { key: "payment_terms", label: "付款条件" },
          { key: "created_at", label: "创建时间" },
        ]); }}>导出Excel</ActionButton>
      } />
      <FilterBar onReset={() => { setSearch(""); setStatusFilter("__all__"); setPage(1); }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索报价号/客户..." className="w-64" />
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="draft">草稿</SelectItem><SelectItem value="sent">已发送</SelectItem><SelectItem value="accepted">已接受</SelectItem><SelectItem value="rejected">已拒绝</SelectItem><SelectItem value="expired">已过期</SelectItem></SelectContent></Select>
      </FilterBar>
      <GenericDataTable data={paged} columns={columns} pagination={{ page, pageSize, total: filtered.length, onPageChange: setPage, onPageSizeChange: setPageSize }} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/quotations/${r.id}`)} emptyTitle="暂无报价单" />
    </div>
  );
}
