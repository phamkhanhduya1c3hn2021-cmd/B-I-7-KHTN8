import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopHeader } from './components/TopHeader';
import { ControlPanel } from './components/ControlPanel';
import { MacroViewport } from './components/MacroViewport';
import { MicroViewport } from './components/MicroViewport';
import { KineticChart } from './components/KineticChart';
import { ValidationPanel } from './components/ValidationPanel';
import { ExportModal } from './components/ExportModal';
import { WorksheetModal } from './components/WorksheetModal';
import {
  PracticeApplyPayload,
  PracticeModal,
} from './components/PracticeModal';
import {
  ChartMetricMode,
  ExperimentConfig,
  RunState,
  SavedRunRecord,
  ScenarioId,
} from './types/simulation';
import {
  CATALYST_MASS_G,
  COMPARE_PRESET_CATALYST,
  COMPARE_PRESET_SOLID,
  DEFAULT_CONFIG_CATALYST,
  DEFAULT_CONFIG_SOLID,
  THEORETICAL_GAS_VOLUME_ML,
  createInitialRunState,
  evaluateReactionAtTime,
  formatConfigSummary,
  getTheoreticalTimes,
} from './utils/kinetics';

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>('solid_liquid');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [activeTube, setActiveTube] = useState<'A' | 'B'>('A');

  const [configA, setConfigA] = useState<ExperimentConfig>(DEFAULT_CONFIG_SOLID);
  const [configB, setConfigB] = useState<ExperimentConfig>(COMPARE_PRESET_SOLID.b);

  const [runA, setRunA] = useState<RunState>(createInitialRunState);
  const [runB, setRunB] = useState<RunState>(createInitialRunState);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [metricMode, setMetricMode] = useState<ChartMetricMode>('volume');
  const [resetSignal, setResetSignal] = useState<number>(0);

  const [savedRuns, setSavedRuns] = useState<SavedRunRecord[]>([]);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState<boolean>(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState<boolean>(false);

  const simTimeRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(0);
  const autoSavedRef = useRef<{ a: boolean; b: boolean }>({ a: false, b: false });

  const isFinished =
    runA.isComplete && (!compareMode || runB.isComplete);

  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    setHasStarted(false);
    simTimeRef.current = 0;
    lastSampleTimeRef.current = 0;
    autoSavedRef.current = { a: false, b: false };
    setRunA(createInitialRunState());
    setRunB(createInitialRunState());
    setResetSignal((n) => n + 1);
  }, []);

  const handleSelectScenario = (next: ScenarioId) => {
    if (next === scenario) return;
    setScenario(next);
    if (next === 'solid_liquid') {
      setConfigA(DEFAULT_CONFIG_SOLID);
      setConfigB(COMPARE_PRESET_SOLID.b);
    } else {
      setConfigA(DEFAULT_CONFIG_CATALYST);
      setConfigB(COMPARE_PRESET_CATALYST.b);
    }
    setActiveTube('A');
    resetSimulation();
  };

  const handleToggleCompareMode = (nextCompare: boolean) => {
    if (nextCompare === compareMode) return;
    setCompareMode(nextCompare);
    if (nextCompare) {
      if (scenario === 'solid_liquid') {
        setConfigB(COMPARE_PRESET_SOLID.b);
      } else {
        setConfigB(COMPARE_PRESET_CATALYST.b);
      }
    }
    setActiveTube('A');
    resetSimulation();
  };

  const handleUpdateConfig = (
    tube: 'A' | 'B',
    patch: Partial<ExperimentConfig>
  ) => {
    if (tube === 'A') {
      setConfigA((prev) => ({ ...prev, ...patch }));
    } else {
      setConfigB((prev) => ({ ...prev, ...patch }));
    }
  };

  const handleApplyPresetCompare = () => {
    if (scenario === 'solid_liquid') {
      setConfigA(COMPARE_PRESET_SOLID.a);
      setConfigB(COMPARE_PRESET_SOLID.b);
    } else {
      setConfigA(COMPARE_PRESET_CATALYST.a);
      setConfigB(COMPARE_PRESET_CATALYST.b);
    }
    resetSimulation();
  };

  const handleApplyPracticePreset = (payload: PracticeApplyPayload) => {
    setScenario(payload.scenario);
    setCompareMode(payload.compareMode);
    setConfigA(payload.configA);
    if (payload.configB) {
      setConfigB(payload.configB);
    }
    setActiveTube('A');
    resetSimulation();
  };

  const createSavedRecord = useCallback(
    (
      tubeLabel: string,
      cfg: ExperimentConfig,
      rState: RunState,
      indexNum: number
    ): SavedRunRecord => {
      const theory = getTheoreticalTimes(scenario, cfg);
      const tEnd = rState.tComplete ?? rState.elapsedTime;
      const vSim = rState.volumeGas;
      const avgRate = tEnd > 0 ? vSim / tEnd : 0;
      const errPct =
        (Math.abs(vSim - THEORETICAL_GAS_VOLUME_ML) /
          THEORETICAL_GAS_VOLUME_ML) *
        100;

      return {
        id: `${Date.now()}-${tubeLabel}-${Math.random().toString(36).slice(2, 6)}`,
        label: compareMode ? `Lần ${indexNum} (${tubeLabel})` : `Lần ${indexNum}`,
        scenario,
        summary: formatConfigSummary(scenario, cfg),
        config: { ...cfg },
        tHalf: rState.tHalf ?? (rState.reactedFraction >= 0.5 ? theory.tHalf : null),
        tComplete: rState.tComplete,
        vSimMax: vSim,
        vTheory: THEORETICAL_GAS_VOLUME_ML,
        errorPercent: errPct,
        avgRate,
        catalystMassBefore:
          scenario === 'catalyst' && cfg.hasCatalyst ? CATALYST_MASS_G : 0,
        catalystMassAfter:
          scenario === 'catalyst' && cfg.hasCatalyst ? CATALYST_MASS_G : 0,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      };
    },
    [compareMode, scenario]
  );

  const handleSaveCurrentRun = () => {
    if (!hasStarted) return;
    setSavedRuns((prev) => {
      const scenarioCount = prev.filter((r) => r.scenario === scenario).length;
      const nextIdx = scenarioCount + 1;
      const additions: SavedRunRecord[] = [
        createSavedRecord('A', configA, runA, nextIdx),
      ];
      if (compareMode) {
        additions.push(createSavedRecord('B', configB, runB, nextIdx));
      }
      return [...additions, ...prev];
    });
  };

  const handleTogglePlay = () => {
    if (isFinished) {
      resetSimulation();
      setTimeout(() => {
        setHasStarted(true);
        setIsRunning(true);
      }, 20);
      return;
    }
    if (!hasStarted) {
      setHasStarted(true);
    }
    setIsRunning((prev) => !prev);
  };

  // Main kinetic simulation loop
  useEffect(() => {
    if (!isRunning) return;

    let animId = 0;
    let lastFrame = performance.now();

    const tick = (now: number) => {
      const dtReal = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      const dtSim = dtReal * speed;
      simTimeRef.current += dtSim;
      const tNow = simTimeRef.current;

      const shouldSample =
        tNow - lastSampleTimeRef.current >= 0.12 || tNow < 0.05;
      if (shouldSample) {
        lastSampleTimeRef.current = tNow;
      }

      const evalA = evaluateReactionAtTime(scenario, configA, tNow);
      const theoryA = getTheoreticalTimes(scenario, configA);

      const evalB = compareMode
        ? evaluateReactionAtTime(scenario, configB, tNow)
        : null;
      const theoryB = compareMode
        ? getTheoreticalTimes(scenario, configB)
        : null;

      setRunA((prev) => {
        const nextTHalf =
          prev.tHalf !== null
            ? prev.tHalf
            : evalA.alpha >= 0.5
              ? Number(theoryA.tHalf.toFixed(2))
              : null;
        const nextTComplete =
          prev.tComplete !== null
            ? prev.tComplete
            : evalA.isComplete
              ? Number(theoryA.tComplete.toFixed(2))
              : null;

        const nextHistory =
          (shouldSample && !prev.isComplete) ||
          (evalA.isComplete && !prev.isComplete)
            ? [
                ...prev.history,
                {
                  t: evalA.isComplete ? theoryA.tComplete : tNow,
                  volume: evalA.volume,
                  percent: evalA.alpha * 100,
                  rate: evalA.instantRate,
                },
              ]
            : prev.history;

        return {
          ...prev,
          elapsedTime: evalA.isComplete && prev.tComplete !== null
            ? prev.elapsedTime
            : evalA.isComplete
              ? theoryA.tComplete
              : tNow,
          volumeGas: evalA.volume,
          reactedFraction: evalA.alpha,
          instantRate: evalA.instantRate,
          tHalf: nextTHalf,
          tComplete: nextTComplete,
          isComplete: evalA.isComplete,
          history: nextHistory,
        };
      });

      if (compareMode && evalB && theoryB) {
        setRunB((prev) => {
          const nextTHalf =
            prev.tHalf !== null
              ? prev.tHalf
              : evalB.alpha >= 0.5
                ? Number(theoryB.tHalf.toFixed(2))
                : null;
          const nextTComplete =
            prev.tComplete !== null
              ? prev.tComplete
              : evalB.isComplete
                ? Number(theoryB.tComplete.toFixed(2))
                : null;

          const nextHistory =
            (shouldSample && !prev.isComplete) ||
            (evalB.isComplete && !prev.isComplete)
              ? [
                  ...prev.history,
                  {
                    t: evalB.isComplete ? theoryB.tComplete : tNow,
                    volume: evalB.volume,
                    percent: evalB.alpha * 100,
                    rate: evalB.instantRate,
                  },
                ]
              : prev.history;

          return {
            ...prev,
            elapsedTime: evalB.isComplete && prev.tComplete !== null
              ? prev.elapsedTime
              : evalB.isComplete
                ? theoryB.tComplete
                : tNow,
            volumeGas: evalB.volume,
            reactedFraction: evalB.alpha,
            instantRate: evalB.instantRate,
            tHalf: nextTHalf,
            tComplete: nextTComplete,
            isComplete: evalB.isComplete,
            history: nextHistory,
          };
        });
      }

      const bothDone =
        evalA.isComplete && (!compareMode || (evalB?.isComplete ?? true));
      if (bothDone) {
        setIsRunning(false);
        return;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, speed, scenario, configA, configB, compareMode]);

  // Auto-record completed runs to validation history table
  useEffect(() => {
    if (runA.isComplete && !autoSavedRef.current.a) {
      autoSavedRef.current.a = true;
      setSavedRuns((prev) => {
        const count = prev.filter((r) => r.scenario === scenario).length + 1;
        return [createSavedRecord('A', configA, runA, count), ...prev];
      });
    }
  }, [runA, configA, scenario, createSavedRecord]);

  useEffect(() => {
    if (compareMode && runB.isComplete && !autoSavedRef.current.b) {
      autoSavedRef.current.b = true;
      setSavedRuns((prev) => {
        const count = prev.filter((r) => r.scenario === scenario).length + 1;
        return [createSavedRecord('B', configB, runB, count), ...prev];
      });
    }
  }, [compareMode, runB, configB, scenario, createSavedRecord]);

  const scenarioSavedRuns = savedRuns.filter((r) => r.scenario === scenario);

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 text-slate-900 lg:overflow-hidden">
      {/* Top Bar (Zone 1) */}
      <TopHeader
        scenario={scenario}
        onSelectScenario={handleSelectScenario}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenWorksheet={() => setIsWorksheetOpen(true)}
        onOpenPractice={() => setIsPracticeOpen(true)}
      />

      {/* Main Single-Screen Split-View Workspace */}
      <main className="flex-1 min-h-0 p-3 grid grid-cols-1 lg:grid-cols-[minmax(280px,25fr)_45fr_minmax(320px,30fr)] gap-3">
        {/* Left Column (25%): Control Panel */}
        <div className="min-h-0">
          <ControlPanel
            scenario={scenario}
            compareMode={compareMode}
            onToggleCompareMode={handleToggleCompareMode}
            activeTube={activeTube}
            onSelectActiveTube={setActiveTube}
            configA={configA}
            configB={configB}
            onUpdateConfig={handleUpdateConfig}
            onApplyPresetCompare={handleApplyPresetCompare}
            isRunning={isRunning}
            hasStarted={hasStarted}
            isFinished={isFinished}
            onTogglePlay={handleTogglePlay}
            onReset={resetSimulation}
            speed={speed}
            onChangeSpeed={setSpeed}
            onSaveRun={handleSaveCurrentRun}
          />
        </div>

        {/* Center Column (45%): Dual-Viewport (Macro Top + Micro Bottom) */}
        <div className="min-h-0 grid grid-rows-2 gap-3">
          <MacroViewport
            scenario={scenario}
            compareMode={compareMode}
            configA={configA}
            configB={configB}
            runA={runA}
            runB={runB}
            isRunning={isRunning}
          />
          <MicroViewport
            scenario={scenario}
            compareMode={compareMode}
            configA={configA}
            configB={configB}
            runA={runA}
            runB={runB}
            isRunning={isRunning}
            hasStarted={hasStarted}
            speed={speed}
            resetSignal={resetSignal}
          />
        </div>

        {/* Right Column (30%): Analytics & Validation */}
        <div className="min-h-0 flex flex-col gap-3">
          <KineticChart
            scenario={scenario}
            compareMode={compareMode}
            configA={configA}
            configB={configB}
            runA={runA}
            runB={runB}
            metricMode={metricMode}
            onChangeMetricMode={setMetricMode}
          />
          <ValidationPanel
            scenario={scenario}
            compareMode={compareMode}
            configA={configA}
            configB={configB}
            runA={runA}
            runB={runB}
            savedRuns={scenarioSavedRuns}
            onClearSaved={() =>
              setSavedRuns((prev) => prev.filter((r) => r.scenario !== scenario))
            }
          />
        </div>
      </main>

      {/* Export HTML5 + CSS3 Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        scenario={scenario}
        compareMode={compareMode}
        configA={configA}
        configB={configB}
        runA={runA}
        runB={runB}
        metricMode={metricMode}
        savedRuns={scenarioSavedRuns}
      />

      {/* Pedagogical Worksheet Modal */}
      <WorksheetModal
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        scenario={scenario}
      />

      {/* Reinforcement Practice Modal */}
      <PracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        onApplyToSimulator={handleApplyPracticePreset}
      />
    </div>
  );
}
