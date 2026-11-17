import React, { useMemo, useRef, useState } from 'react';
import { ImageDown } from 'lucide-react';
import {
  ChartMetricMode,
  DataPoint,
  ExperimentConfig,
  RunState,
  ScenarioId,
} from '../types/simulation';
import {
  THEORETICAL_GAS_VOLUME_ML,
  formatConfigSummary,
  formatViNumber,
} from '../utils/kinetics';
import { triggerDownload } from '../utils/htmlExporter';

interface KineticChartProps {
  scenario: ScenarioId;
  compareMode: boolean;
  configA: ExperimentConfig;
  configB: ExperimentConfig;
  runA: RunState;
  runB: RunState;
  metricMode: ChartMetricMode;
  onChangeMetricMode: (mode: ChartMetricMode) => void;
}

function findNearestPoint(history: DataPoint[], targetT: number): DataPoint | null {
  if (history.length === 0) return null;
  let best = history[0];
  let bestDiff = Math.abs(best.t - targetT);
  for (let i = 1; i < history.length; i++) {
    const diff = Math.abs(history[i].t - targetT);
    if (diff < bestDiff) {
      best = history[i];
      bestDiff = diff;
    }
  }
  return best;
}

export const KineticChart: React.FC<KineticChartProps> = ({
  scenario,
  compareMode,
  configA,
  configB,
  runA,
  runB,
  metricMode,
  onChangeMetricMode,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverT, setHoverT] = useState<number | null>(null);

  const width = 460;
  const height = 245;
  const padLeft = 48;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxElapsed = Math.max(
    10,
    runA.elapsedTime,
    compareMode ? runB.elapsedTime : 0
  );
  const xMax = Math.ceil(maxElapsed / 5) * 5;
  const yMax = metricMode === 'volume' ? 275 : 110;
  const theoryVal = metricMode === 'volume' ? THEORETICAL_GAS_VOLUME_ML : 100;

  const toX = (t: number) => padLeft + (t / xMax) * plotW;
  const toY = (v: number) => padTop + plotH - (v / yMax) * plotH;

  const yTicks =
    metricMode === 'volume'
      ? [0, 50, 100, 150, 200, 247.9]
      : [0, 25, 50, 75, 100];

  const xTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) =>
      Number(((xMax / count) * i).toFixed(1))
    );
  }, [xMax]);

  const pointsA = useMemo(() => {
    return runA.history
      .map((pt) => {
        const yVal = metricMode === 'volume' ? pt.volume : pt.percent;
        return `${toX(pt.t).toFixed(1)},${toY(yVal).toFixed(1)}`;
      })
      .join(' ');
  }, [runA.history, metricMode, xMax]);

  const pointsB = useMemo(() => {
    if (!compareMode) return '';
    return runB.history
      .map((pt) => {
        const yVal = metricMode === 'volume' ? pt.volume : pt.percent;
        return `${toX(pt.t).toFixed(1)},${toY(yVal).toFixed(1)}`;
      })
      .join(' ');
  }, [compareMode, runB.history, metricMode, xMax]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    if (relX < padLeft || relX > width - padRight) {
      setHoverT(null);
      return;
    }
    const tVal = ((relX - padLeft) / plotW) * xMax;
    setHoverT(tVal);
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgRef.current);
    triggerDownload(
      `<?xml version="1.0" encoding="UTF-8"?>\n${svgStr}`,
      `do-thi-dong-hoc-${scenario}.svg`,
      'image/svg+xml;charset=utf-8'
    );
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgRef.current);
    const img = new Image();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = width * 2;
      c.height = height * 2;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((pngBlob) => {
          if (pngBlob) {
            const pngUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `do-thi-dong-hoc-${scenario}.png`;
            a.click();
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const hoverPtA =
    hoverT !== null ? findNearestPoint(runA.history, hoverT) : null;
  const hoverPtB =
    hoverT !== null && compareMode
      ? findNearestPoint(runB.history, hoverT)
      : null;

  const gasFormula = scenario === 'solid_liquid' ? 'CO₂' : 'O₂';
  const lastA = runA.history[runA.history.length - 1];
  const lastB = runB.history[runB.history.length - 1];
  const theoryY = toY(theoryVal);

  return (
    <section className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <h3 className="text-xs font-bold text-slate-900 truncate">
          Đồ thị Động học Thời gian thực
        </h3>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200/70">
            <button
              type="button"
              onClick={() => onChangeMetricMode('volume')}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                metricMode === 'volume'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              V ({gasFormula})
            </button>
            <button
              type="button"
              onClick={() => onChangeMetricMode('percent')}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                metricMode === 'percent'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              % Phản ứng
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportSvg}
            title="Tải biểu đồ SVG"
            className="px-1.5 py-1 text-[10px] font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
          >
            SVG
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            title="Tải ảnh PNG biểu đồ"
            className="p-1 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
          >
            <ImageDown className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="px-3.5 pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-600 inline-block" />
          <strong className="text-slate-800">
            {compareMode ? 'A:' : 'Đường thực nghiệm:'}
          </strong>
          <span className="truncate max-w-[180px]">
            {formatConfigSummary(scenario, configA)}
          </span>
        </span>
        {compareMode && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 inline-block" />
            <strong className="text-slate-800">B:</strong>
            <span className="truncate max-w-[180px]">
              {formatConfigSummary(scenario, configB)}
            </span>
          </span>
        )}
      </div>

      {/* SVG Coordinate Plot */}
      <div className="relative px-2 pb-2 pt-1 flex-1 flex items-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[245px] select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverT(null)}
        >
          <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

          {/* Y Grid & Ticks */}
          {yTicks.map((tick) => {
            const y = toY(tick);
            const isTheory = Math.abs(tick - theoryVal) < 0.2;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isTheory ? '#059669' : '#e2e8f0'}
                  strokeWidth={isTheory ? 1.2 : 1}
                  strokeDasharray={isTheory ? '5 4' : undefined}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fontFamily="IBM Plex Mono, monospace"
                  fontSize="9.5"
                  fontWeight={isTheory ? '600' : '400'}
                  fill={isTheory ? '#059669' : '#64748b'}
                >
                  {formatViNumber(tick, tick === 247.9 ? 1 : 0)}
                </text>
              </g>
            );
          })}

          {/* X Grid & Ticks */}
          {xTicks.map((tick) => {
            const x = toX(tick);
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={height - padBottom}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={height - padBottom + 14}
                  textAnchor="middle"
                  fontFamily="IBM Plex Mono, monospace"
                  fontSize="9.5"
                  fill="#64748b"
                >
                  {formatViNumber(tick, 0)}s
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={height - padBottom}
            stroke="#94a3b8"
            strokeWidth={1.3}
          />
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={width - padRight}
            y2={height - padBottom}
            stroke="#94a3b8"
            strokeWidth={1.3}
          />

          {/* Theory Asymptote Label */}
          <text
            x={width - padRight}
            y={theoryY - 5}
            textAnchor="end"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="9.5"
            fontWeight="600"
            fill="#059669"
          >
            {metricMode === 'volume'
              ? 'V_lý thuyết = 247,9 mL (25°C, 1 bar)'
              : 'Hoàn tất 100%'}
          </text>

          {/* Curve A */}
          {pointsA && (
            <polyline
              fill="none"
              stroke="#dc2626"
              strokeWidth={2.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsA}
            />
          )}

          {/* Curve B */}
          {compareMode && pointsB && (
            <polyline
              fill="none"
              stroke="#0284c7"
              strokeWidth={2.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsB}
            />
          )}

          {/* Current Endpoints */}
          {lastA && (
            <circle
              cx={toX(lastA.t)}
              cy={toY(metricMode === 'volume' ? lastA.volume : lastA.percent)}
              r={3.5}
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth={1.2}
            />
          )}
          {compareMode && lastB && (
            <circle
              cx={toX(lastB.t)}
              cy={toY(metricMode === 'volume' ? lastB.volume : lastB.percent)}
              r={3.5}
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth={1.2}
            />
          )}

          {/* Interactive Crosshair */}
          {hoverPtA && (
            <g>
              <line
                x1={toX(hoverPtA.t)}
                y1={padTop}
                x2={toX(hoverPtA.t)}
                y2={height - padBottom}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={toX(hoverPtA.t)}
                cy={toY(
                  metricMode === 'volume' ? hoverPtA.volume : hoverPtA.percent
                )}
                r={4}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              {hoverPtB && (
                <circle
                  cx={toX(hoverPtB.t)}
                  cy={toY(
                    metricMode === 'volume' ? hoverPtB.volume : hoverPtB.percent
                  )}
                  r={4}
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              )}
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={padLeft + plotW / 2}
            y={height - 6}
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize="10"
            fontWeight="600"
            fill="#475569"
          >
            Thời gian t (giây)
          </text>
          <text
            x={12}
            y={padTop + plotH / 2}
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize="10"
            fontWeight="600"
            fill="#475569"
            transform={`rotate(-90 12 ${padTop + plotH / 2})`}
          >
            {metricMode === 'volume' ? `V(${gasFormula}) mL` : 'Đã phản ứng (%)'}
          </text>
        </svg>

        {/* Floating Crosshair Readout */}
        {hoverPtA && (
          <div className="absolute top-2 left-14 bg-slate-900/90 text-white rounded-md px-2.5 py-1 text-[10.5px] font-mono tabular-nums pointer-events-none">
            <span>t = {formatViNumber(hoverPtA.t, 1)}s</span>
            <span className="mx-1.5 text-slate-400">·</span>
            <span className="text-red-300">
              A:{' '}
              {metricMode === 'volume'
                ? `${formatViNumber(hoverPtA.volume, 1)} mL`
                : `${formatViNumber(hoverPtA.percent, 1)}%`}
            </span>
            {hoverPtB && (
              <>
                <span className="mx-1.5 text-slate-400">·</span>
                <span className="text-sky-300">
                  B:{' '}
                  {metricMode === 'volume'
                    ? `${formatViNumber(hoverPtB.volume, 1)} mL`
                    : `${formatViNumber(hoverPtB.percent, 1)}%`}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
