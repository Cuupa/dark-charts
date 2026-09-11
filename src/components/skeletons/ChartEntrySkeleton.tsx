export function ChartEntrySkeleton({ index = 0 }: { index?: number }) {
  return <div className="chart-row" aria-hidden="true" style={{ opacity: Math.max(0.35, 1 - index * 0.08) }}><div className="h-6 w-8 bg-muted rounded" /><div /><div className="h-14 w-14 bg-muted rounded" /><div className="space-y-2"><div className="h-4 w-3/4 bg-muted rounded" /><div className="h-3 w-1/2 bg-muted rounded" /></div><div /><div className="h-4 w-8 bg-muted rounded" /><div /></div>;
}
