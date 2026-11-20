import { describe, expect, it } from 'vitest';
import { START_ANCHOR } from '@/lib/constants';
import { resolveForm } from '../resolve';
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

function field(key: string, insertAfter: string | null, label = key): OwnField {
  return {
    key,
    label,
    type: 'text',
    required: false,
    hidden: false,
    insertAfter,
  };
}

function keys(items: ResolvedItem[]): string[] {
  return items.map((i) => (i.kind === 'field' ? i.field.key : i.element.id));
}

describe('anchors', () => {
  it('root defines base order and descendant items use insertAfter', () => {
    const root = content({
      ownFields: [
        field('second', 'first'),
        field('first', START_ANCHOR),
        field('tail', null),
      ],
    });
    const child = content({ ownFields: [field('mid', 'first')] });
    const resolved = resolveForm([root, child], ['r', 'c']);
    expect(keys(resolved.items)).toEqual(['first', 'mid', 'second', 'tail']);
  });

  it("9. if a parent deletes an anchor, the child's item falls back to the end of its section", () => {
    const parentV1 = content({
      ownFields: [
        field('a', START_ANCHOR),
        field('anchor', 'a'),
        field('b', 'anchor'),
      ],
    });
    const child = content({ ownFields: [field('child', 'anchor')] });
    expect(keys(resolveForm([parentV1, child], ['p', 'c']).items)).toEqual([
      'a',
      'anchor',
      'child',
      'b',
    ]);

    const parentV2 = content({
      ownFields: [field('a', START_ANCHOR), field('b', 'a')],
    });
    const resolved = resolveForm([parentV2, child], ['p', 'c']);
    expect(keys(resolved.items)).toEqual(['a', 'b', 'child']);
  });

  it('10. items sharing an anchor keep their relative order', () => {
    const parent = content({
      ownFields: [field('a', START_ANCHOR), field('z', 'a')],
    });
    const child = content({
      ownFields: [field('c1', 'a'), field('c2', 'a'), field('c3', 'a')],
    });
    const resolved = resolveForm([parent, child], ['p', 'c']);
    expect(keys(resolved.items)).toEqual(['a', 'c1', 'c2', 'c3', 'z']);
  });
});
