import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Kbd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'border-border bg-surface-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded border px-1.5 font-mono text-[11px] font-medium shadow-[inset_0_-1px_0_rgba(16,24,40,0.08)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
