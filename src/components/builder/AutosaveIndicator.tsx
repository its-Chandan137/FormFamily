'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, Check, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AutosaveStatus } from '@/store/slices/builderSlice';

function formatSavedText(lastSavedAt: string): string {
  const diffMs = Date.now() - new Date(lastSavedAt).getTime();
  if (diffMs < 60_000) return 'Saved just now';
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `Saved ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Saved ${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `Saved ${days} day${days === 1 ? '' : 's'} ago`;
}

export function AutosaveIndicator({
  status,
  lastSavedAt,
  error,
  onRetry,
  onTriggerDebugError,
}: {
  status: AutosaveStatus;
  lastSavedAt: string | null;
  error: string | null;
  onRetry: () => void;
  onTriggerDebugError?: () => void;
}) {
  const timeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = timeRef.current;
    if (!el) return;
    if (status === 'saved' && lastSavedAt) {
      const update = () => {
        el.textContent = formatSavedText(lastSavedAt);
      };
      update();
      const t = setInterval(update, 30000);
      return () => clearInterval(t);
    }
    if (status === 'saving') el.textContent = 'Saving...';
    else if (status === 'error') el.textContent = error || 'Autosave failed';
    else if (status === 'saved') el.textContent = 'Saved';
    else el.textContent = 'Draft auto-save ready';
  }, [status, lastSavedAt, error]);

  const initialText =
    status === 'saving'
      ? 'Saving...'
      : status === 'error'
        ? error || 'Autosave failed'
        : status === 'saved' && lastSavedAt
          ? 'Saved'
          : status === 'saved'
            ? 'Saved'
            : 'Draft auto-save ready';

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {status === 'saving' ? (
        <Loader2
          className="text-muted-foreground size-3.5 animate-spin"
          aria-hidden
        />
      ) : null}
      {status === 'saved' ? (
        <Check className="size-3.5 text-green-600" aria-hidden />
      ) : null}
      {status === 'error' ? (
        <AlertCircle className="text-destructive size-3.5" aria-hidden />
      ) : null}
      <span
        ref={timeRef}
        className={
          status === 'error' ? 'text-destructive' : 'text-muted-foreground'
        }
        aria-live="polite"
      >
        {initialText}
      </span>
      {status === 'error' ? (
        <Button type="button" size="xs" variant="outline" onClick={onRetry}>
          <RotateCcw className="mr-1 size-3" /> Retry
        </Button>
      ) : null}
      {onTriggerDebugError ? (
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={onTriggerDebugError}
          title="Trigger a simulated autosave failure (debug)"
        >
          Simulate error
        </Button>
      ) : null}
    </div>
  );
}
