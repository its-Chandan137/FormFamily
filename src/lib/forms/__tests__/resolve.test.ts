import { describe, expect, it } from 'vitest';
import { START_ANCHOR } from '@/lib/constants';
import { resolveForm } from '../resolve';
import { snapshotInherited } from '../snapshot';
import type { FormContent, OwnField, ResolvedItem } from '@/types';

function content(partial: Partial<FormContent> = {}): FormContent {
  return {
    settings: {},
    ownFields: [],
    elements: [],
    overrides: {},
    locks: [],
    ...partial,
  };
}

function field(
  key: string,
  insertAfter: string | null,
  overrides: Partial<OwnField> = {},
): OwnField {
  return {
    key,
    label: overrides.label ?? key,
    type: overrides.type ?? 'text',
    required: overrides.required ?? false,
    hidden: overrides.hidden ?? false,
    insertAfter,
    placeholder: overrides.placeholder,
    helpText: overrides.helpText,
    options: overrides.options,
    validation: overrides.validation,
  };
}

function fieldKeys(items: ResolvedItem[]): string[] {
  return items.map((i) => (i.kind === 'field' ? i.field.key : i.element.id));
}

function findField(items: ResolvedItem[], key: string) {
  const item = items.find((i) => i.kind === 'field' && i.field.key === key);
  return item && item.kind === 'field' ? item.field : undefined;
}

