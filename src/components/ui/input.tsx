import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'border-input bg-surface text-foreground placeholder:text-subtle selection:bg-primary/20 selection:text-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-2 text-sm shadow-xs transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-0',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-2',
        'dark:bg-surface',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
