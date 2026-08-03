"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Ship as ShipIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Shipment } from "@/lib/types";
import { formatDate, SHIPPING_METHOD_LABELS } from "@/lib/utils";

export default function ShipmentsPage() {
  const router = useRouter();
  const { shipments } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [methodFilter, setMethodFilter] = useState("__all__");

  const filtered = useMemo(() => {
    let list = [...shipments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((s) => s.code.toLowerCase().includes(q) || (s.order_code || "").toLowerCase().includes(q) || (s.customer_name || "").toLowerCase().includes(q)); }
    if (statusFilter && statusFilter !== "__all__") list = list.filter((s) => s.status === statusFilter);
    if (methodFilter && methodFilter !== "__all__") list = list.filter((s) => s.shipping_method === methodFilter);
    return list;
  }, [shipments, search, statusFilter, methodFilter]);

  const columns: Column<Shipment>[] = [
    { key: "code", header: "发货号", width: "140px", render: (r) => <Link href={`/shipments/${r.id}`} className="text-xs font-mono text-[#38BDF8] hover:underline">{r.code}</Link> },
    { key: "order_code", header: "订单号", width: "140px", render: (r) => r.order_code ? <Link href={`/orders/${r.order_id}`} className="text-xs font-mono text-[#38BDF8] hover:underline">{r.order_code}</Link> : "-" },
    { key: "customer_name", header: "客户" },
    { key: "shipment_date", header: "发货日期", width: "110px", render: (r) => <span className="text-xs">{formatDate(r.shipment_date)}</span> },
    { key: "shipping_method", header: "运输方式", width: "100px", render: (r) => <span className="text-xs">{SHIPPING_METHOD_LABELS[r.shipping_method]}</span> },
    { key: "tracking_number", header: "运单号", width: "140px", render: (r) => <span className="text-xs font-mono">{r.tracking_number || "-"}</span> },
    { key: "total_weight", header: "总重量", width: "100px", align: "right", render: (r) => <span className="text-xs">{r.total_weight ? `${r.total_weight}kg` : "-"}</span> },
    { key: "status", header: "状态", width: "100px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "操作", width: "80px", align: "center", render: (r) => <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/shipments/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div>
      <PageHeader title="发货计划" description={`共 ${filtered.length} 条发货记录`} actions={
        <ActionButton icon="export" onClick={async () => { const { exportToExcel } = await import("@/lib/excel-utils"); exportToExcel(filtered, "发货列表", "发货", [
          { key: "code", label: "发货号" },
          { key: "order_code", label: "订单号" },
          { key: "customer_name", label: "客户" },
          { key: "shipment_date", label: "发货日期" },
          { key: "shipping_method", label: "运输方式" },
          { key: "tracking_number", label: "运单号" },
          { key: "container_number", label: "集装箱号" },
          { key: "bl_number", label: "提单号" },
          { key: "total_weight", label: "总重量" },
          { key: "total_cartons", label: "总箱数" },
          { key: "status", label: "状态" },
          { key: "created_at", label: "创建时间" },
        ]); }}>导出Excel</ActionButton>
      } />
      <FilterBar onReset={() => { setSearch(""); setStatusFilter("__all__"); setMethodFilter("__all__"); }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索发货号/订单/客户..." className="w-64" />
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="draft">草稿</SelectItem><SelectItem value="shipped">已发货</SelectItem><SelectItem value="in_transit">运输中</SelectItem><SelectItem value="delivered">已送达</SelectItem><SelectItem value="cancelled">已取消</SelectItem></SelectContent></Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部方式" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部方式</SelectItem><SelectItem value="sea">海运</SelectItem><SelectItem value="air">空运</SelectItem><SelectItem value="express">快递</SelectItem><SelectItem value="land">陆运</SelectItem></SelectContent></Select>
      </FilterBar>
      <GenericDataTable data={filtered} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/shipments/${r.id}`)} emptyTitle="暂无发货记录" />
    </div>
  );
}
