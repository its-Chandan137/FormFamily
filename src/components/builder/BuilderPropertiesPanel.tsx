'use client';

import { useState } from 'react';
import { Copy, Lock, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/builder/RichTextEditor';
import { SegmentedControl } from '@/components/shared/SegmentedControl';
import { FieldTypeIcon } from '@/components/shared/FieldTypeIcon';
import { cn } from '@/lib/utils';
import type {
  FormContent,
  FormRecord,
  LayoutElement,
  OwnField,
  ResolvedItem,
  VisibilityCondition,
} from '@/types';

function getFieldTypeLabel(type: string) {
  const map: Record<string, string> = {
    text: 'Text Input',
    textarea: 'Text Area',
    number: 'Number',
    email: 'Email',
    phone: 'Phone',
    select: 'Select',
    multiselect: 'Multi Select',
    date: 'Date Picker',
    time: 'Time Picker',
    datetime: 'Date & Time',
    daterange: 'Date Range',
    checkbox: 'Checkbox',
    checkbox_group: 'Checkbox Group',
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
    repeater: 'Repeater',
    likert: 'Likert Scale',
    currency: 'Currency',
    logo: 'Logo',
    heading: 'Heading',
    richtext: 'Rich Text',
    divider: 'Divider',
    section: 'Section',
  };
  return map[type] ?? type;
}

function VisibilityEditor({
  resolvedItems,
  value,
  onChange,
}: {
  resolvedItems: ResolvedItem[];
  value?: VisibilityCondition;
  onChange: (next: VisibilityCondition | undefined) => void;
}) {
  const controllers = resolvedItems.filter(
    (i) =>
      i.kind === 'field' &&
      ['select', 'radio', 'checkbox'].includes(i.field.type),
  );
  const selectedController = controllers.find(
    (i) => i.kind === 'field' && i.field.key === value?.fieldKey,
  );
  const controllerField =
    selectedController?.kind === 'field' ? selectedController.field : null;

  return (
    <div className="space-y-2 rounded-lg border border-[#E5E9F2] p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-[#17213D]">
          Conditional visibility
        </Label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange(undefined)}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-[#75809A]">
        Show this item only when another field matches a condition.
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs text-[#4B587C]">Controller field</Label>
        <select
          className="h-9 w-full rounded-lg border border-[#E5E9F2] bg-white px-2 text-sm"
          value={value?.fieldKey ?? ''}
          onChange={(e) => {
            const fieldKey = e.target.value;
            if (!fieldKey) return onChange(undefined);
            const field = controllers.find(
              (i) => i.kind === 'field' && i.field.key === fieldKey,
            );
            if (!field || field.kind !== 'field') return;
            if (field.field.type === 'checkbox') {
              onChange({ fieldKey, operator: 'equals', value: 'true' });
            } else {
              onChange({
                fieldKey,
                operator: 'equals',
                value: field.field.options?.[0] ?? '',
              });
            }
          }}
        >
          <option value="">Always visible</option>
          {controllers.map((i) =>
            i.kind === 'field' ? (
              <option key={i.field.key} value={i.field.key}>
                {i.field.label} ({i.field.type})
              </option>
            ) : null,
          )}
        </select>
      </div>
      {controllerField && controllerField.type !== 'checkbox' ? (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#4B587C]">Operator</Label>
            <select
              className="h-9 w-full rounded-lg border border-[#E5E9F2] bg-white px-2 text-sm"
              value={value?.operator ?? 'equals'}
              onChange={(e) => {
                const operator = e.target
                  .value as VisibilityCondition['operator'];
                if (!value) return;
                onChange({
                  fieldKey: value.fieldKey,
                  operator,
                  value: value.value || controllerField.options?.[0] || '',
                });
              }}
            >
              <option value="equals">Equals</option>
              <option value="not_equals">Not equals</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#4B587C]">Value</Label>
            <select
              className="h-9 w-full rounded-lg border border-[#E5E9F2] bg-white px-2 text-sm"
              value={value?.value ?? ''}
              onChange={(e) =>
                value && onChange({ ...value, value: e.target.value })
              }
            >
              {(controllerField.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : null}
      {controllerField?.type === 'checkbox' && value ? (
        <div className="space-y-1.5">
          <Label className="text-xs text-[#4B587C]">State</Label>
          <select
            className="h-9 w-full rounded-lg border border-[#E5E9F2] bg-white px-2 text-sm"
            value={value.value}
            onChange={(e) =>
              onChange({ ...value, operator: 'equals', value: e.target.value })
            }
          >
            <option value="true">Checked</option>
            <option value="false">Not checked</option>
          </select>
        </div>
      ) : null}
    </div>
  );
}

function OptionsEditor({
  field,
  onUpdate,
}: {
  field: OwnField;
  onUpdate: (patch: Partial<OwnField>, coalesceKey?: string) => void;
}) {
  const options = field.options ?? [];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-[#17213D]">Options</Label>
        <button
          type="button"
          className="text-xs font-medium text-[#5945F5] hover:underline"
          onClick={() =>
            onUpdate({ options: [...options, `Option ${options.length + 1}`] })
          }
        >
          + Add Option
        </button>
      </div>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={`${field.key}-${idx}`} className="flex items-center gap-2">
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[idx] = e.target.value;
                onUpdate(
                  { options: next },
                  `field.${field.key}.options.${idx}`,
                );
              }}
              className="h-9 border-[#E5E9F2]"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-[#75809A] hover:text-red-600"
              aria-label={`Remove option ${opt || idx + 1}`}
              onClick={() =>
                onUpdate({ options: options.filter((_, i) => i !== idx) })
              }
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidationAccordion({
  field,
  onUpdate,
}: {
  field: OwnField;
  onUpdate: (patch: Partial<OwnField>, coalesceKey?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const v = field.validation ?? {};
  return (
    <div className="rounded-lg border border-[#E5E9F2]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-[#17213D]"
        onClick={() => setOpen((o) => !o)}
      >
        Validation
        <span className="text-[#75809A]">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-[#E5E9F2] px-3 py-3">
          {['text', 'textarea', 'email', 'phone'].includes(field.type) ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs">
                <span className="text-[#4B587C]">Min length</span>
                <Input
                  type="number"
                  className="h-9"
                  value={v.min ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...v,
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-[#4B587C]">Max length</span>
                <Input
                  type="number"
                  className="h-9"
                  value={v.max ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...v,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </label>
            </div>
          ) : null}
          {['number', 'currency', 'rating', 'slider'].includes(field.type) ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs">
                <span className="text-[#4B587C]">Min value</span>
                <Input
                  type="number"
                  className="h-9"
                  value={v.min ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...v,
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-[#4B587C]">Max value</span>
                <Input
                  type="number"
                  className="h-9"
                  value={v.max ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...v,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </label>
            </div>
          ) : null}
          {['text', 'textarea', 'email', 'phone'].includes(field.type) ? (
            <label className="block space-y-1 text-xs">
              <span className="text-[#4B587C]">Pattern (regex)</span>
              <Input
                className="h-9"
                value={v.pattern ?? ''}
                onChange={(e) =>
                  onUpdate({
                    validation: { ...v, pattern: e.target.value || undefined },
                  })
                }
              />
            </label>
          ) : null}
          {['file', 'file_multiple'].includes(field.type) ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 space-y-1 text-xs">
                <span className="text-[#4B587C]">
                  Accepted file types (comma separated)
                </span>
                <Input
                  className="h-9"
                  value={(v.allowedFileTypes ?? []).join(', ')}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...v,
                        allowedFileTypes: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-[#4B587C]">Max file size (MB)</span>
                <Input
                  type="number"
                  className="h-9"
                  value={v.maxFileSizeMb ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...v,
                        maxFileSizeMb: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </label>
            </div>
          ) : null}
          <p className="text-[11px] text-[#75809A]">
            Only relevant validation options are shown for this field type.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function OwnFieldProperties({
  field,
  resolvedItems,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleLock,
  isLocked,
}: {
  field: OwnField;
  resolvedItems: ResolvedItem[];
  onUpdate: (patch: Partial<OwnField>, coalesceKey?: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleLock: () => void;
  isLocked: boolean;
}) {
  const [tab, setTab] = useState<'general' | 'advanced'>('general');
  const hasOptions = [
    'select',
    'radio',
    'checkbox_group',
    'multiselect',
    'likert',
  ].includes(field.type);
  const hasPlaceholder = ![
    'checkbox',
    'checkbox_group',
    'radio',
    'toggle',
    'rating',
    'slider',
    'likert',
    'file',
    'file_multiple',
    'address_group',
    'name_group',
    'repeater',
    'hidden',
    'section',
    'divider',
    'heading',
    'logo',
    'richtext',
  ].includes(field.type);
  const hasOptionLayout = ['radio', 'checkbox_group', 'likert'].includes(
    field.type,
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#E5E9F2] px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#EEEBFF] text-[#5945F5]">
              <FieldTypeIcon type={field.type} className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#17213D]">
                {field.label || 'Untitled field'}
              </div>
              <div className="text-xs text-[#75809A]">
                {getFieldTypeLabel(field.type)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-4">
          {(['general', 'advanced'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'relative pb-2 text-sm font-medium capitalize',
                tab === t ? 'text-[#5945F5]' : 'text-[#75809A]',
              )}
            >
              {t}
              {tab === t ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#5945F5]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {tab === 'general' ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#17213D]">
                Label
              </Label>
              <Input
                className="h-10 border-[#E5E9F2]"
                value={field.label}
                onChange={(e) =>
                  onUpdate(
                    { label: e.target.value },
                    `field.${field.key}.label`,
                  )
                }
              />
            </div>
            {hasPlaceholder ? (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#17213D]">
                  Placeholder
                </Label>
                <Input
                  className="h-10 border-[#E5E9F2]"
                  value={field.placeholder ?? ''}
                  onChange={(e) =>
                    onUpdate(
                      { placeholder: e.target.value },
                      `field.${field.key}.placeholder`,
                    )
                  }
                />
              </div>
            ) : null}
            {hasOptions ? (
              <OptionsEditor field={field} onUpdate={onUpdate} />
            ) : null}
            {hasOptionLayout ? (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#17213D]">
                  Option layout
                </Label>
                <SegmentedControl
                  ariaLabel="Option layout"
                  value={field.optionLayout ?? 'vertical'}
                  onValueChange={(v) =>
                    onUpdate({ optionLayout: v as 'vertical' | 'horizontal' })
                  }
                  options={[
                    { value: 'vertical', label: 'Vertical' },
                    { value: 'horizontal', label: 'Horizontal' },
                  ]}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-lg border border-[#E5E9F2] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-[#17213D]">
                  Required
                </div>
                <div className="text-xs text-[#75809A]">
                  User must fill this field
                </div>
              </div>
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#17213D]">
                Help Text
              </Label>
              <textarea
                className="min-h-20 w-full rounded-lg border border-[#E5E9F2] px-3 py-2 text-sm"
                value={field.helpText ?? ''}
                onChange={(e) =>
                  onUpdate(
                    { helpText: e.target.value },
                    `field.${field.key}.helpText`,
                  )
                }
              />
            </div>
            <ValidationAccordion field={field} onUpdate={onUpdate} />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border border-[#E5E9F2] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-[#17213D]">Hidden</div>
                <div className="text-xs text-[#75809A]">
                  Hide from form users
                </div>
              </div>
              <Switch
                checked={field.hidden}
                onCheckedChange={(checked) => onUpdate({ hidden: checked })}
              />
            </div>
            <VisibilityEditor
              resolvedItems={resolvedItems}
              value={field.visibilityCondition}
              onChange={(next) => onUpdate({ visibilityCondition: next })}
            />
            <div className="flex items-center justify-between rounded-lg border border-[#E5E9F2] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-[#17213D]">
                  Lock for children
                </div>
                <div className="text-xs text-[#75809A]">
                  Prevent child forms overriding
                </div>
              </div>
              <Switch checked={isLocked} onCheckedChange={onToggleLock} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#17213D]">
                Field key
              </Label>
              <Input
                className="h-10 border-[#E5E9F2] bg-slate-50"
                value={field.key}
                disabled
                readOnly
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 border-t border-[#E5E9F2] p-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onDuplicate}
        >
          <Copy className="mr-1.5 size-4" />
          Duplicate
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 text-red-600 hover:text-red-700"
          onClick={onDelete}
        >
          <Trash2 className="mr-1.5 size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function OwnElementProperties({
  element,
  resolvedItems,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  element: LayoutElement;
  resolvedItems: ResolvedItem[];
  onUpdate: (patch: Partial<LayoutElement>, coalesceKey?: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [tab, setTab] = useState<'general' | 'advanced'>('general');
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#E5E9F2] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#EEEBFF] text-[#5945F5]">
            <FieldTypeIcon type={element.type} className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#17213D]">
              {getFieldTypeLabel(element.type)}
            </div>
            <div className="text-xs text-[#75809A]">Layout element</div>
          </div>
        </div>
        <div className="mt-3 flex gap-4">
          {(['general', 'advanced'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'relative pb-2 text-sm font-medium capitalize',
                tab === t ? 'text-[#5945F5]' : 'text-[#75809A]',
              )}
            >
              {t}
              {tab === t ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#5945F5]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {tab === 'general' ? (
          <>
            {element.type === 'heading' ? (
              <div className="space-y-1.5">
                <Label>Text</Label>
                <Input
                  className="h-10 border-[#E5E9F2]"
                  value={String(element.props.text ?? '')}
                  onChange={(e) =>
                    onUpdate(
                      { props: { ...element.props, text: e.target.value } },
                      `el.${element.id}.text`,
                    )
                  }
                />
              </div>
            ) : null}
            {element.type === 'section' ? (
              <>
                <div className="space-y-1.5">
                  <Label>Section title</Label>
                  <Input
                    className="h-10 border-[#E5E9F2]"
                    value={String(element.props.title ?? '')}
                    onChange={(e) =>
                      onUpdate(
                        { props: { ...element.props, title: e.target.value } },
                        `el.${element.id}.title`,
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    className="h-10 border-[#E5E9F2]"
                    value={String(element.props.description ?? '')}
                    onChange={(e) =>
                      onUpdate(
                        {
                          props: {
                            ...element.props,
                            description: e.target.value,
                          },
                        },
                        `el.${element.id}.description`,
                      )
                    }
                  />
                </div>
              </>
            ) : null}
            {element.type === 'logo' ? (
              <>
                <div className="space-y-1.5">
                  <Label>Logo URL</Label>
                  <Input
                    className="h-10 border-[#E5E9F2]"
                    value={String(element.props.src ?? '')}
                    onChange={(e) =>
                      onUpdate(
                        { props: { ...element.props, src: e.target.value } },
                        `el.${element.id}.src`,
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Alt text</Label>
                  <Input
                    className="h-10 border-[#E5E9F2]"
                    value={String(element.props.alt ?? '')}
                    onChange={(e) =>
                      onUpdate(
                        { props: { ...element.props, alt: e.target.value } },
                        `el.${element.id}.alt`,
                      )
                    }
                  />
                </div>
              </>
            ) : null}
            {element.type === 'richtext' ? (
              <div className="space-y-1.5">
                <Label>Content</Label>
                <RichTextEditor
                  value={String(element.props.html ?? '')}
                  onChange={(html) =>
                    onUpdate(
                      { props: { ...element.props, html } },
                      `el.${element.id}.html`,
                    )
                  }
                />
              </div>
            ) : null}
            {element.type === 'divider' ? (
              <p className="text-sm text-[#75809A]">
                Divider has no configurable content.
              </p>
            ) : null}
          </>
        ) : (
          <VisibilityEditor
            resolvedItems={resolvedItems}
            value={element.visibilityCondition}
            onChange={(next) => onUpdate({ visibilityCondition: next })}
          />
        )}
      </div>
      <div className="flex gap-2 border-t border-[#E5E9F2] p-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onDuplicate}
        >
          <Copy className="mr-1.5 size-4" />
          Duplicate
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 text-red-600 hover:text-red-700"
          onClick={onDelete}
        >
          <Trash2 className="mr-1.5 size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function InheritedProperties({
  item,
  resolvedItems,
  onSetOverride,
  onSetElementOverride,
  onResetInherited,
}: {
  item: ResolvedItem;
  resolvedItems: ResolvedItem[];
  onSetOverride: (key: string, patch: Record<string, unknown>) => void;
  onSetElementOverride: (
    id: string,
    props: Record<string, unknown>,
    coalesceKey?: string,
  ) => void;
  onResetInherited: (key: string) => void;
}) {
  const [tab, setTab] = useState<'general' | 'advanced'>('general');
  const isField = item.kind === 'field';
  const type = isField ? item.field.type : item.element.type;
  const label = isField
    ? item.field.label
    : String(
        item.element.props.title ??
          item.element.props.text ??
          getFieldTypeLabel(item.element.type),
      );
  const id = isField ? item.field.key : item.element.id;
  const locked = isField && item.field.locked;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#E5E9F2] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#EEEBFF] text-[#5945F5]">
            <FieldTypeIcon type={type} className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#17213D]">{label}</div>
            <div className="text-xs text-[#75809A]">
              {getFieldTypeLabel(type)} · Inherited
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-4">
          {(['general', 'advanced'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'relative pb-2 text-sm font-medium capitalize',
                tab === t ? 'text-[#5945F5]' : 'text-[#75809A]',
              )}
            >
              {t}
              {tab === t ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#5945F5]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {locked ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <Lock className="mr-1 inline size-3.5" /> This inherited field is
            locked by a parent form.
          </div>
        ) : null}
        {tab === 'general' ? (
          <>
            {isField ? (
              <>
                <div className="space-y-1.5">
                  <Label>Label</Label>
                  <Input
                    className="h-10 border-[#E5E9F2]"
                    value={item.field.label}
                    disabled={locked}
                    onChange={(e) =>
                      onSetOverride(id, { label: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Placeholder</Label>
                  <Input
                    className="h-10 border-[#E5E9F2]"
                    value={item.field.placeholder ?? ''}
                    disabled={locked}
                    onChange={(e) =>
                      onSetOverride(id, { placeholder: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Help text</Label>
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-[#E5E9F2] px-3 py-2 text-sm"
                    value={item.field.helpText ?? ''}
                    disabled={locked}
                    onChange={(e) =>
                      onSetOverride(id, { helpText: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#E5E9F2] px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-[#17213D]">
                      Required
                    </div>
                  </div>
                  <Switch
                    checked={item.field.required}
                    disabled={locked}
                    onCheckedChange={(checked) =>
                      onSetOverride(id, { required: checked })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                {item.element.type === 'heading' ? (
                  <div className="space-y-1.5">
                    <Label>Text</Label>
                    <Input
                      className="h-10 border-[#E5E9F2]"
                      value={String(item.element.props.text ?? '')}
                      onChange={(e) =>
                        onSetElementOverride(
                          id,
                          { text: e.target.value },
                          `el.${id}.text`,
                        )
                      }
                    />
                  </div>
                ) : null}
                {item.element.type === 'section' ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Section title</Label>
                      <Input
                        className="h-10 border-[#E5E9F2]"
                        value={String(item.element.props.title ?? '')}
                        onChange={(e) =>
                          onSetElementOverride(
                            id,
                            { title: e.target.value },
                            `el.${id}.title`,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input
                        className="h-10 border-[#E5E9F2]"
                        value={String(item.element.props.description ?? '')}
                        onChange={(e) =>
                          onSetElementOverride(
                            id,
                            { description: e.target.value },
                            `el.${id}.description`,
                          )
                        }
                      />
                    </div>
                  </>
                ) : null}
                {item.element.type === 'richtext' ? (
                  <div className="space-y-1.5">
                    <Label>Content</Label>
                    <RichTextEditor
                      value={String(item.element.props.html ?? '')}
                      onChange={(html) =>
                        onSetElementOverride(id, { html }, `el.${id}.html`)
                      }
                    />
                  </div>
                ) : null}
                {item.element.type === 'logo' ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Logo URL</Label>
                      <Input
                        className="h-10 border-[#E5E9F2]"
                        value={String(item.element.props.src ?? '')}
                        onChange={(e) =>
                          onSetElementOverride(
                            id,
                            { src: e.target.value },
                            `el.${id}.src`,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Alt text</Label>
                      <Input
                        className="h-10 border-[#E5E9F2]"
                        value={String(item.element.props.alt ?? '')}
                        onChange={(e) =>
                          onSetElementOverride(
                            id,
                            { alt: e.target.value },
                            `el.${id}.alt`,
                          )
                        }
                      />
                    </div>
                  </>
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
            {isField ? (
              <>
                <div className="flex items-center justify-between rounded-lg border border-[#E5E9F2] px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-[#17213D]">
                      Hidden
                    </div>
                  </div>
                  <Switch
                    checked={item.field.hidden}
                    disabled={locked}
                    onCheckedChange={(checked) =>
                      onSetOverride(id, { hidden: checked })
                    }
                  />
                </div>
                <VisibilityEditor
                  resolvedItems={resolvedItems}
                  value={item.field.visibilityCondition}
                  onChange={(next) =>
                    onSetOverride(id, { visibilityCondition: next ?? null })
                  }
                />
              </>
            ) : (
              <VisibilityEditor
                resolvedItems={resolvedItems}
                value={item.element.visibilityCondition}
                onChange={(next) =>
                  onSetElementOverride(id, {
                    visibilityCondition: next ?? null,
                  } as any)
                }
              />
            )}
          </>
        )}
      </div>
      <div className="border-t border-[#E5E9F2] p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onResetInherited(id)}
          disabled={locked}
        >
          Reset inherited overrides
        </Button>
      </div>
    </div>
  );
}

function FormSettingsPanel({
  draft,
  onUpdateSettings,
}: {
  draft: FormContent;
  onUpdateSettings: (
    patch: Partial<FormContent['settings']>,
    coalesceKey?: string,
  ) => void;
}) {
  const [tab, setTab] = useState<'general' | 'advanced'>('general');
  const s = draft.settings;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#E5E9F2] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#EEEBFF] text-[#5945F5]">
            <FieldTypeIcon type="text" className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#17213D]">
              Form Settings
            </div>
            <div className="text-xs text-[#75809A]">General configuration</div>
          </div>
        </div>
        <div className="mt-3 flex gap-4">
          {(['general', 'advanced'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'relative pb-2 text-sm font-medium capitalize',
                tab === t ? 'text-[#5945F5]' : 'text-[#75809A]',
              )}
            >
              {t}
              {tab === t ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#5945F5]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {tab === 'general' ? (
          <>
            <div className="space-y-1.5">
              <Label>Form title</Label>
              <Input
                className="h-10 border-[#E5E9F2]"
                value={s.title ?? ''}
                onChange={(e) =>
                  onUpdateSettings({ title: e.target.value }, 'settings.title')
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                className="min-h-24 w-full rounded-lg border border-[#E5E9F2] px-3 py-2 text-sm"
                value={s.about ?? ''}
                onChange={(e) =>
                  onUpdateSettings({ about: e.target.value }, 'settings.about')
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Submit button label</Label>
              <Input
                className="h-10 border-[#E5E9F2]"
                value={s.submitLabel ?? ''}
                onChange={(e) =>
                  onUpdateSettings(
                    { submitLabel: e.target.value },
                    'settings.submitLabel',
                  )
                }
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Desktop columns</Label>
              <SegmentedControl
                ariaLabel="Desktop columns"
                value={String(s.layoutColumns ?? 1)}
                onValueChange={(v) =>
                  onUpdateSettings({ layoutColumns: Number(v) as 1 | 2 | 3 })
                }
                options={[
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile columns</Label>
              <SegmentedControl
                ariaLabel="Mobile columns"
                value={String(s.mobileLayoutColumns ?? 1)}
                onValueChange={(v) =>
                  onUpdateSettings({ mobileLayoutColumns: Number(v) as 1 | 2 })
                }
                options={[
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Form width</Label>
              <SegmentedControl
                ariaLabel="Form width"
                value={s.formWidth ?? 'medium'}
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
            <div className="space-y-1.5">
              <Label>Success message</Label>
              <textarea
                className="min-h-20 w-full rounded-lg border border-[#E5E9F2] px-3 py-2 text-sm"
                value={s.successMessage ?? ''}
                onChange={(e) =>
                  onUpdateSettings(
                    { successMessage: e.target.value },
                    'settings.successMessage',
                  )
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
  onClose,
  onDuplicateSelected,
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
  onSetElementOverride: (
    id: string,
    props: Record<string, unknown>,
    coalesceKey?: string,
  ) => void;
  onSetOverride: (key: string, patch: Record<string, unknown>) => void;
  onResetInherited: (key: string) => void;
  onToggleLock: (keyOrId: string) => void;
  onRemoveOwn: (id: string, kind: 'field' | 'element') => void;
  onUpdateSettings: (
    patch: Partial<FormContent['settings']>,
    coalesceKey?: string,
  ) => void;
  onClose: () => void;
  onDuplicateSelected: () => void;
}) {
  const isOwn = selectedItem
    ? selectedItem.kind === 'field'
      ? selectedItem.field.sourceFormId === form.id &&
        selectedItem.field.origin === 'own'
      : selectedItem.sourceFormId === form.id && selectedItem.origin === 'own'
    : false;

  return (
    <aside className="dark:border-border dark:bg-card flex h-full min-h-0 flex-col rounded-xl border border-[#E5E9F2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="flex items-center justify-between border-b border-[#E5E9F2] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-[#17213D]">
          Field Properties
        </h2>
        <button
          type="button"
          className="rounded-md p-1 text-[#75809A] hover:bg-slate-100"
          aria-label="Close properties"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>

      {!selectedItem ? (
        <FormSettingsPanel draft={draft} onUpdateSettings={onUpdateSettings} />
      ) : isOwn && selectedItem.kind === 'field' ? (
        <OwnFieldProperties
          field={
            draft.ownFields.find((f) => f.key === selectedItem.field.key) ??
            (selectedItem.field as unknown as OwnField)
          }
          resolvedItems={resolvedItems}
          onUpdate={(patch, coalesceKey) =>
            onUpdateOwnField(selectedItem.field.key, patch, coalesceKey)
          }
          onDelete={() => onRemoveOwn(selectedItem.field.key, 'field')}
          onDuplicate={onDuplicateSelected}
          onToggleLock={() => onToggleLock(selectedItem.field.key)}
          isLocked={!!draft.locks?.includes(selectedItem.field.key)}
        />
      ) : isOwn && selectedItem.kind === 'element' ? (
        <OwnElementProperties
          element={
            draft.elements.find((e) => e.id === selectedItem.element.id) ??
            selectedItem.element
          }
          resolvedItems={resolvedItems}
          onUpdate={(patch, coalesceKey) =>
            onUpdateOwnElement(selectedItem.element.id, patch, coalesceKey)
          }
          onDelete={() => onRemoveOwn(selectedItem.element.id, 'element')}
          onDuplicate={onDuplicateSelected}
        />
      ) : (
        <InheritedProperties
          item={selectedItem}
          resolvedItems={resolvedItems}
          onSetOverride={onSetOverride}
          onSetElementOverride={onSetElementOverride}
          onResetInherited={onResetInherited}
        />
      )}
    </aside>
  );
}
