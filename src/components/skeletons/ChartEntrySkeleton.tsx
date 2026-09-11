import { Skeleton } from '@/components/ui/skeleton';

interface ChartEntrySkeletonProps {
  index?: number;
}

export function ChartEntrySkeleton({ index = 0 }: ChartEntrySkeletonProps) {
  const delay = index * 100;

  return (
    <div 
      className="relative flex flex-col gap-3 p-4 border-b border-border overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex items-center gap-3 min-w-[100px]">
          <Skeleton className="w-16 h-12 bg-zinc-800/80 animate-pulse" />
        </div>

        <Skeleton className="w-20 h-20 bg-zinc-800/80 animate-pulse flex-shrink-0" />

        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-6 w-3/4 bg-zinc-800/80 animate-pulse" />
          <Skeleton className="h-4 w-1/2 bg-zinc-800/80 animate-pulse" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Skeleton className="h-5 w-20 bg-zinc-800/80 animate-pulse" />
            <Skeleton className="h-5 w-16 bg-zinc-800/80 animate-pulse" />
            <Skeleton className="h-5 w-24 bg-zinc-800/80 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <Skeleton className="w-4 h-4 bg-zinc-800/80 animate-pulse rounded-full" />
            <Skeleton className="h-3 w-12 bg-zinc-800/80 animate-pulse" />
            <Skeleton className="h-5 w-8 bg-zinc-800/80 animate-pulse" />
          </div>
          
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <Skeleton className="h-3 w-10 bg-zinc-800/80 animate-pulse" />
            <Skeleton className="h-5 w-10 bg-zinc-800/80 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="pl-28">
        <Skeleton className="h-20 w-full bg-zinc-800/80 animate-pulse" />
      </div>
    </div>
  );
}
