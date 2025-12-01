import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-sm hover:shadow-md active:scale-[0.98] transform",
  {
    variants: {
      variant: {
        default: "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-600/25 hover:text-white active:text-white focus:text-white",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/90 text-white hover:from-destructive/90 hover:to-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 hover:shadow-destructive/25 hover:text-white active:text-white focus:text-white",
        outline:
          "border-2 bg-background text-gray-900 hover:bg-accent hover:text-gray-900 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 hover:border-primary/50 dark:text-white active:text-gray-900 focus:text-gray-900",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/90 text-gray-900 hover:from-secondary/90 hover:to-secondary/80 hover:text-gray-900 active:text-gray-900 focus:text-gray-900 dark:text-white",
        ghost:
          "hover:bg-accent hover:text-gray-900 dark:hover:bg-accent/50 hover:shadow-none text-gray-900 dark:text-white active:text-gray-900 focus:text-gray-900",
        link: "text-orange-600 underline-offset-4 hover:underline shadow-none hover:shadow-none hover:text-orange-700 active:text-orange-600 focus:text-orange-600 dark:text-orange-400",
        message: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/25 font-semibold hover:text-white active:text-white focus:text-white",
        "orange-gradient": "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/25 shadow-lg hover:shadow-xl transition-all duration-300 hover:text-white active:text-white focus:text-white",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-base",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
