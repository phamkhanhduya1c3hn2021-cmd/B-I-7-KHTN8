import React from 'react';
import { BookOpen, ClipboardCheck, Download } from 'lucide-react';
import { ScenarioId } from '../types/simulation';

interface TopHeaderProps {
  scenario: ScenarioId;
  onSelectScenario: (scenario: ScenarioId) => void;
  onOpenExport: () => void;
  onOpenWorksheet: () => void;
  onOpenPractice: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  scenario,
  onSelectScenario,
  onOpenExport,
  onOpenWorksheet,
  onOpenPractice,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8 shrink-0">
      {/* Zone 1: Single-line Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-base lg:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
          KHTN 8 · Động học Phản ứng
        </span>
      </div>

      {/* Zone 2: Scenario Tabs & Symbolic Equation */}
      <div className="flex items-center gap-4 min-w-0">
        <nav
          aria-label="Kịch bản thí nghiệm"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/70 shrink-0"
        >
          <button
            type="button"
            onClick={() => onSelectScenario('solid_liquid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              scenario === 'solid_liquid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Hệ Rắn – Dung dịch
          </button>
          <button
            type="button"
            onClick={() => onSelectScenario('catalyst')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              scenario === 'catalyst'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Hệ Xúc tác (MnO₂)
          </button>
        </nav>

        {/* Symbolic Chemical Equation (Hidden on very narrow screens, shown on xl) */}
        <div
          className="hidden xl:flex items-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs text-slate-800 whitespace-nowrap shrink-0"
          title="Phương trình hóa học (Cấp độ Biểu tượng)"
        >
          {scenario === 'solid_liquid' ? (
            <span>
              CaCO<sub>3</sub>(rắn) + 2HCl(dd) → CaCl<sub>2</sub>(dd) + CO<sub>2</sub>↑(khí) + H<sub>2</sub>O(lỏng)
            </span>
          ) : (
            <span>
              2H<sub>2</sub>O<sub>2</sub>(dd){' '}
              <span className="inline-flex flex-col items-center mx-1 leading-none align-middle">
                <span className="text-[10px] font-semibold text-amber-700 border-b border-slate-700 px-1 pb-0.5">
                  MnO<sub>2</sub>
                </span>
                <span className="text-[10px] text-slate-500 pt-0.5">→</span>
              </span>{' '}
              2H<sub>2</sub>O(lỏng) + O<sub>2</sub>↑(khí)
            </span>
          )}
        </div>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenPractice}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
          Bài tập củng cố
        </button>
        <button
          type="button"
          onClick={onOpenWorksheet}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          Phiếu học tập
        </button>
        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Xuất HTML5 / Biểu đồ
        </button>
      </div>
    </header>
  );
};
