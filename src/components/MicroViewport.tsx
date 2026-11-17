import React, { useEffect, useRef, useState } from 'react';
import {
  CollisionStats,
  ExperimentConfig,
  RunState,
  ScenarioId,
  SurfaceAreaType,
} from '../types/simulation';

interface MicroViewportProps {
  scenario: ScenarioId;
  compareMode: boolean;
  configA: ExperimentConfig;
  configB: ExperimentConfig;
  runA: RunState;
  runB: RunState;
  isRunning: boolean;
  hasStarted: boolean;
  speed: number;
  resetSignal: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  energyFactor: number; // relative thermal energy multiplier
  trail: Array<{ x: number; y: number }>;
  cooldown: number;
}

interface SolidBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  baseW: number;
  baseH: number;
  isCatalyst?: boolean;
}

interface CollisionRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  effective: boolean;
}

interface ProductMolecule {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  label: string;
}

interface BoxEngine {
  particles: Particle[];
  blocks: SolidBlock[];
  rings: CollisionRing[];
  products: ProductMolecule[];
  stats: CollisionStats;
  lastConc: number;
  lastSurface: SurfaceAreaType;
  lastCatalyst: boolean;
  lastScenario: ScenarioId;
  lastW: number;
  lastH: number;
}

function createEmptyEngine(): BoxEngine {
  return {
    particles: [],
    blocks: [],
    rings: [],
    products: [],
    stats: { total: 0, effective: 0 },
    lastConc: -1,
    lastSurface: 'chunk',
    lastCatalyst: false,
    lastScenario: 'solid_liquid',
    lastW: 0,
    lastH: 0,
  };
}

function buildBlocks(
  scenario: ScenarioId,
  config: ExperimentConfig,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
): SolidBlock[] {
  const blocks: SolidBlock[] = [];
  if (scenario === 'solid_liquid') {
    if (config.surfaceArea === 'chunk') {
      const bw = Math.min(110, boxW * 0.42);
      const bh = Math.min(42, boxH * 0.24);
      blocks.push({
        x: boxX + (boxW - bw) / 2,
        y: boxY + boxH - bh - 10,
        w: bw,
        h: bh,
        baseW: bw,
        baseH: bh,
      });
    } else if (config.surfaceArea === 'granule') {
      const cols = 4;
      const bw = Math.min(34, boxW * 0.14);
      const bh = Math.min(20, boxH * 0.12);
      const totalGapW = boxW * 0.82;
      const startX = boxX + (boxW - totalGapW) / 2;
      const stepX = (totalGapW - bw) / (cols - 1);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < cols; col++) {
          blocks.push({
            x: startX + col * stepX + (row % 2 === 1 ? 6 : -3),
            y: boxY + boxH - (row + 1) * (bh + 6) - 6,
            w: bw,
            h: bh,
            baseW: bw,
            baseH: bh,
          });
        }
      }
    } else {
      // Powder: dispersed small crystals exposing ~4x surface
      const cols = 8;
      const rows = 2;
      const bw = Math.min(18, boxW * 0.065);
      const bh = Math.min(12, boxH * 0.075);
      const totalGapW = boxW * 0.88;
      const startX = boxX + (boxW - totalGapW) / 2;
      const stepX = (totalGapW - bw) / (cols - 1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          blocks.push({
            x: startX + c * stepX + (r === 1 ? 4 : -2),
            y: boxY + boxH - (r + 1) * (bh + 8) - 8,
            w: bw,
            h: bh,
            baseW: bw,
            baseH: bh,
          });
        }
      }
    }
  } else if (config.hasCatalyst) {
    // Catalyst scenario with MnO2 active sites
    const count = 6;
    const bw = Math.min(24, boxW * 0.09);
    const bh = Math.min(16, boxH * 0.1);
    const totalGapW = boxW * 0.78;
    const startX = boxX + (boxW - totalGapW) / 2;
    const stepX = (totalGapW - bw) / (count - 1);
    for (let i = 0; i < count; i++) {
      blocks.push({
        x: startX + i * stepX,
        y: boxY + boxH - bh - 12 - (i % 2) * 14,
        w: bw,
        h: bh,
        baseW: bw,
        baseH: bh,
        isCatalyst: true,
      });
    }
  }
  return blocks;
}

