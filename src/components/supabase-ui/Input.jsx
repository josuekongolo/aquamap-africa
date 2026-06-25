"use client";

import { forwardRef, useId } from "react";

import { cn } from "@/lib/utils";
import { Label } from "./Label";

/**
 * Input — faithful port of Supabase's components, combining their two patterns:
 *   1) The shadcn InputVariants (packages/ui/src/components/shadcn/ui/input.tsx)
 *   2) The classic FormLayout (label above, error/description below)
 *
 * --- EXACT Supabase values (from source) ---
 * Shape (shadcn input, size="small" default):
 *   rounded-md (6px), border, px-3 py-2, h-[34px] (small), text-sm (14px),
 *   shadow-xs, transition-all.
 * Their token classes & resolved light-theme values:
 *   bg-foreground/[.026]      -> near-white tint on white  ~= #fbfbfb
 *   border-control            -> gray-light-800  hsl(0 0% 78%)  = #c7c7c7
 *   placeholder:text-foreground-muted -> hsl(0 0% 69.8%) = #b2b2b2
 *   focus: ring-2 ring-offset-2 + border (their focus uses a ring against
 *          ring-offset-background, classic theme adds focus-visible:border-foreground-muted)
 *   aria-invalid: bg-destructive-200 / border-destructive-400, focus border-destructive
 *   disabled: cursor-not-allowed, text-foreground-muted, opacity-50
 *
 * --- ADAPTED to your brand ---
 *   text color foreground       -> ink #06303d
 *   focus ring + focus border    -> teal --brand #0D6B8A (their brand accent role)
 *   error red kept close to their destructive (#dc4f3c-ish) using Tailwind red-500/600.
 */
const Input = forwardRef(function Input(
  {
    className,
    inputClassName,
    label,
    labelOptional,
    descriptionText,
    error,
    id,
    type = "text",
    ...props
  },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {(label || labelOptional) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && <Label htmlFor={inputId}>{label}</Label>}
          {labelOptional && (
            <span className="text-sm text-[#707070]">{labelOptional}</span>
          )}
        </div>
      )}

      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={error ? "true" : undefined}
        className={cn(
          // shape + base — Supabase shadcn input (small): rounded-md=6px, h-[34px]
          "block box-border w-full rounded-md border px-3 py-2 h-[34px] text-sm shadow-xs transition-all",
          // colors (light, ink text, near-white control bg, Supabase border-control)
          "bg-[#fbfbfb] border-[#c7c7c7] text-[#06303d]",
          "placeholder:text-[#b2b2b2]",
          // focus — subtle border + brand ring (Supabase uses ring-2 ring-offset-2)
          "outline-none focus-visible:outline-none",
          "focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20 focus-visible:ring-offset-0 focus-visible:shadow-md",
          // disabled — Supabase: cursor-not-allowed + muted text + opacity
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:text-[#b2b2b2]",
          // error / aria-invalid — Supabase: destructive bg + border, focus destructive border
          error &&
            "bg-red-50 border-red-400 placeholder:text-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20",
          inputClassName
        )}
        {...props}
      />

      {error ? (
        <p className="text-sm leading-normal text-red-600">{error}</p>
      ) : descriptionText ? (
        <p className="text-sm leading-normal text-[#707070]">{descriptionText}</p>
      ) : null}
    </div>
  );
});

export { Input };
export default Input;
