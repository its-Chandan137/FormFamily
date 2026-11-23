'use client';

import { useState } from 'react';
import { z } from 'zod';
import type { ResolvedForm, ResolvedItem } from '@/types';
import {
  buildZodSchema,
  isVisibilityConditionMet,
} from '@/lib/forms/build-zod-schema';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export interface FormRendererProps {
  resolved: ResolvedForm;
  onSubmit: (answers: Record<string, unknown>) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
  disableSubmit?: boolean;
  /** Force a viewport layout for preview simulations. */
  previewMode?: 'desktop' | 'mobile';
}

function FieldLabel({
  label,
  required,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
}) {
  return (
    <Label htmlFor={htmlFor} className="mb-1 block text-[16px] font-medium">
      {label}
      {required ? <span className="text-destructive ml-1">*</span> : null}
    </Label>
  );
}

export function FormRenderer({
  resolved,
  onSubmit,
  submitting,
  submitLabel,
  disableSubmit,
  previewMode,
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = buildZodSchema(resolved, values) as z.ZodObject<
      Record<string, z.ZodTypeAny>
    >;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(parsed.data as Record<string, unknown>);
  };

  const renderElement = (
    item: Extract<ResolvedItem, { kind: 'element' }>,
    index: number,
  ) => {
    const { element } = item;
    if (!isVisibilityConditionMet(element.visibilityCondition, values))
      return null;
    const desktopCols = resolved.settings.layoutColumns ?? 1;
    const mobileCols = resolved.settings.mobileLayoutColumns ?? 1;
    const fullSpan = desktopCols > 1 || mobileCols > 1 ? 'col-span-full' : '';
    switch (element.type) {
      case 'logo': {
        const src = String(
          element.props.src ?? resolved.settings.logoUrl ?? '',
        );
        const alt = String(
          element.props.alt ?? resolved.settings.companyName ?? 'Logo',
        );
        return (
          <div
            key={element.id + index}
            className={cn('flex justify-start', fullSpan)}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt} className="h-12 w-auto object-contain" />
            ) : (
              <div className="bg-muted text-muted-foreground flex h-12 items-center rounded-md px-4 text-sm font-medium">
                {alt || 'Logo'}
              </div>
            )}
          </div>
        );
      }
      case 'heading':
        return (
          <h2
            key={element.id + index}
            className={cn('text-xl font-semibold', fullSpan)}
          >
            {String(element.props.text ?? resolved.settings.companyName ?? '')}
          </h2>
        );
      case 'richtext':
        return (
          <div
            key={element.id + index}
            className={cn(
              'prose prose-sm text-muted-foreground max-w-none',
              fullSpan,
            )}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(String(element.props.html ?? '')),
            }}
          />
        );
      case 'divider':
        return (
          <hr
            key={element.id + index}
            className={cn('border-border', fullSpan)}
          />
        );
      case 'section':
        return (
          <div key={element.id + index} className={cn('pt-2', fullSpan)}>
            <h3 className="text-base font-medium">
              {String(element.props.title ?? '')}
            </h3>
            {element.props.description ? (
              <p className="text-muted-foreground text-sm">
                {String(element.props.description)}
              </p>
            ) : null}
          </div>
        );
      default:
        return null;
    }
  };

  const renderField = (item: Extract<ResolvedItem, { kind: 'field' }>) => {
    const f = item.field;
    if (f.hidden) return null;
    if (!isVisibilityConditionMet(f.visibilityCondition, values)) return null;
    const id = `field-${f.key}`;
    const errorId = `${id}-error`;
    const helpId = `${id}-help`;
    const value = values[f.key];
    const error = errors[f.key];
    const describedBy =
      [f.helpText ? helpId : null, error ? errorId : null]
        .filter(Boolean)
        .join(' ') || undefined;
    const common = {
      id,
      name: f.key,
      'aria-invalid': !!error,
      'aria-describedby': describedBy,
    };

    let control: React.ReactNode = null;
    switch (f.type) {
      case 'textarea':
        control = (
          <Textarea
            id={id}
            name={f.key}
            placeholder={f.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => setValue(f.key, e.target.value)}
            aria-invalid={!!error}
            aria-describedby={describedBy}
          />
        );
        break;
      case 'select':
        control = (
          <Select
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => setValue(f.key, v)}
          >
            <SelectTrigger
              id={id}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              className="w-full"
            >
              <SelectValue placeholder={f.placeholder ?? 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {(f.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        break;
      case 'radio':
        control = (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => setValue(f.key, v)}
            className={cn(
              'gap-2',
              f.optionLayout === 'horizontal' &&
                'flex flex-row flex-wrap gap-x-4 gap-y-2',
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
          >
            {(f.options ?? []).map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${id}-${opt}`} />
                <Label
                  htmlFor={`${id}-${opt}`}
                  className="text-[16px] font-normal"
                >
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        break;
      case 'checkbox':
        control = (
          <div className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={value === true}
              onCheckedChange={(v) => setValue(f.key, v === true)}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
            <Label htmlFor={id} className="text-[16px] font-normal">
              {f.label}
              {f.required ? (
                <span className="text-destructive ml-1">*</span>
              ) : null}
            </Label>
          </div>
        );
        break;
      case 'checkbox_group': {
        const selected = Array.isArray(value) ? (value as string[]) : [];
        control = (
          <div
            className={cn(
              'gap-2',
              f.optionLayout === 'horizontal'
                ? 'flex flex-row flex-wrap gap-x-4 gap-y-2'
                : 'flex flex-col',
            )}
            role="group"
            aria-describedby={describedBy}
          >
            {(f.options ?? []).map((opt) => {
              const checked = selected.includes(opt);
              return (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`${id}-${opt}`}
                    checked={checked}
                    onCheckedChange={(v) => {
                      const next = v
                        ? [...selected, opt]
                        : selected.filter((x) => x !== opt);
                      setValue(f.key, next);
                    }}
                    aria-invalid={!!error}
                  />
                  <Label
                    htmlFor={`${id}-${opt}`}
                    className="text-[16px] font-normal"
                  >
                    {opt}
                  </Label>
                </div>
              );
            })}
          </div>
        );
        break;
      }
      case 'multiselect': {
        const selected = Array.isArray(value) ? (value as string[]) : [];
        control = (
          <div className="space-y-2" aria-describedby={describedBy}>
            <select
              multiple
              id={id}
              className="border-input bg-background min-h-24 w-full rounded-md border px-2 py-2 text-sm"
              value={selected}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map(
                  (o) => o.value,
                );
                setValue(f.key, opts);
              }}
              aria-invalid={!!error}
            >
              {(f.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              Hold Ctrl/Cmd to select multiple.
            </p>
          </div>
        );
        break;
      }
      case 'toggle':
        control = (
          <div className="flex items-center gap-2">
            <Switch
              id={id}
              checked={value === true}
              onCheckedChange={(v) => setValue(f.key, v === true)}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
            <Label htmlFor={id} className="text-[16px] font-normal">
              {f.label}
            </Label>
          </div>
        );
        break;
      case 'rating': {
        const max = Math.max(
          3,
          Math.min(10, Number(f.validation?.max ?? 5) || 5),
        );
        const current = typeof value === 'number' ? value : Number(value || 0);
        control = (
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-describedby={describedBy}
          >
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={cn(
                  'border-input size-9 rounded-md border text-sm',
                  current >= n
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background',
                )}
                onClick={() => setValue(f.key, n)}
                aria-label={`Rate ${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        );
        break;
      }
      case 'slider': {
        const min = Number(f.validation?.min ?? 0);
        const max = Number(f.validation?.max ?? 100);
        const current =
          typeof value === 'number' ? value : Number(value ?? min);
        control = (
          <div className="space-y-2">
            <input
              id={id}
              type="range"
              min={min}
              max={max}
              value={current}
              onChange={(e) => setValue(f.key, Number(e.target.value))}
              className="w-full"
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
            <div className="text-muted-foreground text-xs">
              Value: {current}
            </div>
          </div>
        );
        break;
      }
      case 'likert':
        control = (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => setValue(f.key, v)}
            className={cn(
              'gap-2',
              f.optionLayout === 'horizontal' &&
                'flex flex-row flex-wrap gap-x-4 gap-y-2',
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
          >
            {(f.options ?? []).map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${id}-${opt}`} />
                <Label
                  htmlFor={`${id}-${opt}`}
                  className="text-[16px] font-normal"
                >
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        break;
      case 'daterange': {
        const obj = (value && typeof value === 'object' ? value : {}) as {
          start?: string;
          end?: string;
        };
        control = (
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              type="date"
              value={obj.start ?? ''}
              onChange={(e) =>
                setValue(f.key, { ...obj, start: e.target.value })
              }
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
            <Input
              type="date"
              value={obj.end ?? ''}
              onChange={(e) => setValue(f.key, { ...obj, end: e.target.value })}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
          </div>
        );
        break;
      }
      case 'address_group': {
        const obj = (value && typeof value === 'object' ? value : {}) as Record<
          string,
          string
        >;
        const upd = (k: string, v: string) =>
          setValue(f.key, { ...obj, [k]: v });
        control = (
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Street"
              value={obj.street ?? ''}
              onChange={(e) => upd('street', e.target.value)}
              className="sm:col-span-2"
            />
            <Input
              placeholder="City"
              value={obj.city ?? ''}
              onChange={(e) => upd('city', e.target.value)}
            />
            <Input
              placeholder="State/Province"
              value={obj.state ?? ''}
              onChange={(e) => upd('state', e.target.value)}
            />
            <Input
              placeholder="Postal code"
              value={obj.postalCode ?? ''}
              onChange={(e) => upd('postalCode', e.target.value)}
            />
            <Input
              placeholder="Country"
              value={obj.country ?? ''}
              onChange={(e) => upd('country', e.target.value)}
            />
          </div>
        );
        break;
      }
      case 'name_group': {
        const obj = (value && typeof value === 'object' ? value : {}) as Record<
          string,
          string
        >;
        const upd = (k: string, v: string) =>
          setValue(f.key, { ...obj, [k]: v });
        control = (
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="First name"
              value={obj.first ?? ''}
              onChange={(e) => upd('first', e.target.value)}
            />
            <Input
              placeholder="Middle name"
              value={obj.middle ?? ''}
              onChange={(e) => upd('middle', e.target.value)}
            />
            <Input
              placeholder="Last name"
              value={obj.last ?? ''}
              onChange={(e) => upd('last', e.target.value)}
            />
          </div>
        );
        break;
      }
      case 'file_multiple':
        control = (
          <div className="space-y-2">
            <Input
              {...common}
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).map((file) => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                }));
                setValue(f.key, files);
              }}
            />
            {Array.isArray(value) ? (
              <p className="text-muted-foreground text-xs">
                {value.length} file(s) selected
              </p>
            ) : null}
          </div>
        );
        break;
      case 'signature':
        control = (
          <div className="space-y-2">
            <Input
              {...common}
              placeholder={f.placeholder ?? 'Type full name as signature'}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => setValue(f.key, e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Basic signature capture (typed). Can be upgraded to draw-pad.
            </p>
          </div>
        );
        break;
      case 'repeater': {
        const rows = Array.isArray(value)
          ? (value as Array<Record<string, unknown>>)
          : [];
        control = (
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={idx} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item {idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setValue(
                        f.key,
                        rows.filter((_, i) => i !== idx),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Value / details"
                  value={typeof row.value === 'string' ? row.value : ''}
                  onChange={(e) => {
                    const next = rows.slice();
                    next[idx] = { ...row, value: e.target.value };
                    setValue(f.key, next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue(f.key, [...rows, { value: '' }])}
            >
              Add item
            </Button>
          </div>
        );
        break;
      }
      case 'hidden':
        return null;
      case 'file':
        control = (
          <div className="space-y-2">
            <Input
              {...common}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setValue(f.key, undefined);
                  return;
                }
                setValue(f.key, {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                });
              }}
            />
            {value &&
            typeof value === 'object' &&
            'name' in (value as object) ? (
              <p className="text-muted-foreground text-xs">
                Selected: {(value as { name: string }).name} (
                {Math.round(((value as { size?: number }).size ?? 0) / 1024)}{' '}
                KB)
              </p>
            ) : null}
          </div>
        );
        break;
      default:
        control = (
          <Input
            {...common}
            type={
              f.type === 'email'
                ? 'email'
                : f.type === 'date'
                  ? 'date'
                  : f.type === 'number' || f.type === 'currency'
                    ? 'number'
                    : f.type === 'phone'
                      ? 'tel'
                      : 'text'
            }
            placeholder={f.placeholder}
            value={
              typeof value === 'string' || typeof value === 'number'
                ? String(value)
                : ''
            }
            onChange={(e) => setValue(f.key, e.target.value)}
          />
        );
    }

    const messages = (
      <>
        {f.helpText ? (
          <p id={helpId} className="text-muted-foreground text-xs">
            {f.helpText}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="text-destructive text-xs">
            {error}
          </p>
        ) : null}
      </>
    );

    if (f.type === 'checkbox' || f.type === 'toggle') {
      return (
        <div key={f.key} className={cn('space-y-1')}>
          {control}
          {messages}
        </div>
      );
    }

    return (
      <div key={f.key} className="space-y-1">
        <FieldLabel label={f.label} required={f.required} htmlFor={id} />
        {control}
        {messages}
      </div>
    );
  };

  const formWidthClass =
    resolved.settings.formWidth === 'narrow'
      ? 'max-w-2xl'
      : resolved.settings.formWidth === 'medium'
        ? 'max-w-3xl'
        : resolved.settings.formWidth === 'wide'
          ? 'max-w-5xl'
          : resolved.settings.formWidth === 'full'
            ? 'max-w-none'
            : 'max-w-2xl';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('mx-auto w-full space-y-6', formWidthClass)}
      noValidate
    >
      {resolved.settings.title ? (
        <h1 className="text-2xl font-semibold tracking-tight">
          {resolved.settings.title}
        </h1>
      ) : null}
      {resolved.settings.about ? (
        <div
          className="prose prose-sm text-muted-foreground max-w-none"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(resolved.settings.about),
          }}
        />
      ) : null}
      <div
        className={cn(
          (() => {
            const desktop = resolved.settings.layoutColumns ?? 1;
            const mobile = resolved.settings.mobileLayoutColumns ?? 1;
            if (previewMode === 'mobile') {
              if (mobile <= 1) return 'space-y-5';
              return cn(
                'grid gap-5',
                mobile === 2 ? 'grid-cols-2' : 'grid-cols-1',
              );
            }
            if (desktop <= 1 && mobile <= 1) return 'space-y-5';
            const mobileClass =
              mobile === 2
                ? 'grid-cols-2'
                : mobile >= 3
                  ? 'grid-cols-3'
                  : 'grid-cols-1';
            const desktopClass =
              desktop === 2
                ? 'md:grid-cols-2'
                : desktop === 3
                  ? 'md:grid-cols-3'
                  : 'md:grid-cols-1';
            return cn('grid gap-5', mobileClass, desktopClass);
          })(),
        )}
      >
        {resolved.items.map((item, idx) =>
          item.kind === 'element'
            ? renderElement(item, idx)
            : renderField(item),
        )}
      </div>
      <Button
        type="submit"
        disabled={submitting || disableSubmit}
        className="w-full sm:w-auto"
      >
        {submitting
          ? 'Submitting…'
          : (submitLabel ?? resolved.settings.submitLabel ?? 'Submit')}
      </Button>
    </form>
  );
}
