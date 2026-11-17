import {
  ChartMetricMode,
  ExperimentConfig,
  RunState,
  SavedRunRecord,
  ScenarioId,
} from '../types/simulation';
import {
  CATALYST_MASS_G,
  FIXED_CACO3_MASS_G,
  FIXED_SOLUTION_VOL_ML,
  THEORETICAL_GAS_VOLUME_ML,
  formatConfigSummary,
  formatViNumber,
} from './kinetics';

interface ExportReportParams {
  scenario: ScenarioId;
  compareMode: boolean;
  configA: ExperimentConfig;
  configB: ExperimentConfig;
  runA: RunState;
  runB: RunState;
  metricMode: ChartMetricMode;
  savedRuns: SavedRunRecord[];
}

function buildStandaloneSvgChart(params: ExportReportParams): string {
  const { scenario, compareMode, runA, runB, metricMode } = params;
  const width = 760;
  const height = 340;
  const padLeft = 64;
  const padRight = 28;
  const padTop = 28;
  const padBottom = 48;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxDataT = Math.max(
    10,
    runA.elapsedTime,
    compareMode ? runB.elapsedTime : 0
  );
  const xMax = Math.ceil(maxDataT / 5) * 5;
  const yMax = metricMode === 'volume' ? 275 : 110;
  const theoryYVal = metricMode === 'volume' ? THEORETICAL_GAS_VOLUME_ML : 100;

  const toX = (t: number) => padLeft + (t / xMax) * plotW;
  const toY = (v: number) => padTop + plotH - (v / yMax) * plotH;

  const yTicks =
    metricMode === 'volume'
      ? [0, 50, 100, 150, 200, 247.9]
      : [0, 25, 50, 75, 100];

  const xTickCount = 6;
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) =>
    Number(((xMax / xTickCount) * i).toFixed(1))
  );

  const buildPolyline = (run: RunState) => {
    if (run.history.length === 0) return '';
    return run.history
      .map((pt) => {
        const val = metricMode === 'volume' ? pt.volume : pt.percent;
        return `${toX(pt.t).toFixed(1)},${toY(val).toFixed(1)}`;
      })
      .join(' ');
  };

  const gasFormula = scenario === 'solid_liquid' ? 'CO₂' : 'O₂';
  const yLabel =
    metricMode === 'volume'
      ? `Thể tích khí ${gasFormula} (mL)`
      : 'Phần trăm đã phản ứng (%)';

  const theoryY = toY(theoryYVal);
  const pointsA = buildPolyline(runA);
  const pointsB = compareMode ? buildPolyline(runB) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" role="img" aria-label="Đồ thị động học phản ứng theo thời gian">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" rx="8" />
  ${yTicks
    .map((tick) => {
      const y = toY(tick);
      const isTheory = Math.abs(tick - theoryYVal) < 0.2;
      return `
      <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}"
        stroke="${isTheory ? '#0f172a' : '#e2e8f0'}"
        stroke-width="${isTheory ? '1.2' : '1'}"
        ${isTheory ? 'stroke-dasharray="5 4"' : ''} />
      <text x="${padLeft - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="11" fill="${isTheory ? '#0f172a' : '#64748b'}" font-weight="${isTheory ? '600' : '400'}">${formatViNumber(tick, tick === 247.9 ? 1 : 0)}</text>`;
    })
    .join('')}
  ${xTicks
    .map((tick) => {
      const x = toX(tick);
      return `
      <line x1="${x.toFixed(1)}" y1="${padTop}" x2="${x.toFixed(1)}" y2="${height - padBottom}" stroke="#f1f5f9" stroke-width="1" />
      <text x="${x.toFixed(1)}" y="${height - padBottom + 18}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="#64748b">${formatViNumber(tick, 0)}s</text>`;
    })
    .join('')}
  <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="#94a3b8" stroke-width="1.5" />
  <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#94a3b8" stroke-width="1.5" />
  <text x="${width - padRight}" y="${(theoryY - 7).toFixed(1)}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="11" fill="#0f172a" font-weight="600">Giới hạn lý thuyết: ${metricMode === 'volume' ? '247,9 mL (25°C, 1 bar)' : '100%'}</text>
  ${pointsA ? `<polyline fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pointsA}" />` : ''}
  ${pointsB ? `<polyline fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pointsB}" />` : ''}
  <text x="${(padLeft + plotW / 2).toFixed(1)}" y="${height - 10}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12" fill="#334155" font-weight="600">Thời gian t (giây)</text>
  <text x="16" y="${(padTop + plotH / 2).toFixed(1)}" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="12" fill="#334155" font-weight="600" transform="rotate(-90 16 ${(padTop + plotH / 2).toFixed(1)})">${yLabel}</text>
