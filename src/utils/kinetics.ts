import {
  ExperimentConfig,
  RunState,
  ScenarioId,
  SurfaceAreaType,
} from '../types/simulation';

// Standard conditions in KHTN 8 (25°C, 1 bar): V_mol = 24.79 L/mol
// Fixed stoichiometry:
// - Tab 1: 1.0 g CaCO3 (0.01 mol) + 50 mL HCl (excess) -> 0.01 mol CO2 -> 247.9 mL
// - Tab 2: 50 mL H2O2 0.4 M (0.02 mol) -> 0.01 mol O2 -> 247.9 mL
export const MOLAR_VOLUME_L = 24.79;
export const MOLES_GAS_THEORY = 0.01;
export const THEORETICAL_GAS_VOLUME_ML = 247.9; // 0.01 * 24.79 * 1000
export const FIXED_CACO3_MASS_G = 1.0;
export const FIXED_SOLUTION_VOL_ML = 50;
export const CATALYST_MASS_G = 0.1;

export const SURFACE_AREA_META: Record<
  SurfaceAreaType,
  { label: string; detail: string; factor: number; particleCountLabel: string }
> = {
  chunk: {
    label: 'Khối viên lớn',
    detail: '1 viên · Diện tích ×1',
    factor: 1,
    particleCountLabel: '1 viên',
  },
  granule: {
    label: 'Hạt đập nhỏ',
    detail: '8 hạt vừa · Diện tích ×2',
    factor: 2,
    particleCountLabel: '8 hạt vừa',
  },
  powder: {
    label: 'Bột mịn',
    detail: '64 hạt nhỏ · Diện tích ×4',
    factor: 4,
    particleCountLabel: '64 hạt nhỏ',
  },
};

export const DEFAULT_CONFIG_SOLID: ExperimentConfig = {
  concentration: 1.0,
  temperature: 25,
  surfaceArea: 'chunk',
  hasCatalyst: false,
};

export const DEFAULT_CONFIG_CATALYST: ExperimentConfig = {
  concentration: 0.4,
  temperature: 25,
  surfaceArea: 'powder',
  hasCatalyst: true,
};

export const COMPARE_PRESET_SOLID: { a: ExperimentConfig; b: ExperimentConfig } = {
  a: {
    concentration: 1.0,
    temperature: 45,
    surfaceArea: 'powder',
    hasCatalyst: false,
  },
  b: {
    concentration: 0.1,
    temperature: 15,
    surfaceArea: 'chunk',
    hasCatalyst: false,
  },
};

export const COMPARE_PRESET_CATALYST: { a: ExperimentConfig; b: ExperimentConfig } = {
  a: {
    concentration: 0.4,
    temperature: 25,
    surfaceArea: 'powder',
    hasCatalyst: true,
  },
  b: {
    concentration: 0.4,
    temperature: 25,
    surfaceArea: 'powder',
    hasCatalyst: false,
  },
};

/**
 * Computes effective shrinking-core rate constant k_eff (s^-1).
 *
 * Model: d(alpha)/dt = k_eff * (1 - alpha)^(2/3)
 * Analytical solution:
 *   t_complete = 3 / k_eff
 *   alpha(t) = 1 - (1 - k_eff * t / 3)^3  for t < t_complete, else 1
 *   t_1/2 = t_complete * (1 - 0.5^(1/3)) ≈ 0.2063 * t_complete
 *
 * Properties:
 * - Exact finite completion time t_complete
 * - Exact Van't Hoff rule: +10°C -> 2x rate, 0.5x reaction time
 * - Linear scaling with [HCl] and surface area factor (1x, 2x, 4x)
 * - In Tab 2, MnO2 lowers activation barrier -> 20x faster rate
 */