function getTargetParticleCount(
  scenario: ScenarioId,
  config: ExperimentConfig
): number {
  if (scenario === 'solid_liquid') {
    // 0.1 M -> 7 particles; 1.0 M -> 70 particles (exact 10x scaling!)
    return Math.max(5, Math.round(config.concentration * 70));
  }
  return 36; // H2O2 molecules
}

function spawnParticle(
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  temperature: number
): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speedBase = 48 * Math.sqrt((temperature + 273.15) / 298.15);
  const energyFactor = 0.55 + Math.random() * 1.1; // Maxwell-Boltzmann proxy
  const spd = speedBase * Math.sqrt(energyFactor);
  return {
    x: boxX + 10 + Math.random() * Math.max(20, boxW - 20),
    y: boxY + 10 + Math.random() * Math.max(20, boxH * 0.65),
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    energyFactor,
    trail: [],
    cooldown: 0,
  };
}

export const MicroViewport: React.FC<MicroViewportProps> = ({
  scenario,
  compareMode,
  configA,
  configB,
  runA,
  runB,
  isRunning,
  hasStarted,
  speed,
  resetSignal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineARef = useRef<BoxEngine>(createEmptyEngine());
  const engineBRef = useRef<BoxEngine>(createEmptyEngine());

  const [statsDisplay, setStatsDisplay] = useState<{
    a: CollisionStats;
    b: CollisionStats;
  }>({
    a: { total: 0, effective: 0 },
    b: { total: 0, effective: 0 },
  });

  const propsRef = useRef({
    scenario,
    compareMode,
    configA,
    configB,
    runA,
    runB,
    isRunning,
    hasStarted,
    speed,
  });

  useEffect(() => {
    propsRef.current = {
      scenario,
      compareMode,
      configA,
      configB,
      runA,
      runB,
      isRunning,
      hasStarted,
      speed,
    };
  }, [
    scenario,
    compareMode,
    configA,
    configB,
    runA,
    runB,
    isRunning,
    hasStarted,
    speed,
  ]);

  useEffect(() => {
    engineARef.current = createEmptyEngine();
    engineBRef.current = createEmptyEngine();
    setStatsDisplay({
      a: { total: 0, effective: 0 },
      b: { total: 0, effective: 0 },
    });
  }, [resetSignal, scenario, compareMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;
    let lastTime = performance.now();
    let lastUiSync = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(300, Math.floor(rect.width * dpr));
      canvas.height = Math.max(180, Math.floor(rect.height * dpr));
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const stepAndDrawBox = (
      ctx: CanvasRenderingContext2D,
      engine: BoxEngine,
      boxX: number,
      boxY: number,
      boxW: number,
      boxH: number,
      config: ExperimentConfig,
      run: RunState,
      dt: number,
      tubeLabel: string,
      accentColor: string
    ) => {
      const {
        scenario: sc,
        isRunning: running,
        hasStarted: started,
        speed: spdMul,
      } = propsRef.current;

      // Rebuild blocks when geometry or dimensions change
      const dimsChanged =
        Math.abs(engine.lastW - boxW) > 2 || Math.abs(engine.lastH - boxH) > 2;
      if (
        dimsChanged ||
        engine.lastSurface !== config.surfaceArea ||
        engine.lastCatalyst !== config.hasCatalyst ||
        engine.lastScenario !== sc
      ) {
        engine.blocks = buildBlocks(sc, config, boxX, boxY, boxW, boxH);
        engine.lastSurface = config.surfaceArea;
        engine.lastCatalyst = config.hasCatalyst;
        engine.lastScenario = sc;
        engine.lastW = boxW;
        engine.lastH = boxH;
      }

      // Sync particle count dynamically with concentration
      const targetCount = getTargetParticleCount(sc, config);
      while (engine.particles.length < targetCount) {
        engine.particles.push(
          spawnParticle(boxX, boxY, boxW, boxH, config.temperature)
        );
      }
      if (engine.particles.length > targetCount) {
        engine.particles.length = targetCount;
      }

      // Clip to box region
      ctx.save();
      ctx.beginPath();
      ctx.rect(boxX, boxY, boxW, boxH);
      ctx.clip();

      // Subtle magnified water/acid gradient background
      const bgGrad = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(1, '#eef6ff');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Subtle magnifying grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 1;
      for (let gx = boxX + 24; gx < boxX + boxW; gx += 24) {
        ctx.beginPath();
        ctx.moveTo(gx, boxY);
        ctx.lineTo(gx, boxY + boxH);
        ctx.stroke();
      }
      for (let gy = boxY + 24; gy < boxY + boxH; gy += 24) {
        ctx.beginPath();
        ctx.moveTo(boxX, gy);
        ctx.lineTo(boxX + boxW, gy);
        ctx.stroke();
      }

      // Box Title
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'left';
      ctx.fillText(tubeLabel, boxX + 10, boxY + 17);

      // Should particles animate? Animate on idle preview (!started) or while running
      const shouldAnimate = !started || (running && !run.isComplete);
      const simDt = shouldAnimate ? dt * (started ? spdMul : 0.75) : 0;
      const thermalScale = Math.sqrt((config.temperature + 273.15) / 298.15);
      // Speed visual amplification so 10°C vs 60°C looks unmistakably different
      const tempVisualBoost =
        1 + ((config.temperature - 10) / 50) * 1.65;

      // Effective activation energy threshold probability
      // Higher temperature -> much higher fraction of collisions exceed Ea
      // Catalyst ON -> lowers Ea dramatically
      const tempProb = Math.min(
        0.9,
        0.14 * Math.pow(2, (config.temperature - 25) / 15)
      );
      const effectiveProb =
        sc === 'solid_liquid'
          ? tempProb
          : config.hasCatalyst
            ? Math.min(0.92, tempProb * 2.4)
            : Math.min(0.12, tempProb * 0.14);

      const remainingScale =
        sc === 'solid_liquid'
          ? Math.max(0.08, Math.cbrt(Math.max(0, 1 - run.reactedFraction)))
          : 1;

      // Draw CaCO3 / MnO2 blocks
      engine.blocks.forEach((b) => {
        const curW = b.isCatalyst ? b.baseW : b.baseW * remainingScale;
        const curH = b.isCatalyst ? b.baseH : b.baseH * remainingScale;
        const drawX = b.x + (b.baseW - curW) / 2;
        const drawY = b.y + (b.baseH - curH);

        if (b.isCatalyst) {
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(drawX, drawY, curW, curH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.font = '600 8px "IBM Plex Mono", monospace';
          ctx.fillStyle = '#fef3c7';
          ctx.textAlign = 'center';
          ctx.fillText('MnO₂', drawX + curW / 2, drawY + curH / 2 + 3);
        } else if (remainingScale > 0.09) {
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(drawX, drawY, curW, curH, 3);
          ctx.fill();
          ctx.stroke();

          // Crystal lattice dots inside solid
          ctx.fillStyle = '#94a3b8';
          const step = 7;
          for (let lx = drawX + 4; lx < drawX + curW - 3; lx += step) {
            for (let ly = drawY + 4; ly < drawY + curH - 3; ly += step) {
              ctx.fillRect(lx, ly, 2, 2);
            }
          }
        }
      });

      // Update & draw moving reactant particles
      const pRadius = sc === 'solid_liquid' ? 3.2 : 3.8;
      const pColor = sc === 'solid_liquid' ? '#dc2626' : '#0284c7';

      engine.particles.forEach((p) => {
        if (simDt > 0) {
          p.cooldown = Math.max(0, p.cooldown - simDt);

          // Store motion trail
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 5) p.trail.shift();

          const currentMag = Math.hypot(p.vx, p.vy) || 1;
          const targetMag =
            58 * thermalScale * tempVisualBoost * Math.sqrt(p.energyFactor);
          p.vx = (p.vx / currentMag) * targetMag;
          p.vy = (p.vy / currentMag) * targetMag;

          p.x += p.vx * simDt;
          p.y += p.vy * simDt;

          // Wall collisions
          if (p.x < boxX + pRadius) {
            p.x = boxX + pRadius;
            p.vx = Math.abs(p.vx);
          } else if (p.x > boxX + boxW - pRadius) {
            p.x = boxX + boxW - pRadius;
            p.vx = -Math.abs(p.vx);
          }
          if (p.y < boxY + 24 + pRadius) {
            p.y = boxY + 24 + pRadius;
            p.vy = Math.abs(p.vy);
          } else if (p.y > boxY + boxH - pRadius) {
            p.y = boxY + boxH - pRadius;
            p.vy = -Math.abs(p.vy);
          }

          // Check collision with solid blocks (or spontaneous decomposition in Tab 2 without MnO2)
          if (p.cooldown <= 0 && started && running && !run.isComplete) {
            let hitBlock = false;
            let hitX = p.x;
            let hitY = p.y;

            if (engine.blocks.length > 0 && remainingScale > 0.1) {
              for (const b of engine.blocks) {
                const curW = b.isCatalyst ? b.baseW : b.baseW * remainingScale;
                const curH = b.isCatalyst ? b.baseH : b.baseH * remainingScale;
                const bx = b.x + (b.baseW - curW) / 2;
                const by = b.y + (b.baseH - curH);

                if (
                  p.x + pRadius >= bx &&
                  p.x - pRadius <= bx + curW &&
                  p.y + pRadius >= by &&
                  p.y - pRadius <= by + curH
                ) {
                  hitBlock = true;
                  hitX = p.x;
                  hitY = by;
                  p.vy = -Math.abs(p.vy);
                  p.y = by - pRadius - 1;
                  break;
                }
              }
            } else if (sc === 'catalyst' && !config.hasCatalyst) {
              // Uncatalyzed bulk H2O2 rare collisions
              if (Math.random() < 0.015) {
                hitBlock = true;
              }
            }

            if (hitBlock) {
              p.cooldown = 0.22;
              engine.stats.total += 1;
              const isEffective = Math.random() < effectiveProb;

              if (isEffective) {
                engine.stats.effective += 1;
                engine.rings.push({
                  x: hitX,
                  y: hitY,
                  r: 3,
                  maxR: 18,
                  alpha: 1,
                  effective: true,
                });
                engine.products.push({
                  x: hitX,
                  y: hitY - 4,
                  vx: (Math.random() - 0.5) * 18,
                  vy: -36 - Math.random() * 20,
                  alpha: 1,
                  label: sc === 'solid_liquid' ? 'CO₂' : 'O₂',
                });
              } else {
                engine.rings.push({
                  x: hitX,
                  y: hitY,
                  r: 2,
                  maxR: 12,
                  alpha: 0.75,
                  effective: false,
                });
              }
            }
          }
        }

        // Draw velocity trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle =
            sc === 'solid_liquid'
              ? 'rgba(220, 38, 38, 0.25)'
              : 'rgba(2, 132, 199, 0.25)';
          ctx.lineWidth = pRadius * 0.9;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Draw particle dot
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update & draw collision flash rings
      engine.rings = engine.rings.filter((ring) => {
        if (simDt > 0) {
          ring.r += 38 * dt;
          ring.alpha -= 2.2 * dt;
        }
        if (ring.alpha <= 0) return false;

        ctx.strokeStyle = ring.effective
          ? `rgba(16, 185, 129, ${ring.alpha})`
          : `rgba(100, 116, 139, ${ring.alpha * 0.7})`;
        ctx.lineWidth = ring.effective ? 2.2 : 1.3;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();

        if (ring.effective) {
          ctx.fillStyle = `rgba(245, 158, 11, ${ring.alpha * 0.35})`;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        return true;
      });

      // Update & draw detached CO2 / O2 molecules
      engine.products = engine.products.filter((prod) => {
        if (simDt > 0) {
          prod.x += prod.vx * simDt;
          prod.y += prod.vy * simDt;
          if (prod.y < boxY + 26) prod.alpha -= 2.5 * dt;
        }
        if (prod.alpha <= 0 || prod.y < boxY) return false;

        ctx.save();
        ctx.globalAlpha = Math.max(0, prod.alpha);
        // Molecule cluster
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(prod.x, prod.y, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '700 8.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#065f46';
        ctx.textAlign = 'left';
        ctx.fillText(prod.label, prod.x + 6, prod.y + 3);
        ctx.restore();
        return true;
      });

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

      const { compareMode: cmp, configA: cA, configB: cB, runA: rA, runB: rB } =
        propsRef.current;

      if (!cmp) {
        stepAndDrawBox(
          ctx,
          engineARef.current,
          0,
          0,
          w,
          h,
          cA,
          rA,
          dt,
          propsRef.current.scenario === 'solid_liquid'
            ? `Mật độ H⁺: ${cA.concentration.toFixed(1).replace('.', ',')} M`
            : 'Phân tử H₂O₂ & bề mặt xúc tác',
          '#dc2626'
        );
      } else {
        const halfW = w / 2;
        stepAndDrawBox(
          ctx,
          engineARef.current,
          0,
          0,
          halfW - 1,
          h,
          cA,
          rA,
          dt,
          'Vi mô A',
          '#dc2626'
        );
        stepAndDrawBox(
          ctx,
          engineBRef.current,
          halfW + 1,
          0,
          halfW - 1,
          h,
          cB,
          rB,
          dt,
          'Vi mô B',
          '#0284c7'
        );

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(halfW, 0);
        ctx.lineTo(halfW, h);
        ctx.stroke();
      }

      ctx.restore();

      if (now - lastUiSync > 140) {
        lastUiSync = now;
        setStatsDisplay({
          a: { ...engineARef.current.stats },
          b: { ...engineBRef.current.stats },
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  const effRateA =
    statsDisplay.a.total > 0
      ? ((statsDisplay.a.effective / statsDisplay.a.total) * 100).toFixed(0)
      : '0';
  const effRateB =
    statsDisplay.b.total > 0
      ? ((statsDisplay.b.effective / statsDisplay.b.total) * 100).toFixed(0)
      : '0';

  return (
    <section className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full">
      <div className="px-3.5 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-bold text-slate-900 truncate">
            Góc nhìn Vi mô (Mô phỏng Va chạm 2D)
          </h3>
        </div>

        {/* Legend for collision colors */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 shrink-0">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 inline-block" />
            Không hiệu quả
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-amber-300/60 inline-block" />
            Hiệu quả (E ≥ Eₐ)
          </span>
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 min-h-[180px]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Live Collision Counter Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] font-mono tabular-nums shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600">
                {compareMode ? 'Va chạm A:' : 'Tổng va chạm:'}
              </span>
              <strong className="text-slate-900">{statsDisplay.a.total}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-emerald-700">Hiệu quả:</span>
              <strong className="text-emerald-700">
                {statsDisplay.a.effective} ({effRateA}%)
              </strong>
            </div>
          </div>

          {compareMode && (
            <div className="bg-white/90 backdrop-blur-xs border border-sky-200 rounded-md px-2.5 py-1.5 text-[11px] font-mono tabular-nums shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sky-700">Va chạm B:</span>
                <strong className="text-slate-900">{statsDisplay.b.total}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-emerald-700">Hiệu quả:</span>
                <strong className="text-emerald-700">
                  {statsDisplay.b.effective} ({effRateB}%)
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
