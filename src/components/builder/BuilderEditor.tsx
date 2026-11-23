'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Eye, History, Monitor, Redo2, Smartphone, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { upsertForm } from '@/store/slices/formsSlice';
import { bootstrapApp } from '@/store/bootstrap';
import {
  applyDraftEdit,
  clearBuilderForFormSwitch,
  initBuilder,
  redo,
  resetHistoryTo,
  setAutosaveStatus,
  setPreviewMode,
  setSelectedItem,
  undo,
} from '@/store/slices/builderSlice';
import { formsRepository } from '@/services';
import { ErrorState } from '@/components/shared/ScreenStates';
import {
  applyConflictMerges,
  computeImpact,
  describeResolvedDiff,
  diffResolvedForms,
  findPublishKeyConflicts,
  getDraftResolutionChain,
  getFormStatus,
  getFormStatusLabel,
  getPublishedContent,
  publishFormWithPropagation,
  resolveForm,
  resolveWithContent,
  START_ANCHOR,
  type DescribedChange,
} from '@/lib/forms';
import type {
  FieldType,
  FormContent,
  FormRecord,
  LayoutElement,
  OwnField,
  ResolvedItem,
} from '@/types';
import { AutosaveIndicator } from './AutosaveIndicator';
import { BuilderCanvas } from './BuilderCanvas';
import { BuilderPalette, type PaletteItemDef } from './BuilderPalette';
import { BuilderPropertiesPanel } from './BuilderPropertiesPanel';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import {
  ImpactPreviewDialog,
  type ImpactFormChange,
} from '@/components/family/ImpactPreviewDialog';
import {
  KeyConflictDialog,
  type KeyConflictDetail,
} from '@/components/family/KeyConflictDialog';
import { CreateChildDialog } from '@/components/family/CreateChildDialog';
import { DetachDialog } from '@/components/family/DetachDialog';
import { DeleteFormDialog } from '@/components/family/DeleteFormDialog';
import { FormRenderer } from '@/components/renderer/FormRenderer';
import {
  clone,
  ensureDraft,
  getItemId,
  insertAfterForIndex,
  isOwnCanvasItem,
  resolvedItemLabel,
} from '@/lib/builder/helpers';

const PALETTE_ITEMS: PaletteItemDef[] = [
  { kind: 'field', key: 'first_name', type: 'text', label: 'First Name' },
  { kind: 'field', key: 'last_name', type: 'text', label: 'Last Name' },
  { kind: 'field', key: 'email', type: 'email', label: 'Email' },
  { kind: 'field', key: 'phone', type: 'phone', label: 'Phone' },
  { kind: 'field', key: 'resume', type: 'file', label: 'Resume' },
  {
    kind: 'field',
    key: 'current_company',
    type: 'text',
    label: 'Current Company',
  },
  { kind: 'field', key: 'experience', type: 'number', label: 'Experience' },
  { kind: 'field', key: 'current_ctc', type: 'currency', label: 'Current CTC' },
  {
    kind: 'field',
    key: 'expected_ctc',
    type: 'currency',
    label: 'Expected CTC',
  },
  {
    kind: 'field',
    key: 'notice_period',
    type: 'select',
    label: 'Notice Period',
  },
  {
    kind: 'field',
    key: 'current_location',
    type: 'text',
    label: 'Current Location',
  },
  { kind: 'field', key: 'portfolio_url', type: 'text', label: 'Portfolio URL' },
  { kind: 'field', key: 'github_url', type: 'text', label: 'GitHub URL' },
  {
    kind: 'field',
    key: 'data_consent',
    type: 'checkbox',
    label: 'Data Consent',
  },
  { kind: 'field', key: 'tech_stack', type: 'select', label: 'Tech Stack' },
  {
    kind: 'field',
    key: 'cloud_platforms',
    type: 'select',
    label: 'Cloud Platforms',
  },
  {
    kind: 'field',
    key: 'oncall_comfort',
    type: 'radio',
    label: 'On-call Comfort',
  },
  {
    kind: 'field',
    key: 'testing_tools',
    type: 'select',
    label: 'Testing Tools',
  },
  { kind: 'element', type: 'logo', label: 'Logo' },
  { kind: 'element', type: 'heading', label: 'Heading' },
  { kind: 'element', type: 'richtext', label: 'Rich text' },
  { kind: 'element', type: 'divider', label: 'Divider' },
  { kind: 'element', type: 'section', label: 'Section' },
];