export function computeRateConstant(
  scenario: ScenarioId,
  config: ExperimentConfig
): number {
  const vantHoffTempFactor = Math.pow(2, (config.temperature - 25) / 10);

  if (scenario === 'solid_liquid') {
    // Baseline at 1.0 M, 25°C, chunk (1x): t_complete = 24.0 s -> k0 = 3 / 24 = 0.125 s^-1
    const k0 = 0.125;
    const concFactor = config.concentration / 1.0;
    const surfaceFactor = SURFACE_AREA_META[config.surfaceArea].factor;
    return k0 * concFactor * vantHoffTempFactor * surfaceFactor;
  } else {
    // Catalyst scenario: H2O2 0.4 M
    // With MnO2 at 25°C: t_complete = 8.0 s -> k_cat = 3 / 8 = 0.375 s^-1
    // Without MnO2 at 25°C: t_complete = 160.0 s -> k_uncat = 3 / 160 = 0.01875 s^-1 (20x slower)
    const kBase = config.hasCatalyst ? 0.375 : 0.01875;
    return kBase * vantHoffTempFactor;
  }
}

export function getTheoreticalTimes(
  scenario: ScenarioId,
  config: ExperimentConfig
): { tHalf: number; tComplete: number; avgRate: number } {
  const k = computeRateConstant(scenario, config);
  const tComplete = 3 / k;
  const tHalf = tComplete * (1 - Math.pow(0.5, 1 / 3));
  const avgRate = THEORETICAL_GAS_VOLUME_ML / tComplete;
  return { tHalf, tComplete, avgRate };
}

// Deterministic tiny measurement tolerance (< 0.12%) so validation displays realistic <0.5% agreement
export function getSimulatedFinalVolume(config: ExperimentConfig): number {
  const seed =
    Math.round(config.concentration * 10) * 7 +
    Math.round(config.temperature) * 3 +
    (config.hasCatalyst ? 11 : 5);
  const offset = ((seed % 7) - 3) * 0.04; // between -0.12 and +0.12 mL (< 0.05% error)
  return Number((THEORETICAL_GAS_VOLUME_ML + offset).toFixed(2));
}

export function evaluateReactionAtTime(
  scenario: ScenarioId,
  config: ExperimentConfig,
  t: number
): {
  alpha: number;
  volume: number;
  instantRate: number;
  isComplete: boolean;
} {
  const k = computeRateConstant(scenario, config);
  const tComplete = 3 / k;
  const finalVol = getSimulatedFinalVolume(config);

  if (t <= 0) {
    return {
      alpha: 0,
      volume: 0,
      instantRate: k * finalVol,
      isComplete: false,
    };
  }

  if (t >= tComplete) {
    return {
      alpha: 1,
      volume: finalVol,
      instantRate: 0,
      isComplete: true,
    };
  }

  const remainingCubeRoot = 1 - (k * t) / 3;
  const alpha = 1 - Math.pow(remainingCubeRoot, 3);
  const dAlphaDt = k * Math.pow(remainingCubeRoot, 2);
  const volume = alpha * finalVol;
  const instantRate = dAlphaDt * finalVol;

  return {
    alpha,
    volume,
    instantRate,
    isComplete: false,
  };
}

export function createInitialRunState(): RunState {
  return {
    elapsedTime: 0,
    volumeGas: 0,
    reactedFraction: 0,
    instantRate: 0,
    tHalf: null,
    tComplete: null,
    isComplete: false,
    history: [{ t: 0, volume: 0, percent: 0, rate: 0 }],
    collisions: { total: 0, effective: 0 },
  };
}

export function formatConfigSummary(
  scenario: ScenarioId,
  config: ExperimentConfig
): string {
  if (scenario === 'solid_liquid') {
    const surfaceLabel = SURFACE_AREA_META[config.surfaceArea].label;
    return `${config.concentration.toFixed(1).replace('.', ',')} M · ${config.temperature}°C · ${surfaceLabel}`;
  }
  const catLabel = config.hasCatalyst ? 'Có MnO₂ (0,10 g)' : 'Không MnO₂';
  return `${catLabel} · ${config.temperature}°C`;
}

export function formatViNumber(val: number, decimals = 1): string {
  return val.toFixed(decimals).replace('.', ',');
}
