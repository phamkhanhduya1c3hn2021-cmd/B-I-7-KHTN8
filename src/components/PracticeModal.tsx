import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { ExperimentConfig, ScenarioId } from '../types/simulation';
import { formatViNumber } from '../utils/kinetics';

export interface PracticeApplyPayload {
  scenario: ScenarioId;
  compareMode: boolean;
  configA: ExperimentConfig;
  configB?: ExperimentConfig;
}

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToSimulator: (payload: PracticeApplyPayload) => void;
}

interface McqQuestion {
  id: string;
  type: 'mcq';
  topic: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  simPreset?: {
    label: string;
    payload: PracticeApplyPayload;
  };
}

interface NumericQuestion {
  id: string;
  type: 'numeric';
  topic: string;
  prompt: string;
  unit: string;
  expectedValue: number;
  tolerance: number;
  hint: string;
  explanation: string;
  simPreset: {
    label: string;
    payload: PracticeApplyPayload;
  };
}

type QuestionItem = McqQuestion | NumericQuestion;

const QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
    type: 'mcq',
    topic: 'Nồng độ & Va chạm vi mô',
    prompt:
      'Khi tăng nồng độ dung dịch HCl từ 0,1 M lên 1,0 M (giữ nguyên nhiệt độ và kích thước viên đá vôi CaCO₃), điều gì xảy ra ở cấp độ vi mô?',
    options: [
      'Mật độ hạt H⁺ tăng gấp 10 lần, làm tăng tần số va chạm hiệu quả lên bề mặt CaCO₃.',
      'Vận tốc chuyển động nhiệt của mỗi hạt H⁺ tăng gấp 10 lần.',
      'Tổng lượng khí CO₂ thu được cuối cùng tăng gấp 10 lần.',
      'Năng lượng hoạt hóa Eₐ của phản ứng giảm xuống một nửa.',
    ],
    correctIndex: 0,
    explanation:
      'Tăng nồng độ HCl từ 0,1 M lên 1,0 M làm số hạt H⁺ trong một đơn vị thể tích tăng 10 lần → xác suất va chạm hiệu quả tăng mạnh. Tổng lượng khí CO₂ cuối vẫn giữ nguyên 247,9 mL vì lượng CaCO₃ ban đầu cố định (1,0 g).',
    simPreset: {
      label: 'Kiểm chứng trên mô phỏng (1,0 M vs 0,1 M)',
      payload: {
        scenario: 'solid_liquid',
        compareMode: true,
        configA: {
          concentration: 1.0,
          temperature: 25,
          surfaceArea: 'chunk',
          hasCatalyst: false,
        },
        configB: {
          concentration: 0.1,
          temperature: 25,
          surfaceArea: 'chunk',
          hasCatalyst: false,
        },
      },
    },
  },
  {
    id: 'q2',
    type: 'mcq',
    topic: 'Diện tích bề mặt tiếp xúc',
    prompt:
      'Cho cùng 1,0 g CaCO₃ tác dụng với 50 mL dung dịch HCl 1,0 M (dư) ở 25°C ở 3 dạng: (1) Khối viên lớn, (2) Hạt đập nhỏ, (3) Bột mịn. Nhận định nào đúng?',
    options: [
      'Dạng bột mịn có tốc độ thoát khí nhanh nhất và thu được nhiều khí CO₂ nhất.',
      'Dạng bột mịn phản ứng xong sớm nhất nhưng cả 3 trường hợp đều thu được cùng thể tích khí 247,9 mL.',
      'Dạng khối viên lớn phản ứng chậm nhất nên thu được ít khí CO₂ hơn.',
      'Diện tích tiếp xúc không ảnh hưởng đến tốc độ phản ứng giữa chất rắn và dung dịch.',
    ],
    correctIndex: 1,
    explanation:
      'Nghiền nhỏ CaCO₃ thành bột mịn làm tăng diện tích tiếp xúc với HCl → phản ứng diễn ra nhanh nhất (t₁₀₀% nhỏ nhất). Tuy nhiên, do cùng dùng 1,0 g CaCO₃ (0,01 mol), cả 3 đều sinh ra tối đa 0,01 mol CO₂ = 247,9 mL (25°C, 1 bar).',
    simPreset: {
      label: 'So sánh Bột mịn vs Viên lớn',
      payload: {
        scenario: 'solid_liquid',
        compareMode: true,
        configA: {
          concentration: 1.0,
          temperature: 25,
          surfaceArea: 'powder',
          hasCatalyst: false,
        },
        configB: {
          concentration: 1.0,
          temperature: 25,
          surfaceArea: 'chunk',
          hasCatalyst: false,
        },
      },
    },
  },
  {
    id: 'q3',
    type: 'mcq',
    topic: 'Nhiệt độ & Quy tắc Van’t Hoff',
    prompt:
      'Trong thí nghiệm CaCO₃ (viên lớn) + HCl 1,0 M ở 25°C, thời gian để phản ứng kết thúc hoàn toàn là 24,0 giây. Nếu tăng nhiệt độ lên 35°C (hệ số Van’t Hoff γ = 2), thời gian phản ứng kết thúc là bao nhiêu?',
    options: ['48,0 giây', '18,0 giây', '12,0 giây', '6,0 giây'],
    correctIndex: 2,
    explanation:
      'Theo quy tắc Van’t Hoff với γ = 2, khi nhiệt độ tăng thêm 10°C (từ 25°C lên 35°C), tốc độ phản ứng tăng gấp 2 lần nên thời gian phản ứng giảm đi một nửa: 24,0 / 2 = 12,0 giây.',
  },
  {
    id: 'q4',
    type: 'mcq',
    topic: 'Vai trò của Chất xúc tác',
    prompt:
      'Khi cho 0,10 g bột MnO₂ vào dung dịch H₂O₂ để xúc tác phản ứng phân hủy nước oxy già, phát biểu nào sau đây đúng về MnO₂?',
    options: [
      'MnO₂ bị tiêu hao hoàn toàn sau khi khí O₂ ngừng thoát ra.',
      'MnO₂ làm giảm năng lượng hoạt hóa Eₐ giúp phản ứng nhanh hơn, sau phản ứng khối lượng vẫn là 0,10 g.',
      'MnO₂ làm tăng thể tích khí O₂ cực đại vượt quá giới hạn lý thuyết.',
      'MnO₂ chỉ làm tăng nhiệt độ dung dịch chứ không tham gia cơ chế hạ rào cản năng lượng.',
    ],
    correctIndex: 1,
    explanation:
      'Chất xúc tác MnO₂ làm tăng tốc độ phản ứng nhờ hạ thấp rào cản năng lượng hoạt hóa Eₐ, nhưng không bị tiêu hao: khối lượng MnO₂ trước và sau phản ứng vẫn giữ nguyên 0,10 g.',
    simPreset: {
      label: 'Thử nghiệm H₂O₂ có MnO₂ vs Không MnO₂',
      payload: {
        scenario: 'catalyst',
        compareMode: true,
        configA: {
          concentration: 0.4,
          temperature: 25,
          surfaceArea: 'powder',
          hasCatalyst: true,
        },
        configB: {
          concentration: 0.4,
          temperature: 25,
          surfaceArea: 'powder',
          hasCatalyst: false,
        },
      },
    },
  },
  {
    id: 'q5',
    type: 'mcq',
    topic: 'Đồ thị động học V(t)',
    prompt:
      'Trên đồ thị thể tích khí theo thời gian V(t), làm thế nào để nhận biết ngay ống nghiệm nào có tốc độ phản ứng tức thời lớn hơn ở giai đoạn đầu?',
    options: [
      'Đường cong có độ dốc (hệ số góc) lớn hơn, đi lên thẳng đứng hơn.',
      'Đường cong nằm ngang thấp hơn ở phía dưới.',
      'Đường cong đạt vạch tiệm cận cao hơn 247,9 mL.',
      'Đường cong mất nhiều thời gian hơn để bắt đầu đi lên.',
    ],
    correctIndex: 0,
    explanation:
      'Tốc độ phản ứng v = ΔV / Δt chính là độ dốc của đường cong V(t). Đường càng dốc đứng thì tốc độ thoát khí càng nhanh và đạt đến vạch tiệm cận 247,9 mL trong thời gian càng ngắn.',
  },
  {
    id: 'q6',
    type: 'mcq',
    topic: 'Ứng dụng thực tiễn KHTN 8',
    prompt:
      'Biện pháp nào sau đây KHÔNG dựa trên nguyên lý làm tăng tốc độ phản ứng hóa học?',
    options: [
      'Chẻ nhỏ củi trước khi đưa vào bếp đun nấu.',
      'Bảo quản thực phẩm tươi sống trong ngăn mát tủ lạnh.',
      'Nung đá vôi ở nhiệt độ cao để sản xuất vôi sống.',
      'Dùng men tiêu hóa (enzyme) để phân giải thức ăn nhanh hơn.',
    ],
    correctIndex: 1,
    explanation:
      'Bảo quản thực phẩm trong tủ lạnh (nhiệt độ thấp) là biện pháp làm GIẢM tốc độ phản ứng phân hủy/lên men để giữ thực phẩm tươi lâu hơn. Ba phương án còn lại đều làm tăng tốc độ phản ứng.',
  },
  {
    id: 'n1',
    type: 'numeric',
    topic: 'Thực hành đo kiểm chứng Van’t Hoff',
    prompt:
      'Nạp thí nghiệm So sánh A (HCl 1,0 M · 45°C · Viên lớn) và B (HCl 1,0 M · 25°C · Viên lớn) lên mô phỏng, chạy đến khi kết thúc. Cho biết thời gian kết thúc t₁₀₀% của Ống A (45°C) là bao nhiêu giây?',
    unit: 'giây (s)',
    expectedValue: 6.0,
    tolerance: 0.25,
    hint: 'Từ 25°C (24,0 s) tăng thêm 20°C lên 45°C → tốc độ tăng 2² = 4 lần.',
    explanation:
      'Ở 25°C, t₁₀₀% = 24,0 s. Tăng lên 45°C (ΔT = +20°C), tốc độ tăng gấp 4 lần nên thời gian kết thúc giảm còn 24,0 / 4 = 6,0 s.',
    simPreset: {
      label: 'Nạp cặp 45°C vs 25°C lên mô phỏng',
      payload: {
        scenario: 'solid_liquid',
        compareMode: true,
        configA: {
          concentration: 1.0,
          temperature: 45,
          surfaceArea: 'chunk',
          hasCatalyst: false,
        },
        configB: {
          concentration: 1.0,
          temperature: 25,
          surfaceArea: 'chunk',
          hasCatalyst: false,
        },
      },
    },
  },
  {
    id: 'n2',
    type: 'numeric',
    topic: 'Thực hành tính tốc độ trung bình',
    prompt:
      'Chạy hệ xúc tác H₂O₂ (0,4 M, 50 mL) có thêm 0,10 g MnO₂ ở 25°C (hoàn tất sau 8,0 giây với V = 247,9 mL). Tính tốc độ thoát khí O₂ trung bình v_tb của phản ứng này.',
    unit: 'mL/s',
    expectedValue: 30.99,
    tolerance: 0.6,
    hint: 'Áp dụng công thức v_tb = ΔV / Δt = 247,9 / 8,0.',
    explanation:
      'Tốc độ trung bình v_tb = ΔV / Δt = 247,9 / 8,0 ≈ 30,99 mL/s. Nếu không có MnO₂ ở 25°C, phản ứng mất tới 160,0 giây (v_tb ≈ 1,55 mL/s, chậm hơn 20 lần).',
    simPreset: {
      label: 'Nạp hệ xúc tác MnO₂ (25°C) lên mô phỏng',
      payload: {
        scenario: 'catalyst',
        compareMode: false,
        configA: {
          concentration: 0.4,
          temperature: 25,
          surfaceArea: 'powder',
          hasCatalyst: true,
        },
      },
    },
  },
];

