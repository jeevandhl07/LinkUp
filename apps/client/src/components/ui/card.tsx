import { ReactNode } from "react";
import { cn } from "../../lib/cn";

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("rounded-xl border border-border bg-panel", className)}>{children}</div>
);