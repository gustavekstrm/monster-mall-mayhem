export type MonsterEffectPick = "CASCADE_MULTIPLIER" | "LOW_TO_WILD" | "REMOVE_RANDOM";

export interface ChaosMeterSnapshot {
  value: number;
  threshold: number;
  monster: MonsterEffectPick | null;
}
