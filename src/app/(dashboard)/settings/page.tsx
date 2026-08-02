"use client";
import { useState } from "react";
import { Building2, Globe, DollarSign, Settings as SettingsIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common/page-header";
import { InfoCard } from "@/components/common/info-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { SystemSettings } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { systemSettings, exchangeRates, addAuditLog, reset } = useStore();
  const [form, setForm] = useState<SystemSettings>(systemSettings);
  const [resetOpen, setResetOpen] = useState(false);

  const handleSave = () => {
    useStore.setState({ systemSettings: form });
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "system_settings", action: "update", after_data: form as any, description: "更新公司信息" });
    toast.success("设置已保存");
  };

  const handleReset = () => {
    reset();
    setResetOpen(false);
  };

  return (
    <div>
      <PageHeader title="系统设置" description="公司信息、汇率、业务规则配置" actions={<Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setResetOpen(true)}><RotateCcw className="h-3.5 w-3.5 mr-1.5" />重置演示数据</Button>} />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company"><Building2 className="h-3.5 w-3.5 mr-1.5" />公司信息</TabsTrigger>
          <TabsTrigger value="rates"><Globe className="h-3.5 w-3.5 mr-1.5" />汇率管理</TabsTrigger>
          <TabsTrigger value="rules"><DollarSign className="h-3.5 w-3.5 mr-1.5" />业务规则</TabsTrigger>
        </TabsList>

        {/* 公司信息 */}
        <TabsContent value="company" className="mt-3">
          <InfoCard title="公司基本信息" icon={Building2}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="公司名称"><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
              <Field label="公司英文名"><Input value={form.company_name_en} onChange={(e) => setForm({ ...form, company_name_en: e.target.value })} /></Field>
              <Field label="联系邮箱"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="联系电话"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="地址" full><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} className="bg-[#3298cb] hover:bg-[#2c87b3]">保存设置</Button>
            </div>
          </InfoCard>
        </TabsContent>

        {/* 汇率管理 */}
        <TabsContent value="rates" className="mt-3">
          <InfoCard title="汇率管理" icon={Globe} description="汇率用于外币订单的本币金额计算">
            <Table>
              <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">币种</TableHead><TableHead className="text-xs text-right">对人民币汇率</TableHead><TableHead className="text-xs">生效日期</TableHead><TableHead className="text-xs text-right">操作</TableHead></TableRow></TableHeader>
              <TableBody>
                {exchangeRates.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.currency}</TableCell>
                    <TableCell className="text-sm text-right">{r.rate_to_cny.toFixed(4)}</TableCell>
                    <TableCell className="text-xs">{formatDate(r.effective_date)}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.info("汇率编辑功能：实际项目中可修改汇率值")}>编辑</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
              提示：汇率每日自动同步，可在「业务规则」中设置自动更新时间。
            </div>
          </InfoCard>
        </TabsContent>

        {/* 业务规则 */}
        <TabsContent value="rules" className="mt-3">
          <InfoCard title="业务规则配置" icon={SettingsIcon}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="默认币种"><Input value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })} /></Field>
              <Field label="默认贸易条款"><Input value={form.default_trade_terms} onChange={(e) => setForm({ ...form, default_trade_terms: e.target.value })} placeholder="如 FOB / CIF / EXW" /></Field>
              <Field label="默认付款条件"><Input value={form.default_payment_terms} onChange={(e) => setForm({ ...form, default_payment_terms: e.target.value })} placeholder="如 T/T 30天" /></Field>
              <Field label="报价有效期(天)"><Input type="number" defaultValue={30} /></Field>
              <Field label="订单交货期(天)"><Input type="number" defaultValue={60} /></Field>
              <Field label="应收账款到期(天)"><Input type="number" defaultValue={30} /></Field>
              <Field label="最低库存预警阈值"><Input type="number" defaultValue={50} /></Field>
              <Field label="信用额度预警比例(%)"><Input type="number" defaultValue={80} /></Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} className="bg-[#3298cb] hover:bg-[#2c87b3]">保存规则</Button>
            </div>
          </InfoCard>

          <InfoCard title="状态机说明" icon={SettingsIcon} className="mt-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-800 mb-1">订单状态机</div>
                <div className="text-xs text-gray-600 font-mono">pending → confirmed → producing → shipped → completed</div>
                <div className="text-xs text-gray-600 font-mono mt-1">任意状态 → cancelled (终态)</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-800 mb-1">询盘状态机</div>
                <div className="text-xs text-gray-600 font-mono">pending → processing → quoted → closed</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-800 mb-1">报价单状态机</div>
                <div className="text-xs text-gray-600 font-mono">draft → sent → accepted (转订单) / rejected / expired</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-800 mb-1">采购订单状态机</div>
                <div className="text-xs text-gray-600 font-mono">pending → approved → sent → partial_arrived / arrived → warehoused → paid</div>
              </div>
            </div>
          </InfoCard>
        </TabsContent>
      </Tabs>

      <ConfirmDialog open={resetOpen} title="重置演示数据" description="此操作将清空所有数据并恢复初始演示数据，是否继续？" variant="destructive" confirmText="确认重置" onConfirm={handleReset} onCancel={() => setResetOpen(false)} />
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}><Label className="text-xs text-gray-700">{label}</Label>{children}</div>;
}
