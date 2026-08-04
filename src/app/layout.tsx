import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "RCA6.0 ERP - 汽配外贸企业资源计划系统",
  description:
    "基于Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui搭建的汽配外贸ERP系统，覆盖客户、产品、询盘、报价、订单、采购、库存、发货、财务、单证等14个核心业务模块。",
  keywords: ["ERP", "汽配外贸", "RCA6.0", "Next.js", "管理系统"],
  authors: [{ name: "RCA Auto Parts" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
