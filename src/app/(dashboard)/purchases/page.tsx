"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Truck, Check, X, Send, Package, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PurchaseRequest, PurchaseOrder } from "@/lib/types";
import { formatCurrency, formatDate, generateFormattedCode } from "@/lib/utils";

export default function PurchasesPage() {
  const router = useRouter();
  const { purchaseRequests, purchaseOrders, suppliers, addAuditLog } = useStore();
  const [tab, setTab] = useState("requests");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");

  const filteredPRs = useMemo(() => {
    let list = [...purchaseRequests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.code.toLowerCase().includes(q) || (r.order_code || "").toLowerCase().includes(q)); }
    if (statusFilter && statusFilter !== "__all__") list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [purchaseRequests, search, statusFilter]);

  const filteredPOs = useMemo(() => {
    let list = [...purchaseOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.code.toLowerCase().includes(q) || (r.supplier_name || "").toLowerCase().includes(q)); }
    if (statusFilter && statusFilter !== "__all__") list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [purchaseOrders, search, statusFilter]);

  const handlePRAction = (pr: PurchaseRequest, action: "approve" | "reject" | "convert") => {
    if (action === "approve") {
      useStore.setState((state) => ({ purchaseRequests: state.purchaseRequests.map((p) => p.id === pr.id ? { ...p, status: "approved", updated_at: new Date().toISOString() } : p) }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "purchase_requests", action: "approve", record_id: pr.id, record_code: pr.code, description: `请购单 ${pr.code} 审批通过` });
      toast.success("已审批通过");
    } else if (action === "reject") {
      useStore.setState((state) => ({ purchaseRequests: state.purchaseRequests.map((p) => p.id === pr.id ? { ...p, status: "rejected", updated_at: new Date().toISOString() } : p) }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "purchase_requests", action: "reject", record_id: pr.id, record_code: pr.code, description: `请购单 ${pr.code} 审批拒绝` });
      toast.success("已拒绝");
    } else if (action === "convert") {
      if (!suppliers[0]) { toast.error("没有供应商可创建采购订单"); return; }
      const code = generateFormattedCode("PO");
      const totalAmount = (pr.items || []).reduce((s, it) => s + Number(it.quantity) * 50, 0); // 默认单价50
      const newPO: PurchaseOrder = {
        id: crypto.randomUUID(), code, supplier_id: suppliers[0].id, supplier_name: suppliers[0].name,
        purchase_request_id: pr.id, order_date: new Date().toISOString(), currency: "CNY", total_amount: totalAmount,
        status: "pending", trade_terms: "EXW", payment_terms: "T/T 30天",
        items: (pr.items || []).map((it) => ({ product_id: it.product_id, product_name: it.product_name, quantity: it.quantity, unit: it.unit, unit_price: 50, arrived_quantity: 0, warehoused_quantity: 0 })),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      useStore.setState((state) => ({
        purchaseOrders: [newPO, ...state.purchaseOrders],
        purchaseRequests: state.purchaseRequests.map((p) => p.id === pr.id ? { ...p, status: "converted", updated_at: new Date().toISOString() } : p),
      }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "purchase_orders", action: "create", record_id: newPO.id, record_code: newPO.code, after_data: newPO as any, description: `从请购单 ${pr.code} 转为采购订单 ${code}` });
      toast.success(`已转为采购订单 ${code}`);
      setTab("orders");
    }
  };

  const handlePOAction = (po: PurchaseOrder, action: string) => {
    const now = new Date().toISOString();
    if (action === "approve") {
      useStore.setState((state) => ({ purchaseOrders: state.purchaseOrders.map((p) => p.id === po.id ? { ...p, status: "approved", updated_at: now } : p) }));
      toast.success("已审批");
    } else if (action === "sent") {
      useStore.setState((state) => ({ purchaseOrders: state.purchaseOrders.map((p) => p.id === po.id ? { ...p, status: "sent", updated_at: now } : p) }));
      toast.success("已发送给供应商");
    } else if (action === "arrived") {
      useStore.setState((state) => ({
        purchaseOrders: state.purchaseOrders.map((p) => p.id === po.id ? { ...p, status: "arrived", updated_at: now, items: (p.items || []).map((it) => ({ ...it, arrived_quantity: it.quantity })) } : p),
      }));
      toast.success("已标记全部到货");
    } else if (action === "warehoused") {
      useStore.setState((state) => ({
        purchaseOrders: state.purchaseOrders.map((p) => p.id === po.id ? { ...p, status: "warehoused", updated_at: now, items: (p.items || []).map((it) => ({ ...it, warehoused_quantity: it.arrived_quantity })) } : p),
        inventory: state.inventory.map((inv) => {
          const item = po.items?.find((it) => it.product_id === inv.product_id);
          if (!item) return inv;
          return { ...inv, quantity: inv.quantity + item.quantity, available_quantity: inv.available_quantity + item.quantity, updated_at: now };
        }),
      }));
      toast.success("已入库");
    } else if (action === "paid") {
      const code = generateFormattedCode("PAY");
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);
      const newPayable = {
        id: crypto.randomUUID(), code, supplier_id: po.supplier_id, supplier_name: po.supplier_name,
        purchase_order_id: po.id, category: "purchase_payment", amount: po.total_amount, paid_amount: 0,
        currency: po.currency, due_date: dueDate.toISOString(), status: "pending" as const, created_at: now,
      };
      useStore.setState((state) => ({
        purchaseOrders: state.purchaseOrders.map((p) => p.id === po.id ? { ...p, status: "paid", updated_at: now } : p),
        payables: [newPayable, ...state.payables],
      }));
      toast.success("已生成应付账款");
    }
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "purchase_orders", action: "status_change", record_id: po.id, record_code: po.code, after_data: { status: action }, description: `采购订单 ${po.code} 状态变更：${po.status} → ${action}` });
  };

  const prColumns: Column<PurchaseRequest>[] = [
    { key: "code", header: "请购号", width: "140px", render: (r) => <Link href={`/purchases/${r.id}`} className="text-xs font-mono text-[#38BDF8] hover:underline">{r.code}</Link> },
    { key: "order_code", header: "关联订单", render: (r) => r.order_code ? <Link href={`/orders/${r.order_id}`} className="text-xs font-mono text-[#38BDF8] hover:underline">{r.order_code}</Link> : "-" },
    { key: "items_count", header: "明细", width: "60px", align: "center", render: (r) => <span className="text-xs">{(r.items || []).length}</span> },
    { key: "status", header: "状态", width: "100px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "created_at", header: "创建时间", width: "120px", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
    { key: "actions", header: "操作", width: "200px", align: "center", render: (r) => (
      <div className="flex items-center justify-center gap-1">
        {r.status === "pending" && <>
          <Button size="sm" variant="default" className="h-7 bg-green-600 hover:bg-green-700 text-xs" onClick={(e) => { e.stopPropagation(); handlePRAction(r, "approve"); }}><Check className="h-3 w-3 mr-0.5" />批准</Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handlePRAction(r, "reject"); }}><X className="h-3 w-3 mr-0.5" />拒绝</Button>
        </>}
        {r.status === "approved" && <Button size="sm" variant="default" className="h-7 bg-[#38BDF8] hover:bg-[#0EA5E9] text-xs" onClick={(e) => { e.stopPropagation(); handlePRAction(r, "convert"); }}>转采购订单</Button>}
        {r.status === "converted" && <span className="text-xs text-gray-400">已转换</span>}
        {r.status === "rejected" && <span className="text-xs text-red-500">已拒绝</span>}
      </div>
    ) },
  ];

  const poColumns: Column<PurchaseOrder>[] = [
    { key: "code", header: "采购号", width: "140px", render: (r) => <Link href={`/purchases/${r.id}`} className="text-xs font-mono text-[#38BDF8] hover:underline">{r.code}</Link> },
    { key: "supplier_name", header: "供应商", render: (r) => <Link href={`/suppliers/${r.supplier_id}`} className="text-sm hover:underline">{r.supplier_name}</Link> },
    { key: "order_date", header: "下单日期", width: "110px", render: (r) => <span className="text-xs">{formatDate(r.order_date)}</span> },
    { key: "total_amount", header: "金额", width: "120px", align: "right", render: (r) => <span className="text-sm font-medium">{formatCurrency(r.total_amount, r.currency)}</span> },
    { key: "status", header: "状态", width: "110px", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "操作", width: "180px", align: "center", render: (r) => (
      <div className="flex items-center justify-center gap-1">
        {r.status === "pending" && <Button size="sm" className="h-7 bg-[#38BDF8] hover:bg-[#0EA5E9] text-xs" onClick={(e) => { e.stopPropagation(); handlePOAction(r, "approved"); }}>审批</Button>}
        {r.status === "approved" && <Button size="sm" className="h-7 bg-[#38BDF8] hover:bg-[#0EA5E9] text-xs" onClick={(e) => { e.stopPropagation(); handlePOAction(r, "sent"); }}><Send className="h-3 w-3 mr-0.5" />发送</Button>}
        {r.status === "sent" && <Button size="sm" className="h-7 bg-[#38BDF8] hover:bg-[#0EA5E9] text-xs" onClick={(e) => { e.stopPropagation(); handlePOAction(r, "arrived"); }}><Package className="h-3 w-3 mr-0.5" />到货登记</Button>}
        {(r.status === "partial_arrived" || r.status === "arrived") && <Button size="sm" className="h-7 bg-[#38BDF8] hover:bg-[#0EA5E9] text-xs" onClick={(e) => { e.stopPropagation(); handlePOAction(r, "warehoused"); }}>入库</Button>}
        {r.status === "warehoused" && <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-xs" onClick={(e) => { e.stopPropagation(); handlePOAction(r, "paid"); }}><DollarSign className="h-3 w-3 mr-0.5" />付款</Button>}
        {r.status === "paid" && <span className="text-xs text-gray-400">已完成</span>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="采购管理" description="请购单与采购订单全流程管理" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="requests"><ClipboardList className="h-3.5 w-3.5 mr-1.5" />请购单 ({purchaseRequests.length})</TabsTrigger>
          <TabsTrigger value="orders"><Truck className="h-3.5 w-3.5 mr-1.5" />采购订单 ({purchaseOrders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-3">
          <FilterBar onReset={() => { setSearch(""); setStatusFilter("__all__"); }}>
            <SearchInput value={search} onChange={setSearch} placeholder="搜索请购号/订单号..." className="w-64" />
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="pending">待审批</SelectItem><SelectItem value="approved">已批准</SelectItem><SelectItem value="rejected">已拒绝</SelectItem><SelectItem value="converted">已转换</SelectItem></SelectContent></Select>
          </FilterBar>
          <GenericDataTable data={filteredPRs} columns={prColumns} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/purchases/${r.id}`)} emptyTitle="暂无请购单" />
        </TabsContent>
        <TabsContent value="orders" className="mt-3">
          <FilterBar onReset={() => { setSearch(""); setStatusFilter("__all__"); }}>
            <SearchInput value={search} onChange={setSearch} placeholder="搜索采购号/供应商..." className="w-64" />
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="全部状态" /></SelectTrigger><SelectContent><SelectItem value="__all__">全部状态</SelectItem><SelectItem value="pending">待审批</SelectItem><SelectItem value="approved">已审批</SelectItem><SelectItem value="sent">已发送</SelectItem><SelectItem value="partial_arrived">部分到货</SelectItem><SelectItem value="arrived">已到货</SelectItem><SelectItem value="warehoused">已入库</SelectItem><SelectItem value="paid">已付款</SelectItem></SelectContent></Select>
          </FilterBar>
          <GenericDataTable data={filteredPOs} columns={poColumns} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/purchases/${r.id}`)} emptyTitle="暂无采购订单" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
