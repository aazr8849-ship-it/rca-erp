"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Truck, Package, MessageSquare, FileText,
  ShoppingCart, ClipboardList, Warehouse, Ship, DollarSign, FolderOpen,
  History, Settings, UserCog, User, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { getVisibleNavItems, type NavItem } from "@/lib/permissions";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Truck, Package, MessageSquare, FileText,
  ShoppingCart, ClipboardList, Warehouse, Ship, DollarSign, FolderOpen,
  History, Settings, UserCog, User,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useStore();

  // 根据用户角色获取可见导航项
  const role = (currentUser?.role as any) || "admin";
  const navItems: NavItem[] = getVisibleNavItems(role);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-[220px] bg-[#0F172A] text-white transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-[60px] px-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex items-center justify-center w-8 h-8 rounded bg-[#38BDF8] text-white font-bold text-sm">
              R
            </div>
            <span className="text-base font-semibold tracking-wide">
              RCA6.0 ERP
            </span>
          </Link>
          <button
            className="lg:hidden text-white/80 hover:text-white"
            onClick={onClose}
            aria-label="关闭侧边栏"
          >
            <X size={20} />
          </button>
        </div>

        {/* 导航列表 */}
        <nav className="flex-1 overflow-y-auto py-3 custom-scroll">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const Icon = ICON_MAP[item.icon] || LayoutDashboard;
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={onClose}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-[#38BDF8] text-white font-medium"
                        : "text-white/85 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#38BDF8] -translate-x-2" />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部用户信息 */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>系统正常运行中</span>
          </div>
          <div className="mt-1 text-[10px] text-white/40">
            RCA6.0 ERP © 2026
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </>
  );
}
