'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeForm, upsertForm } from '@/store/slices/formsSlice';
import { formsRepository } from '@/services';
import {
  getDepth,
  getDraftResolutionChain,
  getDescendants,
  snapshotInherited,
  wouldCreateCycle,
  exceedsMaxDepth,
} from '@/lib/forms';
import type { FormRecord } from '@/types';
import { toast } from 'sonner';

export function DeleteFormDialog({
  open,
  onOpenChange,
  formId,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string | null;
  onDeleted?: () => void;
}) {
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const [strategy, setStrategy] = useState<'standalone' | 'reparent'>(
    'standalone',
  );
  const [keepInherited, setKeepInherited] = useState(true);
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);

  const form = formId ? (forms.find((f) => f.id === formId) ?? null) : null;
  const children = useMemo(
    () => (form ? forms.filter((f) => f.parentFormId === form.id) : []),
    [forms, form],
  );
  const hasChildren = children.length > 0;
  const canReparent = !!form?.parentFormId;

  const preview = useMemo(() => {
    if (!form) return [] as string[];
    if (!hasChildren) return [`${form.name} will be deleted.`];
    if (strategy === 'standalone') {
      return children.map(
        (c) =>
          `${c.name} will become a standalone root form${keepInherited ? ' (keeps inherited fields as its own)' : ''}.`,
      );
    }
    const parent = forms.find((f) => f.id === form.parentFormId);
    return children.map(
      (c) =>
        `${c.name} will move under ${parent?.name ?? "deleted form's parent"}.`,
    );
  }, [form, hasChildren, strategy, keepInherited, children, forms]);

  const validationError = useMemo(() => {
    if (!form || !hasChildren) return null;
    if (strategy === 'reparent') {
      if (!form.parentFormId)
        return 'No parent available to reparent children under.';
      for (const child of children) {
        // moving child under deleted form's parent: check cycle/depth in resulting structure (form removed)
        const withoutDeleted = forms.filter((f) => f.id !== form.id);
        if (
          wouldCreateCycle(withoutDeleted as any, child.id, form.parentFormId)
        )
          return `Reparenting ${child.name} would create a cycle.`;
        // depth check: child's subtree depth relative to new parent
        const parentDepth = getDepth(withoutDeleted as any, form.parentFormId);
        const childDepth = getDepth(withoutDeleted as any, child.id);
        const descendantsDepths = getDescendants(
          withoutDeleted as any,
          child.id,
        ).map((id) => getDepth(withoutDeleted as any, id));
        const maxChildSubtreeDepth = Math.max(
          childDepth,
          ...descendantsDepths,
          1,
        );
        const relative = maxChildSubtreeDepth - childDepth; // 0 for leaf child
        if (parentDepth + 1 + relative > 5)
          return `Reparenting ${child.name} would exceed maximum depth.`;
      }
    }
    return null;
  }, [form, hasChildren, strategy, children, forms]);

  const canConfirm = !!form && confirmName === form.name && !validationError;

  const onDelete = async () => {
    if (!form || !canConfirm) return;
    setLoading(true);
    try {
      const all = [...forms];
      const byId = new Map(all.map((f) => [f.id, { ...f } as FormRecord]));
      const target = byId.get(form.id);
      if (!target) throw new Error('Form not found');

      if (hasChildren) {
        for (const child of children) {
          const childRec = byId.get(child.id);
          if (!childRec) continue;
          if (strategy === 'standalone') {
            if (keepInherited) {
              const chainInfo = getDraftResolutionChain(
                all as any,
                childRec.id,
              );
              if (chainInfo) {
                const snap = snapshotInherited(chainInfo.chain, chainInfo.ids);
                childRec.draft = snap;
                // also convert published versions? keep as-is for simplicity, but form becomes root; published snapshots remain valid historical
              }
            }
            childRec.parentFormId = null;
            childRec.updatedAt = new Date().toISOString();
            byId.set(childRec.id, childRec);
          } else if (strategy === 'reparent' && form.parentFormId) {
            childRec.parentFormId = form.parentFormId;
            childRec.updatedAt = new Date().toISOString();
            byId.set(childRec.id, childRec);
          }
        }
      }

      // save updated children
      const updatedChildren = children
        .map((c) => byId.get(c.id))
        .filter(Boolean) as FormRecord[];
      if (updatedChildren.length) {
        await formsRepository.saveMany(updatedChildren as any);
        for (const c of updatedChildren) dispatch(upsertForm(c as any));
      }
      await formsRepository.delete(form.id);
      dispatch(removeForm(form.id));
      toast.success('Form deleted');
      onOpenChange(false);
      setConfirmName('');
      onDeleted?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setConfirmName('');
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Delete form</DialogTitle>
          <DialogDescription>
            {form ? (
              <>
                Delete <strong>{form.name}</strong>. This action cannot be
                undone in this demo.
              </>
            ) : (
              'Select a form.'
            )}
          </DialogDescription>
        </DialogHeader>
        {form ? (
          <div className="space-y-4">
            {hasChildren ? (
              <div className="space-y-3 rounded-md border p-3">
                <div className="text-sm font-medium">
                  This form has {children.length} child form
                  {children.length === 1 ? '' : 's'}. What should happen to
                  them?
                </div>
                <RadioGroup
                  value={strategy}
                  onValueChange={(v) => setStrategy(v as any)}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="standalone" id="del-standalone" />
                    <Label htmlFor="del-standalone" className="font-normal">
                      Make children standalone (each becomes its own root)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="reparent"
                      id="del-reparent"
                      disabled={!canReparent}
                    />
                    <Label
                      htmlFor="del-reparent"
                      className={
                        canReparent
                          ? 'font-normal'
                          : 'text-muted-foreground font-normal'
                      }
                    >
                      Move children under deleted form&apos;s parent
                      {!canReparent ? ' (no parent available)' : ''}
                    </Label>
                  </div>
                </RadioGroup>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="keep-inherited"
                    checked={keepInherited}
                    onCheckedChange={(v) => setKeepInherited(v === true)}
                  />
                  <Label htmlFor="keep-inherited" className="font-normal">
                    Keep fields inherited from this form as their own fields
                  </Label>
                </div>
                <div className="bg-muted/40 rounded-md p-2 text-sm">
                  <div className="mb-1 font-medium">Preview</div>
                  <ul className="list-disc space-y-1 pl-5">
                    {preview.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                {validationError ? (
                  <p className="text-destructive text-sm">{validationError}</p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <span className="font-mono">{form.name}</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={form.name}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={!canConfirm || loading}
          >
            {loading ? 'Deleting…' : 'Delete form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
