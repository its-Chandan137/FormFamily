'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DescribedChange } from '@/lib/forms';

export interface ImpactFormChange {
  formId: string;
  formName: string;
  changes: DescribedChange[];
  hasKeyConflict?: boolean;
}

function formatChange(change: DescribedChange): string {
  const label = change.label ?? change.key;
  switch (change.kind) {
    case 'added':
      return `Field added: ${label}`;
    case 'removed':
      return `Field removed: ${label}`;
    case 'relabelled':
      return `Relabelled: ${label} (${String(change.before ?? '')} → ${String(change.after ?? '')})`;
    case 'made-required':
      return `Made required: ${label}`;
    case 'made-optional':
      return `Made optional: ${label}`;
    case 'hidden':
      return `Hidden: ${label}`;
    case 'shown':
      return `Shown: ${label}`;
    case 'placeholder-changed':
      return `Placeholder changed: ${label}`;
    case 'help-text-changed':
      return `Help text changed: ${label}`;
    case 'type-changed':
      return `Type changed: ${label}`;
    case 'options-changed':
      return `Options changed: ${label}`;
    case 'validation-changed':
      return `Validation changed: ${label}`;
    case 'moved':
      return `Moved: ${label}`;
    default:
      return `Changed: ${label}`;
  }
}

export function ImpactPreviewDialog({
  open,
  onOpenChange,
  items,
  onContinue,
  onCancel,
  propagateToDescendants = false,
  onPropagateChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ImpactFormChange[];
  onContinue: () => void;
  onCancel: () => void;
  propagateToDescendants?: boolean;
  onPropagateChange?: (value: boolean) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review publish impact</DialogTitle>
          <DialogDescription>
            Publishing this parent form can affect inheriting child forms.
            Review the changes and choose how they should be applied.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="bg-muted/20 rounded-lg border p-3 text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Info className="size-4" aria-hidden />
              What is happening
            </div>
            <ul className="text-muted-foreground space-y-1">
              <li>
                • <span className="text-foreground">Affected forms:</span>{' '}
                {items.length} inheriting form{items.length === 1 ? '' : 's'}{' '}
                may be impacted by this publish.
              </li>
              <li>
                • <span className="text-foreground">Impact preview:</span> each
                item below shows the resolved changes detected for that child
                form.
              </li>
              <li>
                • <span className="text-foreground">Key conflict:</span> a child
                already has its own field with the same key the parent is
                publishing.
              </li>
            </ul>
          </div>

          {onPropagateChange ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="text-sm font-medium">Apply changes to</div>
              <div className="space-y-2">
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm',
                    !propagateToDescendants && 'border-primary bg-primary/5',
                  )}
                >
                  <input
                    type="radio"
                    name="propagate"
                    className="mt-1"
                    checked={!propagateToDescendants}
                    onChange={() => onPropagateChange(false)}
                  />
                  <div>
                    <div className="font-medium">This parent form only</div>
                    <div className="text-muted-foreground">
                      Existing inheriting forms keep their current pinned parent
                      version. New child forms created later will use the
                      updated parent.
                    </div>
                  </div>
                </label>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm',
                    propagateToDescendants && 'border-primary bg-primary/5',
                  )}
                >
                  <input
                    type="radio"
                    name="propagate"
                    className="mt-1"
                    checked={propagateToDescendants}
                    onChange={() => onPropagateChange(true)}
                  />
                  <div>
                    <div className="font-medium">All inheriting forms</div>
                    <div className="text-muted-foreground">
                      Existing inheriting forms will be updated to use this
                      newly published parent version, so they receive the parent
                      changes.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {items.map((item) => {
              const isOpen = expanded[item.formId] ?? true;
              return (
                <div key={item.formId} className="rounded-md border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 p-3 text-left"
                    onClick={() => toggle(item.formId)}
                    aria-expanded={isOpen}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="size-4 shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0" />
                      )}
                      <span className="truncate font-medium">
                        {item.formName}
                      </span>
                      {item.hasKeyConflict ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="size-3" /> Key conflict
                        </Badge>
                      ) : null}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {item.changes.length} change
                      {item.changes.length === 1 ? '' : 's'}
                    </Badge>
                  </button>
                  {isOpen ? (
                    <div className="border-t px-3 py-2">
                      {item.changes.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          No visible field-level diff detected, but this form
                          may still resolve against the published parent
                          depending on your propagation choice.
                        </p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {item.changes.map((change, idx) => (
                            <li
                              key={`${change.key}-${change.kind}-${idx}`}
                              className="text-foreground/90"
                            >
                              • {formatChange(change)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel publish
          </Button>
          <Button onClick={onContinue}>
            {propagateToDescendants ? 'Continue and apply to all' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
