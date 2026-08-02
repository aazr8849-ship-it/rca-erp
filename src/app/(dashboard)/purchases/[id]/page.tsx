"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Truck } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { EmptyState } from "@/components/common/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { purchaseRequests, purchaseOrders, suppliers, orders } = useStore();

  // 优先按PO查找，再按PR查找
  const po = purchaseOrders.find((p) => p.id === params.id);
  const pr = purchaseRequests.find((p) => p.id === params.id);

  if (!po && !pr) return <EmptyState icon={ClipboardList} title="记录不存在" action={<Button onClick={() => router.push("/purchases")}>返回列表</Button>} />;

  if (po) {
    const supplier = suppliers.find((s) => s.id === po.supplier_id);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-800">{po.code}</h1>
                <StatusBadge status={po.status} />
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{po.supplier_name} · 创建于 {formatDate(po.created_at)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <InfoCard title="采购订单信息" icon={Truck} className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <InfoItem label="采购编码" value={<span className="font-mono">{po.code}</span>} />
              <InfoItem label="供应商" value={<Link href={`/suppliers/${po.supplier_id}`} className="text-[#38BDF8] hover:underline">{po.supplier_name}</Link>} />
              <InfoItem label="下单日期" value={formatDate(po.order_date)} />
              <InfoItem label="币种" value={po.currency} />
              <InfoItem label="总金额" value={<span className="text-[#38BDF8] font-medium">{formatCurrency(po.total_amount, po.currency)}</span>} />
              <InfoItem label="状态" value={<StatusBadge status={po.status} />} />
              <InfoItem label="贸易条款" value={po.trade_terms || "-"} />
              <InfoItem label="付款条件" value={po.payment_terms || "-"} />
            </div>
          </InfoCard>

          <InfoCard title="供应商信息">
            {supplier ? (
              <div className="space-y-3 text-sm">
                <div><div className="text-xs text-gray-500">名称</div><div className="font-medium">{supplier.name}</div></div>
                <div><div className="text-xs text-gray-500">联系人</div><div>{supplier.contact_person}</div></div>
                <div><div className="text-xs text-gray-500">电话</div><div>{supplier.contact_phone || "-"}</div></div>
                <div><div className="text-xs text-gray-500">国家</div><div>{supplier.country}</div></div>
              </div>
            ) : <div className="text-sm text-gray-500">供应商信息不存在</div>}
          </InfoCard>
        </div>

        <InfoCard title="采购明细">
          <Table>
            <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">序号</TableHead><TableHead className="text-xs">产品名称</TableHead><TableHead className="text-xs text-right">数量</TableHead><TableHead className="text-xs">单位</TableHead><TableHead className="text-xs text-right">单价</TableHead><TableHead className="text-xs text-right">已到货</TableHead><TableHead className="text-xs text-right">已入库</TableHead><TableHead className="text-xs text-right">小计</TableHead></TableRow></TableHeader>
            <TableBody>
              {(po.items || []).map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-sm">{item.product_name}</TableCell>
                  <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                  <TableCell className="text-xs">{item.unit}</TableCell>
                  <TableCell className="text-sm text-right">{formatCurrency(item.unit_price, po.currency)}</TableCell>
                  <TableCell className="text-sm text-right text-green-600">{item.arrived_quantity || 0}</TableCell>
                  <TableCell className="text-sm text-right text-blue-600">{item.warehoused_quantity || 0}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{formatCurrency(Number(item.quantity) * Number(item.unit_price), po.currency)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-medium"><TableCell colSpan={7} className="text-right text-sm">合计：</TableCell><TableCell className="text-right text-[#38BDF8] text-base">{formatCurrency(po.total_amount, po.currency)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </InfoCard>
      </div>
    );
  }

  // PR 详情
  const order = orders.find((o) => o.id === pr!.order_id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{pr!.code}</h1>
              <StatusBadge status={pr!.status} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">创建于 {formatDate(pr!.created_at)}</div>
          </div>
        </div>
      </div>

      <InfoCard title="请购单信息" icon={ClipboardList}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <InfoItem label="请购编码" value={<span className="font-mono">{pr!.code}</span>} />
          <InfoItem label="关联订单" value={order ? <Link href={`/orders/${order.id}`} className="text-[#38BDF8] hover:underline">{order.code}</Link> : "-"} />
          <InfoItem label="状态" value={<StatusBadge status={pr!.status} />} />
          <InfoItem label="创建时间" value={formatDate(pr!.created_at)} />
        </div>
      </InfoCard>

      <InfoCard title="请购明细">
        <Table>
          <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">序号</TableHead><TableHead className="text-xs">产品名称</TableHead><TableHead className="text-xs text-right">数量</TableHead><TableHead className="text-xs">单位</TableHead><TableHead className="text-xs">备注</TableHead></TableRow></TableHeader>
          <TableBody>
            {(pr!.items || []).map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-xs">{idx + 1}</TableCell>
                <TableCell className="text-sm">{item.product_name}</TableCell>
                <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                <TableCell className="text-xs">{item.unit}</TableCell>
                <TableCell className="text-xs text-gray-500">{item.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </InfoCard>
    </div>
  );
}
