import type {
  FormContent,
  OwnField,
  ResolvedField,
  ResolvedForm,
  ResolvedItem,
} from '@/types';

export interface FieldChange {
  key: string;
  before: OwnField;
  after: OwnField;
}

export interface FormContentDiff {
  fieldsAdded: string[];
  fieldsRemoved: string[];
  fieldsChanged: FieldChange[];
}

export type FieldChangeKind =
  | 'added'
  | 'removed'
  | 'relabelled'
  | 'made-required'
  | 'made-optional'
  | 'hidden'
  | 'shown'
  | 'placeholder-changed'
  | 'help-text-changed'
  | 'type-changed'
  | 'options-changed'
  | 'validation-changed'
  | 'moved'
  | 'changed';

export interface DescribedChange {
  key: string;
  kind: FieldChangeKind;
  label?: string;
  before?: string | boolean | null;
  after?: string | boolean | null;
}

function fieldsEqual(a: OwnField, b: OwnField): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Summarises what changed between two form contents by comparing own fields.
 * Reports field keys that were added, removed, or changed.
 */
export function diffFormContent(
  before: FormContent,
  after: FormContent,
): FormContentDiff {
  const beforeMap = new Map(before.ownFields.map((f) => [f.key, f]));
  const afterMap = new Map(after.ownFields.map((f) => [f.key, f]));

  const fieldsAdded: string[] = [];
  const fieldsRemoved: string[] = [];
  const fieldsChanged: FieldChange[] = [];

  for (const [key] of afterMap) {
    if (!beforeMap.has(key)) {
      fieldsAdded.push(key);
    }
  }

  for (const [key, beforeField] of beforeMap) {
    const afterField = afterMap.get(key);
    if (!afterField) {
      fieldsRemoved.push(key);
    } else if (!fieldsEqual(beforeField, afterField)) {
      fieldsChanged.push({ key, before: beforeField, after: afterField });
    }
  }

  return { fieldsAdded, fieldsRemoved, fieldsChanged };
}

export function describeOwnFieldChange(change: FieldChange): DescribedChange[] {
  const out: DescribedChange[] = [];
  const { key, before, after } = change;
  if (before.label !== after.label) {
    out.push({
      key,
      kind: 'relabelled',
      label: after.label,
      before: before.label,
      after: after.label,
    });
  }
  if (before.required !== after.required) {
    out.push({
      key,
      kind: after.required ? 'made-required' : 'made-optional',
      label: after.label,
      before: before.required,
      after: after.required,
    });
  }
  if (before.hidden !== after.hidden) {
    out.push({
      key,
      kind: after.hidden ? 'hidden' : 'shown',
      label: after.label,
      before: before.hidden,
      after: after.hidden,
    });
  }
  if (before.placeholder !== after.placeholder) {
    out.push({
      key,
      kind: 'placeholder-changed',
      label: after.label,
      before: before.placeholder ?? null,
      after: after.placeholder ?? null,
    });
  }
  if (before.helpText !== after.helpText) {
    out.push({
      key,
      kind: 'help-text-changed',
      label: after.label,
      before: before.helpText ?? null,
      after: after.helpText ?? null,
    });
  }
  if (before.type !== after.type) {
    out.push({
      key,
      kind: 'type-changed',
      label: after.label,
      before: before.type,
      after: after.type,
    });
  }
  if (
    JSON.stringify(before.options ?? []) !== JSON.stringify(after.options ?? [])
  ) {
    out.push({ key, kind: 'options-changed', label: after.label });
  }
  if (
    JSON.stringify(before.validation ?? null) !==
    JSON.stringify(after.validation ?? null)
  ) {
    out.push({ key, kind: 'validation-changed', label: after.label });
  }
  if (before.insertAfter !== after.insertAfter) {
    out.push({
      key,
      kind: 'moved',
      label: after.label,
      before: before.insertAfter,
      after: after.insertAfter,
    });
  }
  if (out.length === 0) {
    out.push({ key, kind: 'changed', label: after.label });
  }
  return out;
}

