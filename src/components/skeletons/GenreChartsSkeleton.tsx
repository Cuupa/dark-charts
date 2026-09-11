import { Skeleton } from '@/components/ui/skeleton';
import { ChartEntrySkeleton } from './ChartEntrySkeleton';

export function GenreChartsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border">
        <div className="p-4 border-b border-border relative z-10">
          <Skeleton className="h-6 w-48 bg-zinc-800/80 animate-pulse" />
        </div>
        <div>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
            <ChartEntrySkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
