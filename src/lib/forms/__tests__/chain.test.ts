import { describe, expect, it } from 'vitest';
import type { FormContent, FormRecord, FormVersion } from '@/types';
import {
  getAncestorChain,
  getDraftResolutionChain,
  getPublishedContent,
  getPublishedResolutionChain,
} from '../chain';

function content(label = 'x'): FormContent {
  return {
    settings: { title: label },
    ownFields: [
      {
        key: label,
        label,
        type: 'text',
        required: false,
        hidden: false,
        insertAfter: null,
      },
    ],
    elements: [],
    overrides: {},
    locks: [],
  };
}

function version(formId: string, n: number, c: FormContent): FormVersion {
  return {
    id: `v_${formId}_${n}`,
    formId,
    versionNumber: n,
    status: 'published',
    content: c,
    resolvedSnapshot: null,
    publishedAt: new Date().toISOString(),
  };
}

function record(
  partial: Partial<FormRecord> & Pick<FormRecord, 'id' | 'name' | 'slug'>,
): FormRecord {
  return {
    orgId: 'org1',
    parentFormId: null,
    publishedVersionId: null,
    versions: [],
    draft: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('chain helpers', () => {
  it('getPublishedContent returns null when no published version', () => {
    const f = record({ id: 'a', name: 'A', slug: 'a' });
    expect(getPublishedContent(f)).toBeNull();
  });

  it('getPublishedContent returns content of the published version', () => {
    const c = content('root');
    const f = record({
      id: 'a',
      name: 'A',
      slug: 'a',
      versions: [version('a', 1, c)],
      publishedVersionId: 'v_a_1',
    });
    expect(getPublishedContent(f)).toEqual(c);
  });

  it('getAncestorChain returns root->parent contents for a descendant', () => {
    const rc = content('root');
    const pc = content('parent');
    const root = record({
      id: 'r',
      name: 'R',
      slug: 'r',
      versions: [version('r', 1, rc)],
      publishedVersionId: 'v_r_1',
    });
    const parent = record({
      id: 'p',
      name: 'P',
      slug: 'p',
      parentFormId: 'r',
      versions: [version('p', 1, pc)],
      publishedVersionId: 'v_p_1',
    });
    const child = record({ id: 'c', name: 'C', slug: 'c', parentFormId: 'p' });
    const res = getAncestorChain([root, parent, child], 'c');
    expect(res).not.toBeNull();
    expect(res!.ids).toEqual(['r', 'p']);
    expect(res!.chain.map((x) => x.settings.title)).toEqual(['root', 'parent']);
  });

  it('getAncestorChain returns null if an ancestor has no published content', () => {
    const rc = content('root');
    const root = record({
      id: 'r',
      name: 'R',
      slug: 'r',
      versions: [version('r', 1, rc)],
      publishedVersionId: 'v_r_1',
    });
    const parent = record({
      id: 'p',
      name: 'P',
      slug: 'p',
      parentFormId: 'r',
      draft: content('draft-only'),
    });
    const child = record({ id: 'c', name: 'C', slug: 'c', parentFormId: 'p' });
    expect(getAncestorChain([root, parent, child], 'c')).toBeNull();
  });

  it('getPublishedResolutionChain returns chain including published self, and handles root', () => {
    const rc = content('root');
    const cc = content('child');
    const root = record({
      id: 'r',
      name: 'R',
      slug: 'r',
      versions: [version('r', 1, rc)],
      publishedVersionId: 'v_r_1',
    });
    const child = record({
      id: 'c',
      name: 'C',
      slug: 'c',
      parentFormId: 'r',
      versions: [version('c', 1, cc)],
      publishedVersionId: 'v_c_1',
    });
    expect(getPublishedResolutionChain([root], 'r')).toEqual({
      chain: [rc],
      ids: ['r'],
    });
    expect(getPublishedResolutionChain([root, child], 'c')).toEqual({
      chain: [rc, cc],
      ids: ['r', 'c'],
    });
  });

  it('getDraftResolutionChain prefers draft over published self and resolves against published ancestors', () => {
    const rc = content('root');
    const pc = content('pub');
    const dc = content('draft');
    const root = record({
      id: 'r',
      name: 'R',
      slug: 'r',
      versions: [version('r', 1, rc)],
      publishedVersionId: 'v_r_1',
    });
    const child = record({
      id: 'c',
      name: 'C',
      slug: 'c',
      parentFormId: 'r',
      versions: [version('c', 1, pc)],
      publishedVersionId: 'v_c_1',
      draft: dc,
    });
    const res = getDraftResolutionChain([root, child], 'c');
    expect(res).toEqual({ chain: [rc, dc], ids: ['r', 'c'] });
  });

  it('returns null when required content is missing', () => {
    const root = record({ id: 'r', name: 'R', slug: 'r' });
    expect(getPublishedResolutionChain([root], 'r')).toBeNull();
    expect(getDraftResolutionChain([root], 'r')).toBeNull();
  });
});
