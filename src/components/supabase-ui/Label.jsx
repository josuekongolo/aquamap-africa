"use client";

import { cn } from "@/lib/utils";

/**
 * Label — faithful to Supabase's shadcn Label.
 * Supabase source: `text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`
 *   -> labelVariants in packages/ui/src/components/shadcn/ui/label.tsx
 * Their classic FormLayout label color is `text-foreground-light` (#525252).
 * ADAPTED: color set to ink (#06303d) so labels read on a light brand surface.
 *
 * text-sm = 14px, font-medium, leading-none. EXACTLY Supabase's label sizing.
 */
export function Label({ className, htmlFor, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-medium leading-none text-[#06303d]",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export default Label;
