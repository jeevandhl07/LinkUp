import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline";
};

type Variant = NonNullable<Props["variant"]>;

export const Button = ({ className, variant = "default", ...props }: Props) => {
  const styles: Record<Variant, string> = {
    default: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90",
    ghost: "bg-transparent hover:bg-border/60",
    outline: "border border-border hover:bg-border/30"
  };

  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50", styles[variant], className)}
      {...props}
    />
  );
};
