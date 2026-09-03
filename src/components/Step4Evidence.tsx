import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, ZoomIn, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuditPhoto, InspectionDraft } from '../types/audit';
import { capturePhoto } from '../services/camera';

interface Step4Props {
  draft: InspectionDraft;
  onChange: (updates: Partial<InspectionDraft>) => void;
}

export const Step4Evidence: React.FC<Step4Props> = ({ draft, onChange }) => {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<AuditPhoto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCapture = async () => {
    setErrorMsg(null);
    setIsCapturing(true);
    try {
      const newPhoto = await capturePhoto();
      const updatedPhotos = [...(draft.photos || []), newPhoto];
      onChange({ photos: updatedPhotos });
    } catch (err: any) {
      if (err?.message !== 'No photo selected') {
        console.warn('Camera capture canceled or failed:', err);
        setErrorMsg('Không thể kích hoạt máy ảnh: ' + (err?.message || 'Người dùng đã hủy'));
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    const updatedPhotos = (draft.photos || []).filter((p) => p.id !== photoId);
    onChange({ photos: updatedPhotos });
  };

  const handleUpdateLabel = (photoId: string, label: string) => {
    const updatedPhotos = (draft.photos || []).map((p) => {
      if (p.id === photoId) return { ...p, label };
      return p;
    });
    onChange({ photos: updatedPhotos });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-vku-400" />
          Bước 4: Chụp ảnh hiện trường & Bằng chứng thực địa
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Sử dụng Camera thiết bị để ghi lại hình ảnh khuyết tật và số tem tài sản VKU.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Capture Action Box */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-6 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-vku-600/20 border border-vku-500/30 text-vku-400 flex items-center justify-center mx-auto shadow-inner">
          <Camera className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Chụp ảnh bằng chứng thiết bị</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Ảnh chụp sẽ được nén tối ưu và lưu an toàn vào IndexedDB ngoại tuyến trên điện thoại.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            disabled={isCapturing}
            onClick={handleCapture}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vku-600 hover:bg-vku-500 text-white text-sm font-semibold shadow-lg shadow-vku-600/30 transition active:scale-95 disabled:opacity-50"
          >
            {isCapturing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang mở camera...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Chụp ảnh mới / Tải ảnh lên</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Captured Photos Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-vku-400" />
            Danh sách ảnh bằng chứng ({draft.photos?.length || 0})
          </label>
          {(draft.photos?.length || 0) > 0 && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu cục bộ
            </span>
          )}
        </div>

        {(!draft.photos || draft.photos.length === 0) ? (
          <div className="border border-dashed border-slate-700/80 rounded-xl p-8 text-center text-slate-500 text-xs">
            Chưa có ảnh chụp nào. Nhấn nút "Chụp ảnh mới" ở trên để ghi lại hình ảnh hư hỏng hoặc tem thiết bị.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {draft.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto(photo)}>
                  <img
                    src={photo.dataUrl}
                    alt={`Bằng chứng ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur"
                      title="Xem phóng to"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] text-white font-mono">
                    #{index + 1}
                  </span>
                </div>

                {/* Photo Label Input & Delete */}
                <div className="p-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Nhãn (VD: Tem vỡ, Dây đứt...)"
                    value={photo.label || ''}
                    onChange={(e) => handleUpdateLabel(photo.id, e.target.value)}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-vku-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {previewPhoto.label || 'Chi tiết ảnh bằng chứng'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
              >
                Đóng
              </button>
            </div>
            <div className="p-2 max-h-[75vh] overflow-auto flex items-center justify-center">
              <img
                src={previewPhoto.dataUrl}
                alt="Phóng to bằng chứng"
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
