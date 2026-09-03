import React from 'react';
import { Monitor, Projector, Wind, Zap, Armchair, Tag, Barcode, Sparkles } from 'lucide-react';
import { EquipmentCategory, InspectionDraft } from '../types/audit';

interface Step2Props {
  draft: InspectionDraft;
  onChange: (updates: Partial<InspectionDraft>) => void;
}

interface CategoryOption {
  id: EquipmentCategory;
  name: string;
  desc: string;
  icon: React.ElementType;
  defaultItems: string[];
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'Hardware',
    name: 'Hardware',
    desc: 'PC Lab, Màn hình LCD, Server, Máy in, Switch',
    icon: Monitor,
    defaultItems: ['PC Dell OptiPlex 7080 Lab', 'Màn hình Dell 24 inch', 'Server Rack Lab B1', 'Switch Cisco 24-Port'],
  },
  {
    id: 'Projector',
    name: 'Projector',
    desc: 'Máy chiếu Panasonic/Sony, Màn chiếu điện, Cáp HDMI',
    icon: Projector,
    defaultItems: ['Máy chiếu Panasonic PT-LB385', 'Máy chiếu Sony VPL-EX455', 'Màn chiếu cuốn điện 120 inch', 'Cáp HDMI âm tường 15m'],
  },
  {
    id: 'AC',
    name: 'AC (Điều hòa)',
    desc: 'Điều hòa Daikin/Panasonic, Remote, Quạt đảo',
    icon: Wind,
    defaultItems: ['Điều hòa Daikin Inverter 2.5 HP', 'Điều hòa Panasonic 18000 BTU', 'Remote điều hòa treo tường', 'Dàn lạnh âm trần Cassette'],
  },
  {
    id: 'Electrical',
    name: 'Electrical (Điện)',
    desc: 'Tủ điện tổng, Ổ cắm âm sàn/tường, Đèn LED, Quạt trần',
    icon: Zap,
    defaultItems: ['Tủ điện phân phối tầng', 'Ổ cắm điện âm sàn 3 chấu', 'Bộ máng đèn LED đôi 1.2m', 'Quạt trần Panasonic 3 cánh'],
  },
  {
    id: 'Furniture',
    name: 'Furniture',
    desc: 'Bàn ghế sinh viên, Bục giảng, Bảng từ trượt',
    icon: Armchair,
    defaultItems: ['Bàn liền ghế sinh viên 2 chỗ', 'Bàn ghế giảng viên', 'Bục giảng thông minh tích hợp', 'Bảng từ trắng chống lóa 3.6m'],
  },
];

export const Step2Equipment: React.FC<Step2Props> = ({ draft, onChange }) => {
  const currentCategory = CATEGORIES.find((c) => c.id === draft.category) || CATEGORIES[0];

  const generateQuickTag = () => {
    const prefix = draft.category.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generated = `VKU-${prefix}-${randomNum}`;
    onChange({ assetTag: generated });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-vku-400" />
          Bước 2: Phân loại & Thông tin thiết bị
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Chọn phân loại thiết bị cơ sở vật chất VKU và thông tin định danh tài sản.
        </p>
      </div>

      {/* Category Selection Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Loại thiết bị kiểm định <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = draft.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange({
                    category: cat.id,
                    itemName: cat.defaultItems[0] || '',
                  });
                }}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-vku-950/70 border-vku-500 ring-2 ring-vku-500/40 text-white shadow-lg'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    isSelected ? 'bg-vku-600 text-white' : 'bg-slate-700/60 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{cat.name}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Equipment Item Name */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Tên thiết bị / Model cụ thể <span className="text-rose-400">*</span>
        </label>

        {/* Quick Item Presets */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {currentCategory.defaultItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange({ itemName: item })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                draft.itemName === item
                  ? 'bg-vku-500/30 border border-vku-400 text-vku-200'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Nhập tên thiết bị (ví dụ: Máy chiếu Panasonic PT-LB385)"
          value={draft.itemName}
          onChange={(e) => onChange({ itemName: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-vku-500 transition"
        />
      </div>

      {/* Asset Tag & Serial Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-vku-400" />
              Mã Barcode / Thẻ tài sản VKU
            </span>
            <button
              type="button"
              onClick={generateQuickTag}
              className="text-[11px] text-vku-400 hover:text-vku-300 flex items-center gap-1 font-normal lowercase"
            >
              <Sparkles className="w-3 h-3" /> Tạo mã nhanh
            </button>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="VD: VKU-PRJ-8492"
              value={draft.assetTag}
              onChange={(e) => onChange({ assetTag: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-vku-500 transition"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-vku-400" />
            Số Serial nhà sản xuất (nếu có)
          </label>
          <input
            type="text"
            placeholder="VD: SN-2023-XYZ-991"
            value={draft.serialNumber}
            onChange={(e) => onChange({ serialNumber: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-vku-500 transition"
          />
        </div>
      </div>
    </div>
  );
};
