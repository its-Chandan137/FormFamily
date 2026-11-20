'use client';

import { Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/builder/RichTextEditor';
import type {
  FormContent,
  FormRecord,
  LayoutElement,
  OwnField,
  ResolvedItem,
} from '@/types';

export function BuilderPropertiesPanel({
  form,
  draft,
  selectedItem,
  onUpdateOwnField,
  onUpdateOwnElement,
  onSetOverride,
  onToggleLock,
  onRemoveOwn,
  onUpdateSettings,
}: {
  form: FormRecord;
  draft: FormContent;
  selectedItem: ResolvedItem | null;
  onUpdateOwnField: (
    key: string,
    patch: Partial<OwnField>,
    coalesceKey?: string,
  ) => void;
  onUpdateOwnElement: (
    id: string,
    patch: Partial<LayoutElement>,
    coalesceKey?: string,
  ) => void;
  onSetOverride: (key: string, patch: Record<string, unknown>) => void;
  onToggleLock: (id: string) => void;
  onRemoveOwn: (id: string, kind: 'field' | 'element') => void;
  onUpdateSettings: (
    patch: Partial<FormContent['settings']>,
    coalesceKey?: string,
  ) => void;
}) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedItem ? (
          <p className="text-muted-foreground text-sm">
            Select an item on the canvas to edit its properties.
          </p>
        ) : selectedItem.kind === 'element' ? (
          <ElementProps
            form={form}
            draft={draft}
            element={selectedItem.element}
            inherited={
              selectedItem.sourceFormId !== form.id ||
              selectedItem.origin === 'inherited'
            }
            onUpdate={onUpdateOwnElement}
            onRemove={onRemoveOwn}
          />
        ) : selectedItem.field.origin === 'inherited' ? (
          <InheritedFieldProps
            field={selectedItem.field}
            draft={draft}
            onSetOverride={onSetOverride}
            onToggleLock={onToggleLock}
          />
        ) : (
          <OwnFieldProps
            fieldKey={selectedItem.field.key}
            draft={draft}
            onUpdate={onUpdateOwnField}
            onToggleLock={onToggleLock}
            onRemove={onRemoveOwn}
          />
        )}

        <Separator />
        <div className="space-y-3">
          <div className="text-sm font-medium">Form settings</div>
          <div className="space-y-1">
            <Label htmlFor="settings-title">Title</Label>
            <Input
              id="settings-title"
              value={draft.settings.title ?? ''}
              onChange={(e) =>
                onUpdateSettings({ title: e.target.value }, 'settings.title')
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="settings-company">Company name</Label>
            <Input
              id="settings-company"
              value={draft.settings.companyName ?? ''}
              onChange={(e) =>
                onUpdateSettings(
                  { companyName: e.target.value },
                  'settings.companyName',
                )
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="settings-submit">Submit label</Label>
            <Input
              id="settings-submit"
              value={draft.settings.submitLabel ?? ''}
              onChange={(e) =>
                onUpdateSettings(
                  { submitLabel: e.target.value },
                  'settings.submitLabel',
                )
              }
            />
          </div>
          <div className="space-y-1">
            <Label>About (rich text)</Label>
            <RichTextEditor
              value={draft.settings.about ?? ''}
              onChange={(html) =>
                onUpdateSettings({ about: html }, 'settings.about')
              }
              placeholder="Describe the role or form..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ElementProps({
  form,
  draft,
  element,
  inherited,
  onUpdate,
  onRemove,
}: {
  form: FormRecord;
  draft: FormContent;
  element: LayoutElement;
  inherited: boolean;
  onUpdate: (
    id: string,
    patch: Partial<LayoutElement>,
    coalesceKey?: string,
  ) => void;
  onRemove: (id: string, kind: 'field' | 'element') => void;
}) {
  const own = !inherited && draft.elements.some((e) => e.id === element.id);
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Element: {element.type}</div>
      {element.type === 'heading' ? (
        <div className="space-y-1">
          <Label>Text</Label>
          <Input
            value={String(element.props.text ?? '')}
            onChange={(e) =>
              own &&
              onUpdate(
                element.id,
                { props: { ...element.props, text: e.target.value } },
                `el.${element.id}.text`,
              )
            }
            disabled={!own}
          />
        </div>
      ) : null}
      {element.type === 'section' ? (
        <>
          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              value={String(element.props.title ?? '')}
              onChange={(e) =>
                own &&
                onUpdate(
                  element.id,
                  { props: { ...element.props, title: e.target.value } },
                  `el.${element.id}.title`,
                )
              }
              disabled={!own}
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={String(element.props.description ?? '')}
              onChange={(e) =>
                own &&
                onUpdate(
                  element.id,
                  { props: { ...element.props, description: e.target.value } },
                  `el.${element.id}.desc`,
                )
              }
              disabled={!own}
            />
          </div>
        </>
      ) : null}
      {element.type === 'richtext' ? (
        <div className="space-y-1">
          <Label>Content</Label>
          {own ? (
            <RichTextEditor
              value={String(element.props.html ?? '')}
              onChange={(html) =>
                onUpdate(
                  element.id,
                  { props: { ...element.props, html } },
                  `el.${element.id}.html`,
                )
              }
            />
          ) : (
            <div
              className="prose prose-sm max-w-none rounded-md border p-3"
              dangerouslySetInnerHTML={{
                __html: String(element.props.html ?? ''),
              }}
            />
          )}
        </div>
      ) : null}
      {element.type === 'logo' ? (
        <div className="space-y-1">
          <Label>Logo URL (optional, falls back to form setting)</Label>
          <Input
            value={String(element.props.src ?? '')}
            onChange={(e) =>
              own &&
              onUpdate(element.id, {
                props: { ...element.props, src: e.target.value },
              })
            }
            disabled={!own}
          />
        </div>
      ) : null}
      {own ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(element.id, 'element')}
        >
          Remove element
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">
          Inherited element (source form:{' '}
          {form.id === element.id ? 'current' : 'ancestor'}).
        </p>
      )}
    </div>
  );
}

