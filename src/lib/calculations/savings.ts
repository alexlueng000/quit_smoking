export function calculateDailySmokingCost(
  cigarettesPerDay: number,
  cigarettePackPrice: number | null,
  cigarettesPerPack: number,
): number {
  if (!cigarettePackPrice || cigarettesPerPack <= 0) return 0;
  return (cigarettesPerDay / cigarettesPerPack) * cigarettePackPrice;
}

export function calculateEstimatedSavings(
  quitDate: Date | null,
  now: Date,
  cigarettesPerDay: number,
  cigarettePackPrice: number | null,
  cigarettesPerPack: number,
): number {
  if (!quitDate || quitDate > now) return 0;
  const elapsedDays = Math.max(
    0,
    Math.floor((now.getTime() - quitDate.getTime()) / (24 * 60 * 60 * 1000)),
  );
  return elapsedDays * calculateDailySmokingCost(
    cigarettesPerDay,
    cigarettePackPrice,
    cigarettesPerPack,
  );
}