</svg>`;
}

export function generateHtml5Css3Report(params: ExportReportParams): string {
  const {
    scenario,
    compareMode,
    configA,
    configB,
    runA,
    runB,
    savedRuns,
  } = params;

  const svgMarkup = buildStandaloneSvgChart(params);
  const title =
    scenario === 'solid_liquid'
      ? 'Báo cáo Thí nghiệm: Tốc độ phản ứng CaCO₃ + HCl'
      : 'Báo cáo Thí nghiệm: Phân hủy H₂O₂ với Chất xúc tác MnO₂';
  const equation =
    scenario === 'solid_liquid'
      ? 'CaCO₃ (rắn) + 2HCl (dd) → CaCl₂ (dd) + CO₂↑ (khí) + H₂O (lỏng)'
      : '2H₂O₂ (dd) —[MnO₂]→ 2H₂O (lỏng) + O₂↑ (khí)';

  const nowStr = new Date().toLocaleString('vi-VN');
  const errA =
    (Math.abs(runA.volumeGas - THEORETICAL_GAS_VOLUME_ML) /
      THEORETICAL_GAS_VOLUME_ML) *
    100;
  const errB =
    (Math.abs(runB.volumeGas - THEORETICAL_GAS_VOLUME_ML) /
      THEORETICAL_GAS_VOLUME_ML) *
    100;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — KHTN 8</title>
  <style>
    :root {
      --bg-canvas: #f8fafc;
      --bg-surface: #ffffff;
      --border-hairline: #e2e8f0;
      --ink-primary: #0f172a;
      --ink-secondary: #475569;
      --ink-muted: #64748b;
      --accent-a: #dc2626;
      --accent-b: #0284c7;
      --accent-ok: #059669;
      --radius: 8px;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-canvas);
      color: var(--ink-primary);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px 20px 48px;
    }

    header.report-header {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius);
      padding: 20px 24px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .report-kicker {
      font-size: 12px;
      font-weight: 600;
      color: var(--ink-muted);
      margin: 0 0 4px;
    }

    h1 {
      font-size: clamp(1.25rem, 2.5vw, 1.65rem);
      margin: 0;
      font-weight: 700;
      color: var(--ink-primary);
    }

    .equation-box {
      font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 14px;
      font-weight: 600;
      background: #f1f5f9;
      border: 1px solid var(--border-hairline);
      border-radius: 6px;
      padding: 10px 14px;
      color: var(--ink-primary);
    }

    .grid-layout {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 20px;
    }

    .panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius);
      padding: 20px;
    }

    .col-chart {
      grid-column: span 12;
    }

    .col-half {
      grid-column: span 12;
    }

    @media (min-width: 860px) {
      .col-chart {
        grid-column: span 7;
      }
      .col-summary {
        grid-column: span 5;
      }
      .col-half {
        grid-column: span 6;
      }
    }

    h2 {
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-hairline);
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 13px;
      color: var(--ink-secondary);
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .swatch {
      width: 14px;
      height: 3px;
      display: inline-block;
      border-radius: 2px;
    }

    .metric-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
    }

    .metric-item {
      background: #f8fafc;
      border: 1px solid var(--border-hairline);
      border-radius: 6px;
      padding: 12px;
    }

    .metric-label {
      font-size: 12px;
      color: var(--ink-muted);
      display: block;
      margin-bottom: 4px;
    }

    .metric-value {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 18px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }

    th, td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-hairline);
      white-space: nowrap;
    }

    th {
      background: #f8fafc;
      color: var(--ink-secondary);
      font-weight: 600;
      font-size: 12px;
    }

    td.mono {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
    }

    footer.report-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: var(--ink-muted);
    }

    @media print {
      body {
        background: #ffffff;
      }
      .panel, header.report-header {
        border-color: #cbd5e1;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="report-header">
      <div>
        <p class="report-kicker">KHTN 8 · Bài 7: Tốc độ phản ứng và chất xúc tác · Xuất lúc ${nowStr}</p>
        <h1>${title}</h1>
      </div>
      <div class="equation-box">${equation}</div>
    </header>

    <main class="grid-layout">
      <section class="panel col-chart">
        <h2>Đồ thị Động học Thời gian thực</h2>
        <div class="legend">
          <span class="legend-item">
            <span class="swatch" style="background: var(--accent-a);"></span>
            <strong>Thí nghiệm A:</strong> ${formatConfigSummary(scenario, configA)}
          </span>
          ${
            compareMode
              ? `<span class="legend-item">
            <span class="swatch" style="background: var(--accent-b);"></span>
            <strong>Thí nghiệm B:</strong> ${formatConfigSummary(scenario, configB)}
          </span>`
              : ''
          }
        </div>
        <figure style="margin: 0;">
          ${svgMarkup}
        </figure>
      </section>

      <section class="panel col-summary">
        <h2>Thông số &amp; Kiểm chứng Lý thuyết</h2>
        <p style="font-size: 13px; color: var(--ink-secondary); margin-top: 0;">
          ${
            scenario === 'solid_liquid'
              ? `Điều kiện cố định: m(CaCO₃) = ${formatViNumber(FIXED_CACO3_MASS_G, 1)} g (0,01 mol) · V(HCl) = ${FIXED_SOLUTION_VOL_ML} mL (dư). Thể tích mol chuẩn (25°C, 1 bar) = 24,79 L/mol.`
              : `Điều kiện cố định: V(H₂O₂) = ${FIXED_SOLUTION_VOL_ML} mL (0,4 M → 0,01 mol O₂). Khối lượng MnO₂ bảo toàn: ${formatViNumber(CATALYST_MASS_G, 2)} g.`
          }
        </p>
        <div class="metric-list">
          <div class="metric-item">
            <span class="metric-label">Thể tích lý thuyết (V_lt)</span>
            <span class="metric-value">${formatViNumber(THEORETICAL_GAS_VOLUME_ML, 1)} mL</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Thể tích mô phỏng A</span>
            <span class="metric-value" style="color: var(--accent-a);">${formatViNumber(runA.volumeGas, 2)} mL</span>
          </div>
          ${
            compareMode
              ? `<div class="metric-item">
            <span class="metric-label">Thể tích mô phỏng B</span>
            <span class="metric-value" style="color: var(--accent-b);">${formatViNumber(runB.volumeGas, 2)} mL</span>
          </div>`
              : ''
          }
          <div class="metric-item">
            <span class="metric-label">Thời gian 50% (t₁/₂ A)</span>
            <span class="metric-value">${runA.tHalf !== null ? `${formatViNumber(runA.tHalf, 2)} s` : '—'}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Thời gian kết thúc (A)</span>
            <span class="metric-value">${runA.tComplete !== null ? `${formatViNumber(runA.tComplete, 2)} s` : '—'}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Sai số so với lý thuyết (A)</span>
            <span class="metric-value" style="color: var(--accent-ok);">${runA.isComplete ? `${formatViNumber(errA, 2)} %` : 'Đang chạy'}</span>
          </div>
          ${
            compareMode && runB.isComplete
              ? `<div class="metric-item">
            <span class="metric-label">Sai số lý thuyết (B)</span>
            <span class="metric-value" style="color: var(--accent-ok);">${formatViNumber(errB, 2)} %</span>
          </div>`
              : ''
          }
        </div>
      </section>

      <section class="panel" style="grid-column: span 12;">
        <h2>Bảng Lịch sử Các lần chạy Kiểm chứng</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lần chạy</th>
                <th>Điều kiện thí nghiệm</th>
                <th>t₁/₂ (s)</th>
                <th>t kết thúc (s)</th>
                <th>v_tb (mL/s)</th>
                <th>V mô phỏng (mL)</th>
                <th>V lý thuyết (mL)</th>
                <th>Sai số (%)</th>
              </tr>
            </thead>
            <tbody>
              ${
                savedRuns.length === 0
                  ? `<tr><td colspan="8" style="color: var(--ink-muted); text-align: center;">Chưa có lần chạy nào được lưu vào bảng lịch sử.</td></tr>`
                  : savedRuns
                      .map(
                        (r) => `<tr>
                    <td><strong>${r.label}</strong></td>
                    <td>${r.summary}</td>
                    <td class="mono">${r.tHalf !== null ? formatViNumber(r.tHalf, 2) : '—'}</td>
                    <td class="mono">${r.tComplete !== null ? formatViNumber(r.tComplete, 2) : '—'}</td>
                    <td class="mono">${formatViNumber(r.avgRate, 2)}</td>
                    <td class="mono">${formatViNumber(r.vSimMax, 2)}</td>
                    <td class="mono">${formatViNumber(r.vTheory, 1)}</td>
                    <td class="mono">${formatViNumber(r.errorPercent, 2)}%</td>
                  </tr>`
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <footer class="report-footer">
      Tài liệu HTML5 &amp; CSS3 chuẩn đa nền tảng · Tương thích Chrome, Safari, Edge, Firefox và thiết bị di động.
    </footer>
  </div>
</body>
</html>`;
}

export function triggerDownload(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateCsvReport(savedRuns: SavedRunRecord[]): string {
  const header = [
    'Lan chay',
    'Kich ban',
    'Dieu kien',
    't_1/2 (s)',
    't_ket thuc (s)',
    'v_tb (mL/s)',
    'V_mo phong (mL)',
    'V_ly thuyet (mL)',
    'Sai so (%)',
  ].join(',');

  const rows = savedRuns.map((r) =>
    [
      `"${r.label}"`,
      r.scenario === 'solid_liquid' ? '"CaCO3 + HCl"' : '"H2O2 + MnO2"',
      `"${r.summary}"`,
      r.tHalf !== null ? r.tHalf.toFixed(2) : '',
      r.tComplete !== null ? r.tComplete.toFixed(2) : '',
      r.avgRate.toFixed(2),
      r.vSimMax.toFixed(2),
      r.vTheory.toFixed(1),
      r.errorPercent.toFixed(2),
    ].join(',')
  );

  return '\uFEFF' + [header, ...rows].join('\n');
}
