'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  EyeOff,
  GripVertical,
  Link as LinkIcon,
  Lock,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ResolvedItem } from '@/types';
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
          'bg-primary absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-opacity',
          show ? 'opacity-100' : 'opacity-0',
        )}
      />
      {show ? (
        <div className="bg-primary absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full" />
      ) : null}
    </div>
  );
}

function SortableOwnRow({
  id,
  selected,
  onSelect,
  onRemove,
  children,
  isDraggingActive,
  overId,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  children: React.ReactNode;
  isDraggingActive: boolean;
  overId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'canvas-item', own: true } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  } as React.CSSProperties;
  return (
    <div ref={setNodeRef} style={style} className="space-y-0">
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          'group focus-visible:ring-ring rounded-md border p-3 outline-none focus-visible:ring-2',
          selected
            ? 'border-primary ring-primary/20 ring-2'
            : 'hover:border-foreground/20',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <button
              type="button"
              className="text-muted-foreground hover:bg-accent mt-0.5 cursor-grab touch-none rounded p-0.5"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="size-4" />
            </button>
            <div className="min-w-0">{children}</div>
          </div>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Remove item"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function InheritedRow({
  item,
  selected,
  onSelect,
  formId,
  id,
}: {
  item: ResolvedItem;
  selected: boolean;
  onSelect: () => void;
  formId: string;
  id: string;
}) {
  const field = item.kind === 'field' ? item.field : null;
  const locked = field?.locked ?? false;
  const hidden = field?.hidden ?? false;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'focus-visible:ring-ring rounded-md border p-3 outline-none focus-visible:ring-2',
        selected
          ? 'border-primary ring-primary/20 ring-2'
          : 'hover:border-foreground/20',
        locked ? 'bg-muted/30' : '',
      )}
      aria-label={`${resolvedItemLabel(item)}, inherited${locked ? ', locked' : ''}`}
      data-canvas-item-id={id}
    >
      <div className="flex items-start gap-2">
        <div className="text-muted-foreground mt-0.5 size-5" aria-hidden />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {resolvedItemLabel(item)}
            </span>
            <Badge variant="outline" className="gap-1">
              <LinkIcon className="size-3" />
              Inherited
            </Badge>
            {locked ? (
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" />
                Locked
              </Badge>
            ) : null}
            {hidden ? (
              <Badge variant="outline" className="gap-1">
                <EyeOff className="size-3" />
                Hidden
              </Badge>
            ) : null}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {item.kind === 'field'
              ? `${item.field.type} • key: ${item.field.key}`
              : `element • ${item.element.type}`}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvasDrop({
  dragActive,
  overId,
}: {
  dragActive: boolean;
  overId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'slot:empty',
    data: { type: 'slot', index: 0 },
  });
  const highlighted = dragActive && (isOver || overId === 'slot:empty');
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'text-muted-foreground rounded-md border-2 border-dashed p-10 text-center text-sm transition-colors',
        highlighted
          ? 'border-primary bg-primary/5 text-foreground'
          : 'border-border',
      )}
    >
      <p className="font-medium">Drop fields or elements here</p>
      <p className="mt-1 text-xs">
        Drag from the palette or click + to add. This canvas is a drop target
        when empty.
      </p>
      <div
        className={cn(
          'bg-primary mx-auto mt-4 h-0.5 max-w-xs rounded-full transition-opacity',
          highlighted ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}

export function BuilderCanvas({
  formId,
  items,
  selectedId,
  onSelect,
  onRemoveOwn,
  dragActive,
  overId,
}: {
  formId: string;
  items: ResolvedItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemoveOwn: (id: string, kind: 'field' | 'element') => void;
  dragActive: boolean;
  overId: string | null;
}) {
  const ownIds = items.filter((i) => isOwnCanvasItem(i, formId)).map(getItemId);

  return (
    <Card className="min-h-[420px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Canvas</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyCanvasDrop dragActive={dragActive} overId={overId} />
        ) : (
          <SortableContext
            items={ownIds}
            strategy={verticalListSortingStrategy}
          >
            <div
              className="max-h-[70vh] space-y-0 overflow-auto pr-1"
              role="list"
              aria-label="Form canvas"
            >
              <DropSlot id="slot:0" active={dragActive} overId={overId} />
              {items.map((item, index) => {
                const id = getItemId(item);
                const own = isOwnCanvasItem(item, formId);
                const selected = selectedId === id;
                const slotAfter = `slot:${index + 1}`;
                const meta = (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {resolvedItemLabel(item)}
                      </span>
                      {own ? <Badge variant="secondary">Own</Badge> : null}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {item.kind === 'field'
                        ? `${item.field.type} • key: ${item.field.key}`
                        : `element • ${item.element.type}`}
                    </div>
                  </div>
                );
                return (
                  <React.Fragment key={id}>
                    {own ? (
                      <SortableOwnRow
                        id={id}
                        selected={selected}
                        onSelect={() => onSelect(id)}
                        onRemove={() =>
                          onRemoveOwn(
                            id,
                            item.kind === 'field' ? 'field' : 'element',
                          )
                        }
                        isDraggingActive={dragActive}
                        overId={overId}
                      >
                        {meta}
                      </SortableOwnRow>
                    ) : (
                      <InheritedRow
                        id={id}
                        item={item}
                        selected={selected}
                        onSelect={() => onSelect(id)}
                        formId={formId}
                      />
                    )}
                    <DropSlot
                      id={slotAfter}
                      active={dragActive}
                      overId={overId}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}
