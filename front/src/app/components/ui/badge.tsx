import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-ds-sm border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-focus-ring focus-visible:ring-focus-ring/30 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary text-text-inverse [a&]:hover:bg-brand-primary-hover",
        secondary:
          "border-transparent bg-brand-primary-subtle text-brand-primary [a&]:hover:bg-surface-selected",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border-default text-text-secondary [a&]:hover:bg-background-subtle [a&]:hover:text-text-primary",
        neutral:
          "border-border-default bg-background-subtle text-text-secondary",
        info:
          "border-[var(--status-feedback-info-border)] bg-[var(--status-feedback-info-surface)] text-[var(--status-feedback-info-text)]",
        success:
          "border-[var(--status-feedback-success-border)] bg-[var(--status-feedback-success-surface)] text-[var(--status-feedback-success-text)]",
        warning:
          "border-[var(--status-feedback-warning-border)] bg-[var(--status-feedback-warning-surface)] text-[var(--status-feedback-warning-text)]",
        danger:
          "border-[var(--status-feedback-danger-border)] bg-[var(--status-feedback-danger-surface)] text-[var(--status-feedback-danger-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