export function describeContentDiff(
  diff: FormContentDiff,
  before: FormContent,
  after: FormContent,
): DescribedChange[] {
  const byKeyAfter = new Map(after.ownFields.map((f) => [f.key, f]));
  const byKeyBefore = new Map(before.ownFields.map((f) => [f.key, f]));
  const changes: DescribedChange[] = [];
  for (const key of diff.fieldsAdded) {
    const f = byKeyAfter.get(key);
    changes.push({ key, kind: 'added', label: f?.label ?? key });
  }
  for (const key of diff.fieldsRemoved) {
    const f = byKeyBefore.get(key);
    changes.push({ key, kind: 'removed', label: f?.label ?? key });
  }
  for (const c of diff.fieldsChanged) {
    changes.push(...describeOwnFieldChange(c));
  }
  return changes;
}

function visibleFieldMap(resolved: ResolvedForm): Map<string, ResolvedField> {
  const map = new Map<string, ResolvedField>();
  for (const item of resolved.items) {
    if (item.kind !== 'field') continue;
    map.set(item.field.key, item.field);
  }
  return map;
}

export interface ResolvedFormDiff {
  fieldsAdded: string[];
  fieldsRemoved: string[];
  fieldsChanged: Array<{
    key: string;
    before: ResolvedField;
    after: ResolvedField;
  }>;
}

export function diffResolvedForms(
  before: ResolvedForm,
  after: ResolvedForm,
): ResolvedFormDiff {
  const b = visibleFieldMap(before);
  const a = visibleFieldMap(after);
  const fieldsAdded: string[] = [];
  const fieldsRemoved: string[] = [];
  const fieldsChanged: Array<{
    key: string;
    before: ResolvedField;
    after: ResolvedField;
  }> = [];

  for (const [key] of a) if (!b.has(key)) fieldsAdded.push(key);
  for (const [key, beforeField] of b) {
    const afterField = a.get(key);
    if (!afterField) fieldsRemoved.push(key);
    else if (JSON.stringify(beforeField) !== JSON.stringify(afterField))
      fieldsChanged.push({ key, before: beforeField, after: afterField });
  }
  return { fieldsAdded, fieldsRemoved, fieldsChanged };
}

export function describeResolvedFieldChange(change: {
  key: string;
  before: ResolvedField;
  after: ResolvedField;
}): DescribedChange[] {
  const { key, before, after } = change;
  const out: DescribedChange[] = [];
  if (before.label !== after.label)
    out.push({
      key,
      kind: 'relabelled',
      label: after.label,
      before: before.label,
      after: after.label,
    });
  if (before.required !== after.required)
    out.push({
      key,
      kind: after.required ? 'made-required' : 'made-optional',
      label: after.label,
      before: before.required,
      after: after.required,
    });
  if (before.hidden !== after.hidden)
    out.push({
      key,
      kind: after.hidden ? 'hidden' : 'shown',
      label: after.label,
      before: before.hidden,
      after: after.hidden,
    });
  if (before.placeholder !== after.placeholder)
    out.push({
      key,
      kind: 'placeholder-changed',
      label: after.label,
      before: before.placeholder ?? null,
      after: after.placeholder ?? null,
    });
  if (before.helpText !== after.helpText)
    out.push({
      key,
      kind: 'help-text-changed',
      label: after.label,
      before: before.helpText ?? null,
      after: after.helpText ?? null,
    });
  if (before.type !== after.type)
    out.push({
      key,
      kind: 'type-changed',
      label: after.label,
      before: before.type,
      after: after.type,
    });
  if (
    JSON.stringify(before.options ?? []) !== JSON.stringify(after.options ?? [])
  )
    out.push({ key, kind: 'options-changed', label: after.label });
  if (
    JSON.stringify(before.validation ?? null) !==
    JSON.stringify(after.validation ?? null)
  )
    out.push({ key, kind: 'validation-changed', label: after.label });
  if (out.length === 0) out.push({ key, kind: 'changed', label: after.label });
  return out;
}

export function describeResolvedDiff(
  diff: ResolvedFormDiff,
  before: ResolvedForm,
  after: ResolvedForm,
): DescribedChange[] {
  const b = visibleFieldMap(before);
  const a = visibleFieldMap(after);
  const changes: DescribedChange[] = [];
  for (const key of diff.fieldsAdded)
    changes.push({ key, kind: 'added', label: a.get(key)?.label ?? key });
  for (const key of diff.fieldsRemoved)
    changes.push({ key, kind: 'removed', label: b.get(key)?.label ?? key });
  for (const c of diff.fieldsChanged)
    changes.push(...describeResolvedFieldChange(c));
  return changes;
}

// re-exported for convenience in UI; keeps ResolvedItem available for future helpers
export type { ResolvedItem };
