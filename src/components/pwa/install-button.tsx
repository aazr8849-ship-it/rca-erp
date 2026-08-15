"use client";
import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已安装
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // iOS不支持beforeinstallprompt，需要手动引导
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      const dismissed = localStorage.getItem("pwa-ios-dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
      return;
    }

    // 监听安装提示
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-ios-dismissed", "true");
  };

  if (isInstalled) return null;

  // 顶部横幅提示
  if (showBanner) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#38BDF8] text-white px-4 py-2 flex items-center justify-between text-sm shadow-lg">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>
            {isIOS
              ? "点击Safari分享按钮，选择「添加到主屏幕」安装APP"
              : "安装 RCA ERP 到桌面，离线也能用"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isIOS && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 bg-white text-[#38BDF8] hover:bg-white/90 text-xs"
              onClick={handleInstall}
            >
              安装
            </Button>
          )}
          <button onClick={handleDismiss} className="text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
