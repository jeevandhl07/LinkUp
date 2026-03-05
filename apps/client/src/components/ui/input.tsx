import { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn("h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm outline-none ring-accent placeholder:text-muted focus:ring-2", className)}
    {...props}
  />
);