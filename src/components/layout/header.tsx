"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "工作台",
  "/customers": "客户管理",
  "/suppliers": "供应商管理",
  "/products": "产品管理",
  "/inquiries": "询盘管理",
  "/quotations": "报价管理",
  "/orders": "订单管理",
  "/purchases": "采购管理",
  "/inventory": "库存管理",
  "/shipments": "发货计划",
  "/finance": "财务管理",
  "/documents": "单证管理",
  "/audit-logs": "操作日志",
  "/settings": "系统设置",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, notifications } = useStore();
  const [searchValue, setSearchValue] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const getPageTitle = () => {
    // 精确匹配
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // 模糊匹配 - 取路径第一段
    const firstSegment = "/" + (pathname.split("/")[1] || "");
    return PAGE_TITLES[firstSegment] || "RCA6.0 ERP";
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    // 简单的全局搜索 - 跳到产品页带search参数
    router.push(`/products?search=${encodeURIComponent(searchValue)}`);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center h-[60px] px-4 bg-white border-b border-gray-200 gap-4">
      {/* 左侧：菜单按钮 + 标题 */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
          aria-label="打开侧边栏"
        >
          <Menu size={20} />
        </Button>
        <h1 className="text-lg font-semibold text-gray-800 whitespace-nowrap">
          {getPageTitle()}
        </h1>
      </div>

      {/* 中间：搜索框 */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-[400px] mx-auto">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <Input
            type="text"
            placeholder="全局搜索产品/客户/订单..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-3 h-9 bg-gray-50 border-gray-200"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      <div className="flex-1 md:hidden" />

      {/* 右侧：通知 + 用户 */}
      <div className="flex items-center gap-2">
        {/* 通知铃铛 */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="通知"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">通知中心</span>
              <Badge variant="secondary" className="text-[10px]">
                {unreadCount} 未读
              </Badge>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  暂无通知
                </div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer",
                      !n.is_read && "bg-blue-50/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                          n.type === "warning" && "bg-yellow-500",
                          n.type === "info" && "bg-blue-500",
                          n.type === "success" && "bg-green-500",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800">
                          {n.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {n.content}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {formatRelativeTime(n.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setNotifOpen(false)}
              >
                查看全部通知
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* 用户头像 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#3298cb] text-white flex items-center justify-center text-xs font-semibold">
                {currentUser ? getInitials(currentUser.name) : "U"}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-medium text-gray-800 leading-tight">
                  {currentUser?.name || "未登录"}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                  {currentUser?.email || ""}
                </div>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{currentUser?.name}</span>
                <span className="text-xs text-gray-500 font-normal">
                  {currentUser?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>个人信息</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>系统设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
