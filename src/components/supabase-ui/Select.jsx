"use client";

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "./Label";

/**
 * Select — native <select> styled to match Supabase's SelectTrigger.
 *
 * --- EXACT Supabase values (SelectTrigger, packages/ui/src/components/shadcn/ui/select.tsx) ---
 *   "flex w-full items-center justify-between rounded-md border border-strong hover:border-stronger
 *    bg-alternative hover:bg-selection text-xs data-[placeholder]:text-foreground-lighter
 *    focus:outline-hidden focus:ring-2 focus:ring-background-control focus:ring-offset-2
 *    disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
 *   ChevronDown: h-4 w-4 text-foreground-lighter strokeWidth={1.5}
 *   Resolved light tokens:
 *     border-strong   -> hsl(0 0% 83.1%)  = #d4d4d4
 *     border-stronger -> hsl(0 0% 56.1%)  = #8f8f8f (hover)
 *     bg-alternative  -> near-white        ~= #fdfdfd
 *     foreground-lighter -> hsl(0 0% 43.9%) = #707070 (placeholder)
 *   Size small -> h-[34px], px-3 py-2.  (Supabase trigger text is text-xs; this port
 *   uses text-sm to match the Input for form consistency — flip to text-xs for 1:1.)
 *
 * --- ADAPTED to your brand ---
 *   text color   -> ink #06303d
 *   focus ring   -> teal --brand #0D6B8A
 *
 * Native <select> can't have a separate chevron element, so the built-in arrow is
 * hidden (appearance-none) and Supabase's ChevronDown is overlaid.
 */
const Select = forwardRef(function Select(
  {
    className,
    selectClassName,
    label,
    labelOptional,
    descriptionText,
    error,
    id,
    children,
    ...props
  },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {(label || labelOptional) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && <Label htmlFor={selectId}>{label}</Label>}
          {labelOptional && (
            <span className="text-sm text-[#707070]">{labelOptional}</span>
          )}
        </div>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? "true" : undefined}
          className={cn(
            // shape — Supabase SelectTrigger: rounded-md, border, h-[34px], px-3 py-2
            "flex w-full items-center rounded-md border px-3 py-2 h-[34px] text-sm shadow-xs transition-all duration-200",
            // hide native arrow + leave room for the overlaid chevron
            "appearance-none pr-9 cursor-pointer",
            // colors — border-strong, bg-alternative, ink text
            "bg-[#fdfdfd] border-[#d4d4d4] text-[#06303d] hover:border-[#8f8f8f]",
            // focus — brand teal ring
            "outline-none focus-visible:outline-none",
            "focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20",
            // disabled
            "disabled:cursor-not-allowed disabled:opacity-50",
            // error
            error &&
              "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20",
            selectClassName
          )}
          {...props}
        >
          {children}
        </select>
        {/* Supabase chevron: h-4 w-4 text-foreground-lighter (#707070) strokeWidth 1.5 */}
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707070]"
          strokeWidth={1.5}
        />
      </div>

      {error ? (
        <p className="text-sm leading-normal text-red-600">{error}</p>
      ) : descriptionText ? (
        <p className="text-sm leading-normal text-[#707070]">{descriptionText}</p>
      ) : null}
    </div>
  );
});

export { Select };
export default Select;
