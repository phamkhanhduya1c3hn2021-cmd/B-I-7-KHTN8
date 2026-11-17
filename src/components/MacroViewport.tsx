import React, { useEffect, useRef } from 'react';
import {
  ExperimentConfig,
  RunState,
  ScenarioId,
} from '../types/simulation';
import {
  CATALYST_MASS_G,
  THEORETICAL_GAS_VOLUME_ML,
  formatViNumber,
} from '../utils/kinetics';

interface MacroViewportProps {
  scenario: ScenarioId;
  compareMode: boolean;
  configA: ExperimentConfig;
  configB: ExperimentConfig;
  runA: RunState;
  runB: RunState;
  isRunning: boolean;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  wobblePhase: number;
  tube: 'A' | 'B';
}

export const MacroViewport: React.FC<MacroViewportProps> = ({
  scenario,
  compareMode,
  configA,
  configB,
  runA,
  runB,
  isRunning,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);

  const stateRef = useRef({
    scenario,
    compareMode,
    configA,
    configB,
    runA,
    runB,
    isRunning,
  });

  useEffect(() => {
    stateRef.current = {
      scenario,
      compareMode,
      configA,
      configB,
      runA,
      runB,
      isRunning,
    };
  }, [scenario, compareMode, configA, configB, runA, runB, isRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;
    let lastTime = performance.now();

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(300, Math.floor(rect.width * dpr));
      canvas.height = Math.max(180, Math.floor(rect.height * dpr));
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const drawRig = (
      ctx: CanvasRenderingContext2D,
      originX: number,
      originY: number,
      rigW: number,
      rigH: number,
      config: ExperimentConfig,
      run: RunState,
      tubeId: 'A' | 'B',
      accentColor: string,
      dt: number,
      nowSec: number
    ) => {
      const { scenario: sc, isRunning: running } = stateRef.current;
      const gasFormula = sc === 'solid_liquid' ? 'CO₂' : 'O₂';

      // Coordinate system inside rig box
      const flaskCenterX = originX + rigW * 0.27;
      const flaskBottomY = originY + rigH * 0.88;
      const flaskHeight = rigH * 0.62;
      const flaskTopY = flaskBottomY - flaskHeight;
      const baseHalfW = Math.min(rigW * 0.17, flaskHeight * 0.48);
      const neckHalfW = baseHalfW * 0.28;
      const neckBottomY = flaskTopY + flaskHeight * 0.26;
      const liquidTopY = flaskTopY + flaskHeight * 0.45;

      // Label badge in top-left of rig
      ctx.save();
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'left';
      const titleText = stateRef.current.compareMode
        ? `Ống ${tubeId}`
        : 'Bình phản ứng';
      ctx.fillText(titleText, originX + 10, originY + 18);

      // Draw temperature thermometer inside flask
      const thermX = flaskCenterX - neckHalfW * 0.35;
      const thermTopY = flaskTopY - 22;
      const thermBottomY = flaskBottomY - 16;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(thermX, thermTopY);
      ctx.lineTo(thermX, thermBottomY);
      ctx.stroke();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(thermX, thermTopY + 1);
      ctx.lineTo(thermX, thermBottomY - 1);
      ctx.stroke();

      const tempRatio = (config.temperature - 10) / 50;
      const mercuryColor =
        config.temperature <= 20
          ? '#0284c7'
          : config.temperature >= 40
            ? '#dc2626'
            : '#f59e0b';
      const mercuryTopY =
        thermBottomY - 10 - tempRatio * (thermBottomY - thermTopY - 20);
      ctx.strokeStyle = mercuryColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(thermX, thermBottomY);
      ctx.lineTo(thermX, mercuryTopY);
      ctx.stroke();

      ctx.fillStyle = mercuryColor;
      ctx.beginPath();
      ctx.arc(thermX, thermBottomY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Thermometer temperature tag
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'right';
      ctx.fillText(`${config.temperature}°C`, thermX - 6, thermTopY + 12);

      // Flask liquid fill (clipped to flask path)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(flaskCenterX - neckHalfW, flaskTopY);
      ctx.lineTo(flaskCenterX - neckHalfW, neckBottomY);
      ctx.lineTo(flaskCenterX - baseHalfW, flaskBottomY - 8);
      ctx.quadraticCurveTo(
        flaskCenterX - baseHalfW,
        flaskBottomY,
        flaskCenterX - baseHalfW + 10,
        flaskBottomY
      );
      ctx.lineTo(flaskCenterX + baseHalfW - 10, flaskBottomY);
      ctx.quadraticCurveTo(
        flaskCenterX + baseHalfW,
        flaskBottomY,
        flaskCenterX + baseHalfW,
        flaskBottomY - 8
      );
      ctx.lineTo(flaskCenterX + neckHalfW, neckBottomY);
      ctx.lineTo(flaskCenterX + neckHalfW, flaskTopY);
      ctx.closePath();
      ctx.clip();

      // Solution background
      const solGrad = ctx.createLinearGradient(0, liquidTopY, 0, flaskBottomY);
      if (sc === 'solid_liquid') {
        const concAlpha = 0.1 + (config.concentration / 2.0) * 0.16;
        solGrad.addColorStop(0, `rgba(14, 165, 233, ${concAlpha})`);
        solGrad.addColorStop(1, `rgba(2, 132, 199, ${concAlpha + 0.08})`);
      } else {
        solGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
        solGrad.addColorStop(1, 'rgba(14, 165, 233, 0.22)');
      }
      ctx.fillStyle = solGrad;
      ctx.fillRect(
        flaskCenterX - baseHalfW - 4,
        liquidTopY,
        baseHalfW * 2 + 8,
        flaskBottomY - liquidTopY + 4
      );

      // Meniscus line
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(flaskCenterX - baseHalfW, liquidTopY);
      ctx.lineTo(flaskCenterX + baseHalfW, liquidTopY);
      ctx.stroke();

      // Solid inside flask
      const remainingFrac = Math.max(0, 1 - run.reactedFraction);
      if (sc === 'solid_liquid') {
        const scale = Math.cbrt(remainingFrac);
        if (scale > 0.02) {
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;

          if (config.surfaceArea === 'chunk') {
            const w = 22 * scale;
            const h = 15 * scale;
            ctx.beginPath();
            ctx.roundRect(
              flaskCenterX - w / 2,
              flaskBottomY - h - 3,
              w,
              h,
              4 * scale
            );
            ctx.fill();
            ctx.stroke();
          } else if (config.surfaceArea === 'granule') {
            const offsets = [-18, -11, -4, 3, 10, 17, -7, 7];
            offsets.forEach((dx, idx) => {
              const r = 4.2 * scale;
              const yOff = idx >= 6 ? 7 : 3;
              ctx.beginPath();
              ctx.arc(flaskCenterX + dx, flaskBottomY - r - yOff, r, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          } else {
            // Powder layer
            const layerH = Math.max(1.5, 9 * scale);
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(
              flaskCenterX - baseHalfW * 0.72,
              flaskBottomY - layerH - 1,
              baseHalfW * 1.44,
              layerH
            );
            // Tiny grains
            ctx.fillStyle = '#94a3b8';
            for (let i = -12; i <= 12; i += 3) {
              ctx.fillRect(
                flaskCenterX + i * 2.1,
                flaskBottomY - layerH + ((i * 7) % 3),
                1.5,
                1.5
              );
            }
          }
        }
      } else if (config.hasCatalyst) {
        // MnO2 black catalyst bed (never shrinks!)
        ctx.fillStyle = '#1e293b';
        for (let i = -14; i <= 14; i += 2) {
          const jitter =
            running && !run.isComplete
              ? Math.sin(nowSec * 9 + i * 1.7) * 2.5
              : 0;
          ctx.beginPath();
          ctx.arc(
            flaskCenterX + i * 2.2,
            flaskBottomY - 4 - Math.abs(jitter),
            1.8,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Spawn & update bubbles
      const bubbleSpawnRate = running && !run.isComplete ? run.instantRate * 0.9 : 0;
      if (bubbleSpawnRate > 0) {
        const spawnCount = Math.min(
          4,
          Math.floor(bubbleSpawnRate * dt * 2.4 + Math.random() * 0.65)
        );
        for (let i = 0; i < spawnCount; i++) {
          const spread =
            sc === 'solid_liquid' && config.surfaceArea === 'chunk'
              ? 18
              : baseHalfW * 1.3;
          bubblesRef.current.push({
            x: flaskCenterX + (Math.random() - 0.5) * spread,
            y: flaskBottomY - 6 - Math.random() * 6,
            r: 1.5 + Math.random() * 2.2,
            vy: 38 + Math.random() * 35 + config.temperature * 0.4,
            wobblePhase: Math.random() * Math.PI * 2,
            tube: tubeId,
          });
        }
      }

      // Draw bubbles belonging to this tube
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.65)';
      ctx.lineWidth = 0.8;
      bubblesRef.current = bubblesRef.current.filter((b) => {
        if (b.tube !== tubeId) return true;
        if (running) {
          b.y -= b.vy * dt;
          b.x += Math.sin(nowSec * 8 + b.wobblePhase) * 14 * dt;
        }
        if (b.y < liquidTopY + 2) return false;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        return true;
      });

      ctx.restore(); // end flask clip

      // Flask glass outline
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(flaskCenterX - neckHalfW - 3, flaskTopY);
      ctx.lineTo(flaskCenterX - neckHalfW, flaskTopY + 3);
      ctx.lineTo(flaskCenterX - neckHalfW, neckBottomY);
      ctx.lineTo(flaskCenterX - baseHalfW, flaskBottomY - 8);
      ctx.quadraticCurveTo(
        flaskCenterX - baseHalfW,
        flaskBottomY,
        flaskCenterX - baseHalfW + 10,
        flaskBottomY
      );
      ctx.lineTo(flaskCenterX + baseHalfW - 10, flaskBottomY);
      ctx.quadraticCurveTo(
        flaskCenterX + baseHalfW,
        flaskBottomY,
        flaskCenterX + baseHalfW,
        flaskBottomY - 8
      );
      ctx.lineTo(flaskCenterX + neckHalfW, neckBottomY);
      ctx.lineTo(flaskCenterX + neckHalfW, flaskTopY + 3);
      ctx.lineTo(flaskCenterX + neckHalfW + 3, flaskTopY);
      ctx.stroke();

      // Rubber stopper
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(
        flaskCenterX - neckHalfW + 1,
        flaskTopY - 7,
        neckHalfW * 2 - 2,
        12,
        2
      );
      ctx.fill();

      // Gas Syringe Setup (right side of rig)
      const syrStartX = originX + rigW * 0.5;
      const syrMaxW = rigW * 0.43;
      const syrY = originY + rigH * 0.46;
      const syrH = Math.min(34, rigH * 0.22);

      // Delivery tube from stopper to syringe nozzle
      const tubeStartX = flaskCenterX + neckHalfW * 0.35;
      const tubeStartY = flaskTopY - 7;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(tubeStartX, tubeStartY);
      ctx.lineTo(tubeStartX, syrY + syrH / 2);
      ctx.lineTo(syrStartX, syrY + syrH / 2);
      ctx.stroke();

      // Syringe barrel
      const barrelW = syrMaxW * 0.78;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.6;
      ctx.fillRect(syrStartX, syrY, barrelW, syrH);
      ctx.strokeRect(syrStartX, syrY, barrelW, syrH);

      // Gas fill inside syringe
      const volFrac = Math.min(1, run.volumeGas / 250);
      const plungerX = syrStartX + volFrac * (barrelW - 8);

      ctx.fillStyle =
        tubeId === 'A'
          ? 'rgba(220, 38, 38, 0.08)'
          : 'rgba(2, 132, 199, 0.08)';
      ctx.fillRect(syrStartX + 1, syrY + 1, plungerX - syrStartX, syrH - 2);

      // Graduation ticks (0, 50, 100, 150, 200, 250 mL)
      ctx.font = '500 8.5px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      [0, 50, 100, 150, 200, 250].forEach((ml) => {
        const tx = syrStartX + (ml / 250) * (barrelW - 8);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, syrY);
        ctx.lineTo(tx, syrY + 5);
        ctx.stroke();
        if (ml === 0 || ml === 100 || ml === 200 || ml === 250) {
          ctx.fillText(`${ml}`, tx, syrY - 4);
        }
      });

      // Theoretical 247.9 mL marker line
      const theoryX =
        syrStartX + (THEORETICAL_GAS_VOLUME_ML / 250) * (barrelW - 8);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(theoryX, syrY - 2);
      ctx.lineTo(theoryX, syrY + syrH + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Syringe plunger & rod
      ctx.fillStyle = accentColor;
      ctx.fillRect(plungerX, syrY + 2, 7, syrH - 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(plungerX + 7, syrY + syrH / 2 - 2, barrelW * 0.28, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(
        plungerX + 7 + barrelW * 0.28,
        syrY + 4,
        4,
        syrH - 8
      );

      // Live Digital Volume Readout below syringe
      const readoutY = syrY + syrH + 22;
      ctx.textAlign = 'left';
      ctx.font = '700 13px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(
        `V(${gasFormula}) = ${formatViNumber(run.volumeGas, 1)} mL`,
        syrStartX,
        readoutY
      );

      ctx.font = '500 10.5px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#475569';
      const pct = Math.min(100, run.reactedFraction * 100);
      ctx.fillText(
        `Đã phản ứng: ${formatViNumber(pct, 1)}%`,
        syrStartX,
        readoutY + 15
      );

      // In Tab 2, display MnO2 conserved mass readout
      if (sc === 'catalyst') {
        ctx.font = '600 10.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = config.hasCatalyst ? '#b45309' : '#64748b';
        ctx.fillText(
          config.hasCatalyst
            ? `m(MnO₂) = ${formatViNumber(CATALYST_MASS_G, 2)} g (bảo toàn)`
            : 'Không có MnO₂',
          syrStartX,
          readoutY + 31
        );
      }

      ctx.restore();
    };

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Clean subtle bench line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, h * 0.88 + 1);
      ctx.lineTo(w - 12, h * 0.88 + 1);
      ctx.stroke();

      const { compareMode: cmp, configA: cA, configB: cB, runA: rA, runB: rB } =
        stateRef.current;

      if (!cmp) {
        drawRig(
          ctx,
          0,
          0,
          w,
          h,
          cA,
          rA,
          'A',
          '#dc2626',
          dt,
          now / 1000
        );
      } else {
        const halfW = w / 2;
        // Center divider
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(halfW, 10);
        ctx.lineTo(halfW, h - 10);
        ctx.stroke();

        drawRig(
          ctx,
          0,
          0,
          halfW - 2,
          h,
          cA,
          rA,
          'A',
          '#dc2626',
          dt,
          now / 1000
        );
        drawRig(
          ctx,
          halfW + 2,
          0,
          halfW - 2,
          h,
          cB,
          rB,
          'B',
          '#0284c7',
          dt,
          now / 1000
        );
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full">
      <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-bold text-slate-900 truncate">
            Góc nhìn Vĩ mô (Hiện tượng quan sát)
          </h3>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs tabular-nums shrink-0">
          <span className="text-slate-600">
            t = <strong className="text-slate-900">{formatViNumber(runA.elapsedTime, 1)} s</strong>
          </span>
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 min-h-[180px] bg-slate-50/50">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </section>
  );
};
