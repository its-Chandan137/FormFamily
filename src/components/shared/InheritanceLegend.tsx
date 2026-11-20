import { Link2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InheritanceLegend({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-2 text-sm', className)}>
      <div className="flex items-center gap-2">
        <span className="border-border bg-surface inline-block size-3 rounded border" />
        <span className="text-foreground">Own item</span>
        <span className="text-muted-foreground">defined in this form</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 items-center gap-1 rounded border-l-[3px] border-l-[var(--inherit)] bg-[var(--inherit-muted)] px-2 text-[var(--inherit)]">
          <Link2 className="size-3" aria-hidden /> Inherited
        </span>
        <span className="text-muted-foreground">
          from parent, tag shows source
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 items-center gap-1 rounded-full bg-[#FFFAEB] px-2 text-xs font-medium text-[#B54708] dark:bg-[rgba(253,176,34,0.12)] dark:text-[#FDB022]">
          <Lock className="size-3" aria-hidden /> Locked
        </span>
        <span className="text-muted-foreground">
          controls disabled by parent
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-accent text-accent-foreground inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium">
          <span className="bg-primary size-1.5 rounded-full" /> Overridden
        </span>
        <span className="text-muted-foreground">
          changed here, can reset to inherited
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="border-border text-muted-foreground inline-flex h-5 items-center rounded border border-dashed px-2 text-xs opacity-70">
          Hidden
        </span>
        <span className="text-muted-foreground">
          collapsed row with Unhide action
        </span>
      </div>
    </div>
  );
}
