import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: { id: string; label: string; description?: string }[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn('flex flex-wrap items-start gap-2', className)}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id} className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                done &&
                  'border-[#039855] bg-[#ECFDF3] text-[#027A48] dark:bg-[rgba(50,213,131,0.12)] dark:text-[#32D583]',
                active && 'border-primary bg-accent text-accent-foreground',
                !done &&
                  !active &&
                  'border-border bg-surface text-muted-foreground',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-sm font-medium',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </span>
            {i < steps.length - 1 ? (
              <span
                aria-hidden
                className="bg-border mx-1 hidden h-px w-6 sm:block"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