describe('resolveForm', () => {
  it('1. a root form resolves to its own items in anchor order', () => {
    const root = content({
      settings: { title: 'Root', submitLabel: 'Send' },
      ownFields: [
        field('b', 'a', { label: 'B' }),
        field('a', START_ANCHOR, { label: 'A' }),
        field('c', null, { label: 'C' }),
      ],
    });

    const resolved = resolveForm([root], ['root']);

    expect(resolved.formId).toBe('root');
    expect(resolved.settings).toEqual({ title: 'Root', submitLabel: 'Send' });
    expect(fieldKeys(resolved.items)).toEqual(['a', 'b', 'c']);
    const a = findField(resolved.items, 'a');
    expect(a?.origin).toBe('own');
    expect(a?.sourceFormId).toBe('root');
    expect(a?.locked).toBe(false);
  });

  it('2. a child inherits every parent item and adds its own after the right anchors', () => {
    const parent = content({
      ownFields: [field('first', START_ANCHOR), field('second', 'first')],
    });
    const child = content({
      ownFields: [field('child_extra', 'first', { label: 'Child Extra' })],
    });

    const resolved = resolveForm([parent, child], ['p', 'c']);
    expect(fieldKeys(resolved.items)).toEqual([
      'first',
      'child_extra',
      'second',
    ]);
    expect(findField(resolved.items, 'first')?.origin).toBe('inherited');
    expect(findField(resolved.items, 'first')?.sourceFormId).toBe('p');
    expect(findField(resolved.items, 'child_extra')?.origin).toBe('own');
    expect(findField(resolved.items, 'child_extra')?.sourceFormId).toBe('c');
  });

  it('3. three levels (Frontend, Backend, DevOps): DevOps gets items from both ancestors', () => {
    const frontend = content({
      ownFields: [field('name', START_ANCHOR), field('email', 'name')],
    });
    const backend = content({
      ownFields: [field('api_key', 'email')],
    });
    const devops = content({
      ownFields: [field('region', 'api_key')],
    });

    const resolved = resolveForm(
      [frontend, backend, devops],
      ['frontend', 'backend', 'devops'],
    );

    expect(fieldKeys(resolved.items)).toEqual([
      'name',
      'email',
      'api_key',
      'region',
    ]);
    expect(findField(resolved.items, 'name')?.sourceFormId).toBe('frontend');
    expect(findField(resolved.items, 'api_key')?.sourceFormId).toBe('backend');
    expect(findField(resolved.items, 'region')?.sourceFormId).toBe('devops');
  });

  it("4. a parent inserting a field in the middle moves it into children at that position, and the child's own items stay after their anchors", () => {
    const parentBefore = content({
      ownFields: [field('a', START_ANCHOR), field('b', 'a')],
    });
    const child = content({
      ownFields: [field('c', 'b')],
    });
    const before = resolveForm([parentBefore, child], ['p', 'c']);
    expect(fieldKeys(before.items)).toEqual(['a', 'b', 'c']);

    const parentAfterInsert = content({
      ownFields: [field('a', START_ANCHOR), field('x', 'a'), field('b', 'x')],
    });
    const after = resolveForm([parentAfterInsert, child], ['p', 'c']);
    expect(fieldKeys(after.items)).toEqual(['a', 'x', 'b', 'c']);
  });

  it('5. a child override changes the label, placeholder, help text or required flag only for that child and its descendants', () => {
    const parent = content({
      ownFields: [
        field('name', START_ANCHOR, {
          label: 'Name',
          placeholder: 'Your name',
          helpText: 'Enter name',
          required: false,
        }),
      ],
    });
    const child = content({
      overrides: {
        name: {
          label: 'Full Name',
          placeholder: 'Jane Doe',
          helpText: 'As on ID',
          required: true,
        },
      },
    });
    const grandchild = content({});

    const parentResolved = resolveForm([parent], ['p']);
    const childResolved = resolveForm([parent, child], ['p', 'c']);
    const grandResolved = resolveForm(
      [parent, child, grandchild],
      ['p', 'c', 'g'],
    );

    expect(findField(parentResolved.items, 'name')).toMatchObject({
      label: 'Name',
      placeholder: 'Your name',
      helpText: 'Enter name',
      required: false,
    });
    expect(findField(childResolved.items, 'name')).toMatchObject({
      label: 'Full Name',
      placeholder: 'Jane Doe',
      helpText: 'As on ID',
      required: true,
    });
    expect(findField(grandResolved.items, 'name')).toMatchObject({
      label: 'Full Name',
      placeholder: 'Jane Doe',
      helpText: 'As on ID',
      required: true,
    });
  });

  it('6. a hidden field stays in the resolved output with hidden: true and keeps its position', () => {
    const parent = content({
      ownFields: [field('a', START_ANCHOR), field('b', 'a'), field('c', 'b')],
    });
    const child = content({ overrides: { b: { hidden: true } } });

    const resolved = resolveForm([parent, child], ['p', 'c']);
    expect(fieldKeys(resolved.items)).toEqual(['a', 'b', 'c']);
    expect(findField(resolved.items, 'b')?.hidden).toBe(true);
  });

  it('7. a locked field ignores overrides (hide, optional, label) from any descendant, and the lock is accumulated down the subtree', () => {
    const parent = content({
      ownFields: [
        field('email', START_ANCHOR, {
          label: 'Email',
          required: true,
          hidden: false,
        }),
      ],
      locks: ['email'],
    });
    const child = content({
      overrides: {
        email: {
          label: 'Work Email',
          required: false,
          hidden: true,
          placeholder: 'x',
          helpText: 'y',
        },
      },
    });
    const grandchild = content({
      overrides: { email: { label: 'Other', required: false } },
    });

    const childResolved = resolveForm([parent, child], ['p', 'c']);
    const grandResolved = resolveForm(
      [parent, child, grandchild],
      ['p', 'c', 'g'],
    );

    for (const resolved of [childResolved, grandResolved]) {
      const f = findField(resolved.items, 'email');
      expect(f).toMatchObject({
        label: 'Email',
        required: true,
        hidden: false,
        locked: true,
        lockedByFormId: 'p',
      });
    }
  });

  it("8. a parent deleting a field removes it, and any overrides on it, from all descendants. A child's own fields are untouched", () => {
    const parentV1 = content({
      ownFields: [field('a', START_ANCHOR), field('b', 'a'), field('c', 'b')],
    });
    const child = content({
      overrides: { b: { label: 'Child B' } },
      ownFields: [field('child_only', 'c')],
    });

    const before = resolveForm([parentV1, child], ['p', 'c']);
    expect(fieldKeys(before.items)).toEqual(['a', 'b', 'c', 'child_only']);

    const parentV2 = content({
      ownFields: [field('a', START_ANCHOR), field('c', 'a')],
    });
    const after = resolveForm([parentV2, child], ['p', 'c']);
    expect(fieldKeys(after.items)).toEqual(['a', 'c', 'child_only']);
    expect(findField(after.items, 'b')).toBeUndefined();
    expect(findField(after.items, 'child_only')?.label).toBe('child_only');
  });

  it('snapshot resolves identically when used via snapshotInherited helper', () => {
    const parent = content({ ownFields: [field('a', START_ANCHOR)] });
    const child = content({ ownFields: [field('b', 'a')] });
    const chain = [parent, child];
    const ids = ['p', 'c'];
    const original = resolveForm(chain, ids);
    const snapshot = snapshotInherited(chain, ids);
    const roundTrip = resolveForm([snapshot], ['c']);
    expect(roundTrip.settings).toEqual(original.settings);
    expect(fieldKeys(roundTrip.items)).toEqual(fieldKeys(original.items));
    expect(
      roundTrip.items.map((i) =>
        i.kind === 'field'
          ? {
              kind: 'field',
              key: i.field.key,
              label: i.field.label,
              type: i.field.type,
              required: i.field.required,
              hidden: i.field.hidden,
              placeholder: i.field.placeholder,
              helpText: i.field.helpText,
            }
          : {
              kind: 'element',
              id: i.element.id,
              type: i.element.type,
              props: i.element.props,
            },
      ),
    ).toEqual(
      original.items.map((i) =>
        i.kind === 'field'
          ? {
              kind: 'field',
              key: i.field.key,
              label: i.field.label,
              type: i.field.type,
              required: i.field.required,
              hidden: i.field.hidden,
              placeholder: i.field.placeholder,
              helpText: i.field.helpText,
            }
          : {
              kind: 'element',
              id: i.element.id,
              type: i.element.type,
              props: i.element.props,
            },
      ),
    );
  });
});
