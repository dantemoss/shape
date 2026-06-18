import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: [
          "bg-foreground text-background",
          "shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_0_0_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12)]",
          "hover:shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_0_0_1px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.22),0_2px_4px_rgba(0,0,0,0.14)]",
          "hover:-translate-y-px",
          "active:translate-y-0 active:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]",
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-lg before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        ],
        outline:
          "border-border bg-background shadow-sm hover:bg-muted hover:text-foreground hover:-translate-y-px hover:shadow-md active:translate-y-0 aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_8%)] hover:-translate-y-px hover:shadow-md active:translate-y-0",
        ghost:
          "hover:bg-muted hover:text-foreground active:bg-muted/70 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: [
          "bg-expense text-expense-foreground",
          "shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_2px_4px_rgba(0,0,0,0.15)]",
          "hover:opacity-90 hover:-translate-y-px hover:shadow-md",
          "active:translate-y-0",
        ],
        income: [
          "bg-income text-income-foreground",
          "shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_2px_4px_rgba(0,0,0,0.15)]",
          "hover:opacity-90 hover:-translate-y-px hover:shadow-md",
          "active:translate-y-0",
        ],
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 text-base",
        icon: "size-9",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
