import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "maple" | "jade" | "gold" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          default: "bg-bg border border-text/10 text-text-muted",
          maple: "bg-accent-maple/10 text-accent-maple",
          jade: "bg-accent-jade/10 text-accent-jade",
          gold: "bg-accent-gold/10 text-accent-gold",
          muted: "bg-bg-card text-text-caption",
        }[variant],
        className
      )}
      {...props}
    />
  );
}
