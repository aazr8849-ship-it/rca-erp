"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ship, Package } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { EmptyState } from "@/components/common/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, SHIPPING_METHOD_LABELS } from "@/lib/utils";

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { shipments, orders, customers } = useStore();
  const shipment = shipments.find((s) => s.id === params.id);
  const order = shipment ? orders.find((o) => o.id === shipment.order_id) : null;
  const customer = order ? customers.find((c) => c.id === order.customer_id) : null;

  if (!shipment) return <EmptyState icon={Ship} title="发货单不存在" action={<Button onClick={() => router.push("/shipments")}>返回列表</Button>} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{shipment.code}</h1>
              <StatusBadge status={shipment.status} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">订单 {shipment.order_code} · 发货日期 {formatDate(shipment.shipment_date)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard title="发货信息" icon={Ship} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="发货编码" value={<span className="font-mono">{shipment.code}</span>} />
            <InfoItem label="关联订单" value={shipment.order_code ? <Link href={`/orders/${shipment.order_id}`} className="text-[#3298cb] hover:underline">{shipment.order_code}</Link> : "-"} />
            <InfoItem label="客户" value={shipment.customer_name || "-"} />
            <InfoItem label="发货日期" value={formatDate(shipment.shipment_date)} />
            <InfoItem label="运输方式" value={SHIPPING_METHOD_LABELS[shipment.shipping_method]} />
            <InfoItem label="运单号" value={<span className="font-mono text-xs">{shipment.tracking_number || "-"}</span>} />
            <InfoItem label="集装箱号" value={shipment.container_number || "-"} />
            <InfoItem label="提单号" value={shipment.bl_number || "-"} />
            <InfoItem label="总重量" value={shipment.total_weight ? `${shipment.total_weight} kg` : "-"} />
            <InfoItem label="总箱数" value={shipment.total_cartons ? `${shipment.total_cartons} 箱` : "-"} />
            <InfoItem label="状态" value={<StatusBadge status={shipment.status} />} />
          </div>
        </InfoCard>

        {customer && (
          <InfoCard title="收货客户">
            <div className="space-y-2 text-sm">
              <div><div className="text-xs text-gray-500">客户名称</div><Link href={`/customers/${customer.id}`} className="font-medium text-[#3298cb] hover:underline">{customer.name}</Link></div>
              <div><div className="text-xs text-gray-500">联系人</div><div>{customer.contact_person}</div></div>
              <div><div className="text-xs text-gray-500">电话</div><div>{customer.contact_phone || "-"}</div></div>
              <div><div className="text-xs text-gray-500">国家</div><div>{customer.country}</div></div>
              <div><div className="text-xs text-gray-500">地址</div><div className="text-xs">{customer.address || "-"}</div></div>
            </div>
          </InfoCard>
        )}
      </div>

      <InfoCard title="发货明细" icon={Package}>
        <Table>
          <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">序号</TableHead><TableHead className="text-xs">产品名称</TableHead><TableHead className="text-xs text-right">数量</TableHead><TableHead className="text-xs text-right">箱数</TableHead><TableHead className="text-xs text-right">重量(kg)</TableHead></TableRow></TableHeader>
          <TableBody>
            {(shipment.items || []).map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-xs">{idx + 1}</TableCell>
                <TableCell className="text-sm">{item.product_name}</TableCell>
                <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                <TableCell className="text-sm text-right">{item.cartons}</TableCell>
                <TableCell className="text-sm text-right">{item.weight_kg}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </InfoCard>
    </div>
  );
}
