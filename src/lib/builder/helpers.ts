import { START_ANCHOR } from '@/lib/constants';
import type {
  FormContent,
  FormRecord,
  LayoutElement,
  OwnField,
  ResolvedForm,
  ResolvedItem,
} from '@/types';

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function ensureDraft(form: FormRecord): FormContent {
  if (form.draft) return clone(form.draft);
  const pub = form.versions.find(
    (v) => v.id === form.publishedVersionId,
  )?.content;
  if (pub) return clone(pub);
  return {
    settings: { title: form.name },
    ownFields: [],
    elements: [],
    overrides: {},
    locks: [],
  };
}

export function getItemId(item: ResolvedItem): string {
  return item.kind === 'field' ? item.field.key : item.element.id;
}

export function isOwnCanvasItem(item: ResolvedItem, formId: string): boolean {
  if (item.kind === 'field')
    return item.field.sourceFormId === formId && item.field.origin === 'own';
  return item.sourceFormId === formId && item.origin === 'own';
}

export function isInheritedItem(item: ResolvedItem, formId: string): boolean {
  if (item.kind === 'field')
    return (
      item.field.origin === 'inherited' || item.field.sourceFormId !== formId
    );
  return item.origin === 'inherited' || item.sourceFormId !== formId;
}

export function resolvedItemLabel(item: ResolvedItem): string {
  if (item.kind === 'field') return item.field.label || item.field.key;
  switch (item.element.type) {
    case 'heading':
      return String(item.element.props.text ?? 'Heading');
    case 'section':
      return String(item.element.props.title ?? 'Section');
    case 'richtext':
      return 'Rich text';
    case 'logo':
      return 'Logo';
    case 'divider':
      return 'Divider';
    default:
      return item.element.type;
  }
}

/**
 * Compute insertAfter for dropping at a visual index in the resolved list.
 * index 0 => START_ANCHOR (top). index N => id of resolved item at N-1.
 */
export function insertAfterForIndex(
  resolved: ResolvedForm,
  index: number,
): string {
  if (index <= 0) return START_ANCHOR;
  const prev = resolved.items[index - 1];
  return prev ? getItemId(prev) : START_ANCHOR;
}

export function findOwnField(
  draft: FormContent,
  key: string,
): OwnField | undefined {
  return draft.ownFields.find((f) => f.key === key);
}

export function findOwnElement(
  draft: FormContent,
  id: string,
): LayoutElement | undefined {
  return draft.elements.find((e) => e.id === id);
}

export function removeOwnItemFromDraft(
  draft: FormContent,
  id: string,
  kind: 'field' | 'element',
): FormContent {
  const next = clone(draft);
  if (kind === 'field')
    next.ownFields = next.ownFields.filter((f) => f.key !== id);
  else next.elements = next.elements.filter((e) => e.id !== id);
  for (const f of next.ownFields)
    if (f.insertAfter === id) f.insertAfter = null;
  for (const e of next.elements) if (e.insertAfter === id) e.insertAfter = null;
  return next;
}

export function setOwnItemInsertAfter(
  draft: FormContent,
  id: string,
  kind: 'field' | 'element',
  insertAfter: string | null,
): FormContent {
  const next = clone(draft);
  if (kind === 'field') {
    const f = next.ownFields.find((x) => x.key === id);
    if (f) f.insertAfter = insertAfter;
  } else {
    const e = next.elements.find((x) => x.id === id);
    if (e) e.insertAfter = insertAfter;
  }
  return next;
}

export function upsertOwnField(
  draft: FormContent,
  field: OwnField,
): FormContent {
  const next = clone(draft);
  const idx = next.ownFields.findIndex((f) => f.key === field.key);
  if (idx === -1) next.ownFields.push(field);
  else next.ownFields[idx] = field;
  return next;
}

export function upsertOwnElement(
  draft: FormContent,
  element: LayoutElement,
): FormContent {
  const next = clone(draft);
  const idx = next.elements.findIndex((e) => e.id === element.id);
  if (idx === -1) next.elements.push(element);
  else next.elements[idx] = element;
  return next;
}
