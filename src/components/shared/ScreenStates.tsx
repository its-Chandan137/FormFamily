'use client';

import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PageSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function InlineSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn('h-20 w-full rounded-lg', className)}
      aria-busy="true"
    />
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <Card role="alert" className="border-destructive/20">
      <CardContent className="flex flex-col items-start gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-[#FEF3F2] text-[#D92D20] dark:bg-[rgba(249,112,102,0.12)] dark:text-[#F97066]">
            <AlertCircle className="size-4" aria-hidden />
          </span>
          <div>
            <div className="text-foreground text-sm font-medium">{title}</div>
            {message ? (
              <p className="text-muted-foreground mt-1 text-sm">{message}</p>
            ) : null}
          </div>
        </div>
        {onRetry ? (
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden />
            {retryLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      aria-hidden
      className={cn('text-border-strong h-20 w-[120px]', className)}
    >
      <rect
        x="18"
        y="14"
        width="84"
        height="52"
        rx="10"
        className="stroke-current"
        strokeWidth="1.5"
      />
      <path
        d="M34 32h28M34 42h52M34 52h40"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="86"
        cy="24"
        r="10"
        className="fill-surface-muted stroke-current"
        strokeWidth="1.5"
      />
      <path
        d="M82.5 24h7M86 20.5v7"
        className="stroke-subtle"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  illustration,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        {illustration ?? <EmptyIllustration />}
        <div className="space-y-1">
          <div className="text-foreground text-sm font-medium">{title}</div>
          {description ? (
            <p className="text-muted-foreground mx-auto max-w-md text-sm">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="mt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
