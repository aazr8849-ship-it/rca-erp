"use client";
import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 自动更新组件
 * 检测到新版本时自动提示用户刷新
 */
export function AutoUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let currentBuild = document.documentElement.getAttribute("data-build-id") || "";

    const checkForUpdates = async () => {
      setChecking(true);
      try {
        // 获取最新的index.html看是否有新版本
        const res = await fetch(`/api/version?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.buildId && data.buildId !== currentBuild) {
            setShowUpdate(true);
          }
        }
      } catch {
        // 忽略错误
      } finally {
        setChecking(false);
      }
    };

    // 每5分钟检查一次更新
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    
    // 页面重新可见时也检查
    const handleVisibility = () => {
      if (!document.hidden) checkForUpdates();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleUpdate = () => {
    // 刷新页面加载新版本
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update().then(() => {
            window.location.reload();
          });
        } else {
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-[#38BDF8] p-4 max-w-sm animate-in slide-in-from-bottom">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#38BDF8]/10 flex items-center justify-center shrink-0">
          <RefreshCw className="h-5 w-5 text-[#38BDF8]" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-800">发现新版本</div>
          <p className="text-xs text-slate-500 mt-0.5">系统已更新，点击刷新获取最新功能</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-7 text-xs bg-[#38BDF8] hover:bg-[#0EA5E9]" onClick={handleUpdate}>
              立即更新
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowUpdate(false)}>
              稍后
            </Button>
          </div>
        </div>
        <button onClick={() => setShowUpdate(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