function InheritedFieldProps({
  field,
  draft,
  onSetOverride,
  onToggleLock,
}: {
  field: any;
  draft: FormContent;
  onSetOverride: (key: string, patch: Record<string, unknown>) => void;
  onToggleLock: (id: string) => void;
}) {
  const override = draft.overrides?.[field.key] ?? {};
  const locked = field.locked as boolean;
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        {field.label} <span className="text-muted-foreground">(inherited)</span>
      </div>
      {locked ? (
        <p className="flex items-center gap-1 text-sm text-amber-700">
          <Lock className="size-4" /> Locked by ancestor and cannot be changed.
        </p>
      ) : null}
      <div className="space-y-1">
        <Label>Label override</Label>
        <Input
          value={(override.label ?? field.label) as string}
          onChange={(e) => onSetOverride(field.key, { label: e.target.value })}
          disabled={locked}
        />
      </div>
      <div className="space-y-1">
        <Label>Placeholder override</Label>
        <Input
          value={(override.placeholder ?? field.placeholder ?? '') as string}
          onChange={(e) =>
            onSetOverride(field.key, { placeholder: e.target.value })
          }
          disabled={locked}
        />
      </div>
      <div className="space-y-1">
        <Label>Help text override</Label>
        <Input
          value={(override.helpText ?? field.helpText ?? '') as string}
          onChange={(e) =>
            onSetOverride(field.key, { helpText: e.target.value })
          }
          disabled={locked}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Hidden</Label>
        <Switch
          checked={!!field.hidden}
          onCheckedChange={(v) => onSetOverride(field.key, { hidden: v })}
          disabled={locked}
          aria-label="Hide inherited field"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Optional (not required)</Label>
        <Switch
          checked={!field.required}
          onCheckedChange={(v) => onSetOverride(field.key, { required: !v })}
          disabled={locked}
          aria-label="Make inherited field optional"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Lock for descendants</Label>
        <Switch
          checked={(draft.locks ?? []).includes(field.key)}
          onCheckedChange={() => onToggleLock(field.key)}
          aria-label="Lock field for descendants"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onSetOverride(field.key, {
            label: undefined,
            placeholder: undefined,
            helpText: undefined,
            required: undefined,
            hidden: undefined,
          })
        }
        disabled={locked}
      >
        Reset to inherited
      </Button>
    </div>
  );
}

function OwnFieldProps({
  fieldKey,
  draft,
  onUpdate,
  onToggleLock,
  onRemove,
}: {
  fieldKey: string;
  draft: FormContent;
  onUpdate: (
    key: string,
    patch: Partial<OwnField>,
    coalesceKey?: string,
  ) => void;
  onToggleLock: (id: string) => void;
  onRemove: (id: string, kind: 'field' | 'element') => void;
}) {
  const ownField = draft.ownFields.find((x) => x.key === fieldKey);
  if (!ownField) return <p className="text-sm">Field not found in draft.</p>;
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        {ownField.label} <span className="text-muted-foreground">(own)</span>
      </div>
      <div className="space-y-1">
        <Label>Label</Label>
        <Input
          value={ownField.label}
          onChange={(e) =>
            onUpdate(
              fieldKey,
              { label: e.target.value },
              `field.${fieldKey}.label`,
            )
          }
        />
      </div>
      <div className="space-y-1">
        <Label>Placeholder</Label>
        <Input
          value={ownField.placeholder ?? ''}
          onChange={(e) =>
            onUpdate(
              fieldKey,
              { placeholder: e.target.value },
              `field.${fieldKey}.placeholder`,
            )
          }
        />
      </div>
      <div className="space-y-1">
        <Label>Help text</Label>
        <Input
          value={ownField.helpText ?? ''}
          onChange={(e) =>
            onUpdate(
              fieldKey,
              { helpText: e.target.value },
              `field.${fieldKey}.helpText`,
            )
          }
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Required</Label>
        <Switch
          checked={ownField.required}
          onCheckedChange={(v) => onUpdate(fieldKey, { required: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Hidden</Label>
        <Switch
          checked={ownField.hidden}
          onCheckedChange={(v) => onUpdate(fieldKey, { hidden: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Lock for descendants</Label>
        <Switch
          checked={(draft.locks ?? []).includes(fieldKey)}
          onCheckedChange={() => onToggleLock(fieldKey)}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRemove(fieldKey, 'field')}
      >
        <Trash2 className="mr-2 size-4" />
        Remove field
      </Button>
    </div>
  );
}
