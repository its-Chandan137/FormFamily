'use client';

import { Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/builder/RichTextEditor';
import { SegmentedControl } from '@/components/shared/SegmentedControl';
import type {
  FormContent,
  FormRecord,
  LayoutElement,
  OwnField,
  ResolvedItem,
  VisibilityCondition,
} from '@/types';

export function BuilderPropertiesPanel({
  form,
  draft,
  selectedItem,
  resolvedItems,
  onUpdateOwnField,
  onUpdateOwnElement,
  onSetElementOverride,
  onSetOverride,
  onResetInherited,
  onToggleLock,
  onRemoveOwn,
  onUpdateSettings,
}: {
  form: FormRecord;
  draft: FormContent;
  selectedItem: ResolvedItem | null;
  resolvedItems: ResolvedItem[];
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
  onSetElementOverride: (id: string, props: Record<string, unknown>) => void;
  onSetOverride: (key: string, patch: Record<string, unknown>) => void;
  onResetInherited: (key: string) => void;
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
            resolvedItems={resolvedItems}
            onUpdate={onUpdateOwnElement}
            onSetElementOverride={onSetElementOverride}
            onResetInherited={onResetInherited}
            onRemove={onRemoveOwn}
          />
        ) : selectedItem.field.origin === 'inherited' ? (
          <InheritedFieldProps
            field={selectedItem.field}
            draft={draft}
            resolvedItems={resolvedItems}
            onSetOverride={onSetOverride}
            onResetInherited={onResetInherited}
            onToggleLock={onToggleLock}
          />
        ) : (
          <OwnFieldProps
            fieldKey={selectedItem.field.key}
            draft={draft}
            resolvedItems={resolvedItems}
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
            <Label>Layout columns (desktop)</Label>
            <div>
              <SegmentedControl
                ariaLabel="Desktop layout columns"
                value={String(draft.settings.layoutColumns ?? 1)}
                onValueChange={(v) =>
                  onUpdateSettings({
                    layoutColumns: Number(v) as 1 | 2 | 3,
                  })
                }
                options={[
                  { value: '1', label: '1 col' },
                  { value: '2', label: '2 cols' },
                  { value: '3', label: '3 cols' },
                ]}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Layout columns (mobile)</Label>
            <div>
              <SegmentedControl
                ariaLabel="Mobile layout columns"
                value={String(draft.settings.mobileLayoutColumns ?? 1)}
                onValueChange={(v) =>
                  onUpdateSettings({
                    mobileLayoutColumns: Number(v) as 1 | 2,
                  })
                }
                options={[
                  { value: '1', label: '1 col' },
                  { value: '2', label: '2 cols' },
                ]}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Layout/width apply only to this form (not inherited).
            </p>
          </div>
          <div className="space-y-1">
            <Label>Form width</Label>
            <div>
              <SegmentedControl
                ariaLabel="Form width"
                value={draft.settings.formWidth ?? 'narrow'}
                onValueChange={(v) =>
                  onUpdateSettings({
                    formWidth: v as 'narrow' | 'medium' | 'wide' | 'full',
                  })
                }
                options={[
                  { value: 'narrow', label: 'Narrow' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'wide', label: 'Wide' },
                  { value: 'full', label: 'Full' },
                ]}
              />
            </div>
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
  element,
  inherited,
  resolvedItems,
  onUpdate,
  onSetElementOverride,
  onResetInherited,
  onRemove,
}: {
  form: FormRecord;
  draft: FormContent;
  element: LayoutElement;
  inherited: boolean;
  resolvedItems: ResolvedItem[];
  onUpdate: (
    id: string,
    patch: Partial<LayoutElement>,
    coalesceKey?: string,
  ) => void;
  onSetElementOverride: (
    id: string,
    props: Record<string, unknown>,
    coalesceKey?: string,
  ) => void;
  onResetInherited: (key: string) => void;
  onRemove: (id: string, kind: 'field' | 'element') => void;
}) {
  const own = !inherited;
  const updateProps = (
    props: Record<string, unknown>,
    coalesceKey?: string,
  ) => {
    if (own) {
      onUpdate(
        element.id,
        { props: { ...element.props, ...props } },
        coalesceKey,
      );
    } else {
      onSetElementOverride(element.id, props, coalesceKey);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        Element: {element.type}{' '}
        {inherited ? (
          <span className="text-muted-foreground">(inherited)</span>
        ) : null}
      </div>
      {element.type === 'heading' ? (
        <div className="space-y-1">
          <Label>Text</Label>
          <Input
            value={String(element.props.text ?? '')}
            onChange={(e) =>
              updateProps({ text: e.target.value }, `el.${element.id}.text`)
            }
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
                updateProps({ title: e.target.value }, `el.${element.id}.title`)
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={String(element.props.description ?? '')}
              onChange={(e) =>
                updateProps(
                  { description: e.target.value },
                  `el.${element.id}.desc`,
                )
              }
            />
          </div>
        </>
      ) : null}
      {element.type === 'richtext' ? (
        <div className="space-y-1">
          <Label>Content</Label>
          <RichTextEditor
            value={String(element.props.html ?? '')}
            onChange={(html) => updateProps({ html }, `el.${element.id}.html`)}
          />
        </div>
      ) : null}
      {element.type === 'logo' ? (
        <div className="space-y-1">
          <Label>Logo URL (optional, falls back to form setting)</Label>
          <Input
            value={String(element.props.src ?? '')}
            onChange={(e) => updateProps({ src: e.target.value })}
          />
        </div>
      ) : null}
      {own ? (
        <VisibilityConditionEditor
          value={element.visibilityCondition}
          onChange={(visibilityCondition) =>
            onUpdate(element.id, {
              visibilityCondition,
            } as Partial<LayoutElement>)
          }
          fields={resolvedItems
            .filter((i) => i.kind === 'field')
            .map((i) => ({
              key: i.field.key,
              label: i.field.label,
              type: i.field.type,
              options: i.field.options,
            }))}
        />
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
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            Inherited element — you can change text/content and position, but
            not remove it or change its identity.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResetInherited(element.id)}
          >
            Reset to inherited
          </Button>
        </div>
      )}
    </div>
  );
}

function InheritedFieldProps({
  field,
  draft,
  resolvedItems,
  onSetOverride,
  onResetInherited,
  onToggleLock,
}: {
  field: any;
  draft: FormContent;
  resolvedItems: ResolvedItem[];
  onSetOverride: (key: string, patch: Record<string, unknown>) => void;
  onResetInherited: (key: string) => void;
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
      <VisibilityConditionEditor
        value={
          (override.visibilityCondition ?? field.visibilityCondition) as
            VisibilityCondition | undefined
        }
        onChange={(visibilityCondition) =>
          onSetOverride(field.key, {
            visibilityCondition: visibilityCondition ?? null,
          })
        }
        fields={resolvedItems
          .filter((i) => i.kind === 'field')
          .map((i) => ({
            key: i.field.key,
            label: i.field.label,
            type: i.field.type,
            options: i.field.options,
          }))}
        selfKey={field.key}
        disabled={locked}
      />
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
        onClick={() => onResetInherited(field.key)}
        disabled={locked}
      >
        Reset to inherited
      </Button>
    </div>
  );
}

function VisibilityConditionEditor({
  value,
  onChange,
  fields,
  selfKey,
  disabled,
}: {
  value?: VisibilityCondition;
  onChange: (next?: VisibilityCondition) => void;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    options?: string[];
  }>;
  selfKey?: string;
  disabled?: boolean;
}) {
  const enabled = !!value;
  const controllerOptions = fields.filter(
    (f) =>
      f.key !== selfKey && ['select', 'radio', 'checkbox'].includes(f.type),
  );
  const selected = controllerOptions.find((f) => f.key === value?.fieldKey);
  const effectiveOptions =
    selected?.type === 'checkbox'
      ? ['true', 'false']
      : (selected?.options ?? []);
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label>Conditional visibility</Label>
        <Switch
          checked={enabled}
          disabled={disabled}
          onCheckedChange={(checked) => {
            if (!checked) onChange(undefined);
            else {
              const first = controllerOptions[0];
              const firstOpts =
                first?.type === 'checkbox'
                  ? ['true', 'false']
                  : (first?.options ?? []);
              onChange({
                fieldKey: first?.key ?? '',
                operator: 'equals',
                value: firstOpts[0] ?? '',
              });
            }
          }}
          aria-label="Enable conditional visibility"
        />
      </div>
      {enabled && value ? (
        controllerOptions.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Add a select, radio, or checkbox field to use as a condition
            controller.
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <Label>Show when field</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={value.fieldKey}
                disabled={disabled}
                onChange={(e) => {
                  const nextField = controllerOptions.find(
                    (f) => f.key === e.target.value,
                  );
                  const nextOpts =
                    nextField?.type === 'checkbox'
                      ? ['true', 'false']
                      : (nextField?.options ?? []);
                  onChange({
                    ...value,
                    fieldKey: e.target.value,
                    value: nextOpts[0] ?? '',
                  });
                }}
              >
                <option value="">Select field</option>
                {controllerOptions.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label} ({f.key})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Condition</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={value.operator}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    ...value,
                    operator: e.target.value as 'equals' | 'not_equals',
                  })
                }
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not equals</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Value</Label>
              {effectiveOptions.length > 0 ? (
                <select
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  value={value.value}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange({ ...value, value: e.target.value })
                  }
                >
                  {effectiveOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={value.value}
                  onChange={(e) =>
                    onChange({ ...value, value: e.target.value })
                  }
                  placeholder="Value (e.g. Yes)"
                  disabled={disabled}
                />
              )}
            </div>
          </>
        )
      ) : (
        <p className="text-muted-foreground text-xs">
          Show this item only when a condition is met (dynamic field/section).
        </p>
      )}
    </div>
  );
}

