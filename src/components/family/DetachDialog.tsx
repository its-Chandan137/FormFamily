'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { upsertForm } from '@/store/slices/formsSlice';
import { formsRepository } from '@/services';
import {
  getDraftResolutionChain,
  resolveForm,
  snapshotInherited,
} from '@/lib/forms';
import { toast } from 'sonner';

export function DetachDialog({
  open,
  onOpenChange,
  formId,
  onDetached,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string | null;
  onDetached?: () => void;
}) {
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const [loading, setLoading] = useState(false);
  const form = formId ? (forms.find((f) => f.id === formId) ?? null) : null;

  const onConfirm = async () => {
    if (!form) return;
    setLoading(true);
    try {
      const chainInfo = getDraftResolutionChain(
        forms as unknown as import('@/types').FormRecord[],
        form.id,
        { allowAncestorDraftFallback: true },
      );
      if (!chainInfo) throw new Error('Cannot resolve form for detach');
      const snapshot = snapshotInherited(chainInfo.chain, chainInfo.ids);
      const updated = {
        ...form,
        parentFormId: null,
        draft: snapshot,
        updatedAt: new Date().toISOString(),
      };
      await formsRepository.save(
        updated as unknown as import('@/types').FormRecord,
      );
      dispatch(upsertForm(updated as unknown as import('@/types').FormRecord));
      toast.success('Form detached from family');
      onOpenChange(false);
      onDetached?.();
    } catch (_e) {
      toast.error('Failed to detach form');
    } finally {
      setLoading(false);
    }
  };

  const nInherited = (() => {
    if (!form) return 0;
    try {
      const chainInfo = getDraftResolutionChain(
        forms as unknown as import('@/types').FormRecord[],
        form.id,
        { allowAncestorDraftFallback: true },
      );
      if (!chainInfo) return 0;
      const resolved = resolveForm(chainInfo.chain, chainInfo.ids);
      return resolved.items.filter((i) =>
        i.kind === 'field'
          ? i.field.origin === 'inherited'
          : i.origin === 'inherited',
      ).length;
    } catch {
      return 0;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detach from family</DialogTitle>
          <DialogDescription>
            Detaching will copy {nInherited} inherited item
            {nInherited === 1 ? '' : 's'} into this form as its own, remove its
            parent link, and stop it receiving parent updates. Its children will
            stay attached to it.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-amber-700">
          This action changes the form structure. You can continue editing after
          detaching.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!form || loading}>
            {loading ? 'Detaching…' : 'Detach'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
