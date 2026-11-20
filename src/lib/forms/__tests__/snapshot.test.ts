import { describe, expect, it } from 'vitest';
import { START_ANCHOR } from '@/lib/constants';
import type { FormContent, OwnField } from '@/types';
import { resolveForm } from '../resolve';
import { snapshotInherited } from '../snapshot';

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
  extra: Partial<OwnField> = {},
): OwnField {
  return {
    key,
    label: extra.label ?? key,
    type: extra.type ?? 'text',
    required: extra.required ?? false,
    hidden: extra.hidden ?? false,
    insertAfter,
    placeholder: extra.placeholder,
    helpText: extra.helpText,
    options: extra.options,
    validation: extra.validation,
  };
}

describe('snapshot', () => {
  it('15. snapshotInherited copies the resolved inherited fields into the form as own fields, and the result resolves identically to before', () => {
    const root = content({
      settings: { title: 'Base', submitLabel: 'Go' },
      ownFields: [
        field('a', START_ANCHOR, { label: 'A', required: true }),
        field('b', 'a', { label: 'B', placeholder: 'ph', helpText: 'ht' }),
      ],
      elements: [
        {
          id: 'el1',
          type: 'heading',
          props: { text: 'Hi' },
          insertAfter: START_ANCHOR,
        },
      ],
    });
    const child = content({
      ownFields: [field('c', 'b', { label: 'C', hidden: true })],
      overrides: { b: { label: 'B2', required: true } },
      locks: [],
    });

    const chain = [root, child];
    const ids = ['root', 'child'];
    const before = resolveForm(chain, ids);
    const snapshot = snapshotInherited(chain, ids);

    expect(snapshot.overrides).toEqual({});
    expect(snapshot.locks).toEqual([]);
    expect(snapshot.ownFields.map((f) => f.key)).toEqual(['a', 'b', 'c']);
    expect(snapshot.elements.map((e) => e.id)).toEqual(['el1']);
    // All fields are now own in the snapshot content
    expect(
      snapshot.ownFields.every(
        (f) => typeof f.insertAfter === 'string' || f.insertAfter === null,
      ),
    ).toBe(true);
    expect(snapshot.ownFields.find((f) => f.key === 'b')?.label).toBe('B2');
    expect(snapshot.ownFields.find((f) => f.key === 'c')?.hidden).toBe(true);

    const after = resolveForm([snapshot], ['child']);
    expect(after.settings).toEqual(before.settings);
    expect(
      after.items.map((i) => (i.kind === 'field' ? i.field.key : i.element.id)),
    ).toEqual(
      before.items.map((i) =>
        i.kind === 'field' ? i.field.key : i.element.id,
      ),
    );
    // Effective field properties preserved (labels/required/hidden/etc.)
    const beforeFields = before.items.flatMap((i) =>
      i.kind === 'field' ? [i.field] : [],
    );
    const afterFields = after.items.flatMap((i) =>
      i.kind === 'field' ? [i.field] : [],
    );
    expect(afterFields).toEqual(
      beforeFields.map((f) => ({
        ...f,
        origin: 'own' as const,
        sourceFormId: 'child',
        locked: f.locked && f.sourceFormId === 'child',
        lockedByFormId:
          f.locked && f.sourceFormId === 'child' ? 'child' : undefined,
      })),
    );
    const beforeEls = before.items.flatMap((i) =>
      i.kind === 'element'
        ? [{ ...i, origin: 'own' as const, sourceFormId: 'child' }]
        : [],
    );
    const afterEls = after.items.flatMap((i) =>
      i.kind === 'element' ? [i] : [],
    );
    expect(afterEls).toEqual(beforeEls);
  });
});
