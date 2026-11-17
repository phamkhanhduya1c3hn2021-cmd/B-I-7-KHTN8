import React from 'react';
import { FileSpreadsheet, Trash2 } from 'lucide-react';
import {
  ExperimentConfig,
  RunState,
  SavedRunRecord,
  ScenarioId,
} from '../types/simulation';
import {
  CATALYST_MASS_G,
  THEORETICAL_GAS_VOLUME_ML,
  formatViNumber,
} from '../utils/kinetics';
import { generateCsvReport, triggerDownload } from '../utils/htmlExporter';

interface ValidationPanelProps {
  scenario: ScenarioId;
  compareMode: boolean;
  configA: ExperimentConfig;
  configB: ExperimentConfig;
  runA: RunState;
  runB: RunState;
  savedRuns: SavedRunRecord[];
  onClearSaved: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  scenario,
  compareMode,
  configA,
  runA,
  runB,
  savedRuns,
  onClearSaved,
}) => {
  const errA =
    (Math.abs(runA.volumeGas - THEORETICAL_GAS_VOLUME_ML) /
      THEORETICAL_GAS_VOLUME_ML) *
    100;
  const avgRateA =
    runA.elapsedTime > 0 ? runA.volumeGas / runA.elapsedTime : 0;

  const handleDownloadCsv = () => {
    if (savedRuns.length === 0) return;
    const csv = generateCsvReport(savedRuns);
    triggerDownload(
      csv,
      `bang-kiem-chung-khtn8-${scenario}.csv`,
      'text/csv;charset=utf-8'
    );
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <h3 className="text-xs font-bold text-slate-900 truncate">
          Bảng Kiểm chứng Mô phỏng
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={savedRuns.length === 0}
            title="Xuất bảng số liệu CSV"
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileSpreadsheet className="w-3 h-3" aria-hidden="true" />
            CSV
          </button>
          {savedRuns.length > 0 && (
            <button
              type="button"
              onClick={onClearSaved}
              title="Xóa lịch sử bảng"
              className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-slate-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Live Verification Metrics Strip */}
      <div className="px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-100 grid grid-cols-2 gap-2 shrink-0">
        {/* Metric 1: Stoichiometry & Molar Gas Volume */}
        <div className="bg-white border border-slate-200 rounded-lg p-2">
          <div className="text-[10.5px] font-medium text-slate-500">
            Bảo toàn khí (V_lt = 247,9 mL)
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1 font-mono tabular-nums">
            <span className="text-sm font-bold text-slate-900">
              {formatViNumber(runA.volumeGas, 2)} mL
            </span>
            <span
              className={`text-[10.5px] font-semibold ${
                runA.isComplete ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {runA.isComplete
                ? `Sai số ${formatViNumber(errA, 2)}%`
                : 'Đang thu khí'}
            </span>
          </div>
        </div>

        {/* Metric 2: Mean Rate OR Catalyst Conservation */}
        {scenario === 'catalyst' ? (
          <div className="bg-white border border-slate-200 rounded-lg p-2">
            <div className="text-[10.5px] font-medium text-slate-500">
              Kiểm chứng khối lượng MnO₂
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1 font-mono tabular-nums">
              <span className="text-xs font-bold text-slate-900">
                {configA.hasCatalyst
                  ? `${formatViNumber(CATALYST_MASS_G, 2)} g → ${formatViNumber(CATALYST_MASS_G, 2)} g`
                  : '0,00 g'}
              </span>
              <span className="text-[10.5px] font-semibold text-amber-700">
                {configA.hasCatalyst ? 'Δm = 0 g' : 'Không XT'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-2">
            <div className="text-[10.5px] font-medium text-slate-500">
              Tốc độ TB (v_tb = ΔV / Δt)
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1 font-mono tabular-nums">
              <span className="text-sm font-bold text-slate-900">
                {formatViNumber(avgRateA, 2)} mL/s
              </span>
              {compareMode && (
                <span className="text-[10.5px] font-semibold text-sky-700">
                  B:{' '}
                  {formatViNumber(
                    runB.elapsedTime > 0 ? runB.volumeGas / runB.elapsedTime : 0,
                    2
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Half-Life & Completion Strip */}
      <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600 shrink-0">
        <span>
          t₁/₂ (A):{' '}
          <strong className="text-slate-900">
            {runA.tHalf !== null ? `${formatViNumber(runA.tHalf, 2)}s` : '—'}
          </strong>
        </span>
        <span>
          t₁₀₀% (A):{' '}
          <strong className="text-slate-900">
            {runA.tComplete !== null
              ? `${formatViNumber(runA.tComplete, 2)}s`
              : '—'}
          </strong>
        </span>
        {compareMode && (
          <span className="text-sky-700">
            t₁/₂ (B):{' '}
            <strong>
              {runB.tHalf !== null ? `${formatViNumber(runB.tHalf, 2)}s` : '—'}
            </strong>
          </span>
        )}
      </div>

      {/* Run History Table */}
      <div className="flex-1 overflow-auto lab-scroll min-h-[110px]">
        <table className="w-full text-left border-collapse text-[11px] tabular-nums">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 z-10">
            <tr>
              <th className="py-1.5 px-2.5 font-semibold">Lần</th>
              <th className="py-1.5 px-2 font-semibold">Điều kiện</th>
              <th className="py-1.5 px-2 font-semibold text-right">t₁/₂(s)</th>
              <th className="py-1.5 px-2 font-semibold text-right">t₁₀₀%(s)</th>
              <th className="py-1.5 px-2.5 font-semibold text-right">v_tb</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {savedRuns.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 px-3 text-center text-slate-500 text-xs"
                >
                  Chạy hoàn tất thí nghiệm hoặc nhấn <strong>Lưu bảng</strong> để đối chiếu quy luật tốc độ phản ứng.
                </td>
              </tr>
            ) : (
              savedRuns.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80">
                  <td className="py-1.5 px-2.5 font-semibold text-slate-900 whitespace-nowrap">
                    {rec.label}
                  </td>
                  <td
                    className="py-1.5 px-2 text-slate-700 max-w-[130px] truncate"
                    title={rec.summary}
                  >
                    {rec.summary}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-right text-slate-800 whitespace-nowrap">
                    {rec.tHalf !== null ? formatViNumber(rec.tHalf, 2) : '—'}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-right text-slate-800 whitespace-nowrap">
                    {rec.tComplete !== null
                      ? formatViNumber(rec.tComplete, 2)
                      : '—'}
                  </td>
                  <td className="py-1.5 px-2.5 font-mono text-right font-semibold text-slate-900 whitespace-nowrap">
                    {formatViNumber(rec.avgRate, 2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
