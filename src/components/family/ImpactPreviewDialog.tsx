'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ImpactFormChange[];
  onContinue: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish impact preview</DialogTitle>
          <DialogDescription>
            This change affects {items.length} form
            {items.length === 1 ? '' : 's'}. Review the exact changes before
            publishing.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
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
                        Resolved output will be recomputed (ordering/settings
                        may change).
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
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onContinue}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
