import React from 'react';
import { TourConfig, LocationItem } from '../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';

interface AdminTourTabProps {
  tourConfig?: TourConfig;
  locations: LocationItem[];
  onUpdate: (config: TourConfig) => void;
}

export const AdminTourTab: React.FC<AdminTourTabProps> = ({ tourConfig, locations, onUpdate }) => {
  const config = tourConfig || { title: '', estimatedDuration: '', steps: [] };

  const handleAddStep = () => {
    const newStep = { locationId: locations[0]?.id || '', narrationScript: '' };
    onUpdate({ ...config, steps: [...config.steps, newStep] });
  };

  const handleUpdateStep = (index: number, field: string, value: string) => {
    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onUpdate({ ...config, steps: newSteps });
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = config.steps.filter((_, i) => i !== index);
    onUpdate({ ...config, steps: newSteps });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSteps = [...config.steps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      onUpdate({ ...config, steps: newSteps });
    } else if (direction === 'down' && index < config.steps.length - 1) {
      const newSteps = [...config.steps];
      [newSteps[index + 1], newSteps[index]] = [newSteps[index], newSteps[index + 1]];
      onUpdate({ ...config, steps: newSteps });
    }
  };

  const handleDuplicateStep = (index: number) => {
    const newSteps = [...config.steps];
    const stepToDuplicate = newSteps[index];
    newSteps.splice(index + 1, 0, { ...stepToDuplicate });
    onUpdate({ ...config, steps: newSteps });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 bg-[#FDFCFB] p-6 rounded-2xl border border-gray-200 shadow-xs">
      <div className="border-b border-gray-200 pb-3">
        <h3 className="font-serif font-bold text-sm text-[#1A365D]">Quản Lý Tour Tham Quan Gợi Ý (Guided Tour)</h3>
        <p className="text-gray-500 text-[11px] mt-0.5">Cấu hình danh sách các điểm đến trong tour trải nghiệm resort.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-bold mb-1 text-xs">Tên Tour</label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => onUpdate({ ...config, title: e.target.value })}
            placeholder="VD: The Cliff Discovery Tour"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-[#1A365D] outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-1 text-xs">Thời Gian Dự Kiến</label>
          <input
            type="text"
            value={config.estimatedDuration}
            onChange={(e) => onUpdate({ ...config, estimatedDuration: e.target.value })}
            placeholder="VD: 15 Phút"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-[#1A365D] outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-gray-700 font-bold text-xs">Danh Sách Điểm Tham Quan</label>
          <button
            onClick={handleAddStep}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A365D] hover:bg-[#2A4365] text-white font-bold text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Điểm Mới</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
          {config.steps.map((step, idx) => (
            <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl flex gap-3 relative group">
              <div className="flex flex-col gap-1 mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleMoveStep(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleMoveStep(idx, 'down')} disabled={idx === config.steps.length - 1} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1A365D] bg-blue-50 px-2 py-0.5 rounded text-[10px]">Bước {idx + 1}</span>
                  <select
                    value={step.locationId}
                    onChange={(e) => handleUpdateStep(idx, 'locationId', e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:border-[#1A365D] outline-none"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>#{loc.code} - {loc.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <textarea
                    rows={2}
                    value={step.narrationScript}
                    onChange={(e) => handleUpdateStep(idx, 'narrationScript', e.target.value)}
                    placeholder="Nhập kịch bản thuyết minh giọng nói AI..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] focus:border-[#1A365D] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 self-start">
                <button onClick={() => handleDuplicateStep(idx)} className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Nhân bản bước này (Duplicate)">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleRemoveStep(idx)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors" title="Xóa bước này">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          
          {config.steps.length === 0 && (
            <div className="text-center p-6 bg-gray-50 border border-gray-200 border-dashed rounded-xl text-gray-500 text-xs">
              Chưa có điểm tham quan nào. Bấm "Thêm Điểm Mới" để bắt đầu cấu hình tour.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
