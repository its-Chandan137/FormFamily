'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Loader2,
  Pencil,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/builder/RichTextEditor';
import { START_ANCHOR } from '@/lib/constants';
import {
  clone,
  ensureDraft,
  getItemId,
  isOwnCanvasItem,
  resolvedItemLabel,
} from '@/lib/builder/helpers';
import { resolveWithContent } from '@/lib/forms';
import { formsRepository } from '@/services';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { upsertForm } from '@/store/slices/formsSlice';
import type { FormContent, FormRecord, ResolvedItem } from '@/types';

type Props = {
  formId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getTextValue(item: ResolvedItem): string {
  if (item.kind === 'field') return item.field.label || '';
  const p = item.element.props as Record<string, unknown>;
  if (item.element.type === 'richtext') return String(p.html ?? p.text ?? '');
  if (item.element.type === 'heading') return String(p.text ?? '');
  if (item.element.type === 'section') return String(p.title ?? '');
  if (item.element.type === 'logo') return String(p.src ?? '');
  return '';
}

function getTextLabel(item: ResolvedItem): string {
  if (item.kind === 'field') return 'Label';
  if (item.element.type === 'heading') return 'Heading text';
  if (item.element.type === 'richtext') return 'Text';
  if (item.element.type === 'section') return 'Section title';
  if (item.element.type === 'logo') return 'Logo URL';
  return 'Text';
}

function canEditText(item: ResolvedItem): boolean {
  if (item.kind === 'field') return item.field.origin === 'own';
  return ['heading', 'richtext', 'section', 'logo'].includes(item.element.type);
}

function canMove(item: ResolvedItem): boolean {
  if (item.kind === 'field') return !item.field.locked;
  return true;
}

function setItemText(
  draft: FormContent,
  item: ResolvedItem,
  value: string,
): FormContent {
  const next = clone(draft);
  if (item.kind === 'field') {
    const f = next.ownFields.find((x) => x.key === item.field.key);
    if (f) f.label = value;
    return next;
  }

  const id = item.element.id;
  const own = next.elements.find((e) => e.id === id);
  if (own) {
    if (item.element.type === 'section') own.props.title = value;
    else if (item.element.type === 'logo') own.props.src = value;
    else if (item.element.type === 'richtext') own.props.html = value;
    else own.props.text = value;
    return next;
  }

  next.elementOverrides = { ...(next.elementOverrides ?? {}) };
  const prev = next.elementOverrides[id] ?? {};
  const props = { ...(prev.props ?? {}) } as Record<string, unknown>;
  if (item.element.type === 'section') props.title = value;
  else if (item.element.type === 'logo') props.src = value;
  else if (item.element.type === 'richtext') props.html = value;
  else props.text = value;
  next.elementOverrides[id] = { ...prev, props: props as any };
  return next;
}

function moveItem(
  draft: FormContent,
  items: ResolvedItem[],
  itemId: string,
  direction: -1 | 1,
  formId: string,
): FormContent {
  const idx = items.findIndex((i) => getItemId(i) === itemId);
  if (idx < 0) return draft;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= items.length) return draft;

  const reordered = items.map(getItemId);
  const [moved] = reordered.splice(idx, 1);
  reordered.splice(targetIdx, 0, moved);
  const pos = reordered.indexOf(moved);
  const prevId = pos <= 0 ? START_ANCHOR : reordered[pos - 1];

  const item = items[idx];
  const next = clone(draft);
  if (isOwnCanvasItem(item, formId)) {
    if (item.kind === 'field') {
      const f = next.ownFields.find((x) => x.key === itemId);
      if (f) f.insertAfter = prevId;
    } else {
      const el = next.elements.find((x) => x.id === itemId);
      if (el) el.insertAfter = prevId;
    }
  } else {
    next.positionOverrides = {
      ...(next.positionOverrides ?? {}),
      [itemId]: prevId,
    };
  }
  return next;
}

