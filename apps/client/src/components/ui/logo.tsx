import { useId } from "react";
import { cn } from "../../lib/cn";

type LogoProps = {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
};

export const LinkUpLogo = ({ className, iconClassName, showText = true }: LogoProps) => {
  const gradId = useId();

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className={cn("relative h-9 w-9", iconClassName)}>
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#13d4d4" />
              <stop offset="100%" stopColor="#1f5fcb" />
            </linearGradient>
          </defs>

          <path
            d="M28.5 14a14.5 14.5 0 1 0 0 29h8.2l5.6-5.6a2.6 2.6 0 1 0-3.7-3.7l-4.1 4.1h-6a9.3 9.3 0 1 1 0-18.6h6l4.1 4.1a2.6 2.6 0 1 0 3.7-3.7L36.7 14h-8.2Z"
            fill={`url(#${gradId})`}
          />
          <path
            d="M35.5 50a14.5 14.5 0 1 0 0-29h-8.2l-5.6 5.6a2.6 2.6 0 1 0 3.7 3.7l4.1-4.1h6a9.3 9.3 0 1 1 0 18.6h-6l-4.1-4.1a2.6 2.6 0 0 0-3.7 3.7l5.6 5.6h8.2Z"
            fill="#19396f"
          />
          <path
            d="M49 14.4h7.2c1.5 0 2.8 1.2 2.8 2.8v8l4-2.2v12l-4-2.2v1c0 1.5-1.2 2.8-2.8 2.8H49v-2.8h6.5V17.2H49v-2.8Z"
            fill="#20c6c4"
            opacity="0.92"
          />
        </svg>
      </div>

      {showText ? (
        <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          LinkUp
        </span>
      ) : null}
    </div>
  );
};
