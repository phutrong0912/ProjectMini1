import React from 'react';
import { Star, AlertCircle, CheckCircle2, ShieldAlert, FileText, Check } from 'lucide-react';
import { DefectUrgency, InspectionDraft } from '../types/audit';

interface Step3Props {
  draft: InspectionDraft;
  onChange: (updates: Partial<InspectionDraft>) => void;
}

const RATING_DESCRIPTIONS: Record<number, { title: string; desc: string; color: string }> = {
  1: {
    title: '1 Sao - Nghiêm trọng / Hỏng hóc hoàn toàn',
    desc: 'Thiết bị ngừng hoạt động, tiềm ẩn nguy cơ chập cháy, mất an toàn cho sinh viên và giảng viên.',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  2: {
    title: '2 Sao - Hư hỏng nặng',
    desc: 'Hoạt động chập chờn, phát tiếng kêu lạ hoặc thiếu linh kiện chính, cần đội bảo trì can thiệp gấp.',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  3: {
    title: '3 Sao - Trung bình / Xuống cấp',
    desc: 'Vẫn sử dụng được nhưng hiệu suất giảm sút, bụi bẩn nhiều hoặc hao mòn cơ học theo thời gian.',
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  },
  4: {
    title: '4 Sao - Khá tốt',
    desc: 'Hoạt động ổn định, chỉ có các vết xước nhỏ bên ngoài hoặc bụi bám bề mặt thông thường.',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  },
  5: {
    title: '5 Sao - Xuất sắc / Như mới',
    desc: 'Hoạt động hoàn hảo, nguyên tem bảo hành, bề mặt sạch sẽ, đầy đủ phụ kiện theo tiêu chuẩn VKU.',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
};

const COMMON_DEFECT_TAGS: Record<string, string[]> = {
  Hardware: [
    'Không lên nguồn',
    'Màn hình sọc / nhấp nháy',
    'Chuột / Bàn phím hỏng',
    'Mất kết nối mạng LAN',
    'Quạt case kêu to',
    'Thiếu dây nguồn',
  ],
  Projector: [
    'Bóng đèn mờ / báo thay',
    'Cáp HDMI lỏng / mất tín hiệu',
    'Màn chiếu kẹt không kéo được',
    'Không nhận remote',
    'Quạt tản nhiệt quá nhiệt tắt nguồn',
    'Khung treo trần lung lay',
  ],
  AC: [
    'Không mát / hết gas',
    'Chảy nước dàn lạnh',
    'Lưới lọc bụi bẩn nghẹt',
    'Mất điều khiển (remote)',
    'Phát tiếng ồn lớn khi chạy',
    'Gãy cánh đảo gió',
  ],
  Electrical: [
    'Ổ cắm âm sàn vỡ nắp',
    'Cháy đen tiếp điểm',
    'Bóng đèn tuýp LED nhấp nháy',
    'Aptomat hay bị nhảy',
    'Dây điện hở nguy hiểm',
    'Công tắc lỏng lẻo',
  ],
  Furniture: [
    'Gãy chân bàn / chân ghế',
    'Mặt bàn bong tróc / viết bẩn',
    'Bục giảng lung lay',
    'Bảng từ trắng trầy xước khó xóa',
    'Bánh xe ghế hỏng',
    'Ốc vít lỏng lẻo',
  ],
};

const URGENCY_LEVELS: { id: DefectUrgency; label: string; color: string; desc: string }[] = [
  { id: 'low', label: 'Thấp', color: 'border-slate-700 hover:border-slate-600 text-slate-300', desc: 'Bảo trì định kỳ thông thường' },
  { id: 'medium', label: 'Trung bình', color: 'border-yellow-600/50 text-yellow-300', desc: 'Cần khắc phục trong vòng 1 tuần' },
  { id: 'high', label: 'Cao', color: 'border-orange-600/60 text-orange-300', desc: 'Xử lý khẩn trong 24h' },
  { id: 'critical', label: 'Khẩn cấp / Nguy hiểm', color: 'border-rose-600 text-rose-300', desc: 'Nguy cơ cháy nổ / Ngừng sử dụng ngay' },
];

export const Step3Assessment: React.FC<Step3Props> = ({ draft, onChange }) => {
  const currentRating = draft.rating || 4;
  const ratingInfo = RATING_DESCRIPTIONS[currentRating];
  const defectSuggestions = COMMON_DEFECT_TAGS[draft.category] || COMMON_DEFECT_TAGS.Hardware;

  const toggleDefectTag = (tag: string) => {
    const existing = draft.defectTags || [];
    if (existing.includes(tag)) {
      onChange({ defectTags: existing.filter((t) => t !== tag) });
    } else {
      onChange({ defectTags: [...existing, tag] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          Bước 3: Đánh giá hiện trạng & Mức độ khuyết tật
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Đánh giá tình trạng 1–5 sao, gắn nhãn lỗi và ghi chú chi tiết sự cố.
        </p>
      </div>

      {/* 1-5 Star Interactive Rating */}
      <div className="space-y-3 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Đánh giá tình trạng thiết bị (1–5 Sao) <span className="text-rose-400">*</span>
        </label>

        {/* Star Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 py-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= currentRating;
            return (
              <button
                key={star}
                type="button"
                onClick={() => onChange({ rating: star })}
                className="group p-1 transition-transform active:scale-95 focus:outline-none"
                title={`Đánh giá ${star} sao`}
              >
                <Star
                  className={`w-9 h-9 sm:w-11 sm:h-11 transition-all ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'text-slate-600 hover:text-slate-500'
                  }`}
                />
              </button>
            );
          })}
          <span className="ml-2 font-mono text-xl font-black text-amber-400">
            {currentRating}/5
          </span>
        </div>

        {/* Rating Description Banner */}
        <div className={`p-3 rounded-xl border text-xs leading-relaxed transition ${ratingInfo.color}`}>
          <div className="font-bold text-sm mb-0.5">{ratingInfo.title}</div>
          <div className="opacity-90">{ratingInfo.desc}</div>
        </div>
      </div>

      {/* Quick Defect Tags */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span>Gắn nhãn lỗi thường gặp</span>
          <span className="text-[11px] text-slate-400 font-normal">
            Đã chọn: {(draft.defectTags || []).length}
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {defectSuggestions.map((tag) => {
            const isSelected = (draft.defectTags || []).includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDefectTag(tag)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  isSelected
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-rose-400" />}
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Urgency Level */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Mức độ khẩn cấp xử lý <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {URGENCY_LEVELS.map((u) => {
            const isSelected = draft.urgency === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onChange({ urgency: u.id })}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? `bg-slate-800 ${u.color} ring-2 ring-current`
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{u.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5 leading-tight">{u.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Defect Notes */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-vku-400" />
          Mô tả chi tiết khuyết tật & Đề xuất khắc phục
        </label>
        <textarea
          rows={3}
          placeholder="Ghi chú chi tiết biểu hiện lỗi, vị trí cụ thể (ví dụ: ổ cắm góc trái bảng bị cháy đen, máy chiếu rung khi khởi động...)"
          value={draft.defectNotes}
          onChange={(e) => onChange({ defectNotes: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-vku-500 transition"
        />
      </div>
    </div>
  );
};
