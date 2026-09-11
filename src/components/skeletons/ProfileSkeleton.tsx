import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="bg-card border border-border p-6">
        <div className="flex items-center gap-6 relative z-10">
          <Skeleton className="w-24 h-24 rounded-full bg-zinc-800/80 animate-pulse" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48 bg-zinc-800/80 animate-pulse" />
            <Skeleton className="h-4 w-64 bg-zinc-800/80 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="bg-card border border-border p-6"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="relative z-10 space-y-4">
              <Skeleton className="h-6 w-32 bg-zinc-800/80 animate-pulse" />
              <Skeleton className="h-12 w-full bg-zinc-800/80 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