function QuickEditBody({
  form,
  forms,
  onOpenChange,
}: {
  form: FormRecord;
  forms: FormRecord[];
  onOpenChange: (open: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<FormContent>(() => ensureDraft(form));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const resolved = useMemo(() => {
    try {
      return resolveWithContent(forms, form.id, draft);
    } catch {
      return null;
    }
  }, [forms, form.id, draft]);

  const items = resolved?.items ?? [];

  const updateDraft = (next: FormContent) => {
    setDraft(next);
    setDirty(true);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await formsRepository.updateDraft(form.id, draft);
      dispatch(upsertForm(updated as any));
      toast.success('Quick edits saved');
      setDirty(false);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader className="px-6 pt-6 pb-2">
        <DialogTitle className="flex items-center gap-2">
          <Pencil className="size-4" aria-hidden />
          Quick edit — {form.name}
        </DialogTitle>
        <DialogDescription>
          Edit text, logo, and field positions directly. For full builder
          controls, open the form builder.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(85vh-180px)] px-6 pb-2">
        {!resolved ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            Unable to load form draft.
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            This form has no fields yet.
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {items.map((item, idx) => {
              const id = getItemId(item);
              const isOwn = isOwnCanvasItem(item, form.id);
              const locked = item.kind === 'field' && item.field.locked;
              const movable = canMove(item);
              const editableText = canEditText(item);
              const textLabel = getTextLabel(item);
              const textValue = getTextValue(item);
              const kindLabel =
                item.kind === 'field' ? item.field.type : item.element.type;
              return (
                <div
                  key={id}
                  className="border-border bg-surface rounded-lg border p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {resolvedItemLabel(item)}
                        </span>
                        <Badge
                          variant="outline"
                          dot={false}
                          className="h-5 px-1.5 text-[11px]"
                        >
                          {kindLabel}
                        </Badge>
                        {!isOwn ? (
                          <Badge
                            variant="outline"
                            dot={false}
                            className="h-5 px-1.5 text-[11px]"
                          >
                            Inherited
                          </Badge>
                        ) : null}
                        {locked ? (
                          <Badge
                            variant="outline"
                            dot={false}
                            className="h-5 px-1.5 text-[11px]"
                          >
                            Locked
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move ${resolvedItemLabel(item)} up`}
                        disabled={!movable || idx === 0}
                        onClick={() =>
                          updateDraft(moveItem(draft, items, id, -1, form.id))
                        }
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move ${resolvedItemLabel(item)} down`}
                        disabled={!movable || idx === items.length - 1}
                        onClick={() =>
                          updateDraft(moveItem(draft, items, id, 1, form.id))
                        }
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {editableText ? (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`qe-${id}`}
                        className="text-muted-foreground text-xs"
                      >
                        <span className="inline-flex items-center gap-1">
                          {item.kind !== 'field' &&
                          item.element.type === 'logo' ? (
                            <ImageIcon className="size-3.5" />
                          ) : (
                            <Type className="size-3.5" />
                          )}
                          {textLabel}
                        </span>
                      </Label>
                      {item.kind !== 'field' &&
                      item.element.type === 'richtext' ? (
                        <RichTextEditor
                          value={textValue}
                          onChange={(html) =>
                            updateDraft(setItemText(draft, item, html))
                          }
                        />
                      ) : (
                        <Input
                          id={`qe-${id}`}
                          value={textValue}
                          onChange={(e) =>
                            updateDraft(
                              setItemText(draft, item, e.target.value),
                            )
                          }
                          placeholder={textLabel}
                        />
                      )}
                      {item.kind !== 'field' && item.element.type === 'logo' ? (
                        <div className="space-y-1.5 pt-1">
                          <Label
                            htmlFor={`qe-${id}-alt`}
                            className="text-muted-foreground text-xs"
                          >
                            Alt text
                          </Label>
                          <Input
                            id={`qe-${id}-alt`}
                            value={String(
                              (item.element.props as any).alt ?? '',
                            )}
                            onChange={(e) => {
                              const next = clone(draft);
                              const own = next.elements.find(
                                (x) => x.id === id,
                              );
                              if (own) {
                                own.props.alt = e.target.value;
                              } else {
                                next.elementOverrides = {
                                  ...(next.elementOverrides ?? {}),
                                };
                                const prev = next.elementOverrides[id] ?? {};
                                next.elementOverrides[id] = {
                                  ...prev,
                                  props: {
                                    ...(prev.props ?? {}),
                                    alt: e.target.value,
                                  } as any,
                                };
                              }
                              updateDraft(next);
                            }}
                            placeholder="Logo alt text"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      {item.kind === 'field' && item.field.origin !== 'own'
                        ? 'Inherited field text is controlled by parent; you can reposition it here if unlocked.'
                        : 'No quick text edit available for this item.'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <DialogFooter className="px-6 py-4 sm:justify-between">
        <p className="text-muted-foreground text-xs">
          {dirty ? 'Unsaved changes' : 'No changes yet'}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={() => void onSave()} disabled={!dirty || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

export function QuickEditDialog({ formId, open, onOpenChange }: Props) {
  const forms = useAppSelector((s) => s.forms.items) as FormRecord[];
  const form = useMemo(
    () => (formId ? (forms.find((f) => f.id === formId) ?? null) : null),
    [forms, formId],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-2xl">
        {open && form ? (
          <QuickEditBody
            key={form.id}
            form={form}
            forms={forms}
            onOpenChange={onOpenChange}
          />
        ) : (
          <div className="text-muted-foreground p-6 text-sm">
            {open ? 'Form not found.' : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
