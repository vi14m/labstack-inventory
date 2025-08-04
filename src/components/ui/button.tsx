import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md interactive-element",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md interactive-element",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-xs hover:shadow-sm interactive-element",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs hover:shadow-sm interactive-element",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline transition-colors",
        premium: "btn-primary-gradient text-primary-foreground border-0",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm hover:shadow-md interactive-element",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm hover:shadow-md interactive-element",
        info: "bg-info text-info-foreground hover:bg-info/90 shadow-sm hover:shadow-md interactive-element",
      },
      size: {
        xs: "h-8 px-2 text-xs rounded-sm",
        sm: "h-9 px-3 text-sm rounded-md",
        default: "h-10 px-4 py-2",
        lg: "h-11 px-8 text-base rounded-md",
        xl: "h-12 px-10 text-lg rounded-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
