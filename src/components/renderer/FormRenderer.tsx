'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import type { ResolvedForm, ResolvedItem } from '@/types';
import { buildZodSchema } from '@/lib/forms/build-zod-schema';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
    <Label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
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
}: FormRendererProps) {
  const schema = useMemo(
    () => buildZodSchema(resolved) as z.ZodObject<Record<string, z.ZodTypeAny>>,
    [resolved],
  );
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
    const fullSpan =
      (resolved.settings.layoutColumns ?? 1) > 1 ? 'md:col-span-full' : '';
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
            className="gap-2"
            aria-invalid={!!error}
            aria-describedby={describedBy}
          >
            {(f.options ?? []).map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${id}-${opt}`} />
                <Label htmlFor={`${id}-${opt}`} className="font-normal">
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
            <Label htmlFor={id} className="font-normal">
              {f.label}
              {f.required ? (
                <span className="text-destructive ml-1">*</span>
              ) : null}
            </Label>
          </div>
        );
        break;
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

    if (f.type === 'checkbox') {
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

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl space-y-6"
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
          resolved.settings.layoutColumns === 2
            ? 'grid grid-cols-1 gap-5 md:grid-cols-2'
            : resolved.settings.layoutColumns === 3
              ? 'grid grid-cols-1 gap-5 md:grid-cols-3'
              : 'space-y-5',
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