function slotIndexFromOverId(
  overId: string | null,
  itemsCount: number,
): number | null {
  if (!overId) return null;
  if (overId === 'slot:empty') return 0;
  if (overId.startsWith('slot:')) {
    const n = Number(overId.slice('slot:'.length));
    if (Number.isFinite(n)) return Math.max(0, Math.min(itemsCount, n));
  }
  return null;
}

export function BuilderEditor({ formId }: { formId: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const forms = useAppSelector((s) => s.forms.items) as FormRecord[];
  const fieldsLib = useAppSelector((s) => s.fields.items);
  const builder = useAppSelector((s) => s.builder);
  const uiInitialized = useAppSelector((s) => s.ui.initialized);
  const uiError = useAppSelector((s) => s.ui.error);
  const form = forms.find((f) => f.id === formId) ?? null;
  const draft = builder.initializedFormId === formId ? builder.present : null;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [impactItems, setImpactItems] = useState<ImpactFormChange[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [pendingContent, setPendingContent] = useState<FormContent | null>(
    null,
  );
  const [createChildOpen, setCreateChildOpen] = useState(false);
  const [detachOpen, setDetachOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedJson = useRef<string>('');

  // init/clear on form switch
  useEffect(() => {
    if (!form) return;
    if (builder.initializedFormId !== form.id) {
      dispatch(clearBuilderForFormSwitch());
      dispatch(
        initBuilder({
          formId: form.id,
          draft: ensureDraft(form),
          resetHistory: true,
        }),
      );
      lastSavedJson.current = JSON.stringify(ensureDraft(form));
    }
  }, [form?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // autosave (debounced) when draft changes
  useEffect(() => {
    if (!form || !draft || builder.initializedFormId !== form.id) return;
    const json = JSON.stringify(draft);
    if (json === lastSavedJson.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      dispatch(setAutosaveStatus({ status: 'saving' }));
      try {
        const updated = await formsRepository.updateDraft(form.id, draft);
        dispatch(upsertForm(updated as any));
        lastSavedJson.current = JSON.stringify(draft);
        dispatch(
          setAutosaveStatus({
            status: 'saved',
            savedAt: new Date().toISOString(),
          }),
        );
      } catch (e: any) {
        dispatch(
          setAutosaveStatus({
            status: 'error',
            error: e?.message || 'Failed to save draft',
          }),
        );
      }
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, form?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const resolved = useMemo(() => {
    if (!form || !draft) return null;
    try {
      return resolveWithContent(
        forms as any,
        form.id,
        draft,
      ) as any as ReturnType<typeof resolveForm>;
    } catch {
      return null;
    }
  }, [forms, form, draft]);

  const existingFieldKeys = useMemo(() => {
    const set = new Set<string>();
    for (const item of resolved?.items ?? [])
      if (item.kind === 'field') set.add(item.field.key);
    return set;
  }, [resolved]);

  const applyEdit = useCallback(
    (next: FormContent, coalesceKey?: string) => {
      dispatch(applyDraftEdit({ draft: next, coalesceKey }));
    },
    [dispatch],
  );

  const selectItem = (id: string | null) => dispatch(setSelectedItem(id));

  const doRetrySave = async () => {
    if (!form || !draft) return;
    dispatch(setAutosaveStatus({ status: 'saving' }));
    try {
      const updated = await formsRepository.updateDraft(form.id, draft);
      dispatch(upsertForm(updated as any));
      lastSavedJson.current = JSON.stringify(draft);
      dispatch(
        setAutosaveStatus({
          status: 'saved',
          savedAt: new Date().toISOString(),
        }),
      );
      toast.success('Draft saved');
    } catch (e: any) {
      dispatch(
        setAutosaveStatus({
          status: 'error',
          error: e?.message || 'Failed to save draft',
        }),
      );
      toast.error('Autosave failed');
    }
  };

  const triggerDebugSaveError = () => {
    formsRepository.setDebugFailNextDraftSave(true);
    toast.message('Next autosave will fail (debug flag set)');
  };

  // undo/redo shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        target?.isContentEditable ||
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select';
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        // let native undo work inside text inputs/contenteditable
        if (isEditable) return;
        e.preventDefault();
        dispatch(undo());
      } else if (
        (e.key.toLowerCase() === 'z' && e.shiftKey) ||
        e.key.toLowerCase() === 'y'
      ) {
        if (isEditable && e.key.toLowerCase() !== 'y') return;
        e.preventDefault();
        dispatch(redo());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  const addPaletteItem = (item: PaletteItemDef, insertAfter: string | null) => {
    if (!form || !draft) return;
    if (item.kind === 'field') {
      if (!item.key) return;
      if (existingFieldKeys.has(item.key)) {
        toast.error('This field is already in the form');
        return;
      }
      const libDef = fieldsLib.find((f) => f.key === item.key);
      const own: OwnField = {
        key: item.key,
        label: libDef?.label ?? item.label,
        type: (libDef?.type ?? item.type) as FieldType,
        placeholder: '',
        helpText: '',
        options: libDef?.options
          ? [...libDef.options]
          : item.type === 'select' || item.type === 'radio'
            ? []
            : undefined,
        validation: libDef?.validation ? { ...libDef.validation } : undefined,
        required: false,
        hidden: false,
        insertAfter,
      };
      const next = clone(draft);
      next.ownFields.push(own);
      applyEdit(next);
      selectItem(item.key);
      setAnnounce(`Added ${own.label} to canvas`);
    } else {
      const id = `el_${item.type}_${nanoid(6)}`;
      const el: LayoutElement = {
        id,
        type: item.type as LayoutElement['type'],
        props:
          item.type === 'heading'
            ? { text: 'Heading' }
            : item.type === 'richtext'
              ? { html: '<p>About this role...</p>' }
              : item.type === 'section'
                ? { title: 'Section', description: '' }
                : item.type === 'logo'
                  ? { src: '', alt: draft.settings.companyName ?? 'Logo' }
                  : {},
        insertAfter,
      };
      const next = clone(draft);
      next.elements.push(el);
      applyEdit(next);
      selectItem(id);
      setAnnounce(`Added ${item.label} element to canvas`);
    }
  };

  const onAddClick = (item: PaletteItemDef) => {
    if (!form || !draft) return;
    // click-to-add: add after selected item if any, else at end
    const after = builder.selectedItemId ?? null;
    addPaletteItem(item, after);
  };

  const getInsertAfterForSlot = (slotIndex: number): string => {
    if (!resolved) return START_ANCHOR;
    return insertAfterForIndex(resolved, slotIndex);
  };

  const computeAnnouncedPosition = (
    activeStr: string,
    overStr: string | null,
  ): string | null => {
    if (!resolved || !overStr) return null;
    const activeIndex = resolved.items.findIndex(
      (i) => getItemId(i) === activeStr,
    );
    let targetIndex = slotIndexFromOverId(overStr, resolved.items.length);
    if (targetIndex === null) {
      const idx = resolved.items.findIndex((i) => getItemId(i) === overStr);
      if (idx >= 0) targetIndex = idx;
    }
    if (targetIndex === null) return null;
    let pos = targetIndex;
    if (activeIndex !== -1 && activeIndex < pos) pos = pos - 1;
    pos = Math.max(0, Math.min(resolved.items.length, pos));
    const human =
      activeIndex === -1
        ? Math.min(pos + 1, resolved.items.length + 1)
        : pos + 1;
    const total =
      activeIndex === -1 ? resolved.items.length + 1 : resolved.items.length;
    return `${human} of ${total}`;
  };

  const onDragStart = (e: DragStartEvent) => {
    const activeStr = String(e.active.id);
    setActiveId(activeStr);
    const data = e.active.data.current as unknown as
      { source?: string; item?: PaletteItemDef } | undefined;
    if (data?.source === 'palette') {
      setAnnounce(`Picked up ${data.item?.label ?? 'item'} from palette`);
    } else {
      const item = resolved?.items.find((i) => getItemId(i) === activeStr);
      if (item && resolved) {
        const idx = resolved.items.findIndex((i) => getItemId(i) === activeStr);
        setAnnounce(
          `Picked up ${resolvedItemLabel(item)}, position ${idx + 1} of ${resolved.items.length}`,
        );
      } else if (item) {
        setAnnounce(`Picked up ${resolvedItemLabel(item)}`);
      }
    }
  };

  const onDragOver = (e: DragOverEvent) => {
    const overStr = e.over ? String(e.over.id) : null;
    setOverId(overStr);
    if (!activeId) return;
    const pos = computeAnnouncedPosition(activeId, overStr);
    if (!pos) return;
    const data = e.active.data.current as unknown as
      { source?: string; item?: PaletteItemDef } | undefined;
    if (data?.source === 'palette') {
      setAnnounce(`Moving ${data.item?.label ?? 'item'}, position ${pos}`);
    } else {
      const item = resolved?.items.find((i) => getItemId(i) === activeId);
      if (item)
        setAnnounce(`Moving ${resolvedItemLabel(item)}, position ${pos}`);
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setAnnounce('Drag cancelled');
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    setOverId(null);
    if (!over || !form || !draft || !resolved) {
      setAnnounce('Drag cancelled');
      return;
    }
    const activeStr = String(active.id);
    const overStr = String(over.id);

    // Determine target slot index
    let targetIndex: number | null = slotIndexFromOverId(
      overStr,
      resolved.items.length,
    );
    if (targetIndex === null) {
      // dropped over an item: place before that item
      const idx = resolved.items.findIndex((i) => getItemId(i) === overStr);
      if (idx >= 0) targetIndex = idx;
    }
    if (targetIndex === null) return;

    if (activeStr.startsWith('palette:')) {
      const data = active.data.current as any;
      const item = data?.item as PaletteItemDef | undefined;
      if (!item) return;
      // if dropping "after" in a way that results from over being item, fine; targetIndex is index before over item
      // but if over is a slot:N, N is already the index
      const insertAfter = getInsertAfterForSlot(targetIndex);
      addPaletteItem(item, insertAfter);
      setAnnounce(`Dropped ${item.label} on canvas`);
      return;
    }

    // reorder canvas item (own or inherited)
    const activeItem = resolved.items.find((i) => getItemId(i) === activeStr);
    if (!activeItem) return;
    if (activeItem.kind === 'field' && activeItem.field.locked) return;
    const oldIndex = resolved.items.findIndex(
      (i) => getItemId(i) === activeStr,
    );
    if (oldIndex === -1) return;
    let newIndex = targetIndex;
    // if moving down, dropping at slot after items means after removal index shifts; adjust
    if (oldIndex < newIndex) newIndex = newIndex - 1;
    newIndex = Math.max(0, Math.min(resolved.items.length - 1, newIndex));

    const ids = resolved.items.map(getItemId);
    const reordered = ids.slice();
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, activeStr);
    const pos = reordered.indexOf(activeStr);
    const prevId = pos <= 0 ? START_ANCHOR : reordered[pos - 1];
    const next = clone(draft);
    if (isOwnCanvasItem(activeItem, form.id)) {
      if (activeItem.kind === 'field') {
        const f = next.ownFields.find((x) => x.key === activeStr);
        if (f) f.insertAfter = prevId;
      } else {
        const el = next.elements.find((x) => x.id === activeStr);
        if (el) el.insertAfter = prevId;
      }
    } else {
      next.positionOverrides = {
        ...(next.positionOverrides ?? {}),
        [activeStr]: prevId,
      };
    }
    applyEdit(next);
    const posHuman = pos + 1;
    setAnnounce(
      `Moved ${resolvedItemLabel(activeItem)} to position ${posHuman} of ${resolved.items.length}`,
    );
  };

  const updateOwnField = (
    key: string,
    patch: Partial<OwnField>,
    coalesceKey?: string,
  ) => {
    if (!draft) return;
    const next = clone(draft);
    const idx = next.ownFields.findIndex((f) => f.key === key);
    if (idx === -1) return;
    next.ownFields[idx] = { ...next.ownFields[idx], ...patch };
    applyEdit(next, coalesceKey);
  };
  const updateOwnElement = (
    id: string,
    patch: Partial<LayoutElement>,
    coalesceKey?: string,
  ) => {
    if (!draft) return;
    const next = clone(draft);
    const idx = next.elements.findIndex((e) => e.id === id);
    if (idx === -1) return;
    next.elements[idx] = {
      ...next.elements[idx],
      ...patch,
      props: { ...(next.elements[idx].props ?? {}), ...(patch.props ?? {}) },
    };
    applyEdit(next, coalesceKey);
  };
  const setOverride = (key: string, patch: Record<string, unknown>) => {
    if (!draft) return;
    const next = clone(draft);
    next.overrides = {
      ...(next.overrides ?? {}),
      [key]: { ...(next.overrides?.[key] ?? {}), ...patch },
    };
    applyEdit(next);
  };
  const resetInherited = (key: string) => {
    if (!draft) return;
    const next = clone(draft);
    next.overrides = {
      ...(next.overrides ?? {}),
      [key]: {
        ...(next.overrides?.[key] ?? {}),
        label: undefined,
        placeholder: undefined,
        helpText: undefined,
        required: undefined,
        hidden: undefined,
      },
    };
    if (next.positionOverrides && key in next.positionOverrides) {
      const { [key]: _removed, ...rest } = next.positionOverrides;
      next.positionOverrides = rest;
    }
    if (next.elementOverrides && key in next.elementOverrides) {
      const { [key]: _removed, ...rest } = next.elementOverrides;
      next.elementOverrides = rest;
    }
    applyEdit(next);
  };
  const setElementOverride = (
    id: string,
    props: Record<string, unknown>,
    coalesceKey?: string,
  ) => {
    if (!draft) return;
    const next = clone(draft);
    next.elementOverrides = {
      ...(next.elementOverrides ?? {}),
      [id]: {
        ...(next.elementOverrides?.[id] ?? {}),
        props: { ...(next.elementOverrides?.[id]?.props ?? {}), ...props },
      },
    };
    applyEdit(next, coalesceKey);
  };
  const toggleLock = (keyOrId: string) => {
    if (!draft) return;
    const next = clone(draft);
    const locks = new Set(next.locks ?? []);
    if (locks.has(keyOrId)) locks.delete(keyOrId);
    else locks.add(keyOrId);
    next.locks = Array.from(locks);
    applyEdit(next);
  };
  const removeOwn = (id: string, kind: 'field' | 'element') => {
    if (!draft) return;
    const next = clone(draft);
    if (kind === 'field')
      next.ownFields = next.ownFields.filter((f) => f.key !== id);
    else next.elements = next.elements.filter((e) => e.id !== id);
    for (const f of next.ownFields)
      if (f.insertAfter === id) f.insertAfter = null;
    for (const e of next.elements)
      if (e.insertAfter === id) e.insertAfter = null;
    if (builder.selectedItemId === id) selectItem(null);
    applyEdit(next);
  };
  const updateSettings = (
    patch: Partial<FormContent['settings']>,
    coalesceKey?: string,
  ) => {
    if (!draft) return;
    applyEdit(
      { ...draft, settings: { ...draft.settings, ...patch } },
      coalesceKey,
    );
  };

  const selectedItem =
    resolved?.items.find((i) => getItemId(i) === builder.selectedItemId) ??
    null;

  const startPublish = async () => {
    if (!form || !draft) return;
    const ownKeys = draft.ownFields.map((f) => f.key);
    const dup = ownKeys.find((k, i) => ownKeys.indexOf(k) !== i);
    if (dup) {
      toast.error(`Duplicate key: ${dup}`);
      return;
    }

    const contentToPublish = clone(draft);
    setPendingContent(contentToPublish);
    const found = findPublishKeyConflicts(
      forms as any,
      form.id,
      contentToPublish,
    );
    setConflicts(found);

    const descendants = computeImpact(forms as any, form.id).affectedFormIds;
    const items: ImpactFormChange[] = descendants.map((id) => {
      const f = forms.find((x) => x.id === id)!;
      const hasKeyConflict = found.some((c) => c.descendantId === id);
      let changes: DescribedChange[] = [];
      try {
        // simulate parent published
        const simParent = {
          ...form,
          draft: null,
          versions: [
            ...form.versions,
            {
              id: '__pending__',
              formId: form.id,
              versionNumber: 9999,
              status: 'published' as const,
              content: clone(contentToPublish),
              resolvedSnapshot: null,
              publishedAt: new Date().toISOString(),
            },
          ],
          publishedVersionId: '__pending__',
        } as FormRecord;
        const simForms = forms.map((x) => (x.id === form.id ? simParent : x));
        const beforeChain = getDraftResolutionChain(forms as any, id, {
          allowAncestorDraftFallback: true,
        });
        const dSim = simForms.find((x) => x.id === id)!;
        const dContent = dSim.draft ?? getPublishedContent(dSim);
        if (beforeChain && dContent) {
          const before = resolveForm(beforeChain.chain, beforeChain.ids);
          const after = resolveWithContent(
            simForms as any,
            id,
            dContent as any,
          );
          if (after) {
            const diff = diffResolvedForms(before as any, after as any);
            changes = describeResolvedDiff(diff, before as any, after as any);
          }
        }
      } catch {
        changes = [];
      }
      return { formId: id, formName: f?.name ?? id, changes, hasKeyConflict };
    });
    setImpactItems(items);

    if (items.length > 0) setShowImpact(true);
    else if (found.length > 0) setShowConflict(true);
    else await doPublish(contentToPublish, forms);
  };

  const doPublish = async (content: FormContent, baseForms: FormRecord[]) => {
    if (!form) return;
    try {
      const working = baseForms.map((f) =>
        f.id === form.id ? { ...f, draft: clone(content) } : f,
      );
      const { updatedForms, publishedVersion } = publishFormWithPropagation(
        working as any,
        form.id,
      );
      await formsRepository.saveMany(updatedForms as any);
      for (const f of updatedForms) dispatch(upsertForm(f as any));
      const pubContent =
        updatedForms
          .find((f) => f.id === form.id)
          ?.versions.find((v) => v.id === publishedVersion.id)?.content ??
        content;
      dispatch(resetHistoryTo(clone(pubContent)));
      lastSavedJson.current = JSON.stringify(clone(pubContent));
      dispatch(
        setAutosaveStatus({
          status: 'saved',
          savedAt: new Date().toISOString(),
        }),
      );
      toast.success(`Published v${publishedVersion.versionNumber}`);
      setShowImpact(false);
      setShowConflict(false);
      setPendingContent(null);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to publish form');
    }
  };

  const onImpactContinue = async () => {
    setShowImpact(false);
    if (conflicts.length > 0) setShowConflict(true);
    else if (pendingContent) await doPublish(pendingContent, forms);
  };

  const buildConflictDetails = (): KeyConflictDetail[] => {
    return conflicts.map((c) => {
      const d = forms.find((f) => f.id === c.descendantId);
      const dContent = d ? (d.draft ?? getPublishedContent(d)) : null;
      const childOwn = dContent?.ownFields.find((f) => f.key === c.key);
      let childPosition = 'In child form (own field)';
      try {
        if (d) {
          const chain = getDraftResolutionChain(forms as any, d.id, {
            allowAncestorDraftFallback: true,
          });
          if (chain) {
            const r = resolveForm(chain.chain, chain.ids);
            const idx = r.items.findIndex(
              (i) => i.kind === 'field' && i.field.key === c.key,
            );
            if (idx === 0) childPosition = 'At top of form';
            else if (idx > 0) {
              const prev = r.items[idx - 1];
              childPosition = `After "${resolvedItemLabel(prev)}"`;
            }
          }
        }
      } catch {}
      const parentField = pendingContent?.ownFields.find(
        (f) => f.key === c.key,
      );
      return {
        key: c.key,
        descendantFormId: c.descendantId,
        descendantName: c.descendantName,
        childLabel: childOwn?.label,
        childPosition,
        parentLabel: parentField?.label,
      };
    });
  };

  const onMergeConflicts = async () => {
    if (!form || !pendingContent) return;
    setShowConflict(false);
    try {
      const mergedForms = applyConflictMerges(
        forms as any,
        pendingContent,
        conflicts,
      );
      await formsRepository.saveMany(mergedForms as any);
      for (const f of mergedForms) dispatch(upsertForm(f as any));
      await doPublish(pendingContent, mergedForms as any);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to merge conflicts');
    }
  };

  const restoreVersion = (content: FormContent) => {
    if (!form) return;
    applyEdit(clone(content));
    toast.success('Version restored as draft (undoable)');
  };

  if (uiError) {
    return (
      <ErrorState
        title="Could not load builder"
        message={uiError}
        onRetry={() => void dispatch(bootstrapApp())}
      />
    );
  }

  if (!uiInitialized) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <ErrorState
        title="Form not found"
        message="The requested form could not be found."
        onRetry={() => void dispatch(bootstrapApp())}
      />
    );
  }

  if (!draft) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  const activeItem =
    resolved?.items.find((i) => getItemId(i) === activeId) ?? null;
  const previewResolved = resolved;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-muted-foreground text-xs">Builder</div>
          <h1 className="text-xl font-semibold">{form.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {(() => {
              const status = getFormStatus(form);
              if (status === 'unpublished_changes') {
                return (
                  <Badge variant="secondary">
                    {getFormStatusLabel(status)}
                  </Badge>
                );
              }
              if (status === 'draft') {
                return (
                  <Badge variant="outline">{getFormStatusLabel(status)}</Badge>
                );
              }
              return <Badge>Up to date</Badge>;
            })()}
            <AutosaveIndicator
              status={builder.autosaveStatus}
              lastSavedAt={builder.lastSavedAt}
              error={builder.autosaveError}
              onRetry={doRetrySave}
              onTriggerDebugError={triggerDebugSaveError}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dispatch(undo())}
            disabled={builder.past.length === 0}
            aria-label="Undo (Ctrl+Z)"
          >
            <Undo2 className="mr-1 size-4" />
            Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dispatch(redo())}
            disabled={builder.future.length === 0}
            aria-label="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="mr-1 size-4" />
            Redo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="mr-1 size-4" />
            History
          </Button>
          <div
            className="flex items-center rounded-md border p-0.5"
            role="group"
            aria-label="Preview width"
          >
            <Button
              type="button"
              size="sm"
              variant={
                builder.previewMode === 'desktop' ? 'secondary' : 'ghost'
              }
              onClick={() => dispatch(setPreviewMode('desktop'))}
              aria-label="Desktop preview"
            >
              <Monitor className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={builder.previewMode === 'mobile' ? 'secondary' : 'ghost'}
              onClick={() => dispatch(setPreviewMode('mobile'))}
              aria-label="Mobile preview"
            >
              <Smartphone className="size-4" />
            </Button>
          </div>
          <Link
            href={`/forms/${form.id}/preview`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <Eye className="mr-1 size-4" />
            Full preview
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreateChildOpen(true)}
          >
            Create child
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDetachOpen(true)}
            disabled={!form.parentFormId}
          >
            Detach
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
          <Button type="button" size="sm" onClick={startPublish}>
            Publish
          </Button>
        </div>
      </div>

      <div
        className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 lg:hidden dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        role="status"
      >
        Use a larger screen to edit this form. The builder requires a viewport
        width of at least 1024px.
      </div>

      <div className="hidden lg:block">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
          autoScroll={{ threshold: { x: 0.15, y: 0.15 } }}
        >
          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_320px] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
            <BuilderPalette
              items={PALETTE_ITEMS}
              existingFieldKeys={existingFieldKeys}
              onAdd={onAddClick}
            />
            <div className="space-y-4">
              <BuilderCanvas
                formId={form.id}
                items={resolved?.items ?? []}
                selectedId={builder.selectedItemId}
                onSelect={selectItem}
                onRemoveOwn={removeOwn}
                dragActive={!!activeId}
                overId={overId}
              />
              {previewResolved ? (
                <div
                  className={cn(
                    'rounded-lg border p-4',
                    builder.previewMode === 'mobile'
                      ? 'mx-auto max-w-[375px]'
                      : 'w-full',
                  )}
                >
                  <div className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                    Live preview ({builder.previewMode})
                  </div>
                  <FormRenderer
                    resolved={previewResolved as any}
                    onSubmit={() => {}}
                    disableSubmit
                    submitLabel={
                      previewResolved.settings.submitLabel ?? 'Submit'
                    }
                  />
                </div>
              ) : null}
            </div>
            <BuilderPropertiesPanel
              form={form}
              draft={draft}
              selectedItem={selectedItem as ResolvedItem | null}
              onUpdateOwnField={updateOwnField}
              onUpdateOwnElement={updateOwnElement}
              onSetElementOverride={setElementOverride}
              onSetOverride={setOverride}
              onResetInherited={resetInherited}
              onToggleLock={toggleLock}
              onRemoveOwn={removeOwn}
              onUpdateSettings={updateSettings}
            />
          </div>
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <div className="bg-background rounded-md border px-3 py-2 text-sm shadow-lg">
                {activeId.startsWith('palette:')
                  ? 'Adding item…'
                  : activeItem
                    ? resolvedItemLabel(activeItem)
                    : 'Moving…'}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      <VersionHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        versions={form.versions}
        currentDraft={draft}
        onRestore={restoreVersion}
      />
      <ImpactPreviewDialog
        open={showImpact}
        onOpenChange={setShowImpact}
        items={impactItems}
        onContinue={onImpactContinue}
        onCancel={() => {
          setShowImpact(false);
          setPendingContent(null);
        }}
      />
      <KeyConflictDialog
        open={showConflict}
        onOpenChange={setShowConflict}
        conflicts={buildConflictDetails()}
        onMerge={onMergeConflicts}
        onCancel={() => {
          setShowConflict(false);
          setPendingContent(null);
        }}
      />
      <CreateChildDialog
        open={createChildOpen}
        onOpenChange={setCreateChildOpen}
        parentFormId={form.id}
      />
      <DetachDialog
        open={detachOpen}
        onOpenChange={setDetachOpen}
        formId={form.id}
        onDetached={() => router.refresh()}
      />
      <DeleteFormDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        formId={form.id}
        onDeleted={() => router.push('/forms')}
      />
    </div>
  );
}
