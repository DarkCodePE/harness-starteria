import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("bg-background-subtle animate-pulse rounded-ds-sm motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

export { Skeleton };
