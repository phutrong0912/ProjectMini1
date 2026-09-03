import React, { useState } from 'react';
import {
  ClipboardCheck,
  Building2,
  Monitor,
  Star,
  Camera,
  UserCheck,
  Send,
  Trash2,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { InspectionDraft } from '../types/audit';
import { networkService } from '../services/network';

interface Step5Props {
  draft: InspectionDraft;
  onChange: (updates: Partial<InspectionDraft>) => void;
  onSubmit: () => void;
  onClearDraft: () => void;
  isSubmitting: boolean;
}

export const Step5Review: React.FC<Step5Props> = ({
  draft,
  onChange,
  onSubmit,
  onClearDraft,
  isSubmitting,
}) => {
  const isOnline = networkService.isEffectiveOnline();
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          gpsCoords: {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy),
          },
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-emerald-400" />
          Bước 5: Xác nhận & Hoàn tất khảo sát
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Kiểm tra lại toàn bộ thông tin kiểm định trước khi lưu vào hàng đợi IndexedDB.
        </p>
      </div>

      {/* Review Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: Location & Equipment */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-vku-400">
            <Building2 className="w-4 h-4" />
            Vị trí & Thông tin tài sản
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Tòa nhà:</span>
              <span className="font-semibold text-white">{draft.building || 'Chưa chọn'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tầng:</span>
              <span className="font-semibold text-white">{draft.floor || 'Chưa chọn'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Số phòng:</span>
              <span className="font-semibold text-white">{draft.room || 'Chưa nhập'}</span>
            </div>
            <div className="border-t border-slate-700/60 my-2 pt-2 flex justify-between">
              <span className="text-slate-400">Loại thiết bị:</span>
              <span className="font-semibold text-white">{draft.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tên/Model:</span>
              <span className="font-semibold text-white truncate max-w-[180px]">{draft.itemName || 'Chưa nhập'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mã Barcode:</span>
              <span className="font-mono text-vku-300">{draft.assetTag || 'Chưa có'}</span>
            </div>
            {draft.serialNumber && (
              <div className="flex justify-between">
                <span className="text-slate-400">Serial:</span>
                <span className="font-mono text-slate-300">{draft.serialNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Assessment & Photos */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Star className="w-4 h-4" />
            Đánh giá & Hiện trạng
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Chất lượng:</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                {draft.rating} / 5 Sao
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Mức độ khẩn cấp:</span>
              <span className="font-bold uppercase text-[11px] px-2 py-0.5 rounded bg-slate-700 text-slate-200">
                {draft.urgency}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Nhãn lỗi ({draft.defectTags?.length || 0}):</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {draft.defectTags?.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {draft.defectNotes && (
              <div className="mt-2 pt-2 border-t border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Ghi chú sự cố:</span>
                <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded-lg">
                  "{draft.defectNotes}"
                </p>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400">Ảnh thực địa:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> {draft.photos?.length || 0} ảnh đính kèm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Auditor & Inspector Sign-off Details */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-vku-400" />
            Thông tin người giám sát kiểm định <span className="text-rose-400">*</span>
          </label>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={gpsLoading}
            className="text-[11px] text-vku-400 hover:text-vku-300 flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            {gpsLoading ? 'Đang lấy GPS...' : draft.gpsCoords ? `${draft.gpsCoords.latitude}, ${draft.gpsCoords.longitude}` : 'Lấy tọa độ GPS'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Họ và tên Giám sát viên / Sinh viên</label>
            <input
              type="text"
              placeholder="VD: Nguyễn Trần Minh Anh"
              value={draft.inspectorName}
              onChange={(e) => onChange({ inspectorName: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vku-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Mã sinh viên / Mã cán bộ kiểm định</label>
            <input
              type="text"
              placeholder="VD: 21IT-109 hoặc CB-CSVC-03"
              value={draft.inspectorId}
              onChange={(e) => onChange({ inspectorId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-vku-500"
            />
          </div>
        </div>
      </div>

      {/* Offline Guarantee Notice */}
      <div className="p-3.5 rounded-2xl bg-vku-950/70 border border-vku-600/40 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-vku-400 shrink-0 mt-0.5" />
        <div className="text-xs text-vku-200 leading-relaxed">
          <strong>Bảo đảm ngoại tuyến VKU:</strong> Khảo sát này sẽ được cấp định danh UUID duy nhất và lưu trực tiếp vào cơ sở dữ liệu IndexedDB trên thiết bị. Bạn có thể tắt trình duyệt, mất sóng tầng hầm hoặc khởi động lại máy mà không mất dữ liệu.
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onClearDraft}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>Hủy bản nháp</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-vku-600 hover:bg-vku-500 text-white text-sm font-bold shadow-xl shadow-vku-600/40 transition active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang lưu vào hàng đợi...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>
                {isOnline ? 'Lưu & Đồng bộ ngay lên hệ thống' : 'Lưu vào Hàng đợi Ngoại tuyến (PENDING_SYNC)'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
