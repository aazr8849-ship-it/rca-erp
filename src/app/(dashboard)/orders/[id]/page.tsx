"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, ClipboardList, Truck, Ship, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PurchaseRequest, PurchaseOrder, Shipment, Receivable } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const CONFIRM_MSGS: Record<string, string> = {
  confirmed: "确认订单将冻结库存并生成应收账款，是否继续？",
  producing: "确认开始生产？",
  shipped: "标记发货将扣减库存，是否继续？",
  completed: "确认完成此订单？",
  cancelled: "取消订单将释放冻结库存并取消关联的请购和应收，是否继续？",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, purchaseRequests, purchaseOrders, shipments, receivables, inventory, addAuditLog } = useStore();
  const order = orders.find((o) => o.id === params.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState("__all__");

  if (!order) return <EmptyState icon={ShoppingCart} title="订单不存在" action={<Button onClick={() => router.push("/orders")}>返回列表</Button>} />;

  const relatedPRs = purchaseRequests.filter((p) => p.order_id === order.id);
  const relatedPOs = purchaseOrders.filter((p) => relatedPRs.some((pr) => pr.id === p.purchase_request_id));
  const relatedShipments = shipments.filter((s) => s.order_id === order.id);
  const relatedReceivables = receivables.filter((r) => r.order_id === order.id);

  const STATUS_OPTIONS: Record<string, { label: string; status: string; variant: "default" | "destructive" }[]> = {
    pending: [{ label: "确认订单", status: "confirmed", variant: "default" }, { label: "取消订单", status: "cancelled", variant: "destructive" }],
    confirmed: [{ label: "开始生产", status: "producing", variant: "default" }, { label: "取消订单", status: "cancelled", variant: "destructive" }],
    producing: [{ label: "标记发货", status: "shipped", variant: "default" }, { label: "取消订单", status: "cancelled", variant: "destructive" }],
    shipped: [{ label: "标记完成", status: "completed", variant: "default" }],
    completed: [],
    cancelled: [],
  };

  const handleStatusChange = (status: string) => { setTargetStatus(status); setConfirmOpen(true); };

  const doStatusChange = () => {
    const from = order.status;
    const to = targetStatus;
    const now = new Date().toISOString();
    const updates: any = { status: to, updated_at: now };
    if (to === "confirmed") updates.confirmed_at = now;
    if (to === "shipped") updates.shipped_at = now;
    if (to === "completed") updates.completed_at = now;

    // 模拟状态机副作用：库存变更
    if (to === "confirmed") {
      // 冻结库存
      useStore.setState((state) => ({
        inventory: state.inventory.map((inv) => {
          const item = order.items?.find((it) => it.product_id === inv.product_id);
          if (!item) return inv;
          return { ...inv, frozen_quantity: inv.frozen_quantity + item.quantity, available_quantity: inv.available_quantity - item.quantity, updated_at: now };
        }),
      }));
    } else if (to === "shipped") {
      // 扣减库存
      useStore.setState((state) => ({
        inventory: state.inventory.map((inv) => {
          const item = order.items?.find((it) => it.product_id === inv.product_id);
          if (!item) return inv;
          return { ...inv, quantity: inv.quantity - item.quantity, frozen_quantity: Math.max(0, inv.frozen_quantity - item.quantity), updated_at: now };
        }),
      }));
    } else if (to === "cancelled") {
      // 释放冻结
      useStore.setState((state) => ({
        inventory: state.inventory.map((inv) => {
          const item = order.items?.find((it) => it.product_id === inv.product_id);
          if (!item) return inv;
          return { ...inv, frozen_quantity: Math.max(0, inv.frozen_quantity - item.quantity), available_quantity: inv.available_quantity + item.quantity, updated_at: now };
        }),
      }));
    }

    useStore.setState((state) => ({ orders: state.orders.map((o) => o.id === order.id ? { ...o, ...updates } : o) }));
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "orders", action: "status_change", record_id: order.id, record_code: order.code, before_data: { status: from }, after_data: { status: to }, description: `订单状态变更：${from} → ${to}` });
    toast.success("状态变更成功");
    setConfirmOpen(false);
  };

  const buttons = STATUS_OPTIONS[order.status] || [];

  const prColumns: Column<PurchaseRequest>[] = [
    { key: "code", header: "请购号", render: (r) => <Link href={`/purchases/${r.id}`} className="text-xs font-mono text-[#38BDF8] hover:underline">{r.code}</Link> },
    { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
    { key: "items_count", header: "明细", render: (r) => <span className="text-xs">{(r.items || []).length} 项</span> },
    { key: "created_at", header: "创建时间", render: (r) => <span className="text-xs">{formatDate(r.created_at)}</span> },
  ];

  const poColumns: Column<PurchaseOrder>[] = [
    { key: "code", header: "采购号", render: (r) => <Link href={`/purchases/${r.id}`} className="text-xs font-mono text-[#38BDF8] hover:underline">{r.code}</Link> },
    { key: "supplier_name", header: "供应商" },
    { key: "total_amount", header: "金额", align: "right", render: (r) => formatCurrency(r.total_amount, r.currency) },
    { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const shipColumns: Column<Shipment>[] = [
    { key: "code", header: "发货号", render: (r) => <span className="text-xs font-mono">{r.code}</span> },
    { key: "shipment_date", header: "发货日期", render: (r) => formatDate(r.shipment_date) },
    { key: "shipping_method", header: "运输方式" },
    { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const recColumns: Column<Receivable>[] = [
    { key: "code", header: "应收编号", render: (r) => <span className="text-xs font-mono">{r.code}</span> },
    { key: "amount", header: "金额", align: "right", render: (r) => formatCurrency(r.amount, r.currency) },
    { key: "received_amount", header: "已收", align: "right", render: (r) => formatCurrency(r.received_amount, r.currency) },
    { key: "due_date", header: "到期日", render: (r) => formatDate(r.due_date) },
    { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{order.code}</h1>
              <StatusBadge status={order.status} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{order.customer_name} · 创建于 {formatDate(order.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {buttons.map((b) => (
            <Button key={b.status} onClick={() => handleStatusChange(b.status)} variant={b.variant} className={b.variant === "default" ? "bg-[#38BDF8] hover:bg-[#0EA5E9]" : ""}>{b.label}</Button>
          ))}
        </div>
      </div>

      {/* 状态时间轴 */}
      <OrderStatusTimeline currentStatus={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard title="订单信息" icon={ShoppingCart} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="订单编码" value={<span className="font-mono">{order.code}</span>} />
            <InfoItem label="客户" value={<Link href={`/customers/${order.customer_id}`} className="text-[#38BDF8] hover:underline">{order.customer_name}</Link>} />
            <InfoItem label="下单日期" value={formatDate(order.order_date)} />
            <InfoItem label="交货日期" value={formatDate(order.delivery_date)} />
            <InfoItem label="币种" value={order.currency} />
            <InfoItem label="总金额" value={<span className="text-[#38BDF8] font-medium">{formatCurrency(order.total_amount, order.currency)}</span>} />
            <InfoItem label="状态" value={<StatusBadge status={order.status} />} />
            <InfoItem label="贸易条款" value={order.trade_terms || "-"} />
            <InfoItem label="付款条件" value={order.payment_terms || "-"} />
            {order.confirmed_at && <InfoItem label="确认时间" value={formatDate(order.confirmed_at, "YYYY-MM-DD HH:mm")} />}
            {order.shipped_at && <InfoItem label="发货时间" value={formatDate(order.shipped_at, "YYYY-MM-DD HH:mm")} />}
            {order.completed_at && <InfoItem label="完成时间" value={formatDate(order.completed_at, "YYYY-MM-DD HH:mm")} />}
          </div>
        </InfoCard>

        <InfoCard title="金额信息" icon={DollarSign}>
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-md p-3"><div className="text-xs text-gray-600">订单总金额</div><div className="text-2xl font-bold text-[#38BDF8] mt-1">{formatCurrency(order.total_amount, order.currency)}</div></div>
            <div className="bg-orange-50 rounded-md p-3"><div className="text-xs text-gray-600">明细数量</div><div className="text-2xl font-bold text-orange-600 mt-1">{(order.items || []).length} 项</div></div>
            <div className="bg-green-50 rounded-md p-3"><div className="text-xs text-gray-600">应收账款</div><div className="text-xl font-bold text-green-600 mt-1">{relatedReceivables.length} 笔</div></div>
          </div>
        </InfoCard>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">订单明细</TabsTrigger>
          <TabsTrigger value="purchases">请购单 ({relatedPRs.length})</TabsTrigger>
          <TabsTrigger value="pos">采购订单 ({relatedPOs.length})</TabsTrigger>
          <TabsTrigger value="shipments">发货单 ({relatedShipments.length})</TabsTrigger>
          <TabsTrigger value="receivables">应收账款 ({relatedReceivables.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-3">
          <InfoCard>
            <Table>
              <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">序号</TableHead><TableHead className="text-xs">产品名称</TableHead><TableHead className="text-xs">OEM号</TableHead><TableHead className="text-xs text-right">数量</TableHead><TableHead className="text-xs">单位</TableHead><TableHead className="text-xs text-right">单价</TableHead><TableHead className="text-xs text-right">小计</TableHead></TableRow></TableHeader>
              <TableBody>
                {(order.items || []).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">{idx + 1}</TableCell>
                    <TableCell className="text-sm">{item.product_name}</TableCell>
                    <TableCell className="text-xs font-mono">{item.oem_number || "-"}</TableCell>
                    <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                    <TableCell className="text-xs">{item.unit}</TableCell>
                    <TableCell className="text-sm text-right">{formatCurrency(item.unit_price, order.currency)}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{formatCurrency(Number(item.quantity) * Number(item.unit_price), order.currency)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-medium"><TableCell colSpan={6} className="text-right text-sm">合计：</TableCell><TableCell className="text-right text-[#38BDF8] text-base">{formatCurrency(order.total_amount, order.currency)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </InfoCard>
        </TabsContent>
        <TabsContent value="purchases" className="mt-3"><GenericDataTable data={relatedPRs} columns={prColumns} emptyTitle="暂无请购单" /></TabsContent>
        <TabsContent value="pos" className="mt-3"><GenericDataTable data={relatedPOs} columns={poColumns} emptyTitle="暂无采购订单" /></TabsContent>
        <TabsContent value="shipments" className="mt-3"><GenericDataTable data={relatedShipments} columns={shipColumns} emptyTitle="暂无发货单" /></TabsContent>
        <TabsContent value="receivables" className="mt-3"><GenericDataTable data={relatedReceivables} columns={recColumns} emptyTitle="暂无应收账款" /></TabsContent>
      </Tabs>

      <ConfirmDialog open={confirmOpen} title="订单状态变更" description={CONFIRM_MSGS[targetStatus]} variant={targetStatus === "cancelled" ? "destructive" : "default"} confirmText="确认" onConfirm={doStatusChange} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}
