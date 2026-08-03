"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, History } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AuditLog } from "@/lib/types";
import { formatDate, ACTION_LABELS, MODULE_LABELS } from "@/lib/utils";

export default function AuditLogsPage() {
  const router = useRouter();
  const { auditLogs } = useStore();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("__all__");
  const [actionFilter, setActionFilter] = useState("__all__");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => {
    let list = [...auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((l) => l.description.toLowerCase().includes(q) || (l.record_code || "").toLowerCase().includes(q) || (l.user_name || "").toLowerCase().includes(q)); }
    if (moduleFilter && moduleFilter !== "__all__") list = list.filter((l) => l.module === moduleFilter);
    if (actionFilter && actionFilter !== "__all__") list = list.filter((l) => l.action === actionFilter);
    return list;
  }, [auditLogs, search, moduleFilter, actionFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<AuditLog>[] = [
    { key: "created_at", header: "时间", width: "150px", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at, "YYYY-MM-DD HH:mm:ss")}</span> },
    { key: "user_name", header: "操作人", width: "100px" },
    { key: "module", header: "模块", width: "120px", render: (r) => <span className="text-xs">{MODULE_LABELS[r.module] || r.module}</span> },
    { key: "action", header: "操作", width: "100px", render: (r) => <StatusBadge status={r.action} customLabel={ACTION_LABELS[r.action]} /> },
    { key: "record_code", header: "记录编码", width: "140px", render: (r) => <span className="text-xs font-mono">{r.record_code || "-"}</span> },
    { key: "description", header: "操作描述", render: (r) => <span className="text-sm">{r.description}</span> },
    { key: "actions", header: "操作", width: "80px", align: "center", render: (r) => <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/audit-logs/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div>
      <PageHeader title="操作日志" description={`共 ${filtered.length} 条操作记录`} actions={
        <ActionButton icon="export" onClick={async () => { const { exportToExcel } = await import("@/lib/excel-utils"); exportToExcel(filtered, "操作日志", "日志", [
          { key: "created_at", label: "时间" },
          { key: "user_name", label: "操作人" },
          { key: "module", label: "模块" },
          { key: "action", label: "操作类型" },
          { key: "record_code", label: "记录编码" },
          { key: "description", label: "操作描述" },
        ]); }}>导出Excel</ActionButton>
      } />
      <FilterBar onReset={() => { setSearch(""); setModuleFilter("__all__"); setActionFilter("__all__"); setPage(1); }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索描述/编码/操作人..." className="w-64" />
        <Select value={moduleFilter} onValueChange={setModuleFilter}><SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="全部模块" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部模块</SelectItem>{Object.entries(MODULE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
        <Select value={actionFilter} onValueChange={setActionFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部操作" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部操作</SelectItem>{Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
      </FilterBar>
      <GenericDataTable data={paged} columns={columns} pagination={{ page, pageSize, total: filtered.length, onPageChange: setPage }} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/audit-logs/${r.id}`)} emptyTitle="暂无操作日志" />
    </div>
  );
}
