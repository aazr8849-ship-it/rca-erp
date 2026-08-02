"use client";
import Link from "next/link";
import { Users, MessageSquare, FileText, ShoppingCart, ClipboardList, Truck, Ship, FolderOpen, TrendingUp, AlertCircle, Clock, Calendar } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";

const COLORS = ["#3298cb", "#c76747", "#437453", "#9c7d3d", "#567a9e", "#94524c", "#417f9e", "#8a6b5a"];

export default function DashboardPage() {
  const {
    customers,
    inquiries,
    quotations,
    orders,
    purchaseRequests,
    purchaseOrders,
    shipments,
    documents,
    receivables,
    payables,
  } = useStore();

  const kpis = [
    { label: "客户数", value: customers.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50", link: "/customers" },
    { label: "询盘数", value: inquiries.length, icon: MessageSquare, color: "text-green-500", bg: "bg-green-50", link: "/inquiries" },
    { label: "报价数", value: quotations.length, icon: FileText, color: "text-purple-500", bg: "bg-purple-50", link: "/quotations" },
    { label: "订单数", value: orders.length, icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-50", link: "/orders" },
    { label: "请购数", value: purchaseRequests.length, icon: ClipboardList, color: "text-cyan-500", bg: "bg-cyan-50", link: "/purchases" },
    { label: "采购数", value: purchaseOrders.length, icon: Truck, color: "text-pink-500", bg: "bg-pink-50", link: "/purchases" },
    { label: "发货数", value: shipments.length, icon: Ship, color: "text-indigo-500", bg: "bg-indigo-50", link: "/shipments" },
    { label: "单证数", value: documents.length, icon: FolderOpen, color: "text-teal-500", bg: "bg-teal-50", link: "/documents" },
  ];

  const overdueRec = receivables.filter((r) => r.status === "overdue");
  const overdueRecAmount = overdueRec.reduce((s, r) => s + Number(r.amount), 0);
  const overduePay = payables.filter((p) => p.status === "overdue");
  const overduePayAmount = overduePay.reduce((s, p) => s + Number(p.amount), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const pendingPRs = purchaseRequests.filter((p) => p.status === "pending").length;
  const expiringQuotations = quotations.filter(
    (q) => q.status === "sent" && new Date(q.valid_until).getTime() - Date.now() < 7 * 86400000,
  ).length;

  const orderTrend = [
    { month: "1月", count: 8, amount: 156000 },
    { month: "2月", count: 12, amount: 234000 },
    { month: "3月", count: 15, amount: 312000 },
    { month: "4月", count: 10, amount: 198000 },
    { month: "5月", count: 18, amount: 384000 },
    { month: "6月", count: 22, amount: 452000 },
    { month: "7月", count: orders.length, amount: orders.reduce((s, o) => s + Number(o.total_amount), 0) },
  ];

  const countryCount: Record<string, number> = {};
  customers.forEach((c) => {
    countryCount[c.country] = (countryCount[c.country] || 0) + 1;
  });
  const customerDistribution = Object.entries(countryCount)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-[#364e5b] to-[#3298cb] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">早上好，管理员 👋</h1>
            <p className="text-white/80 text-sm mt-1">欢迎使用 RCA6.0 ERP 系统，祝您工作顺利！</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-md px-3 py-1.5 text-sm">
            <Calendar className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </div>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} href={kpi.link} className="bg-white rounded-lg p-4 hover:shadow-md hover:-translate-y-0.5 transition-all border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{kpi.label}</span>
                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", kpi.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", kpi.color)} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{kpi.value}</div>
              <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5">
                <TrendingUp className="h-2.5 w-2.5" />
                <span>较上月 +12%</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 待办 + 订单趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#3298cb]" />
              待办提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/finance?tab=receivables&status=overdue" className="flex items-center justify-between p-2.5 rounded-md hover:bg-red-50 transition-colors border border-transparent hover:border-red-200">
              <span className="text-sm text-gray-700">逾期应收</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{formatCurrency(overdueRecAmount, "CNY")}</span>
                <Badge variant="destructive" className="text-[10px]">{overdueRec.length}</Badge>
              </div>
            </Link>
            <Link href="/finance?tab=payables&status=overdue" className="flex items-center justify-between p-2.5 rounded-md hover:bg-red-50 transition-colors border border-transparent hover:border-red-200">
              <span className="text-sm text-gray-700">逾期应付</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{formatCurrency(overduePayAmount, "CNY")}</span>
                <Badge variant="destructive" className="text-[10px]">{overduePay.length}</Badge>
              </div>
            </Link>
            <Link href="/orders?status=pending" className="flex items-center justify-between p-2.5 rounded-md hover:bg-yellow-50 transition-colors border border-transparent hover:border-yellow-200">
              <span className="text-sm text-gray-700">待处理订单</span>
              <Badge variant="secondary" className="text-[10px]">{pendingOrders}</Badge>
            </Link>
            <Link href="/purchases?tab=requests&status=pending" className="flex items-center justify-between p-2.5 rounded-md hover:bg-yellow-50 transition-colors border border-transparent hover:border-yellow-200">
              <span className="text-sm text-gray-700">待处理请购</span>
              <Badge variant="secondary" className="text-[10px]">{pendingPRs}</Badge>
            </Link>
            <Link href="/quotations?status=expiring" className="flex items-center justify-between p-2.5 rounded-md hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-200">
              <span className="text-sm text-gray-700">即将过期报价</span>
              <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">{expiringQuotations}</Badge>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#3298cb]" />
              近 7 个月订单趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={orderTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888" fontSize={11} />
                <YAxis yAxisId="left" stroke="#888" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={11} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12 }} formatter={(value: any, name: any) => { if (name === "金额") return [`¥${value.toLocaleString()}`, name]; return [value, name]; }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="right" dataKey="amount" fill="#3298cb" name="金额" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="count" stroke="#c76747" strokeWidth={2} name="订单数" dot={{ fill: "#c76747", r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 客户分布 + 最近订单 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#3298cb]" />
              客户国家分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={customerDistribution} dataKey="count" nameKey="country" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => `${entry.country}: ${entry.count}`} labelLine={false}>
                  {customerDistribution.map((_, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#3298cb]" />
              最近订单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders.slice(0, 5).map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-2.5 rounded-md hover:bg-gray-50 border border-gray-100 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800">{order.code}</div>
                    <div className="text-xs text-gray-500 truncate">{order.customer_name} · {formatRelativeTime(order.created_at)}</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm font-semibold text-[#3298cb]">{formatCurrency(order.total_amount, order.currency)}</div>
                    <Badge variant="secondary" className={cn("text-[10px] mt-0.5", order.status === "completed" && "bg-green-100 text-green-700", order.status === "pending" && "bg-yellow-100 text-yellow-700", order.status === "cancelled" && "bg-red-100 text-red-700", (order.status === "confirmed" || order.status === "producing" || order.status === "shipped") && "bg-blue-100 text-blue-700")}>
                      {order.status === "pending" && "待处理"}
                      {order.status === "confirmed" && "已确认"}
                      {order.status === "producing" && "生产中"}
                      {order.status === "shipped" && "已发货"}
                      {order.status === "completed" && "已完成"}
                      {order.status === "cancelled" && "已取消"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
