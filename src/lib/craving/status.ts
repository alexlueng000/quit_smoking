export type CravingStatus = "started" | "intervening" | "completed" | "abandoned";

const allowedTransitions: Record<CravingStatus, CravingStatus[]> = {
  started: ["intervening", "completed", "abandoned"],
  intervening: ["completed", "abandoned"],
  completed: [],
  abandoned: [],
};

export function canTransitionCraving(from: CravingStatus, to: CravingStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function assertCravingTransition(from: CravingStatus, to: CravingStatus): void {
  if (!canTransitionCraving(from, to)) {
    throw new Error(`Invalid craving status transition: ${from} -> ${to}`);
  }
}
