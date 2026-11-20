import { describe, expect, it } from 'vitest';
import type { FormContent, OwnField } from '@/types';
import {
  describeContentDiff,
  describeOwnFieldChange,
  diffFormContent,
  diffResolvedForms,
  resolveForm,
} from '../index';

function content(ownFields: OwnField[]): FormContent {
  return { settings: {}, ownFields, elements: [], overrides: {}, locks: [] };
}

function field(key: string, partial: Partial<OwnField> = {}): OwnField {
  return {
    key,
    label: partial.label ?? key,
    type: partial.type ?? 'text',
    required: partial.required ?? false,
    hidden: partial.hidden ?? false,
    insertAfter: partial.insertAfter ?? null,
    placeholder: partial.placeholder,
    helpText: partial.helpText,
    options: partial.options,
    validation: partial.validation,
  };
}

describe('diffFormContent', () => {
  it('detects added and removed own fields', () => {
    const before = content([field('a'), field('b')]);
    const after = content([field('b'), field('c')]);
    const diff = diffFormContent(before, after);
    expect(diff.fieldsAdded).toEqual(['c']);
    expect(diff.fieldsRemoved).toEqual(['a']);
    expect(diff.fieldsChanged).toEqual([]);
  });

  it('detects changed own fields', () => {
    const before = content([field('a', { label: 'A', required: false })]);
    const after = content([field('a', { label: 'Alpha', required: true })]);
    const diff = diffFormContent(before, after);
    expect(diff.fieldsAdded).toEqual([]);
    expect(diff.fieldsRemoved).toEqual([]);
    expect(diff.fieldsChanged).toHaveLength(1);
    expect(diff.fieldsChanged[0].key).toBe('a');
  });

  it('returns empty diff for identical content', () => {
    const a = content([field('a', { label: 'A' })]);
    const b = content([field('a', { label: 'A' })]);
    const diff = diffFormContent(a, b);
    expect(diff).toEqual({
      fieldsAdded: [],
      fieldsRemoved: [],
      fieldsChanged: [],
    });
  });

  it('describes relabelled and required/optional changes', () => {
    const before = content([field('a', { label: 'A', required: false })]);
    const after = content([field('a', { label: 'Alpha', required: true })]);
    const diff = diffFormContent(before, after);
    const described = describeContentDiff(diff, before, after);
    expect(described).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'a',
          kind: 'relabelled',
          before: 'A',
          after: 'Alpha',
        }),
        expect.objectContaining({ key: 'a', kind: 'made-required' }),
      ]),
    );
  });

  it('describes hidden/shown and added/removed changes', () => {
    const before = content([field('a', { hidden: false }), field('b')]);
    const after = content([
      field('a', { hidden: true }),
      field('c', { label: 'C' }),
    ]);
    const described = describeContentDiff(
      diffFormContent(before, after),
      before,
      after,
    );
    expect(described).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'b', kind: 'removed' }),
        expect.objectContaining({ key: 'c', kind: 'added', label: 'C' }),
        expect.objectContaining({ key: 'a', kind: 'hidden' }),
      ]),
    );
  });

  it('diffResolvedForms detects added/removed/relabelled/required changes', () => {
    const before = resolveForm(
      [
        {
          settings: {},
          ownFields: [field('a', { label: 'A', required: false })],
          elements: [],
          overrides: {},
          locks: [],
        },
      ],
      ['root'],
    );
    const after = resolveForm(
      [
        {
          settings: {},
          ownFields: [
            field('a', { label: 'Alpha', required: true }),
            field('b', { label: 'B' }),
          ],
          elements: [],
          overrides: {},
          locks: [],
        },
      ],
      ['root'],
    );
    const diff = diffResolvedForms(before, after);
    expect(diff.fieldsAdded).toEqual(['b']);
    expect(diff.fieldsRemoved).toEqual([]);
    expect(diff.fieldsChanged).toHaveLength(1);
    const beforeField =
      before.items[0]?.kind === 'field' ? before.items[0].field : null;
    expect(beforeField).not.toBeNull();
    const kinds = describeOwnFieldChange({
      key: 'a',
      before: {
        key: 'a',
        label: 'A',
        type: 'text',
        required: false,
        hidden: false,
        insertAfter: beforeField!.sourceFormId ? null : null,
      },
      after: {
        key: 'a',
        label: 'Alpha',
        type: 'text',
        required: true,
        hidden: false,
        insertAfter: null,
      },
    }).map((c) => c.kind);
    // sanity: helper works; main resolved diff shape is correct
    expect(diff.fieldsChanged[0].after.label).toBe('Alpha');
    expect(diff.fieldsChanged[0].after.required).toBe(true);
    expect(kinds).toEqual(
      expect.arrayContaining(['relabelled', 'made-required']),
    );
  });
});
