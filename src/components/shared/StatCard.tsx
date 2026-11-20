import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon,
  trend,
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <Card
      className={cn(
        'hover:border-border-strong flex-row items-start justify-between gap-4 transition-colors',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="text-muted-foreground text-[13px] font-medium">
          {label}
        </div>
        <div className="text-foreground text-[24px] leading-8 font-semibold tracking-[-0.01em] tabular-nums">
          {value}
        </div>
        {trend ? <div className="pt-1">{trend}</div> : null}
      </div>
      {icon ? (
        <div className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </div>
      ) : null}
    </Card>
  );

  if (href) {
    return (
      <a
        href={href}
        className="focus-visible:ring-ring block rounded-xl outline-none focus-visible:ring-2"
      >
        {content}
      </a>
    );
  }
  return content;
}
