import { Skeleton } from '@/components/ui/skeleton';

interface ChartCategorySkeletonProps {
  title: string;
}

export function ChartCategorySkeleton({ title }: ChartCategorySkeletonProps) {
  return (
    <div className="bg-card border border-border relative">
      <div className="p-4 border-b border-border relative z-10">
        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">
          {title}
        </h2>
      </div>
      <div className="relative z-10 space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="relative flex items-center gap-3 p-3 border border-border"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            
            <div className="flex items-center gap-2 min-w-[60px] relative z-10">
              <Skeleton className="w-12 h-10 bg-zinc-800/80 animate-pulse" />
            </div>

            <Skeleton className="w-20 h-20 bg-zinc-800/80 animate-pulse flex-shrink-0" />

            <div className="flex-1 min-w-0 space-y-2 relative z-10">
              <Skeleton className="h-5 w-3/4 bg-zinc-800/80 animate-pulse" />
              <Skeleton className="h-4 w-1/2 bg-zinc-800/80 animate-pulse" />
              <div className="flex flex-wrap gap-1 mt-2">
                <Skeleton className="h-4 w-16 bg-zinc-800/80 animate-pulse" />
                <Skeleton className="h-4 w-12 bg-zinc-800/80 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                <Skeleton className="w-3 h-3 bg-zinc-800/80 animate-pulse rounded-full" />
                <Skeleton className="h-3 w-4 bg-zinc-800/80 animate-pulse" />
                <Skeleton className="h-4 w-6 bg-zinc-800/80 animate-pulse" />
              </div>
              
              <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                <Skeleton className="h-3 w-10 bg-zinc-800/80 animate-pulse" />
                <Skeleton className="h-4 w-8 bg-zinc-800/80 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
