import React, { useEffect, useState } from 'react';
import { WifiOff, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { networkService } from '../services/network';
import { syncEngine } from '../services/sync';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(networkService.isEffectiveOnline());
  const [isBasement, setIsBasement] = useState<boolean>(networkService.getSimulatedBasementMode());
  const [syncState, setSyncState] = useState<{
    isSyncing: boolean;
    totalPending: number;
    currentProgress: number;
    activeItemName?: string;
  }>({
    isSyncing: false,
    totalPending: 0,
    currentProgress: 0,
  });

  useEffect(() => {
    const unsubNet = networkService.addListener((online) => {
      setIsOnline(online);
      setIsBasement(networkService.getSimulatedBasementMode());
    });

    const unsubSync = syncEngine.subscribe((status) => {
      setSyncState({
        isSyncing: status.isSyncing,
        totalPending: status.totalPending,
        currentProgress: status.currentProgress,
        activeItemName: status.activeItemName,
      });
    });

    return () => {
      unsubNet();
      unsubSync();
    };
  }, []);

  if (syncState.isSyncing) {
    const percentage = syncState.totalPending > 0
      ? Math.round((syncState.currentProgress / syncState.totalPending) * 100)
      : 0;

    return (
      <div className="bg-sky-950/80 border-b border-sky-800/60 px-4 py-2 text-xs text-sky-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
            <span className="truncate">
              Đang đồng bộ hàng đợi: <strong>{syncState.activeItemName || `Mục ${syncState.currentProgress}/${syncState.totalPending}`}</strong>
            </span>
          </div>
          <span className="font-mono text-sky-300 font-bold shrink-0">{percentage}%</span>
        </div>
        <div className="max-w-4xl mx-auto mt-1.5 w-full bg-sky-900/50 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-sky-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Khu vực mất sóng {isBasement ? '(Mô phỏng Tầng hầm)' : ''}:</strong> Form được lưu tự động vào IndexedDB & hàng đợi sẽ tự động đẩy lên máy chủ khi có kết nối lại.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
