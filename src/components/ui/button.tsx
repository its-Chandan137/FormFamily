import * as React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-[120ms] ease-[cubic-bezier(0.16,1,0.3,1)] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-[#4338CA] dark:hover:bg-[#5558E3]',
        secondary:
          'border-border bg-surface text-foreground shadow-xs hover:bg-surface-muted',
        outline:
          'border-border bg-surface text-foreground shadow-xs hover:bg-surface-muted',
        ghost:
          'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-[#B42318] dark:hover:bg-[#F97066]/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3.5',
        sm: 'h-8 px-3 text-[13px]',
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-11 px-4 text-sm',
        icon: 'size-8 p-0',
        'icon-xs':
          "size-7 rounded-md p-0 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-8 rounded-md p-0',
        'icon-lg': 'size-10 rounded-md p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    loading?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'default',
    size = 'default',
    loading,
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </ButtonPrimitive>
  );
});

export { Button, buttonVariants };
