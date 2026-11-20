'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { History, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FormRenderer } from '@/components/renderer/FormRenderer';
import { describeContentDiff, diffFormContent } from '@/lib/forms';
import type { FormContent, FormVersion } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return '—';
  try {
    return format(new Date(v), 'PP p');
  } catch {
    return String(v);
  }
}

export function VersionHistoryDrawer({
  open,
  onOpenChange,
  versions,
  currentDraft,
  onRestore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: FormVersion[];
  currentDraft: FormContent | null;
  onRestore: (content: FormContent) => void;
}) {
  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
    [versions],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const selected = sorted.find((v) => v.id === selectedId) ?? sorted[0] ?? null;

  const diffSummary = useMemo(() => {
    if (!selected || !currentDraft) return [];
    try {
      const diff = diffFormContent(selected.content, currentDraft);
      return describeContentDiff(diff, selected.content, currentDraft);
    } catch {
      return [];
    }
  }, [selected, currentDraft]);

  const handleRestore = () => {
    if (!selected) return;
    setConfirmRestore(false);
    onRestore(JSON.parse(JSON.stringify(selected.content)) as FormContent);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="size-5" />
              Version history
            </SheetTitle>
            <SheetDescription>
              Select a version to view it read-only, compare with the current
              draft, or restore it as a draft.
            </SheetDescription>
          </SheetHeader>
          <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 p-4 pt-0 md:grid-cols-[260px_minmax(0,1fr)]">
            <div className="min-h-0 rounded-md border">
              <ScrollArea className="h-full max-h-[40vh] md:max-h-full">
                <div className="p-2">
                  {sorted.length === 0 ? (
                    <p className="text-muted-foreground p-2 text-sm">
                      No versions yet.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {sorted.map((v) => (
                        <li key={v.id}>
                          <button
                            type="button"
                            className={`w-full rounded-md border p-2 text-left text-sm ${selected?.id === v.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'}`}
                            onClick={() => setSelectedId(v.id)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">
                                v{v.versionNumber}
                              </span>
                              <Badge
                                variant={
                                  v.status === 'published'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {v.status}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground mt-1 text-xs">
                              {fmtDate(v.publishedAt)}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="min-h-0 space-y-3 overflow-auto">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        Version {selected.versionNumber}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {selected.status} • {fmtDate(selected.publishedAt)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRestore(true)}
                    >
                      <RotateCcw className="mr-2 size-4" />
                      Restore as draft
                    </Button>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="mb-2 text-sm font-medium">
                      Differences from current draft
                    </div>
                    {!currentDraft ? (
                      <p className="text-muted-foreground text-sm">
                        No current draft to compare.
                      </p>
                    ) : diffSummary.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No own-field differences detected.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {diffSummary.map((c, i) => (
                          <li key={`${c.key}-${c.kind}-${i}`}>
                            •{' '}
                            {c.kind === 'added'
                              ? `Added: ${c.label ?? c.key}`
                              : c.kind === 'removed'
                                ? `Removed: ${c.label ?? c.key}`
                                : c.kind === 'relabelled'
                                  ? `Relabelled: ${c.label ?? c.key} (${String(c.before ?? '')} → ${String(c.after ?? '')})`
                                  : c.kind === 'made-required'
                                    ? `Made required: ${c.label ?? c.key}`
                                    : c.kind === 'made-optional'
                                      ? `Made optional: ${c.label ?? c.key}`
                                      : c.kind === 'hidden'
                                        ? `Hidden: ${c.label ?? c.key}`
                                        : c.kind === 'shown'
                                          ? `Shown: ${c.label ?? c.key}`
                                          : `Changed: ${c.label ?? c.key}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <div className="mb-2 text-sm font-medium">
                      Read-only preview (resolved snapshot)
                    </div>
                    {selected.resolvedSnapshot ? (
                      <div className="rounded-md border p-4">
                        <FormRenderer
                          resolved={selected.resolvedSnapshot}
                          onSubmit={() => {}}
                          disableSubmit
                          submitLabel="Submit (disabled)"
                        />
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No resolved snapshot available for this version.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Select a version to view details.
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmRestore} onOpenChange={setConfirmRestore}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore version as draft?</DialogTitle>
            <DialogDescription>
              This will replace the current draft content with version{' '}
              {selected?.versionNumber}. You can undo this change.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore}>Restore as draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