function OwnFieldProps({
  fieldKey,
  draft,
  resolvedItems,
  onUpdate,
  onToggleLock,
  onRemove,
}: {
  fieldKey: string;
  draft: FormContent;
  resolvedItems: ResolvedItem[];
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
  const controllerFields = resolvedItems
    .filter((i) => i.kind === 'field')
    .map((i) => ({
      key: i.field.key,
      label: i.field.label,
      type: i.field.type,
      options: i.field.options,
    }));
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
      {['select', 'radio', 'checkbox_group', 'multiselect', 'likert'].includes(
        ownField.type,
      ) ? (
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Label>Options</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onUpdate(fieldKey, {
                  options: [
                    ...(ownField.options ?? []),
                    `Option ${(ownField.options?.length ?? 0) + 1}`,
                  ],
                })
              }
            >
              Add option
            </Button>
          </div>
          <div className="space-y-2">
            {(ownField.options ?? []).map((opt, idx) => (
              <div
                key={`${fieldKey}-opt-${idx}`}
                className="flex items-center gap-2"
              >
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...(ownField.options ?? [])];
                    next[idx] = e.target.value;
                    onUpdate(
                      fieldKey,
                      { options: next },
                      `field.${fieldKey}.options.${idx}`,
                    );
                  }}
                  placeholder={`Option ${idx + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove option ${opt || idx + 1}`}
                  onClick={() => {
                    const next = (ownField.options ?? []).filter(
                      (_, i) => i !== idx,
                    );
                    onUpdate(fieldKey, { options: next });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            {(ownField.options ?? []).length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Add options so users can select values.
              </p>
            ) : null}
          </div>
          {['radio', 'checkbox_group', 'likert'].includes(ownField.type) ? (
            <div className="space-y-1">
              <Label>Option layout</Label>
              <SegmentedControl
                ariaLabel="Option layout"
                value={ownField.optionLayout ?? 'vertical'}
                onValueChange={(v) =>
                  onUpdate(fieldKey, {
                    optionLayout: v as 'vertical' | 'horizontal',
                  })
                }
                options={[
                  { value: 'vertical', label: 'Vertical' },
                  { value: 'horizontal', label: 'Horizontal' },
                ]}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <VisibilityConditionEditor
        value={ownField.visibilityCondition}
        onChange={(visibilityCondition) =>
          onUpdate(fieldKey, { visibilityCondition } as Partial<OwnField>)
        }
        fields={controllerFields}
        selfKey={fieldKey}
      />
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
