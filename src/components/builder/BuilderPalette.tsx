'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface PaletteItemDef {
  kind: 'field' | 'element';
  key?: string;
  type: string;
  label: string;
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
  const id = `palette:${item.kind}:${item.kind === 'field' ? item.key : item.type}`;
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
        'flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm',
        disabled
          ? 'bg-muted/40 text-muted-foreground opacity-70'
          : 'bg-background hover:bg-accent cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
      {...listeners}
      {...attributes}
      aria-label={
        disabled
          ? `${item.label}, already added`
          : `Drag ${item.label} to canvas or click to add`
      }
    >
      <span className="flex items-center gap-2">
        <GripVertical className="text-muted-foreground size-4" aria-hidden />
        <span>{item.label}</span>
      </span>
      <span className="flex items-center gap-1">
        {disabled ? (
          <Badge variant="secondary" className="text-[10px]">
            Added
          </Badge>
        ) : (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label={`Add ${item.label}`}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Plus className="size-3.5" />
          </Button>
        )}
      </span>
    </div>
  );
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
  const fields = items.filter((i) => i.kind === 'field');
  const elements = items.filter((i) => i.kind === 'element');

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Palette</CardTitle>
        <p className="text-muted-foreground text-xs">
          Drag items onto the canvas or click + to add.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Fields
          </div>
          <div className="grid gap-1.5">
            {fields.map((item) => {
              const disabled = !!item.key && existingFieldKeys.has(item.key);
              return (
                <DraggablePaletteItem
                  key={`f-${item.key}`}
                  item={item}
                  disabled={disabled}
                  onAdd={() => onAdd(item)}
                />
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Elements
          </div>
          <div className="grid gap-1.5">
            {elements.map((item) => (
              <DraggablePaletteItem
                key={`e-${item.type}`}
                item={item}
                disabled={false}
                onAdd={() => onAdd(item)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
