import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Building2,
  Star,
  X,
} from 'lucide-react';
import { QueuedAudit } from '../types/audit';
import { getAllQueuedAudits } from '../services/db';

interface HistoryProps {
  onBackToAudit: () => void;
}

export const AuditHistory: React.FC<HistoryProps> = ({ onBackToAudit }) => {
  const [audits, setAudits] = useState<QueuedAudit[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAudit, setSelectedAudit] = useState<QueuedAudit | null>(null);

  useEffect(() => {
    async function fetchAudits() {
      const all = await getAllQueuedAudits();
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAudits(all);
    }
    fetchAudits();
  }, []);

  const filtered = audits.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.data.building.toLowerCase().includes(q) ||
      a.data.room.toLowerCase().includes(q) ||
      a.data.itemName.toLowerCase().includes(q) ||
      a.data.category.toLowerCase().includes(q) ||
      (a.data.assetTag && a.data.assetTag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-vku-400" />
            Lịch sử khảo sát cơ sở vật chất VKU
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu được lưu trữ ngoại tuyến tại IndexedDB trên thiết bị ({audits.length} phiếu)
          </p>
        </div>
        <button
          onClick={onBackToAudit}
          className="px-3.5 py-1.5 rounded-xl bg-vku-600 hover:bg-vku-500 text-white text-xs font-bold transition shadow"
        >
          + Khảo sát mới
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Tìm theo tòa nhà, số phòng, tên thiết bị hoặc mã Barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-vku-500 transition"
        />
      </div>

      {/* Audits Grid / List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
          Không tìm thấy phiếu khảo sát nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAudit(item)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-2.5 cursor-pointer transition shadow-md group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-vku-300 border border-slate-700">
                  {item.data.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.syncStatus === 'SYNCED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {item.syncStatus}
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-white group-hover:text-vku-300 transition">
                  {item.data.itemName || item.data.category}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.data.building} • {item.data.room}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {item.data.rating}/5
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedAudit.data.itemName || selectedAudit.data.category}
                </h3>
                <span className="text-xs font-mono text-vku-400">{selectedAudit.id}</span>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Vị trí:</span>
                <span className="font-semibold text-white">
                  {selectedAudit.data.building} - {selectedAudit.data.floor} - {selectedAudit.data.room}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Mã tài sản:</span>
                <span className="font-mono text-vku-300">{selectedAudit.data.assetTag || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Đánh giá hiện trạng:</span>
                <span className="font-bold text-amber-400">{selectedAudit.data.rating} / 5 Sao</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Mức độ khẩn cấp:</span>
                <span className="font-bold uppercase text-rose-300">{selectedAudit.data.urgency}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Người kiểm định:</span>
                <span className="text-white">{selectedAudit.data.inspectorName} ({selectedAudit.data.inspectorId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Thời gian tạo:</span>
                <span className="text-white">{new Date(selectedAudit.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              {selectedAudit.data.defectNotes && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Ghi chú khuyết tật:</span>
                  <p className="bg-slate-800/80 p-2.5 rounded-xl italic">{selectedAudit.data.defectNotes}</p>
                </div>
              )}

              {/* Photos Gallery */}
              {selectedAudit.data.photos && selectedAudit.data.photos.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-2">Ảnh bằng chứng ({selectedAudit.data.photos.length}):</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAudit.data.photos.map((p) => (
                      <div key={p.id} className="rounded-xl overflow-hidden border border-slate-700 aspect-video bg-black">
                        <img src={p.dataUrl} alt={p.label || 'Ảnh'} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAudit(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
