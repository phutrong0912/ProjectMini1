import React, { useEffect, useState } from 'react';
import {
  X,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Download,
  Send,
  Building2,
  Layers,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { QueuedAudit, SyncStatus } from '../types/audit';
import { getAllQueuedAudits, deleteQueuedAudit, updateAuditStatus } from '../services/db';
import { syncEngine } from '../services/sync';
import { networkService } from '../services/network';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onQueueUpdated?: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose, onQueueUpdated }) => {
  const [audits, setAudits] = useState<QueuedAudit[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(networkService.isEffectiveOnline());

  const loadAudits = async () => {
    const list = await getAllQueuedAudits();
    // Sort: PENDING_SYNC and FAILED first, then by createdAt descending
    list.sort((a, b) => {
      if (a.syncStatus === 'PENDING_SYNC' && b.syncStatus !== 'PENDING_SYNC') return -1;
      if (a.syncStatus !== 'PENDING_SYNC' && b.syncStatus === 'PENDING_SYNC') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setAudits(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadAudits();
    }

    const unsubNet = networkService.addListener((online) => {
      setIsOnline(online);
    });

    const unsubSync = syncEngine.subscribe((status) => {
      setIsSyncing(status.isSyncing);
      loadAudits();
    });

    return () => {
      unsubNet();
      unsubSync();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    await syncEngine.triggerManualSync();
    await loadAudits();
    if (onQueueUpdated) onQueueUpdated();
  };

  const handleRetryItem = async (id: string) => {
    await updateAuditStatus(id, 'PENDING_SYNC');
    await loadAudits();
    if (networkService.isEffectiveOnline()) {
      syncEngine.processQueue();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Xóa phiếu khảo sát này khỏi hàng đợi?')) {
      await deleteQueuedAudit(id);
      await loadAudits();
      if (onQueueUpdated) onQueueUpdated();
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(audits, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VKU-Facility-Audits-Queue-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pendingCount = audits.filter((a) => a.syncStatus === 'PENDING_SYNC' || a.syncStatus === 'SYNCING').length;
  const failedCount = audits.filter((a) => a.syncStatus === 'FAILED').length;
  const syncedCount = audits.filter((a) => a.syncStatus === 'SYNCED').length;

  const getStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case 'PENDING_SYNC':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock className="w-3 h-3" /> PENDING_SYNC
          </span>
        );
      case 'SYNCING':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <RefreshCw className="w-3 h-3 animate-spin" /> SYNCING
          </span>
        );
      case 'SYNCED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" /> SYNCED
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertCircle className="w-3 h-3" /> FAILED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 h-full border-l border-slate-800 flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-vku-400 ${isSyncing ? 'animate-spin' : ''}`} />
              Hàng đợi đồng bộ ngoại tuyến (FIFO)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động điều phối tuần tự khi phát hiện kết nối mạng
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Metrics Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Chờ đồng bộ</div>
            <div className="text-base font-black text-amber-400">{pendingCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Lỗi / Thử lại</div>
            <div className="text-base font-black text-rose-400">{failedCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Đã đồng bộ</div>
            <div className="text-base font-black text-emerald-400">{syncedCount}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleExportJSON}
            disabled={audits.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-750 disabled:opacity-40 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất JSON sao lưu</span>
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline || pendingCount + failedCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-vku-600 hover:bg-vku-500 text-white text-xs font-bold shadow-md shadow-vku-600/30 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang gửi...' : 'Đồng bộ ngay'}</span>
          </button>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {audits.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
              <ShieldCheck className="w-10 h-10 text-slate-600 mb-2" />
              <p>Hàng đợi trống.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Các phiếu khảo sát thực hiện khi mất sóng sẽ tự động xếp hàng tại đây.
              </p>
            </div>
          ) : (
            audits.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleString('vi-VN');
              return (
                <div
                  key={item.id}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
                >
                  {/* Top line: status & timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(item.syncStatus)}
                    <span className="text-[11px] font-mono text-slate-400">{formattedDate}</span>
                  </div>

                  {/* Body: Location & Item */}
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-vku-400" />
                      <span>{item.data.building} - {item.data.room}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      {item.data.itemName || item.data.category} • Mã: <span className="font-mono text-vku-300">{item.data.assetTag || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Defect preview */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-750">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {item.data.rating}/5 Sao
                    </span>
                    <span className="text-[11px]">
                      {item.data.photos?.length || 0} ảnh đính kèm
                    </span>
                  </div>

                  {/* Error display if failed */}
                  {item.errorLog && (
                    <div className="text-[11px] p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                      Lỗi: {item.errorLog} (Đã thử: {item.retryCount} lần)
                    </div>
                  )}

                  {/* Bottom item actions */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                      ID: {item.id.slice(0, 13)}...
                    </span>
                    <div className="flex items-center gap-2">
                      {item.syncStatus === 'FAILED' && (
                        <button
                          onClick={() => handleRetryItem(item.id)}
                          className="text-vku-400 hover:text-vku-300 font-semibold"
                        >
                          Thử lại
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Xóa phiếu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
