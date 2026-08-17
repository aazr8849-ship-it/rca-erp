"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";
import { signIn } from "@/lib/api/auth";

// 检测是否配置了 Supabase
const useSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !key.includes("REPLACE_WITH") && url.startsWith("https://") && (key.startsWith("sb_publishable_") || key.startsWith("eyJ")) && key.length > 30);
};

const DEMO_ACCOUNTS = [
  { email: "admin@rca-erp.com", password: "admin123", role: "管理员", name: "管理员" },
  { email: "sales@rca-erp.com", password: "sales123", role: "销售", name: "李销售" },
  { email: "purchaser@rca-erp.com", password: "purchase123", role: "采购", name: "王采购" },
  { email: "warehouse@rca-erp.com", password: "warehouse123", role: "仓管", name: "张仓管" },
  { email: "finance@rca-erp.com", password: "finance123", role: "财务", name: "赵财务" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const supabaseEnabled = useSupabase();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("admin@rca-erp.com");
  const [password, setPassword] = useState("admin123");
  const emailRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (supabaseEnabled) {
      // Supabase 认证模式
      const { user, error } = await signIn(email, password);
      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }
      if (user) {
        // 直接设置currentUser到store
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status || "active",
          created_at: user.created_at || new Date().toISOString(),
        });
        toast.success(`欢迎回来，${user.name}`);
        router.push("/");
        return;
      }
      toast.error("登录失败");
    } else {
      // Mock 模式
      await new Promise((r) => setTimeout(r, 600));
      const user = login(email, password);
      if (user) {
        toast.success(`欢迎回来，${user.name}`);
        router.push("/");
      } else {
        toast.error("邮箱或密码错误");
      }
    }
    setLoading(false);
  };

  const quickFill = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen flex items-stretch bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
      {/* 左侧品牌区（桌面端） */}
      <div className="hidden lg:flex flex-col justify-between flex-1 px-16 py-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-[#38BDF8] blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#C4654A] blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#38BDF8] text-white font-bold text-xl">R</div>
            <div>
              <div className="text-2xl font-bold tracking-wide">RCA6.0 ERP</div>
              <div className="text-xs text-white/60">汽配外贸企业资源计划系统</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            一站式汽配外贸<br />企业管理平台
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-md">
            覆盖客户、产品、询盘、报价、订单、采购、库存、发货、财务、单证等14个核心业务模块，助力企业高效运营、智能决策。
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md pt-4">
            {[
              { label: "业务模块", value: "14+" },
              { label: "数据表", value: "29+" },
              { label: "审批流程", value: "8+" },
              { label: "状态机", value: "5+" },
            ].map((s) => (
              <div key={s.label} className="border border-white/10 rounded-lg p-3 bg-white/5 backdrop-blur-sm">
                <div className="text-2xl font-bold text-[#38BDF8]">{s.value}</div>
                <div className="text-xs text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-white/40">© 2026 RCA Auto Parts Trading Co., Ltd. All rights reserved.</div>
      </div>

      {/* 右侧登录卡片 */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* 移动端 Logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#38BDF8] text-white font-bold text-lg">R</div>
              <div className="text-xl font-bold text-gray-800">RCA6.0 ERP</div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">欢迎登录</h2>
              <p className="text-sm text-gray-500 mt-1">
                {supabaseEnabled ? "请输入您的账号和密码登录系统" : "请输入演示账号登录（Mock 模式）"}
              </p>
              {supabaseEnabled && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  已连接 Supabase 认证
                </p>
              )}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">邮箱账号</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rca-erp.com"
                    className="w-full pl-9 pr-3 h-11 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">登录密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-9 pr-10 h-11 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  记住我
                </label>
                <a className="text-[#38BDF8] hover:underline cursor-pointer">忘记密码？</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-md bg-[#38BDF8] hover:bg-[#0EA5E9] text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (<><Loader2 size={16} className="animate-spin" />登录中...</>) : ("登 录")}
              </button>
            </form>

            {/* 演示账号 */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2 font-medium">
                {supabaseEnabled ? "已注册账号（点击快速填充）" : "演示账号（点击快速填充）"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => quickFill(acc)}
                    className="text-left px-2 py-1.5 rounded text-[11px] bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="font-medium text-gray-700">{acc.role}</div>
                    <div className="text-gray-500 truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
              {supabaseEnabled && (
                <p className="mt-3 text-[11px] text-amber-600 text-center">
                  ⚠️ 需要在 Supabase → Authentication → Users 中创建用户才能登录
                </p>
              )}
              {!supabaseEnabled && (
                <p className="mt-3 text-[11px] text-gray-400 text-center">
                  提示：默认密码为 <code className="px-1 bg-gray-100 rounded">用户名 + 123</code>
                </p>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-white/40 mt-6">
            系统使用 Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui 构建
          </div>
        </div>
      </div>
    </div>
  );
}
