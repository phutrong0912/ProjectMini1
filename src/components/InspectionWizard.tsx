import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Monitor,
  Star,
  Camera,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InspectionDraft } from '../types/audit';
import { saveDraft, getDraft, clearDraft, enqueueAudit } from '../services/db';
import { syncEngine } from '../services/sync';
import { networkService } from '../services/network';
import { Step1Location } from './Step1Location';
import { Step2Equipment } from './Step2Equipment';
import { Step3Assessment } from './Step3Assessment';
import { Step4Evidence } from './Step4Evidence';
import { Step5Review } from './Step5Review';

const DEFAULT_DRAFT: InspectionDraft = {
  currentStep: 1,
  lastSavedAt: Date.now(),
  building: 'Tòa nhà B',
  floor: 'Tầng hầm B1',
  room: 'Lab B101',
  category: 'Hardware',
  itemName: 'PC Dell OptiPlex 7080 Lab',
  assetTag: 'VKU-PC-1042',
  serialNumber: '',
  rating: 4,
  defectTags: [],
  urgency: 'low',
  defectNotes: '',
  photos: [],
  inspectorName: 'Nguyễn Văn An',
  inspectorId: '21IT-089',
};

const STEPS = [
  { step: 1, title: 'Vị trí', icon: MapPin },
  { step: 2, title: 'Thiết bị', icon: Monitor },
  { step: 3, title: 'Hiện trạng', icon: Star },
  { step: 4, title: 'Bằng chứng', icon: Camera },
  { step: 5, title: 'Xác nhận', icon: ClipboardCheck },
];

interface WizardProps {
  onSurveySubmitted?: () => void;
}

export const InspectionWizard: React.FC<WizardProps> = ({ onSurveySubmitted }) => {
  const [draft, setDraft] = useState<InspectionDraft>(DEFAULT_DRAFT);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const autosaveTimeoutRef = useRef<any>(null);

  // 1. Restore draft from IndexedDB on initial mount
  useEffect(() => {
    async function loadSavedDraft() {
      const saved = await getDraft();
      if (saved && saved.building) {
        setDraft(saved);
        const timeStr = new Date(saved.lastSavedAt).toLocaleTimeString('vi-VN');
        setRestoredNotice(`Đã tự động khôi phục bản nháp khảo sát lúc ${timeStr}`);
      }
    }
    loadSavedDraft();
  }, []);

  // 2. Real-time autosave to IndexedDB with debounce
  const updateDraft = (updates: Partial<InspectionDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...updates };
      
      // Debounced write to IndexedDB
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = setTimeout(() => {
        saveDraft(next);
      }, 300);

      return next;
    });
  };

  const handleNextStep = () => {
    if (draft.currentStep < 5) {
      const nextStep = draft.currentStep + 1;
      updateDraft({ currentStep: nextStep });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (draft.currentStep > 1) {
      const prevStep = draft.currentStep - 1;
      updateDraft({ currentStep: prevStep });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearDraft = async () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy bản nháp hiện tại và nhập lại từ đầu?')) {
      await clearDraft();
      setDraft({
        ...DEFAULT_DRAFT,
        lastSavedAt: Date.now(),
      });
      setRestoredNotice(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Enqueue to IndexedDB audit_queue as PENDING_SYNC with UUID
      const queuedItem = await enqueueAudit({
        building: draft.building,
        floor: draft.floor,
        room: draft.room,
        category: draft.category,
        itemName: draft.itemName,
        assetTag: draft.assetTag,
        serialNumber: draft.serialNumber,
        rating: draft.rating,
        defectTags: draft.defectTags,
        urgency: draft.urgency,
        defectNotes: draft.defectNotes,
        photos: draft.photos,
        inspectorName: draft.inspectorName,
        inspectorId: draft.inspectorId,
        gpsCoords: draft.gpsCoords,
        completedAt: new Date().toISOString(),
      });

      // 2. Clear the draft so user has a fresh form
      await clearDraft();

      // 3. Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // 4. Trigger sync engine if online
      if (networkService.isEffectiveOnline()) {
        syncEngine.processQueue();
      }

      setSubmitSuccess(
        `Đã lưu thành công phiếu khảo sát [${queuedItem.id.substring(0, 8)}] vào IndexedDB hàng đợi.`
      );

      // Reset form
      setDraft({
        ...DEFAULT_DRAFT,
        building: draft.building,
        floor: draft.floor,
        inspectorName: draft.inspectorName,
        inspectorId: draft.inspectorId,
        lastSavedAt: Date.now(),
      });

      if (onSurveySubmitted) onSurveySubmitted();
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      alert('Có lỗi khi lưu vào IndexedDB: ' + err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
      {/* Draft Restored Banner */}
      {restoredNotice && (
        <div className="mb-4 p-3 rounded-xl bg-vku-950/80 border border-vku-500/40 text-vku-300 text-xs flex items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-vku-400 shrink-0" />
            <span>{restoredNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRestoredNotice(null)}
            className="text-[11px] hover:underline font-semibold text-vku-200"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Submit Success Modal/Alert */}
      {submitSuccess && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccess(null)}
            className="px-2.5 py-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-700/60 text-white font-semibold text-[11px]"
          >
            Đồng ý
          </button>
        </div>
      )}

      {/* Stepper Progress Header */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = draft.currentStep > s.step;
            const isCurrent = draft.currentStep === s.step;

            return (
              <React.Fragment key={s.step}>
                <button
                  type="button"
                  onClick={() => updateDraft({ currentStep: s.step })}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group z-10"
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-vku-600 text-white shadow-lg shadow-vku-600/40 ring-2 ring-vku-400 scale-105'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-750'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold tracking-tight ${
                      isCurrent ? 'text-vku-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </button>

                {/* Progress bar line between steps */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded transition-colors ${
                      draft.currentStep > s.step ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Step Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative min-h-[420px] flex flex-col justify-between">
        {/* Step Component View */}
        <div className="pb-6">
          {draft.currentStep === 1 && (
            <Step1Location draft={draft} onChange={updateDraft} />
          )}
          {draft.currentStep === 2 && (
            <Step2Equipment draft={draft} onChange={updateDraft} />
          )}
          {draft.currentStep === 3 && (
            <Step3Assessment draft={draft} onChange={updateDraft} />
          )}
          {draft.currentStep === 4 && (
            <Step4Evidence draft={draft} onChange={updateDraft} />
          )}
          {draft.currentStep === 5 && (
            <Step5Review
              draft={draft}
              onChange={updateDraft}
              onSubmit={handleSubmit}
              onClearDraft={handleClearDraft}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Step Footer Navigation (Steps 1 to 4) */}
        {draft.currentStep < 5 && (
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={draft.currentStep === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>

            <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
              Tự động lưu IndexedDB • Bước {draft.currentStep}/5
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-vku-600 hover:bg-vku-500 text-white text-xs font-bold shadow-lg shadow-vku-600/30 transition active:scale-95"
            >
              <span>Tiếp tục</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
