"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/__shadcn__/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent p-px transition-all outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        "data-[size=default]:h-5 data-[size=default]:w-8",
        "data-[size=sm]:h-4 data-[size=sm]:w-6",
        "data-[size=default]:[--thumb-x:12px] data-[size=sm]:[--thumb-x:8px]",
        "data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background transition-transform",
          "group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3",
          "group-data-checked/switch:translate-x-[calc(var(--thumb-x)-1px)]",
          "group-data-unchecked/switch:translate-x-0",
          "dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
