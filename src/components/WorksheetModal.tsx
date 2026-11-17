import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, X } from 'lucide-react';
import { ScenarioId } from '../types/simulation';

interface WorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioId;
}

export const WorksheetModal: React.FC<WorksheetModalProps> = ({
  isOpen,
  onClose,
  scenario,
}) => {
  const [speedGuess, setSpeedGuess] = useState<'a' | 'b' | 'equal' | null>(null);
  const [volumeGuess, setVolumeGuess] = useState<'a' | 'b' | 'equal' | null>(
    null
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worksheet-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-700" aria-hidden="true" />
            <h2
              id="worksheet-modal-title"
              className="text-sm font-bold text-slate-900"
            >
              Phiếu học tập &amp; Quy trình Khám phá (Mô hình Johnstone)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto lab-scroll text-xs text-slate-700 leading-relaxed">
          {/* Step 1: Prediction */}
          <div className="space-y-2.5 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Bước 1. Dự đoán trước khi chạy (Chế độ So sánh A vs B)
            </h3>
            <p>
              {scenario === 'solid_liquid'
                ? 'Khi cho cùng 1,0 g CaCO₃ tác dụng với HCl dư trong hai điều kiện khác nhau (ví dụ A: 1,0 M / Bột mịn / Nóng so với B: 0,1 M / Khối viên / Lạnh):'
                : 'Khi cho cùng 50 mL H₂O₂ 0,4 M phân hủy ở 25°C (Ống A có thêm 0,10 g MnO₂ so với Ống B không có MnO₂):'}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-semibold text-slate-900 block">
                  1. Ống nào sủi bọt khí nhanh hơn?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'a', label: 'Ống A nhanh hơn' },
                    { id: 'b', label: 'Ống B nhanh hơn' },
                    { id: 'equal', label: 'Tốc độ bằng nhau' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setSpeedGuess(opt.id as 'a' | 'b' | 'equal')
                      }
                      className={`px-2.5 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                        speedGuess === opt.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-semibold text-slate-900 block">
                  2. Thể tích khí cuối cùng (t₁₀₀%) ống nào nhiều hơn?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'a', label: 'Ống A nhiều hơn' },
                    { id: 'b', label: 'Ống B nhiều hơn' },
                    { id: 'equal', label: 'Bằng nhau (247,9 mL)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setVolumeGuess(opt.id as 'a' | 'b' | 'equal')
                      }
                      className={`px-2.5 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                        volumeGuess === opt.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {volumeGuess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  {volumeGuess === 'equal'
                    ? 'Chính xác! Vì lượng chất tham gia ban đầu (0,01 mol chất tạo khí) ở hai ống bằng nhau, cả hai đường cong đều tiệm cận về đúng 247,9 mL (25°C, 1 bar).'
                    : 'Hãy chạy thử chế độ So sánh A vs B để kiểm chứng trên đồ thị: khi phản ứng kết thúc, cả hai đường đều tiệm cận về cùng một vạch ngang 247,9 mL vì cùng xuất phát từ 0,01 mol!'}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Johnstone Triangle */}
          <div className="space-y-1.5 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Bước 2. Quan sát liên kết 3 cấp độ Johnstone
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Vĩ mô (Khung trên):</strong> Quan sát tốc độ sủi bọt khí, viên đá vôi mòn dần và pit-tông xi-lanh bị đẩy ra.
              </li>
              <li>
                <strong>Vi mô (Khung dưới):</strong> Dùng tốc độ chậm <code>0.5x</code> để đếm <em>Tổng va chạm</em> và <em>Va chạm hiệu quả</em> (vòng sáng xanh/vàng). Thử kéo nồng độ từ 0,1 M lên 1,0 M để thấy mật độ hạt tăng gấp 10 lần.
              </li>
              <li>
                <strong>Biểu tượng (Cột phải):</strong> Theo dõi độ dốc của đồ thị V(t) và kiểm chứng quy tắc Van&apos;t Hoff (tăng 10°C thì t₁/₂ giảm một nửa, tốc độ tăng gấp đôi).
              </li>
            </ul>
          </div>

          {/* Step 3: Conclusions */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900">
              Bước 3. Kết luận kiến thức trọng tâm (SGK KHTN 8)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Tốc độ phản ứng tăng khi tăng <strong>nồng độ</strong>, tăng <strong>nhiệt độ</strong>, hoặc tăng <strong>diện tích bề mặt tiếp xúc</strong> (nghiền nhỏ chất rắn).
              </li>
              <li>
                <strong>Chất xúc tác (MnO₂)</strong> làm hạ thấp rào cản năng lượng hoạt hóa (Eₐ), giúp tăng tốc độ phản ứng nhưng <strong>khối lượng vẫn giữ nguyên (0,10 g)</strong> sau phản ứng.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
