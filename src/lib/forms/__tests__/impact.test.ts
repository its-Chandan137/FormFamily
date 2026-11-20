import { describe, expect, it } from 'vitest';
import type { Form } from '@/types';
import { computeImpact } from '../impact';

function form(id: string, parentFormId: string | null = null): Form {
  return {
    id,
    orgId: 'org',
    parentFormId,
    name: id,
    slug: id,
    publishedVersionId: null,
  };
}

describe('impact', () => {
  it('13. computeImpact returns exactly the descendants of the edited form, not siblings or ancestors', () => {
    const forms: Form[] = [
      form('root', null),
      form('a', 'root'),
      form('b', 'root'),
      form('a1', 'a'),
      form('a2', 'a'),
      form('b1', 'b'),
    ];

    const impact = computeImpact(forms, 'a');
    expect(new Set(impact.affectedFormIds)).toEqual(new Set(['a1', 'a2']));
    expect(impact.affectedFormIds).not.toContain('root');
    expect(impact.affectedFormIds).not.toContain('a');
    expect(impact.affectedFormIds).not.toContain('b');
    expect(impact.affectedFormIds).not.toContain('b1');

    expect(computeImpact(forms, 'root').affectedFormIds.sort()).toEqual(
      ['a', 'a1', 'a2', 'b', 'b1'].sort(),
    );
    expect(computeImpact(forms, 'a1').affectedFormIds).toEqual([]);
  });
});
