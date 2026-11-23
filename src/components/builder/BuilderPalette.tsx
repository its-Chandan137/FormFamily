'use client';

import { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, GripVertical, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldTypeIcon } from '@/components/shared/FieldTypeIcon';

export interface PaletteItemDef {
  kind: 'field' | 'element';
  key?: string;
  type: string;
  label: string;
  /** Preset library field (fixed key). Generic fields omit key. */
  preset?: boolean;
}

interface CategoryDef {
  id: string;
  title: string;
  items: PaletteItemDef[];
}

function DraggablePaletteItem({
  item,
  disabled,
  onAdd,
}: {
  item: PaletteItemDef;
  disabled: boolean;
  onAdd: () => void;
}) {
  const id = `palette:${item.kind}:${item.kind === 'field' ? (item.key ?? item.type) : item.type}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled, data: { source: 'palette', item } });
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group dark:border-border dark:bg-card flex h-[40px] items-center gap-2 rounded-lg border border-[#E5E9F2] bg-white px-2.5 text-left transition-all',
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'dark:hover:bg-accent/30 cursor-grab hover:border-[#C7CDFB] hover:bg-[#F7F8FF] active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={
        disabled ? `${item.label}, already added` : `Add ${item.label}`
      }
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onAdd();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd();
        }
      }}
    >
      <span className="dark:text-muted-foreground text-[#75809A]">
        <FieldTypeIcon type={item.type} className="size-4" />
      </span>
      <span className="dark:text-foreground min-w-0 flex-1 truncate text-[13px] font-medium text-[#17213D]">
        {item.label}
      </span>
      <GripVertical
        className="size-3.5 shrink-0 text-[#A3ADC2] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden
      />
    </div>
  );
}

function CategorySection({
  category,
  collapsed,
  onToggle,
  existingFieldKeys,
  onAdd,
}: {
  category: CategoryDef;
  collapsed: boolean;
  onToggle: () => void;
  existingFieldKeys: Set<string>;
  onAdd: (item: PaletteItemDef) => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="flex w-full items-center justify-between px-1 text-left"
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span className="dark:text-muted-foreground text-[12px] font-semibold tracking-wide text-[#4B587C] uppercase">
          {category.title}
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-[#75809A] transition-transform',
            collapsed && '-rotate-90',
          )}
        />
      </button>
      {!collapsed ? (
        <div className="space-y-1.5">
          {category.items.map((item) => {
            const disabled =
              item.kind === 'field' &&
              !!item.key &&
              existingFieldKeys.has(item.key);
            return (
              <DraggablePaletteItem
                key={`${item.kind}:${item.key ?? item.type}`}
                item={item}
                disabled={disabled}
                onAdd={() => onAdd(item)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const BASIC_TYPES = new Set([
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'select',
  'multiselect',
  'date',
  'time',
  'checkbox',
  'radio',
  'toggle',
  'currency',
  'datetime',
  'daterange',
  'checkbox_group',
  'likert',
]);

const ADVANCED_TYPES = new Set([
  'file',
  'file_multiple',
  'address_group',
  'name_group',
  'rating',
  'slider',
  'signature',
  'hidden',
  'repeater',
]);

const LAYOUT_TYPES = new Set([
  'section',
  'logo',
  'heading',
  'richtext',
  'divider',
]);

const LABEL_OVERRIDES: Record<string, string> = {
  text: 'Text Input',
  textarea: 'Text Area',
  number: 'Number',
  email: 'Email',
  phone: 'Phone',
  select: 'Select',
  multiselect: 'Multi Select',
  date: 'Date Picker',
  time: 'Time Picker',
  checkbox: 'Checkbox',
  radio: 'Radio Button',
  toggle: 'Toggle Switch',
  file: 'File Upload',
  file_multiple: 'Multiple File Upload',
  address_group: 'Address',
  name_group: 'Name Group',
  rating: 'Rating',
  slider: 'Slider',
  signature: 'Signature',
  hidden: 'Hidden Field',
  section: 'Section',
  logo: 'Logo',
  heading: 'Heading',
  richtext: 'Rich Text',
  divider: 'Divider',
  currency: 'Currency',
  datetime: 'Date & Time',
  daterange: 'Date Range',
  checkbox_group: 'Checkbox Group',
  likert: 'Likert Scale',
  repeater: 'Repeater',
};

function categorize(items: PaletteItemDef[]): CategoryDef[] {
  const basic: PaletteItemDef[] = [];
  const advanced: PaletteItemDef[] = [];
  const layout: PaletteItemDef[] = [];
  const presets: PaletteItemDef[] = [];

  for (const item of items) {
    const normalized: PaletteItemDef = {
      ...item,
      label: LABEL_OVERRIDES[item.type] ?? item.label,
    };
    if (item.preset) {
      presets.push(normalized);
      continue;
    }
    if (item.kind === 'element' || LAYOUT_TYPES.has(item.type)) {
      layout.push(normalized);
      continue;
    }
    if (ADVANCED_TYPES.has(item.type)) {
      advanced.push(normalized);
      continue;
    }
    if (BASIC_TYPES.has(item.type)) {
      basic.push(normalized);
      continue;
    }
    basic.push(normalized);
  }

  const cats: CategoryDef[] = [];
  if (basic.length)
    cats.push({ id: 'basic', title: 'Basic Fields', items: basic });
  if (advanced.length)
    cats.push({ id: 'advanced', title: 'Advanced Fields', items: advanced });
  if (layout.length)
    cats.push({ id: 'layout', title: 'Layout Elements', items: layout });
  if (presets.length)
    cats.push({ id: 'presets', title: 'Preset Fields', items: presets });
  return cats;
}

export function BuilderPalette({
  items,
  existingFieldKeys,
  onAdd,
}: {
  items: PaletteItemDef[];
  existingFieldKeys: Set<string>;
  onAdd: (item: PaletteItemDef) => void;
}) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => categorize(items), [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter((i) =>
          `${i.label} ${i.type} ${i.key ?? ''}`.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, query]);

  return (
    <aside className="dark:border-border dark:bg-card flex h-full min-h-0 flex-col rounded-xl border border-[#E5E9F2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="dark:border-border border-b border-[#E5E9F2] px-4 py-4">
        <h2 className="dark:text-foreground text-[15px] font-semibold text-[#17213D]">
          Form Elements
        </h2>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#75809A]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields..."
            className="dark:border-border dark:bg-background dark:text-foreground h-10 w-full rounded-lg border border-[#E5E9F2] bg-[#FBFCFE] pr-3 pl-9 text-sm text-[#17213D] outline-none placeholder:text-[#94A0B8] focus:border-[#5945F5] focus:ring-2 focus:ring-[#5945F5]/15"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {filtered.length === 0 ? (
          <p className="px-1 text-sm text-[#75809A]">
            No fields match your search.
          </p>
        ) : (
          filtered.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              collapsed={!!collapsed[category.id] && !query.trim()}
              onToggle={() =>
                setCollapsed((s) => ({ ...s, [category.id]: !s[category.id] }))
              }
              existingFieldKeys={existingFieldKeys}
              onAdd={onAdd}
            />
          ))
        )}
      </div>
    </aside>
  );
}
