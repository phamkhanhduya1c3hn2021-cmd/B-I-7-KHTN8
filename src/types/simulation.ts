export type ScenarioId = 'solid_liquid' | 'catalyst';

export type SurfaceAreaType = 'chunk' | 'granule' | 'powder';

export type ChartMetricMode = 'volume' | 'percent';

export interface ExperimentConfig {
  concentration: number; // mol/L (0.1 -> 2.0 for HCl; fixed 0.4 for H2O2)
  temperature: number; // °C (10 -> 60)
  surfaceArea: SurfaceAreaType; // chunk (1x), granule (2x), powder (4x)
  hasCatalyst: boolean; // MnO2 0.10 g on/off
}

export interface DataPoint {
  t: number;
  volume: number;
  percent: number;
  rate: number;
}

export interface CollisionStats {
  total: number;
  effective: number;
}

export interface RunState {
  elapsedTime: number;
  volumeGas: number;
  reactedFraction: number;
  instantRate: number;
  tHalf: number | null;
  tComplete: number | null;
  isComplete: boolean;
  history: DataPoint[];
  collisions: CollisionStats;
}

export interface SavedRunRecord {
  id: string;
  label: string;
  scenario: ScenarioId;
  summary: string;
  config: ExperimentConfig;
  tHalf: number | null;
  tComplete: number | null;
  vSimMax: number;
  vTheory: number;
  errorPercent: number;
  avgRate: number;
  catalystMassBefore?: number;
  catalystMassAfter?: number;
  timestamp: string;
}
