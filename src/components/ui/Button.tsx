import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "../../lib/clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none",
        variant === "primary" && "bg-ink text-paper hover:bg-ink-soft",
        variant === "secondary" && "bg-marigold text-ink hover:bg-marigold-dark",
        variant === "ghost" && "bg-transparent text-ink border border-ink/15 hover:bg-ink/5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
