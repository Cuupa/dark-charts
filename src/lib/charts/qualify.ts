export function qualifiesForChartPlacement(score: number): boolean {
  return Number.isFinite(score) && score > 0;
}

export function rankQualifiedItems<T>(
  items: readonly T[],
  scoreOf: (item: T) => number
): Array<{ item: T; placement: number; score: number }> {
  return items
    .filter((item) => qualifiesForChartPlacement(scoreOf(item)))
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .map((item, index) => ({
      item,
      placement: index + 1,
      score: scoreOf(item),
    }));
}
