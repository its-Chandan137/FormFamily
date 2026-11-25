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
import { AlertTriangle } from 'lucide-react';

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
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden />
            Resolve key conflicts before publishing
          </DialogTitle>
          <DialogDescription>
            Some child forms already have their own field with the same key as a
            field you are publishing from this parent form. The same key cannot
            exist as both an inherited parent field and a child&apos;s own
            field.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="bg-muted/20 rounded-lg border p-3 text-sm">
            <div className="font-medium">How to read this</div>
            <ul className="text-muted-foreground mt-2 space-y-1">
              <li>
                • <span className="text-foreground">Conflict:</span> parent
                publishes a field key that a child form already created on its
                own.
              </li>
              <li>
                • <span className="text-foreground">Why blocked:</span> field
                keys must be unique in the resolved form; keeping both would
                create ambiguity.
              </li>
              <li>
                • <span className="text-foreground">Merge conflicts:</span>{' '}
                removes the child&apos;s own duplicate field and uses the
                parent&apos;s inherited field. Child label is kept as an
                override if it was customized.
              </li>
              <li>
                • <span className="text-foreground">Cancel publish:</span>{' '}
                nothing is published and no conflict merge is applied.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            {conflicts.map((c, i) => (
              <div
                key={`${c.descendantFormId}-${c.key}-${i}`}
                className="rounded-md border p-3 text-sm"
              >
                <div className="font-medium">{c.descendantName}</div>
                <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[170px_1fr]">
                  <dt className="text-muted-foreground">1. Conflicting key</dt>
                  <dd>
                    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                      {c.key}
                    </code>
                  </dd>

                  <dt className="text-muted-foreground">2. Child field</dt>
                  <dd>
                    {c.childLabel ? `"${c.childLabel}"` : 'Child-owned field'}{' '}
                    <span className="text-muted-foreground">
                      ({c.childPosition ?? 'In child form (own field)'})
                    </span>
                  </dd>

                  <dt className="text-muted-foreground">3. Parent field</dt>
                  <dd>
                    {c.parentLabel
                      ? `"${c.parentLabel}"`
                      : 'Parent field being published'}
                  </dd>

                  <dt className="text-muted-foreground">4. If you merge</dt>
                  <dd>
                    Remove the child&apos;s own{' '}
                    <code className="font-mono text-xs">{c.key}</code> field and
                    inherit the parent field.
                    {c.childLabel &&
                    c.parentLabel &&
                    c.childLabel !== c.parentLabel
                      ? ` Keep child label "${c.childLabel}" as a label override.`
                      : ' Keep child label override only if it differs.'}
                  </dd>
                </dl>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel publish
          </Button>
          <Button onClick={onMerge}>Merge conflicts and continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
