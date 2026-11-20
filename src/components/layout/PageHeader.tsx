import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  tabs,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-foreground text-[24px] leading-8 font-semibold tracking-[-0.01em]">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {tabs ? <div>{tabs}</div> : null}
    </div>
  );
}
