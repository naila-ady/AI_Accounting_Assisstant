import { cn } from "@/lib/utils";

const colorMap = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  expense: "bg-rose-100 text-rose-700",
  income: "bg-emerald-100 text-emerald-700",
  manual: "bg-slate-100 text-slate-700",
  ai: "bg-violet-100 text-violet-700",
} as const;

type BadgeColor = keyof typeof colorMap;

export function Badge({ variant, className, children }: { variant?: BadgeColor; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      variant && colorMap[variant],
      className,
    )}>
      {children}
    </span>
  );
}
