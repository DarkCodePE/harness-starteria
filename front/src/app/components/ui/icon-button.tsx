import * as React from "react";

import { Button } from "./button";
import { cn } from "./utils";

type ButtonProps = React.ComponentProps<typeof Button>;

type IconButtonProps = Omit<ButtonProps, "children" | "size" | "aria-label"> & {
  "aria-label": string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const iconButtonSizeClass: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "size-8",
  md: "size-9",
  lg: "size-10",
};

function IconButton({
  className,
  size = "md",
  variant = "ghost",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      data-slot="icon-button"
      variant={variant}
      size="icon"
      className={cn(iconButtonSizeClass[size], className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export { IconButton };
