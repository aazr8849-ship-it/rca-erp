"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderOpen, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate, DOCUMENT_TYPE_LABELS } from "@/lib/utils";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { documents, orders } = useStore();
  const doc = documents.find((d) => d.id === params.id);
  const order = doc ? orders.find((o) => o.id === doc.order_id) : null;

  if (!doc) return <EmptyState icon={FolderOpen} title="单证不存在" action={<Button onClick={() => router.push("/documents")}>返回列表</Button>} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{doc.code}</h1>
              <StatusBadge status={doc.status} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{DOCUMENT_TYPE_LABELS[doc.document_type]} · 创建于 {formatDate(doc.created_at)}</div>
          </div>
        </div>
        {doc.status === "issued" && <Button variant="outline"><FileText className="h-3.5 w-3.5 mr-1.5" />下载PDF</Button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard title="单证信息" icon={FolderOpen} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="单证编码" value={<span className="font-mono">{doc.code}</span>} />
            <InfoItem label="单证类型" value={DOCUMENT_TYPE_LABELS[doc.document_type]} />
            <InfoItem label="关联订单" value={doc.order_code ? <Link href={`/orders/${doc.order_id}`} className="text-[#3298cb] hover:underline">{doc.order_code}</Link> : "-"} />
            <InfoItem label="状态" value={<StatusBadge status={doc.status} />} />
            <InfoItem label="签发日期" value={doc.issued_date ? formatDate(doc.issued_date) : "-"} />
            <InfoItem label="创建时间" value={formatDate(doc.created_at, "YYYY-MM-DD HH:mm")} />
            {doc.notes && <InfoItem label="备注" full value={<span className="text-xs">{doc.notes}</span>} />}
          </div>
        </InfoCard>

        {order && (
          <InfoCard title="关联订单">
            <div className="space-y-2 text-sm">
              <div><div className="text-xs text-gray-500">订单号</div><Link href={`/orders/${order.id}`} className="font-medium text-[#3298cb] hover:underline">{order.code}</Link></div>
              <div><div className="text-xs text-gray-500">客户</div><div>{order.customer_name}</div></div>
              <div><div className="text-xs text-gray-500">订单金额</div><div className="font-medium">{order.currency} {order.total_amount}</div></div>
              <div><div className="text-xs text-gray-500">下单日期</div><div>{formatDate(order.order_date)}</div></div>
            </div>
          </InfoCard>
        )}
      </div>

      {doc.status === "issued" && (
        <InfoCard title="单证预览">
          <div className="bg-gray-100 rounded-md p-8 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-3" />
              <div className="text-sm font-medium text-gray-700">{DOCUMENT_TYPE_LABELS[doc.document_type]}</div>
              <div className="text-xs text-gray-500 mt-1">{doc.code}</div>
              <Button className="mt-4" variant="outline">下载查看完整PDF</Button>
            </div>
          </div>
        </InfoCard>
      )}
    </div>
  );
}
