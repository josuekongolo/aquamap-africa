"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button — faithful port of Supabase's Button (packages/ui/src/components/Button/Button.tsx).
 *
 * --- EXACT Supabase base (from their cva) ---
 *   relative inline-flex items-center justify-center cursor-pointer space-x-2 text-center
 *   font-regular ease-out duration-200 rounded-md outline-none transition-all border
 *   focus-visible:outline-4 focus-visible:outline-offset-1
 *
 * --- EXACT Supabase 'primary' variant ---
 *   bg-brand-400 hover:bg-brand/80 text-foreground
 *   border-brand-500/75 hover:border-brand-600
 *   focus-visible:outline-brand-600
 *   Resolved light tokens:
 *     brand-400 = hsl(151.3 66.9% 66.9%) = #7EDCB0
 *     brand-500 = hsl(155.3 78.4% 40%)   = #16B673
 *     brand-600 = hsl(156.5 86.5% 26.1%) = #098852
 *     brand-default ("brand") = hsl(152.9 60% 52.9%) = #3ECF8E
 *
 * --- EXACT Supabase 'default' (secondary) variant ---
 *   text-foreground bg-alternative hover:bg-selection
 *   border-strong hover:border-stronger focus-visible:outline-border-strong
 *   Resolved: bg-alternative ~= #fdfdfd, border-strong #d4d4d4, border-stronger #8f8f8f
 *
 * Sizing (Supabase SIZE_VARIANTS, default size = 'small'):
 *   small  -> text-sm px-3 py-2 h-[34px]
 *   tiny   -> text-xs px-2.5 py-1 h-[26px]
 *   medium -> text-sm px-4 py-2 h-[38px]
 *   large  -> text-base px-4 py-2 h-[42px]
 *
 * --- ADAPTED to your brand (per request) ---
 *   PRIMARY green: Supabase's brand-400 fill is swapped for your --brand-2 #00A878,
 *   with a darker hover (#008f66) and matching border, and WHITE text (your green is
 *   dark enough that Supabase's dark `text-foreground` would not read on it).
 *   FOCUS ring: teal --brand #0D6B8A (replaces brand-600 outline).
 *   Default variant kept on Supabase's neutral light tokens with ink text.
 */
const buttonVariants = cva(
  cn(
    "relative inline-flex items-center justify-center cursor-pointer gap-2 text-center font-medium",
    "ease-out duration-200 rounded-md border transition-all",
    "outline-none focus-visible:outline-none",
    // Supabase focuses with an outline; we use a brand-teal ring (light theme friendly)
    "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0D6B8A]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
  ),
  {
    variants: {
      variant: {
        // ADAPTED: brand green = --brand-2 #00A878 (Supabase primary uses brand-400)
        primary:
          "bg-[#0D6B8A] text-white border-[#0b5d78] hover:bg-[#0b5d78] hover:border-[#094a60]",
        // Supabase 'default' tokens, light: bg-alternative / border-strong / ink text
        default:
          "bg-[#fdfdfd] text-[#06303d] border-[#d4d4d4] hover:bg-[#f3f3f3] hover:border-[#8f8f8f]",
      },
      size: {
        tiny: "text-xs px-2.5 py-1 h-[26px]",
        small: "text-sm px-3 py-2 h-[34px]",
        medium: "text-sm px-4 py-2 h-[38px]",
        large: "text-base px-4 py-2 h-[42px]",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "small",
    },
  }
);

const Button = forwardRef(function Button(
  {
    className,
    variant = "primary",
    size = "small",
    block,
    loading = false,
    icon,
    iconRight,
    type = "button",
    disabled,
    children,
    ...props
  },
  ref
) {
  const isDisabled = loading || disabled;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="inline-flex items-center justify-center shrink-0 [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
      ) : null}
      {children && <span className="truncate">{children}</span>}
      {iconRight && !loading && (
        <span className="inline-flex items-center justify-center shrink-0 [&_svg]:h-4 [&_svg]:w-4">
          {iconRight}
        </span>
      )}
    </button>
  );
});

export { Button, buttonVariants };
export default Button;
