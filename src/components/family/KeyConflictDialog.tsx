'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface KeyConflictDetail {
  key: string;
  descendantFormId: string;
  descendantName: string;
  childLabel?: string;
  childPosition?: string;
  parentLabel?: string;
}

export function KeyConflictDialog({
  open,
  onOpenChange,
  conflicts,
  onMerge,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: KeyConflictDetail[];
  onMerge: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Key conflicts detected</DialogTitle>
          <DialogDescription>
            A parent field key conflicts with a field a descendant already
            added. Merge replaces the child&apos;s own copy with the inherited
            field (keeping the child&apos;s custom label as an override when
            different). Keeping both is not allowed.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {conflicts.map((c, i) => (
            <div
              key={`${c.descendantFormId}-${c.key}-${i}`}
              className="rounded-md border p-3 text-sm"
            >
              <div className="font-medium">{c.descendantName}</div>
              <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr]">
                <dt className="text-muted-foreground">Conflicting field</dt>
                <dd>
                  <code className="font-mono text-xs">{c.key}</code>
                  {c.childLabel || c.parentLabel ? (
                    <span className="text-muted-foreground">
                      {' '}
                      — child: &quot;{c.childLabel ?? c.key}&quot;
                      {c.parentLabel ? `, parent: "${c.parentLabel}"` : ''}
                    </span>
                  ) : null}
                </dd>
                <dt className="text-muted-foreground">
                  Child&apos;s current position
                </dt>
                <dd>{c.childPosition ?? 'In child form (own field)'}</dd>
                <dt className="text-muted-foreground">Merge will do</dt>
                <dd>
                  Remove the child&apos;s own copy of{' '}
                  <code className="font-mono text-xs">{c.key}</code> and use the
                  inherited field from the parent.
                  {c.childLabel &&
                  c.parentLabel &&
                  c.childLabel !== c.parentLabel
                    ? ` Keep the child’s label "${c.childLabel}" as an override.`
                    : ' Keep any existing child label as an override if different.'}
                </dd>
              </dl>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onMerge}>Merge conflicts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
