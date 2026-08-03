"use client";
import { useState, useMemo } from "react";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Receivable, Payable } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function FinancePage() {
  const { receivables, payables, addAuditLog } = useStore();
  const [tab, setTab] = useState("receivables");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");

  const filteredRec = useMemo(() => {
    let list = [...receivables].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.code.toLowerCase().includes(q) || (r.customer_name || "").toLowerCase().includes(q)); }
    if (statusFilter && statusFilter !== "__all__") list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [receivables, search, statusFilter]);

  const filteredPay = useMemo(() => {
    let list = [...payables].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.code.toLowerCase().includes(q) || (r.supplier_name || "").toLowerCase().includes(q)); }
    if (statusFilter && statusFilter !== "__all__") list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [payables, search, statusFilter]);

  const totalRec = receivables.reduce((s, r) => s + Number(r.amount), 0);
  const totalReceived = receivables.reduce((s, r) => s + Number(r.received_amount), 0);
  const totalPay = payables.reduce((s, p) => s + Number(p.amount), 0);
  const totalPaid = payables.reduce((s, p) => s + Number(p.paid_amount), 0);

  const handleReceive = (rec: Receivable) => {
    useStore.setState((state) => ({ receivables: state.receivables.map((r) => r.id === rec.id ? { ...r, received_amount: r.amount, status: "received" as const } : r) }));
    addAuditLog({ user_id: "u-finance", user_name: "赵财务", module: "receivables", action: "update", record_id: rec.id, record_code: rec.code, after_data: { received_amount: rec.amount, status: "received" }, description: `确认收款 ${rec.code} 金额 ${rec.amount} ${rec.currency}` });
    toast.success("收款成功");
  };

  const handlePay = (pay: Payable) => {
    useStore.setState((state) => ({ payables: state.payables.map((p) => p.id === pay.id ? { ...p, paid_amount: p.amount, status: "paid" as const } : p) }));
    addAuditLog({ user_id: "u-finance", user_name: "赵财务", module: "payables", action: "update", record_id: pay.id, record_code: pay.code, after_data: { paid_amount: pay.amount, status: "paid" }, description: `确认付款 ${pay.code} 金额 ${pay.amount} ${pay.currency}` });
    toast.success("付款成功");
  };

  const recColumns: Column<Receivable>[] = [
    { key: "code", header: "应收编号", width: "140px", render: (r) => <span className="text-xs font-mono">{r.code}</span> },
    { key: "customer_name", header: "客户" },
    { key: "order_code", header: "关联订单", width: "120px", render: (r) => <span className="text-xs font-mono">{r.order_code || "-"}</span> },
    { key: "amount", header: "应收金额", width: "120px", align: "right", render: (r) => <span className="text-sm font-medium">{formatCurrency(r.amount, r.currency)}</span> },
    { key: "received_amount", header: "已收", width: "120px", align: "right", render: (r) => <span className="text-sm text-green-600">{formatCurrency(r.received_amount, r.currency)}</span> },
    { key: "due_date", header: "到期日", width: "110px", render: (r) => <span className="text-xs">{formatDate(r.due_date)}</span> },
    { key: "status", header: "状态", width: "100px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "操作", width: "100px", align: "center", render: (r) => r.status !== "received" && r.status !== "cancelled" ? <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-xs" onClick={() => handleReceive(r)}>确认收款</Button> : <span className="text-xs text-gray-400">-</span> },
  ];

  const payColumns: Column<Payable>[] = [
    { key: "code", header: "应付编号", width: "140px", render: (r) => <span className="text-xs font-mono">{r.code}</span> },
    { key: "supplier_name", header: "供应商" },
    { key: "category", header: "类别", width: "120px" },
    { key: "amount", header: "应付金额", width: "120px", align: "right", render: (r) => <span className="text-sm font-medium">{formatCurrency(r.amount, r.currency)}</span> },
    { key: "paid_amount", header: "已付", width: "120px", align: "right", render: (r) => <span className="text-sm text-green-600">{formatCurrency(r.paid_amount, r.currency)}</span> },
    { key: "due_date", header: "到期日", width: "110px", render: (r) => <span className="text-xs">{formatDate(r.due_date)}</span> },
    { key: "status", header: "状态", width: "100px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "操作", width: "100px", align: "center", render: (r) => r.status !== "paid" && r.status !== "cancelled" ? <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-xs" onClick={() => handlePay(r)}>确认付款</Button> : <span className="text-xs text-gray-400">-</span> },
  ];

  return (
    <div>
      <PageHeader title="财务管理" description="应收账款与应付账款管理" actions={
        <ActionButton icon="export" onClick={async () => {
          const { exportToExcel } = await import("@/lib/excel-utils");
          const data = tab === "receivables" ? filteredRec : filteredPay;
          const fileName = tab === "receivables" ? "应收账款" : "应付账款";
          if (tab === "receivables") {
            exportToExcel(data, fileName, "应收", [
              { key: "code", label: "应收编号" },
              { key: "customer_name", label: "客户" },
              { key: "order_code", label: "关联订单" },
              { key: "category", label: "类别" },
              { key: "amount", label: "应收金额" },
              { key: "received_amount", label: "已收金额" },
              { key: "currency", label: "币种" },
              { key: "due_date", label: "到期日" },
              { key: "status", label: "状态" },
              { key: "created_at", label: "创建时间" },
            ]);
          } else {
            exportToExcel(data, fileName, "应付", [
              { key: "code", label: "应付编号" },
              { key: "supplier_name", label: "供应商" },
              { key: "category", label: "类别" },
              { key: "amount", label: "应付金额" },
              { key: "paid_amount", label: "已付金额" },
              { key: "currency", label: "币种" },
              { key: "due_date", label: "到期日" },
              { key: "status", label: "状态" },
              { key: "created_at", label: "创建时间" },
            ]);
          }
        }}>导出Excel</ActionButton>
      } />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-gray-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" />应收总额</div>
          <div className="text-xl font-bold text-[#38BDF8] mt-1">{formatCurrency(totalRec, "CNY")}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-xs text-gray-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" />已收金额</div>
          <div className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalReceived, "CNY")}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="text-xs text-gray-600 flex items-center gap-1"><TrendingDown className="h-3 w-3" />应付总额</div>
          <div className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(totalPay, "CNY")}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-xs text-gray-600 flex items-center gap-1"><TrendingDown className="h-3 w-3" />已付金额</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{formatCurrency(totalPaid, "CNY")}</div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="receivables"><DollarSign className="h-3.5 w-3.5 mr-1.5" />应收账款 ({receivables.length})</TabsTrigger>
          <TabsTrigger value="payables"><DollarSign className="h-3.5 w-3.5 mr-1.5" />应付账款 ({payables.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="receivables" className="mt-3">
          <FilterBar onReset={() => { setSearch(""); setStatusFilter("__all__"); }}>
            <SearchInput value={search} onChange={setSearch} placeholder="搜索应收编号/客户..." className="w-64" />
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="pending">待收款</SelectItem><SelectItem value="partial">部分收款</SelectItem><SelectItem value="received">已收款</SelectItem><SelectItem value="overdue">已逾期</SelectItem><SelectItem value="cancelled">已取消</SelectItem></SelectContent></Select>
          </FilterBar>
          <GenericDataTable data={filteredRec} columns={recColumns} rowKey={(r) => r.id} emptyTitle="暂无应收账款" />
        </TabsContent>
        <TabsContent value="payables" className="mt-3">
          <FilterBar onReset={() => { setSearch(""); setStatusFilter("__all__"); }}>
            <SearchInput value={search} onChange={setSearch} placeholder="搜索应付编号/供应商..." className="w-64" />
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="pending">待付款</SelectItem><SelectItem value="partial">部分付款</SelectItem><SelectItem value="paid">已付款</SelectItem><SelectItem value="overdue">已逾期</SelectItem><SelectItem value="cancelled">已取消</SelectItem></SelectContent></Select>
          </FilterBar>
          <GenericDataTable data={filteredPay} columns={payColumns} rowKey={(r) => r.id} emptyTitle="暂无应付账款" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
