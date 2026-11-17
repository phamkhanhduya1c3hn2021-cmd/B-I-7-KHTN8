import React from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  ExperimentConfig,
  ScenarioId,
  SurfaceAreaType,
} from '../types/simulation';
import {
  CATALYST_MASS_G,
  FIXED_CACO3_MASS_G,
  FIXED_SOLUTION_VOL_ML,
  SURFACE_AREA_META,
  formatViNumber,
} from '../utils/kinetics';

interface ControlPanelProps {
  scenario: ScenarioId;
  compareMode: boolean;
  onToggleCompareMode: (compare: boolean) => void;
  activeTube: 'A' | 'B';
  onSelectActiveTube: (tube: 'A' | 'B') => void;
  configA: ExperimentConfig;
  configB: ExperimentConfig;
  onUpdateConfig: (tube: 'A' | 'B', patch: Partial<ExperimentConfig>) => void;
  onApplyPresetCompare: () => void;
  isRunning: boolean;
  hasStarted: boolean;
  isFinished: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  onSaveRun: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  scenario,
  compareMode,
  onToggleCompareMode,
  activeTube,
  onSelectActiveTube,
  configA,
  configB,
  onUpdateConfig,
  onApplyPresetCompare,
  isRunning,
  hasStarted,
  isFinished,
  onTogglePlay,
  onReset,
  speed,
  onChangeSpeed,
  onSaveRun,
}) => {
  const currentTube = compareMode ? activeTube : 'A';
  const currentConfig = currentTube === 'A' ? configA : configB;
  const sliderClass =
    currentTube === 'A' ? 'lab-slider slider-a' : 'lab-slider slider-b';
  const isLocked = isRunning || (hasStarted && !isFinished);

  return (
    <aside className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header & Mode Switch */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-900 truncate">
            Điều khiển Thí nghiệm
          </h2>
        </div>

        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/70 shrink-0">
          <button
            type="button"
            onClick={() => onToggleCompareMode(false)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              !compareMode
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1 Ống
          </button>
          <button
            type="button"
            onClick={() => onToggleCompareMode(true)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              compareMode
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            So sánh A vs B
          </button>
        </div>
      </div>

      {/* Scrollable Parameter Area */}
      <div className="flex-1 overflow-y-auto lab-scroll p-4 space-y-4">
        {/* Mobile/Tablet equation fallback */}
        <div className="xl:hidden px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800">
          {scenario === 'solid_liquid'
            ? 'CaCO₃(r) + 2HCl(dd) → CaCl₂(dd) + CO₂↑ + H₂O(l)'
            : '2H₂O₂(dd) —[MnO₂]→ 2H₂O(l) + O₂↑'}
        </div>

        {/* Fixed Conservation Note */}
        <div className="text-xs text-slate-600 leading-relaxed pb-3 border-b border-slate-100">
          {scenario === 'solid_liquid' ? (
            <p className="font-mono tabular-nums">
              Lượng cố định: m(CaCO₃) = {formatViNumber(FIXED_CACO3_MASS_G, 1)} g (0,01 mol) · V(HCl) = {FIXED_SOLUTION_VOL_ML} mL (dư)
            </p>
          ) : (
            <p className="font-mono tabular-nums">
              Lượng cố định: V(H₂O₂) = {FIXED_SOLUTION_VOL_ML} mL (0,4 M) · n(O₂ max) = 0,01 mol
            </p>
          )}
        </div>

        {/* Compare Tube Selector */}
        {compareMode && (
          <div className="space-y-2 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Chọn ống cần chỉnh:
              </span>
              <button
                type="button"
                onClick={onApplyPresetCompare}
                disabled={isLocked}
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer underline underline-offset-2"
              >
                Mẫu SGK (Nhanh vs Chậm)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectActiveTube('A')}
                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  activeTube === 'A'
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                Ống A
              </button>
              <button
                type="button"
                onClick={() => onSelectActiveTube('B')}
                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  activeTube === 'B'
                    ? 'bg-sky-50 border-sky-300 text-sky-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
                Ống B
              </button>
            </div>
          </div>
        )}

        {/* Lock Notice while running */}
        {isLocked && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
            Đang chạy thí nghiệm. Nhấn <strong>Đặt lại</strong> để thay đổi thông số biến độc lập.
          </div>
        )}

        {/* Factor 1: Concentration (Tab 1) OR Catalyst (Tab 2) */}
        {scenario === 'solid_liquid' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="slider-conc"
                className="text-xs font-semibold text-slate-800"
              >
                Nồng độ HCl (C<sub>M</sub>)
              </label>
              <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
                {formatViNumber(currentConfig.concentration, 1)} M
              </span>
            </div>
            <input
              id="slider-conc"
              type="range"
              min={0.1}
              max={2.0}
              step={0.1}
              disabled={isLocked}
              value={currentConfig.concentration}
              onChange={(e) =>
                onUpdateConfig(currentTube, {
                  concentration: parseFloat(e.target.value),
                })
              }
              className={`w-full ${sliderClass} disabled:opacity-50`}
            />
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>0,1 M (Loãng)</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() =>
                    onUpdateConfig(currentTube, { concentration: 0.1 })
                  }
                  className={`px-2 py-0.5 rounded border font-mono text-[11px] cursor-pointer disabled:opacity-40 ${
                    Math.abs(currentConfig.concentration - 0.1) < 0.01
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  0,1 M
                </button>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() =>
                    onUpdateConfig(currentTube, { concentration: 1.0 })
                  }
                  className={`px-2 py-0.5 rounded border font-mono text-[11px] cursor-pointer disabled:opacity-40 ${
                    Math.abs(currentConfig.concentration - 1.0) < 0.01
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  1,0 M
                </button>
              </div>
              <span>2,0 M</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Chất xúc tác (Bột MnO₂)
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                {currentConfig.hasCatalyst
                  ? `${formatViNumber(CATALYST_MASS_G, 2)} g`
                  : '0,00 g'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLocked}
                onClick={() =>
                  onUpdateConfig(currentTube, { hasCatalyst: false })
                }
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors cursor-pointer disabled:opacity-50 ${
                  !currentConfig.hasCatalyst
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">Không xúc tác</div>
                <div
                  className={`text-[11px] font-mono ${
                    !currentConfig.hasCatalyst
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  Eₐ = 75 kJ/mol
                </div>
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() =>
                  onUpdateConfig(currentTube, { hasCatalyst: true })
                }
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors cursor-pointer disabled:opacity-50 ${
                  currentConfig.hasCatalyst
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
                  Thêm MnO₂
                </div>
                <div
                  className={`text-[11px] font-mono ${
                    currentConfig.hasCatalyst
                      ? 'text-amber-100'
                      : 'text-slate-500'
                  }`}
                >
                  Eₐ&apos; = 42 kJ/mol
                </div>
              </button>
            </div>

            {/* Activation Energy Barrier Visual Indicator */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Rào cản năng lượng hoạt hóa (Eₐ)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {currentConfig.hasCatalyst ? 'Giảm 44%' : 'Mức chuẩn'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    currentConfig.hasCatalyst
                      ? 'w-[56%] bg-amber-500'
                      : 'w-full bg-slate-600'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Factor 2: Temperature */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="slider-temp"
              className="text-xs font-semibold text-slate-800"
            >
              Nhiệt độ (T)
            </label>
            <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
              {currentConfig.temperature}°C
            </span>
          </div>
          <input
            id="slider-temp"
            type="range"
            min={10}
            max={60}
            step={1}
            disabled={isLocked}
            value={currentConfig.temperature}
            onChange={(e) =>
              onUpdateConfig(currentTube, {
                temperature: parseInt(e.target.value, 10),
              })
            }
            className={`w-full ${sliderClass} disabled:opacity-50`}
          />
          <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-500">
            {[
              { val: 10, label: '10°C (Lạnh)' },
              { val: 25, label: '25°C (Chuẩn)' },
              { val: 60, label: '60°C (Nóng)' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                disabled={isLocked}
                onClick={() =>
                  onUpdateConfig(currentTube, { temperature: preset.val })
                }
                className={`px-2 py-0.5 rounded border font-mono text-[11px] cursor-pointer disabled:opacity-40 ${
                  currentConfig.temperature === preset.val
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Factor 3: Surface Area (Tab 1 only) */}
        {scenario === 'solid_liquid' && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-800 block">
              Diện tích bề mặt (CaCO₃)
            </span>
            <div className="space-y-1.5">
              {(['chunk', 'granule', 'powder'] as SurfaceAreaType[]).map(
                (type) => {
                  const meta = SURFACE_AREA_META[type];
                  const active = currentConfig.surfaceArea === type;
                  return (
                    <label
                      key={type}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                        isLocked
                          ? 'opacity-55 cursor-not-allowed'
                          : 'cursor-pointer'
                      } ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name={`surface-${currentTube}`}
                          value={type}
                          disabled={isLocked}
                          checked={active}
                          onChange={() =>
                            onUpdateConfig(currentTube, { surfaceArea: type })
                          }
                          className="accent-sky-500"
                        />
                        <span className="font-semibold">{meta.label}</span>
                      </div>
                      <span
                        className={`font-mono text-[11px] ${
                          active ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {meta.detail}
                      </span>
                    </label>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Playback Bar */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              isRunning
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                Tạm dừng
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                {hasStarted && !isFinished ? 'Tiếp tục' : 'Bắt đầu'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            title="Đặt lại thí nghiệm"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Đặt lại
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-600 mr-1">
              Tốc độ:
            </span>
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                title={
                  s === 0.5
                    ? 'Chế độ chậm (Slow-motion) để đếm va chạm'
                    : `Tốc độ ${s}x`
                }
                className={`px-2 py-1 text-[11px] font-mono font-semibold rounded border transition-colors cursor-pointer ${
                  speed === s
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {s === 0.5 ? '0.5x' : `${s}x`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onSaveRun}
            disabled={!hasStarted}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3 h-3" aria-hidden="true" />
            Lưu bảng
          </button>
        </div>
      </div>
    </aside>
  );
};
