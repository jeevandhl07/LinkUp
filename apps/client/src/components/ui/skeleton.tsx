export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-border/60 ${className || ""}`} />
);