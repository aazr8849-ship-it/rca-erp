"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { PWAInstallButton } from "@/components/pwa/install-button";
import { Header } from "@/components/layout/header";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/api/auth";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";

const useSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !key.includes("REPLACE_WITH") && url.startsWith("https://") && (key.startsWith("sb_publishable_") || key.startsWith("eyJ")) && key.length > 30);
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabaseEnabled = useSupabase();
  const { currentUser, login } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (supabaseEnabled) {
        try {
          const user = await getCurrentUser();
          if (user) {
            if (!useStore.getState().currentUser) {
              login(user.email, "");
            }
            setChecking(false);
          } else {
            router.replace("/login");
          }
        } catch {
          router.replace("/login");
        }
      } else {
        const timer = setTimeout(() => {
          if (!useStore.getState().currentUser) {
            router.replace("/login");
          } else {
            setChecking(false);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    };

    checkAuth();
  }, [router, supabaseEnabled, login]);

  // 权限检查
  useEffect(() => {
    if (!checking && currentUser) {
      const role = (currentUser.role as any) || "admin";
      if (!hasPermission(role, pathname)) {
        toast.error("您没有权限访问此页面");
        router.push("/");
      }
    }
  }, [pathname, currentUser, checking, router]);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.replace("/login");
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router, supabaseEnabled]);

  if (checking || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">正在加载...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <PWAInstallButton />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
