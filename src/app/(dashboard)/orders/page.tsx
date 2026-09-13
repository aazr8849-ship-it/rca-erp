"use client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { GenericFormDialog } from "@/components/common/generic-form-dialog";
import { createOrder } from "@/lib/api/orders";
import { PageHeader, ActionButton } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrdersPage() {
  const router = useRouter();
  const { orders } = useStore();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    let list = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.code.toLowerCase().includes(q) || (r.customer_name || "").toLowerCase().includes(q)); }
    if (statusFilter && statusFilter !== "__all__") list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [orders, search, statusFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Order>[] = [
    { key: "code", header: "订单号", width: "140px", render: (r) => <Link href={`/orders/${r.id}`} className="text-xs font-mono text-[#2E8BFF] hover:underline">{r.code}</Link> },
    { key: "customer_name", header: "客户", render: (r) => <Link href={`/customers/${r.customer_id}`} className="text-sm hover:underline">{r.customer_name}</Link> },
    { key: "order_date", header: "下单日期", width: "110px", render: (r) => <span className="text-xs">{formatDate(r.order_date)}</span> },
    { key: "delivery_date", header: "交货日期", width: "110px", render: (r) => <span className="text-xs">{formatDate(r.delivery_date)}</span> },
    { key: "currency", header: "币种", width: "60px" },
    { key: "total_amount", header: "总金额", width: "120px", align: "right", render: (r) => <span className="text-sm font-medium text-[#2E8BFF]">{formatCurrency(r.total_amount, r.currency)}</span> },
    { key: "items_count", header: "明细", width: "60px", align: "center", render: (r) => <span className="text-xs">{(r.items || []).length}</span> },
    { key: "status", header: "状态", width: "90px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "操作", width: "80px", align: "center", render: (r) => <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${r.id}`); }}><Eye className="h-3.5 w-3.5" /></Button> },
  ];

  const orderFormConfig = {
    moduleName: "订单",
    fields: [
      { key: "customer_id", label: "客户", type: "entity-customer", required: true },
      { key: "currency", label: "币种", type: "select", options: [
        { value: "USD", label: "USD" }, { value: "CNY", label: "CNY" }, { value: "EUR", label: "EUR" },
      ], defaultValue: "USD" },
      { key: "trade_terms", label: "贸易条款", type: "select", options: [
        { value: "FOB", label: "FOB" }, { value: "CIF", label: "CIF" }, { value: "EXW", label: "EXW" },
      ], defaultValue: "FOB" },
    ],
    itemFields: [
      { key: "product_id", label: "产品", type: "entity-product" },
      { key: "quantity", label: "数量", type: "number", defaultValue: 1 },
      { key: "unit_price", label: "单价", type: "number", defaultValue: 0 },
    ],
    itemLabel: "订单明细",
    onSubmit: async (data: any) => { await createOrder(data); },
  };

  return (
    <div>
      <GenericFormDialog open={createOpen} onOpenChange={setCreateOpen} config={orderFormConfig} onSuccess={() => window.location.reload()} />
      <PageHeader title="订单管理" description={`共 ${filtered.length} 条订单记录`} actions={<>
        <ActionButton icon="export" onClick={async () => { const { exportToExcel } = await import("@/lib/excel-utils"); exportToExcel(filtered, "订单列表", "订单", [
          { key: "code", label: "订单号" },
          { key: "customer_name", label: "客户" },
          { key: "order_date", label: "下单日期" },
          { key: "delivery_date", label: "交货日期" },
          { key: "currency", label: "币种" },
          { key: "total_amount", label: "总金额" },
          { key: "status", label: "状态" },
          { key: "trade_terms", label: "贸易条款" },
          { key: "payment_terms", label: "付款条件" },
          { key: "created_at", label: "创建时间" },
        ]); }}>导出Excel</ActionButton>
        <ActionButton icon="add" onClick={() => setCreateOpen(true)}>新建订单</ActionButton>
      </>
      } />
      <FilterBar onReset={() => { setSearch(""); setStatusFilter("__all__"); setPage(1); }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索订单号/客户..." className="w-64" />
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="pending">待处理</SelectItem><SelectItem value="confirmed">已确认</SelectItem><SelectItem value="producing">生产中</SelectItem><SelectItem value="shipped">已发货</SelectItem><SelectItem value="completed">已完成</SelectItem><SelectItem value="cancelled">已取消</SelectItem></SelectContent></Select>
      </FilterBar>
      <GenericDataTable data={paged} columns={columns} pagination={{ page, pageSize, total: filtered.length, onPageChange: setPage, onPageSizeChange: setPageSize }} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/orders/${r.id}`)} emptyTitle="暂无订单" />
    </div>
  );
}
