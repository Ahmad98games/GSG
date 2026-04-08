import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const SkeletonShimmer = ({ className }: SkeletonProps) => {
  return (
    <div className={cn(
      "relative overflow-hidden bg-[#14171A] rounded-[2px]",
      "before:absolute before:inset-0 before:-translate-x-full",
      "before:animate-[shimmer_2s_infinite]",
      "before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent",
      className
    )} />
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-end pb-6 border-b border-white/5">
      <div className="space-y-3">
        <SkeletonShimmer className="h-4 w-32" />
        <SkeletonShimmer className="h-3 w-48" />
      </div>
      <SkeletonShimmer className="h-10 w-24" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#18181b] border border-white/5 p-6 rounded-2xl space-y-4">
          <SkeletonShimmer className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <SkeletonShimmer className="h-3 w-20" />
            <SkeletonShimmer className="h-6 w-32" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
