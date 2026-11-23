'use client';

import React, { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  Copy,
  GripVertical,
  Link as LinkIcon,
  Lock,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Plus,
  Redo2,
  Trash2,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  FormContent,
  FormRecord,
  ResolvedForm,
  ResolvedItem,
} from '@/types';
import {
  getItemId,
  isOwnCanvasItem,
  resolvedItemLabel,
} from '@/lib/builder/helpers';

function DropSlot({
  id,
  active,
  overId,
}: {
  id: string;
  active: boolean;
  overId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'slot' } });
  const show = active && (isOver || overId === id);
  return (
    <div ref={setNodeRef} className="relative h-3" aria-hidden>
      <div
        className={cn(
          'absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all',
          show ? 'bg-[#5945F5] opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}

function FieldPreview({ item }: { item: ResolvedItem }) {
  if (item.kind === 'element') {
    const el = item.element;
    if (el.type === 'heading') {
      return (
        <div className="dark:text-foreground text-lg font-semibold text-[#17213D]">
          {String(el.props.text ?? 'Heading')}
        </div>
      );
    }
    if (el.type === 'richtext') {
      return (
        <div
          className="prose prose-sm dark:text-muted-foreground max-w-none text-[#4B587C]"
          dangerouslySetInnerHTML={{
            __html: String(el.props.html ?? '<p>Rich text</p>'),
          }}
        />
      );
    }
    if (el.type === 'divider') return <hr className="border-[#E5E9F2]" />;
    if (el.type === 'logo') {
      const src = String(el.props.src ?? '');
      return src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={String(el.props.alt ?? 'Logo')}
          className="h-10 w-auto object-contain"
        />
      ) : (
        <div className="flex h-12 w-32 items-center justify-center rounded-md border border-dashed border-[#D5DBE7] text-xs text-[#75809A]">
          Logo
        </div>
      );
    }
    return null;
  }

  const f = item.field;
  const common =
    'h-10 w-full rounded-lg border border-[#E5E9F2] bg-[#FBFCFE] px-3 text-sm text-[#94A0B8] dark:border-border dark:bg-background';
  switch (f.type) {
    case 'textarea':
      return (
        <div className="dark:border-border dark:bg-background h-24 w-full rounded-lg border border-[#E5E9F2] bg-[#FBFCFE] px-3 py-2 text-sm text-[#94A0B8]">
          {f.placeholder || 'Enter text...'}
        </div>
      );
    case 'select':
    case 'multiselect':
      return (
        <div className={cn(common, 'flex items-center justify-between')}>
          <span>{f.placeholder || 'Select...'}</span>
          <ChevronDown className="size-4" />
        </div>
      );
    case 'checkbox':
    case 'toggle':
      return (
        <div className="flex items-center gap-2 text-sm text-[#4B587C]">
          <div className="size-4 rounded border border-[#C9D2E3]" />
          {f.label}
        </div>
      );
    case 'checkbox_group':
    case 'radio':
    case 'likert':
      return (
        <div
          className={cn(
            'flex gap-3',
            f.optionLayout === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
          )}
        >
          {(f.options ?? ['Option 1', 'Option 2']).slice(0, 4).map((opt) => (
            <div
              key={opt}
              className="flex items-center gap-2 text-sm text-[#4B587C]"
            >
              <div
                className={cn(
                  'size-4 border border-[#C9D2E3]',
                  f.type === 'radio' || f.type === 'likert'
                    ? 'rounded-full'
                    : 'rounded',
                )}
              />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      );
    case 'file':
    case 'file_multiple':
      return (
        <div className="dark:border-border dark:bg-background flex flex-col items-center justify-center rounded-lg border border-dashed border-[#C9D2E3] bg-[#FBFCFE] px-4 py-6 text-center text-sm text-[#75809A]">
          <span className="font-medium text-[#5945F5]">
            Drag and drop file here
          </span>
          <span>or click to upload</span>
        </div>
      );
    case 'rating':
      return (
        <div className="flex gap-1 text-[#D5DBE7]">
          {'★★★★★'.split('').map((s, i) => (
            <span key={i} className="text-xl">
              {s}
            </span>
          ))}
        </div>
      );
    case 'slider':
      return (
        <div className="py-2">
          <div className="h-2 rounded-full bg-[#E5E9F2]">
            <div className="h-2 w-1/3 rounded-full bg-[#5945F5]" />
          </div>
        </div>
      );
    case 'signature':
      return (
        <div className="dark:border-border dark:bg-background h-24 rounded-lg border border-dashed border-[#C9D2E3] bg-[#FBFCFE]" />
      );
    case 'address_group':
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className={cn(common, 'sm:col-span-2')} />
          <div className={common} />
          <div className={common} />
        </div>
      );
    case 'name_group':
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className={common} />
          <div className={common} />
          <div className={common} />
        </div>
      );
    case 'repeater':
      return (
        <div className="rounded-lg border border-dashed border-[#C9D2E3] p-3 text-sm text-[#75809A]">
          Repeater items
        </div>
      );
    case 'hidden':
      return (
        <div className="rounded-md bg-slate-100 px-3 py-2 text-xs text-[#75809A]">
          Hidden field (not visible to users)
        </div>
      );
    default:
      return (
        <div className={common + ' flex items-center'}>
          {f.placeholder || `Enter ${f.label.toLowerCase()}`}
        </div>
      );
  }
}

function SortableCanvasItem({
  item,
  formId,
  selected,
  onSelect,
  onRemoveOwn,
  onDuplicateSelected,
}: {
  item: ResolvedItem;
  formId: string;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemoveOwn: (id: string, kind: 'field' | 'element') => void;
  onDuplicateSelected: () => void;
}) {
  const id = getItemId(item);
  const isOwn = isOwnCanvasItem(item, formId);
  const isLocked = item.kind === 'field' && item.field.locked;
  const disabled = isLocked;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled, data: { source: 'canvas', item } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const isSection = item.kind === 'element' && item.element.type === 'section';
  if (isSection) return null; // sections rendered by wrapper

  const label =
    item.kind === 'field' ? item.field.label : resolvedItemLabel(item);
  const required = item.kind === 'field' && item.field.required;
  const showLabel = !(
    item.kind === 'field' &&
    (item.field.type === 'checkbox' || item.field.type === 'toggle')
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group dark:bg-card relative rounded-lg border bg-white px-4 py-3 transition-all',
        selected
          ? 'border-[#5945F5] bg-[#F7F6FF] ring-1 ring-[#5945F5]/20 dark:bg-[#5945F5]/5'
          : 'border-transparent hover:border-[#DCE3F0]',
        isDragging && 'opacity-40',
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      aria-label={`Select ${label}`}
    >
      {!disabled ? (
        <button
          type="button"
          className="absolute top-1/2 -left-2 -translate-y-1/2 rounded-md border bg-white p-1 text-[#75809A] opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          {...listeners}
          {...attributes}
          aria-label={`Drag ${label}`}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-3.5" />
        </button>
      ) : null}

      {selected && isOwn ? (
        <div className="dark:bg-card absolute -top-3 right-3 flex items-center gap-1 rounded-md border border-[#E5E9F2] bg-white p-1 shadow-sm">
          <button
            type="button"
            className="rounded p-1 text-[#75809A] hover:bg-slate-100 hover:text-[#17213D]"
            aria-label="Duplicate field"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateSelected();
            }}
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-[#75809A] hover:bg-red-50 hover:text-red-600"
            aria-label="Delete field"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveOwn(id, item.kind);
            }}
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-[#75809A] hover:bg-slate-100 hover:text-[#17213D]"
            aria-label="More options"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      ) : null}

      {showLabel ? (
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="dark:text-foreground text-sm font-medium text-[#17213D]">
            {label}
          </span>
          {required ? <span className="text-red-500">*</span> : null}
          {!isOwn ? (
            <span className="inline-flex items-center gap-1 rounded bg-[#EEF0FF] px-1.5 py-0.5 text-[10px] font-medium text-[#5945F5]">
              <LinkIcon className="size-3" /> Inherited
            </span>
          ) : null}
          {isLocked ? (
            <Lock className="size-3.5 text-amber-600" aria-label="Locked" />
          ) : null}
        </div>
      ) : (
        <div className="mb-1 flex items-center gap-2">
          {!isOwn ? (
            <span className="inline-flex items-center gap-1 rounded bg-[#EEF0FF] px-1.5 py-0.5 text-[10px] font-medium text-[#5945F5]">
              <LinkIcon className="size-3" /> Inherited
            </span>
          ) : null}
          {isLocked ? (
            <Lock className="size-3.5 text-amber-600" aria-label="Locked" />
          ) : null}
        </div>
      )}
      <FieldPreview item={item} />
      {item.kind === 'field' && item.field.helpText ? (
        <p className="mt-1.5 text-xs text-[#75809A]">{item.field.helpText}</p>
      ) : null}
    </div>
  );
}

type Block = {
  section: ResolvedItem | null;
  items: ResolvedItem[];
};

function buildBlocks(items: ResolvedItem[]): Block[] {
  const blocks: Block[] = [];
  let current: Block = { section: null, items: [] };
  for (const item of items) {
    if (item.kind === 'element' && item.element.type === 'section') {
      if (current.section || current.items.length) blocks.push(current);
      current = { section: item, items: [] };
    } else {
      current.items.push(item);
    }
  }
  if (current.section || current.items.length) blocks.push(current);
  if (blocks.length === 0) blocks.push({ section: null, items: [] });
  return blocks;
}

function SortableSectionHeader({
  section,
  sectionIndex,
  selected,
  collapsed,
  onSelect,
  onToggle,
  onRemoveOwn,
  onDuplicateSelected,
  formId,
}: {
  section: ResolvedItem & { kind: 'element' };
  sectionIndex: number;
  selected: boolean;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onToggle: () => void;
  onRemoveOwn: (id: string, kind: 'field' | 'element') => void;
  onDuplicateSelected: () => void;
  formId: string;
}) {
  const id = getItemId(section);
  const isOwn = isOwnCanvasItem(section, formId);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: false,
    data: { source: 'canvas', item: section },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group dark:border-border relative flex items-center gap-3 border-b border-[#E5E9F2] px-5 py-4',
        selected && 'bg-[#F7F6FF]',
        isDragging && 'opacity-40',
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
    >
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-[#5945F5] text-xs font-semibold text-white">
        {sectionIndex}
      </span>
      <div className="min-w-0 flex-1">
        <div className="dark:text-foreground truncate text-sm font-semibold text-[#17213D]">
          {String(section.element.props.title ?? 'Section')}
        </div>
        {section.element.props.description ? (
          <div className="truncate text-xs text-[#75809A]">
            {String(section.element.props.description)}
          </div>
        ) : null}
      </div>
      {selected && isOwn ? (
        <div className="flex items-center gap-1 rounded-md border border-[#E5E9F2] bg-white p-1 shadow-sm">
          <button
            type="button"
            className="rounded p-1 text-[#75809A] hover:bg-slate-100"
            aria-label="Duplicate section"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateSelected();
            }}
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-[#75809A] hover:bg-red-50 hover:text-red-600"
            aria-label="Delete section"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveOwn(id, 'element');
            }}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="rounded-md p-1.5 text-[#75809A] hover:bg-slate-100"
        aria-label={collapsed ? 'Expand section' : 'Collapse section'}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <ChevronDown
          className={cn(
            'size-4 transition-transform',
            collapsed && '-rotate-90',
          )}
        />
      </button>
      <button
        type="button"
        className="cursor-grab rounded-md p-1 text-[#A3ADC2] hover:bg-slate-100 active:cursor-grabbing"
        {...listeners}
        {...attributes}
        aria-label="Drag section"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-4" />
      </button>
    </div>
  );
}

export function BuilderCanvas({
  formId,
  form,
  draft,
  items,
  selectedId,
  onSelect,
  onRemoveOwn,
  onDuplicateSelected,
  dragActive,
  overId,
  canvasTab,
  onCanvasTabChange,
  zoom,
  onZoomChange,
  isFullscreen,
  onToggleFullscreen,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  previewMode: _previewMode,
  onPreviewModeChange: _onPreviewModeChange,
  onUpdateSettings,
  previewResolved: _previewResolved,
  onAddSection,
}: {
  formId: string;
  form: FormRecord;
  draft: FormContent;
  items: ResolvedItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemoveOwn: (id: string, kind: 'field' | 'element') => void;
  onDuplicateSelected: () => void;
  dragActive: boolean;
  overId: string | null;
  canvasTab: 'build' | 'settings' | 'integrations';
  onCanvasTabChange: (tab: 'build' | 'settings' | 'integrations') => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  previewMode: 'desktop' | 'mobile';
  onPreviewModeChange: (m: 'desktop' | 'mobile') => void;
  onUpdateSettings: (
    patch: Partial<FormContent['settings']>,
    coalesceKey?: string,
  ) => void;
  previewResolved: ResolvedForm | null; // kept for API compatibility
  onAddSection: () => void;
}) {
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const itemIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const item of items) {
      const id = getItemId(item);
      if (seen.has(id)) {
        // Defensive: avoid React/dnd-kit duplicate-key crashes from bad data.
        continue;
      }
      seen.add(id);
      ids.push(id);
    }
    return ids;
  }, [items]);
  const blocks = useMemo(() => buildBlocks(items), [items]);

  const renderFieldList = (
    blockItems: ResolvedItem[],
    slotOffset: number,
    isLastBlock: boolean,
  ) => (
    <div className="space-y-1">
      {blockItems.length === 0 ? (
        <DropSlot
          id={`slot:${slotOffset}`}
          active={dragActive}
          overId={overId}
        />
      ) : null}
      {blockItems.map((item, idx) => {
        const absoluteIndex = slotOffset + idx;
        return (
          <React.Fragment key={`${getItemId(item)}-${absoluteIndex}`}>
            <DropSlot
              id={`slot:${absoluteIndex}`}
              active={dragActive}
              overId={overId}
            />
            <SortableCanvasItem
              item={item}
              formId={formId}
              selected={selectedId === getItemId(item)}
              onSelect={onSelect}
              onRemoveOwn={onRemoveOwn}
              onDuplicateSelected={onDuplicateSelected}
            />
          </React.Fragment>
        );
      })}
      {isLastBlock ? (
        <DropSlot
          id={`slot:${slotOffset + blockItems.length}`}
          active={dragActive}
          overId={overId}
        />
      ) : null}
    </div>
  );

  // Compute absolute slot offsets per block
  const blockOffsets = useMemo(() => {
    const offsets: number[] = [];
    let off = 0;
    for (const b of blocks) {
      const hasSection = b.section ? 1 : 0;
      offsets.push(off + hasSection);
      off += hasSection + b.items.length;
    }
    return offsets;
  }, [blocks]);

  return (
    <section className="dark:border-border dark:bg-card flex h-full min-h-0 flex-col rounded-xl border border-[#E5E9F2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="dark:border-border flex h-11 items-center justify-between border-b border-[#E5E9F2] px-4">
        <div className="flex items-center gap-5">
          {(['build', 'settings', 'integrations'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onCanvasTabChange(tab)}
              className={cn(
                'relative h-11 text-sm font-medium capitalize transition-colors',
                canvasTab === tab
                  ? 'text-[#5945F5]'
                  : 'text-[#75809A] hover:text-[#17213D]',
              )}
            >
              {tab}
              {canvasTab === tab ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#5945F5]" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <Redo2 className="size-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-[#E5E9F2]" />
          <select
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="h-8 rounded-md border border-[#E5E9F2] bg-white px-2 text-xs text-[#17213D]"
            aria-label="Zoom"
          >
            {[75, 90, 100, 110, 125].map((z) => (
              <option key={z} value={z}>
                {z}%
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div
        className="dark:bg-background/40 min-h-0 flex-1 overflow-y-auto bg-[#F7F8FC] p-4"
        onClick={() => onSelect(null)}
      >
        <div
          style={{ zoom: zoom / 100 }}
          className="mx-auto max-w-5xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {canvasTab === 'settings' ? (
            <div className="dark:border-border dark:bg-card rounded-xl border border-[#E5E9F2] bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[#17213D]">
                Form Settings
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-[#17213D]">Form title</span>
                  <input
                    className="h-10 w-full rounded-lg border border-[#E5E9F2] px-3"
                    value={draft.settings.title ?? ''}
                    onChange={(e) =>
                      onUpdateSettings(
                        { title: e.target.value },
                        'settings.title',
                      )
                    }
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-[#17213D]">
                    Submit label
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-[#E5E9F2] px-3"
                    value={draft.settings.submitLabel ?? ''}
                    onChange={(e) =>
                      onUpdateSettings(
                        { submitLabel: e.target.value },
                        'settings.submitLabel',
                      )
                    }
                  />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="font-medium text-[#17213D]">
                    Description
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-[#E5E9F2] px-3 py-2"
                    value={draft.settings.about ?? ''}
                    onChange={(e) =>
                      onUpdateSettings(
                        { about: e.target.value },
                        'settings.about',
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ) : canvasTab === 'integrations' ? (
            <div className="dark:border-border dark:bg-card rounded-xl border border-[#E5E9F2] bg-white p-8 text-center shadow-sm">
              <h3 className="text-base font-semibold text-[#17213D]">
                Integrations
              </h3>
              <p className="mt-2 text-sm text-[#75809A]">
                Manage GHL and other integrations from the Integrations page.
                Form-level integration settings will appear here.
              </p>
            </div>
          ) : (
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
              {items.length === 0 ? (
                <div
                  className={cn(
                    'rounded-xl border border-dashed px-6 py-16 text-center transition-colors',
                    dragActive
                      ? 'border-[#5945F5] bg-[#F7F6FF]'
                      : 'border-[#C9D2E3] bg-white',
                  )}
                >
                  <p className="text-sm font-medium text-[#17213D]">
                    Start building your form
                  </p>
                  <p className="mt-1 text-sm text-[#75809A]">
                    Drag fields from the left panel or click to add them.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <DropSlot
                      id="slot:empty"
                      active={dragActive}
                      overId={overId}
                    />
                  </div>
                </div>
              ) : null}

              {blocks.map((block, blockIdx) => {
                const section = block.section;
                const sectionId = section
                  ? getItemId(section)
                  : `__default_${blockIdx}`;
                const collapsed = section
                  ? !!collapsedSections[sectionId]
                  : false;
                const sectionIndex = blocks.filter(
                  (b, i) => b.section && i <= blockIdx,
                ).length;
                const blockOffset = blockOffsets[blockIdx];

                return (
                  <div
                    key={sectionId}
                    className="dark:border-border dark:bg-card rounded-xl border border-[#E5E9F2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]"
                  >
                    {section ? (
                      <>
                        <DropSlot
                          id={`slot:${Math.max(0, blockOffset - 1)}`}
                          active={dragActive}
                          overId={overId}
                        />
                        <SortableSectionHeader
                          section={
                            section as ResolvedItem & { kind: 'element' }
                          }
                          sectionIndex={sectionIndex}
                          selected={selectedId === getItemId(section)}
                          collapsed={collapsed}
                          onSelect={(id) => onSelect(id)}
                          onToggle={() =>
                            setCollapsedSections((s) => ({
                              ...s,
                              [sectionId]: !s[sectionId],
                            }))
                          }
                          onRemoveOwn={onRemoveOwn}
                          onDuplicateSelected={onDuplicateSelected}
                          formId={formId}
                        />
                      </>
                    ) : null}
                    {!collapsed ? (
                      <div className="p-4 md:p-5">
                        {renderFieldList(
                          block.items,
                          blockOffset,
                          blockIdx === blocks.length - 1,
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={onAddSection}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#B9AFFF] bg-[#FBFAFF] px-4 py-4 text-sm font-medium text-[#5945F5] transition-colors hover:bg-[#F1EEFF]"
              >
                <Plus className="size-4" />
                Add Section
              </button>
            </SortableContext>
          )}
        </div>
      </div>
    </section>
  );
}