export const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onClose,
  onApplyToSimulator,
}) => {
  const [filter, setFilter] = useState<'all' | 'mcq' | 'numeric'>('all');
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>(
    {}
  );
  const [numericChecked, setNumericChecked] = useState<Record<string, boolean>>(
    {}
  );

  if (!isOpen) return null;

  const isNumericCorrect = (q: NumericQuestion) => {
    if (!numericChecked[q.id]) return false;
    const raw = (numericInputs[q.id] ?? '').replace(',', '.').trim();
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return false;
    return Math.abs(parsed - q.expectedValue) <= q.tolerance;
  };

  const totalScore = QUESTIONS.reduce((acc, q) => {
    if (q.type === 'mcq') {
      return acc + (mcqAnswers[q.id] === q.correctIndex ? 1 : 0);
    }
    return acc + (isNumericCorrect(q) ? 1 : 0);
  }, 0);

  const answeredCount = QUESTIONS.reduce((acc, q) => {
    if (q.type === 'mcq') {
      return acc + (mcqAnswers[q.id] !== undefined ? 1 : 0);
    }
    return acc + (numericChecked[q.id] ? 1 : 0);
  }, 0);

  const filteredQuestions = QUESTIONS.filter(
    (q) => filter === 'all' || q.type === filter
  );

  const handleResetQuiz = () => {
    setMcqAnswers({});
    setNumericInputs({});
    setNumericChecked({});
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClipboardCheck
              className="w-4 h-4 text-slate-800 shrink-0"
              aria-hidden="true"
            />
            <h2
              id="practice-modal-title"
              className="text-sm font-bold text-slate-900 truncate"
            >
              Bài tập Củng cố — Bài 7: Tốc độ phản ứng &amp; Chất xúc tác
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-700">
              Điểm: <strong className="text-slate-900">{totalScore}/{QUESTIONS.length}</strong>
              <span className="text-slate-400 mx-1.5">·</span>
              Đã làm {answeredCount}/{QUESTIONS.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar: Filters & Reset */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg">
            {[
              { id: 'all', label: `Tất cả (${QUESTIONS.length})` },
              { id: 'mcq', label: 'Trắc nghiệm (6)' },
              { id: 'numeric', label: 'Thực hành số liệu (2)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFilter(tab.id as 'all' | 'mcq' | 'numeric')
                }
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetQuiz}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Làm lại
          </button>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto lab-scroll p-5 space-y-5">
          {filteredQuestions.map((q, idx) => {
            const globalIndex = QUESTIONS.findIndex((item) => item.id === q.id) + 1;

            return (
              <article
                key={q.id}
                className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white"
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="font-mono font-bold text-slate-900">
                      Câu {globalIndex}.
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{q.topic}</span>
                  </div>

                  {q.simPreset && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyToSimulator(q.simPreset!.payload);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 transition-colors cursor-pointer"
                    >
                      <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                      {q.simPreset.label}
                    </button>
                  )}
                </div>

                {/* Question Prompt */}
                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {q.prompt}
                </p>

                {/* MCQ Body */}
                {q.type === 'mcq' && (
                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      const selected = mcqAnswers[q.id];
                      const hasAnswered = selected !== undefined;
                      const isSelected = selected === optIdx;
                      const isCorrectOpt = optIdx === q.correctIndex;

                      let btnStyle =
                        'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                      if (hasAnswered) {
                        if (isCorrectOpt) {
                          btnStyle =
                            'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                        } else if (isSelected && !isCorrectOpt) {
                          btnStyle =
                            'bg-red-50 border-red-300 text-red-950';
                        } else {
                          btnStyle =
                            'bg-slate-50/50 border-slate-200 text-slate-500';
                        }
                      }

                      const letter = String.fromCharCode(65 + optIdx);

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() =>
                            setMcqAnswers((prev) => ({
                              ...prev,
                              [q.id]: optIdx,
                            }))
                          }
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-start justify-between gap-3 cursor-pointer ${btnStyle}`}
                        >
                          <span className="leading-relaxed">
                            <strong className="font-mono mr-2">{letter}.</strong>
                            {opt}
                          </span>
                          {hasAnswered && isCorrectOpt && (
                            <CheckCircle2
                              className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                              aria-label="Đáp án đúng"
                            />
                          )}
                          {hasAnswered && isSelected && !isCorrectOpt && (
                            <XCircle
                              className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                              aria-label="Chưa chính xác"
                            />
                          )}
                        </button>
                      );
                    })}

                    {mcqAnswers[q.id] !== undefined && (
                      <div
                        className={`mt-2 p-3 rounded-lg border text-xs leading-relaxed ${
                          mcqAnswers[q.id] === q.correctIndex
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}
                      >
                        <strong className="block mb-0.5">
                          {mcqAnswers[q.id] === q.correctIndex
                            ? 'Chính xác!'
                            : `Chưa chính xác (Đáp án đúng: ${String.fromCharCode(65 + q.correctIndex)}).`}
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Numeric Practice Body */}
                {q.type === 'numeric' && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor={`num-${q.id}`}
                        className="text-xs font-medium text-slate-600"
                      >
                        Kết quả của bạn:
                      </label>
                      <input
                        id={`num-${q.id}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="Ví dụ: 6,0"
                        value={numericInputs[q.id] ?? ''}
                        onChange={(e) => {
                          setNumericInputs((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }));
                          if (numericChecked[q.id]) {
                            setNumericChecked((prev) => ({
                              ...prev,
                              [q.id]: false,
                            }));
                          }
                        }}
                        className="w-36 px-3 py-1.5 font-mono text-xs font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 tabular-nums"
                      />
                      <span className="font-mono text-xs text-slate-500">
                        {q.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setNumericChecked((prev) => ({
                            ...prev,
                            [q.id]: true,
                          }))
                        }
                        disabled={!(numericInputs[q.id] ?? '').trim()}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Kiểm tra
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Gợi ý: {q.hint}
                    </p>

                    {numericChecked[q.id] && (
                      <div
                        className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                          isNumericCorrect(q)
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-red-50/70 border-red-200 text-red-950'
                        }`}
                      >
                        {isNumericCorrect(q) ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong className="block mb-0.5">
                            {isNumericCorrect(q)
                              ? 'Chính xác!'
                              : `Chưa đúng (Đáp án chuẩn: ${formatViNumber(q.expectedValue, q.id === 'n1' ? 1 : 2)} ${q.unit}).`}
                          </strong>
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {idx === filteredQuestions.length - 1 ? null : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
