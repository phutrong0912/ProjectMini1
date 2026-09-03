import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Layers, ShieldCheck, Download, History } from 'lucide-react';
import { networkService } from '../services/network';
import { syncEngine } from '../services/sync';

interface HeaderProps {
  onOpenQueue: () => void;
  onOpenHistory: () => void;
  activeTab: 'audit' | 'history';
}

export const Header: React.FC<HeaderProps> = ({ onOpenQueue, onOpenHistory, activeTab }) => {
  const [isOnline, setIsOnline] = useState<boolean>(networkService.isEffectiveOnline());
  const [isBasementMode, setIsBasementMode] = useState<boolean>(networkService.getSimulatedBasementMode());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Network listener
    const unsubNet = networkService.addListener((online) => {
      setIsOnline(online);
      setIsBasementMode(networkService.getSimulatedBasementMode());
    });

    // Sync listener
    const unsubSync = syncEngine.subscribe((status) => {
      setIsSyncing(status.isSyncing);
      refreshCounts();
    });

    // Initial count
    refreshCounts();

    // PWA install prompt handler
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      unsubNet();
      unsubSync();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const refreshCounts = async () => {
    const counts = await syncEngine.getQueueCounts();
    setPendingCount(counts.pending + counts.failed);
  };

  const toggleBasementMode = async () => {
    const nextState = !isBasementMode;
    await networkService.setSimulatedBasementMode(nextState);
    setIsBasementMode(nextState);
  };

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* VKU Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-vku-600 flex items-center justify-center shadow-lg shadow-vku-600/30 text-white font-black text-lg border border-vku-400/40">
            VKU
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                Facility Audit
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-vku-950 text-vku-300 border border-vku-700/50">
                Offline PWA
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-tight mt-0.5 hidden sm:block">
              Đại học CNTT & Truyền thông Việt - Hàn
            </p>
          </div>
        </div>

        {/* Action Controls & Indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PWA Install Button */}
          {installPrompt && (
            <button
              onClick={handleInstallPWA}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition"
              title="Cài đặt ứng dụng PWA Standalone"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Cài đặt App</span>
            </button>
          )}

          {/* Basement Offline Simulator Switch */}
          <button
            onClick={toggleBasementMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              isBasementMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Bật/tắt mô phỏng mất sóng tầng hầm VKU"
          >
            {isBasementMode ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px] font-semibold">Tầng hầm (OFF)</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold">Trực tuyến</span>
              </>
            )}
          </button>

          {/* Sync Queue Badge Button */}
          <button
            onClick={onOpenQueue}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              pendingCount > 0
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 hover:bg-sky-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Xem hàng đợi đồng bộ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
            <span className="hidden xs:inline">Hàng đợi</span>
            {pendingCount > 0 && (
              <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                {pendingCount}
              </span>
            )}
          </button>

          {/* History Toggle */}
          <button
            onClick={onOpenHistory}
            className={`p-2 rounded-lg text-xs font-medium border transition ${
              activeTab === 'history'
                ? 'bg-vku-600 text-white border-vku-500'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Lịch sử kiểm định cơ sở vật chất"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
