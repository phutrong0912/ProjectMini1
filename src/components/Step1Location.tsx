import React from 'react';
import { MapPin, Building2, Layers, DoorClosed } from 'lucide-react';
import { InspectionDraft } from '../types/audit';

interface Step1Props {
  draft: InspectionDraft;
  onChange: (updates: Partial<InspectionDraft>) => void;
}

const VKU_BUILDINGS = [
  { id: 'Tòa nhà A', label: 'Tòa nhà A (Khu Hiệu bộ & Giảng đường)' },
  { id: 'Tòa nhà B', label: 'Tòa nhà B (Khoa Công nghệ Thông tin)' },
  { id: 'Tòa nhà C', label: 'Tòa nhà C (Khoa Kinh tế số & Trí tuệ nhân tạo)' },
  { id: 'Tòa nhà V', label: 'Tòa nhà V (Trung tâm Văn hóa Việt - Hàn)' },
  { id: 'Tòa nhà K', label: 'Tòa nhà K (Khu Công nghệ Kỹ thuật cao)' },
  { id: 'Thư viện & Hội trường', label: 'Thư viện số & Hội trường lớn' },
  { id: 'Tầng hầm Kỹ thuật & Thể thao', label: 'Tầng hầm Kỹ thuật & Khu Thể thao' },
  { id: 'Ký túc xá', label: 'Khu Ký túc xá Sinh viên' },
];

const FLOORS = [
  'Tầng hầm B1',
  'Tầng 1 (Trệt)',
  'Tầng 2',
  'Tầng 3',
  'Tầng 4',
  'Tầng 5',
  'Tầng thượng',
];

const POPULAR_ROOMS: Record<string, string[]> = {
  'Tòa nhà A': ['A101', 'A102', 'A201', 'A205', 'Hội trường A'],
  'Tòa nhà B': ['Lab B101', 'Lab B202', 'Lab B305', 'Server Room B-01', 'B401'],
  'Tòa nhà C': ['C101', 'C203', 'AI Hub C301', 'Lab Robotics C402'],
  'Tòa nhà V': ['V101', 'V201', 'Phòng Hội thảo V302'],
  'Tòa nhà K': ['K102', 'Xưởng Kỹ thuật K201', 'Lab K304'],
  'Tầng hầm Kỹ thuật & Thể thao': ['Phòng Máy Bơm B1-01', 'Trạm Biến Áp B1-02', 'Kho Thiết Bị Thể Thao'],
};

export const Step1Location: React.FC<Step1Props> = ({ draft, onChange }) => {
  const selectedBuildingRooms = POPULAR_ROOMS[draft.building] || ['Phòng 101', 'Phòng 201', 'Phòng 301'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-vku-400" />
          Bước 1: Vị trí kiểm định tại cơ sở VKU
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Chọn tòa nhà, tầng và số hiệu phòng cần kiểm tra thiết bị.
        </p>
      </div>

      {/* Building Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-vku-400" />
          Tòa nhà / Khu vực cơ sở <span className="text-rose-400">*</span>
        </label>
        <select
          value={draft.building}
          onChange={(e) => {
            const nextBuilding = e.target.value;
            onChange({
              building: nextBuilding,
              room: POPULAR_ROOMS[nextBuilding]?.[0] || '',
            });
          }}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vku-500 transition"
        >
          {VKU_BUILDINGS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {/* Floor Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-vku-400" />
          Tầng / Khu vực độ cao <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FLOORS.map((f) => {
            const isSelected = draft.floor === f;
            const isBasement = f.includes('hầm');
            return (
              <button
                key={f}
                type="button"
                onClick={() => onChange({ floor: f })}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition ${
                  isSelected
                    ? 'bg-vku-600 border-vku-400 text-white shadow-md shadow-vku-600/30'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{f}</span>
                  {isBasement && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Mất sóng
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Room Selection & Free Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <DoorClosed className="w-4 h-4 text-vku-400" />
          Số hiệu Phòng / Khu vực chức năng <span className="text-rose-400">*</span>
        </label>

        {/* Quick Room Suggestions */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedBuildingRooms.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ room: r })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                draft.room === r
                  ? 'bg-vku-500/30 border border-vku-400 text-vku-200'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Hoặc nhập tên phòng cụ thể (ví dụ: Lab AI-302, Kho thiết bị B1-04...)"
          value={draft.room}
          onChange={(e) => onChange({ room: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-vku-500 transition"
        />
      </div>
    </div>
  );
};
