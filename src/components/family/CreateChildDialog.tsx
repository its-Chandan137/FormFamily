'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createForm } from '@/store/slices/formsSlice';
import { getDepth, exceedsMaxDepth } from '@/lib/forms';
import { toast } from 'sonner';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function CreateChildDialog({
  open,
  onOpenChange,
  parentFormId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFormId: string | null;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items);
  const parent = parentFormId
    ? (forms.find((f) => f.id === parentFormId) ?? null)
    : null;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const depth = useMemo(
    () =>
      parentFormId
        ? getDepth(forms as unknown as import('@/types').Form[], parentFormId)
        : 0,
    [forms, parentFormId],
  );
  const atLimit = parentFormId
    ? exceedsMaxDepth(
        forms as unknown as import('@/types').Form[],
        'new_child',
        parentFormId,
      ) || depth >= 5
    : false;

  const onNameChange = (v: string) => {
    setName(v);
    setSlug((prev) => (prev ? prev : slugify(v)));
  };

  const onCreate = async () => {
    if (!parentFormId || !name || !slug || atLimit) return;
    setSaving(true);
    try {
      const created = await dispatch(
        createForm({
          name,
          slug,
          parentFormId,
          content: {
            settings: {},
            ownFields: [],
            elements: [],
            overrides: {},
            locks: [],
          },
        }),
      ).unwrap();
      toast.success('Child form created');
      onOpenChange(false);
      router.push(`/forms/${created.id}/edit`);
    } catch {
      toast.error('Failed to create child form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setName('');
          setSlug('');
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create child form</DialogTitle>
          <DialogDescription>
            {parent ? (
              <>
                Parent: <strong>{parent.name}</strong>
              </>
            ) : (
              'Select a parent form.'
            )}
            {parentFormId ? <> (current depth {depth}, max depth 5)</> : null}
          </DialogDescription>
        </DialogHeader>
        {atLimit ? (
          <p className="text-destructive text-sm">
            Cannot create a child at this level because it would exceed the
            maximum family depth (5).
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="child-name">Name</Label>
              <Input
                id="child-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Child form name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child-slug">Slug</Label>
              <Input
                id="child-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="child-form-slug"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={!parentFormId || !name || !slug || atLimit || saving}
          >
            Create child
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
