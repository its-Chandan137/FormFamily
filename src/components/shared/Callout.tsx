import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const styles = {
  info: {
    wrap: 'border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3] dark:border-[#175CD3]/30 dark:bg-[rgba(83,177,253,0.12)] dark:text-[#53B1FD]',
    icon: Info,
  },
  warning: {
    wrap: 'border-[#FEDF89] bg-[#FFFAEB] text-[#B54708] dark:border-[#B54708]/30 dark:bg-[rgba(253,176,34,0.12)] dark:text-[#FDB022]',
    icon: AlertTriangle,
  },
  danger: {
    wrap: 'border-[#FECDCA] bg-[#FEF3F2] text-[#B42318] dark:border-[#B42318]/30 dark:bg-[rgba(249,112,102,0.12)] dark:text-[#F97066]',
    icon: AlertCircle,
  },
} as const;

export function Callout({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: keyof typeof styles;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const cfg = styles[variant];
  const Icon = cfg.icon;
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-lg border p-3 text-sm',
        cfg.wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        {title ? <div className="font-medium">{title}</div> : null}
        {children ? <div className="text-current/90">{children}</div> : null}
      </div>
    </div>
  );
}
