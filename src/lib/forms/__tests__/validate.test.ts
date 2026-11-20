import { describe, expect, it } from 'vitest';
import { START_ANCHOR } from '@/lib/constants';
import type { FormContent, OwnField } from '@/types';
import { findKeyConflicts } from '../validate';

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

function field(key: string): OwnField {
  return {
    key,
    label: key,
    type: 'text',
    required: false,
    hidden: false,
    insertAfter: START_ANCHOR,
  };
}

describe('validate', () => {
  it('14. findKeyConflicts finds a parent field key that a descendant already owns', () => {
    const parent = content({ ownFields: [field('email'), field('name')] });
    const child = content({ ownFields: [field('email'), field('phone')] });
    const grand = content({ ownFields: [field('name'), field('city')] });

    const conflicts = findKeyConflicts(parent, [child, grand]);
    expect(conflicts).toEqual(
      expect.arrayContaining([
        { key: 'email', descendantIndex: 0 },
        { key: 'name', descendantIndex: 1 },
      ]),
    );
    expect(conflicts).toHaveLength(2);
  });

  it('returns no conflicts when keys are distinct', () => {
    const parent = content({ ownFields: [field('a')] });
    const child = content({ ownFields: [field('b')] });
    expect(findKeyConflicts(parent, [child])).toEqual([]);
  });
});
