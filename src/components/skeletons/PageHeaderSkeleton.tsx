import { Skeleton } from "@/components/ui/skeleton";

interface PageHeaderSkeletonProps {
  titleWidth?: string;
  descriptionWidth?: string;
}

export function PageHeaderSkeleton({ 
  titleWidth = "w-48", 
  descriptionWidth = "w-72" 
}: PageHeaderSkeletonProps) {
  return (
    <div className="mb-8">
      <Skeleton className={`h-9 ${titleWidth} mb-2`} />
      <Skeleton className={`h-5 ${descriptionWidth}`} />
    </div>
  );
}
