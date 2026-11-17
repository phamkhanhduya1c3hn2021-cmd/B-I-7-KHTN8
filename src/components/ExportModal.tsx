import React, { useMemo, useState } from 'react';
import { Check, Code2, Copy, Download, FileCode2, X } from 'lucide-react';
import {
  ChartMetricMode,
  ExperimentConfig,
  RunState,
  SavedRunRecord,
  ScenarioId,
} from '../types/simulation';
import {
  generateCsvReport,
  generateHtml5Css3Report,
  triggerDownload,
} from '../utils/htmlExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioId;
  compareMode: boolean;
  configA: ExperimentConfig;
  configB: ExperimentConfig;
  runA: RunState;
  runB: RunState;
  metricMode: ChartMetricMode;
  savedRuns: SavedRunRecord[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  scenario,
  compareMode,
  configA,
  configB,
  runA,
  runB,
  metricMode,
  savedRuns,
}) => {
  const [copied, setCopied] = useState(false);

  const htmlCode = useMemo(() => {
    if (!isOpen) return '';
    return generateHtml5Css3Report({
      scenario,
      compareMode,
      configA,
      configB,
      runA,
      runB,
      metricMode,
      savedRuns,
    });
  }, [
    isOpen,
    scenario,
    compareMode,
    configA,
    configB,
    runA,
    runB,
    metricMode,
    savedRuns,
  ]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownloadHtml = () => {
    triggerDownload(
      htmlCode,
      `bao-cao-thi-nghiem-khtn8-${scenario}.html`,
      'text/html;charset=utf-8'
    );
  };

  const handleDownloadCsv = () => {
    const csv = generateCsvReport(savedRuns);
    triggerDownload(
      csv,
      `so-lieu-kiem-chung-${scenario}.csv`,
      'text/csv;charset=utf-8'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <h2
              id="export-modal-title"
              className="text-sm font-bold text-slate-900"
            >
              Xuất Báo cáo &amp; Biểu đồ (HTML5 + CSS3 Đa nền tảng)
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

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto lab-scroll">
          <p className="text-xs text-slate-600 leading-relaxed">
            Tệp xuất ra sử dụng mã nguồn chuẩn <strong>HTML5 ngữ nghĩa</strong> và{' '}
            <strong>CSS3 Responsive (Grid/Flexbox)</strong> tích hợp sẵn đồ thị SVG thời gian thực và bảng kiểm chứng số liệu — mở trực tiếp trên mọi trình duyệt máy tính, máy tính bảng và điện thoại mà không cần kết nối mạng.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Tải xuống tệp HTML5 &amp; CSS3 (.html)
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  Đã sao chép mã HTML5
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Sao chép mã HTML5 + CSS3
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={savedRuns.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Tải bảng số liệu (.csv)
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                bao-cao-thi-nghiem-khtn8.html
              </span>
              <span>HTML5 · CSS3 · SVG</span>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-72 lab-scroll leading-relaxed">
              <code>{htmlCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
