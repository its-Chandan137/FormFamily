import { describe, expect, it } from 'vitest';
import type { FormContent, FormRecord, FormVersion, OwnField } from '@/types';
import {
  applyConflictMerges,
  findPublishKeyConflicts,
  getPublishedContent,
  publishFormWithPropagation,
  resolveWithContent,
} from '../index';

function ownField(key: string, partial: Partial<OwnField> = {}): OwnField {
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

function content(
  ownFields: OwnField[],
  partial: Partial<FormContent> = {},
): FormContent {
  return {
    settings: partial.settings ?? {},
    ownFields,
    elements: partial.elements ?? [],
    overrides: partial.overrides ?? {},
    locks: partial.locks ?? [],
  };
}

function version(formId: string, n: number, c: FormContent): FormVersion {
  return {
    id: `v_${formId}_${n}`,
    formId,
    versionNumber: n,
    status: 'published',
    content: JSON.parse(JSON.stringify(c)),
    resolvedSnapshot: null,
    publishedAt: new Date().toISOString(),
  };
}

function form(
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

describe('publish-flow', () => {
  it('publish creates the next version number', () => {
    const root = form({
      id: 'root',
      name: 'Root',
      slug: 'root',
      versions: [
        version(
          'root',
          1,
          content([ownField('a', { insertAfter: '__start__' })]),
        ),
      ],
      publishedVersionId: 'v_root_1',
      draft: content([
        ownField('a', { insertAfter: '__start__' }),
        ownField('b', { insertAfter: 'a' }),
      ]),
    });
    const { updatedForms, publishedVersion } = publishFormWithPropagation(
      [root],
      'root',
    );
    expect(publishedVersion.versionNumber).toBe(2);
    const updated = updatedForms.find((f) => f.id === 'root')!;
    expect(updated.publishedVersionId).toBe(publishedVersion.id);
    expect(updated.versions).toHaveLength(2);
    expect(updated.draft).toBeNull();
  });

  it("descendants' snapshots are recomputed", () => {
    const rootV1 = content([
      ownField('a', { insertAfter: '__start__', label: 'A1' }),
    ]);
    const root = form({
      id: 'root',
      name: 'Root',
      slug: 'root',
      versions: [version('root', 1, rootV1)],
      publishedVersionId: 'v_root_1',
      draft: content([
        ownField('a', { insertAfter: '__start__', label: 'A2' }),
      ]),
    });
    const childC = content([ownField('c', { insertAfter: 'a' })]);
    const child = form({
      id: 'child',
      name: 'Child',
      slug: 'child',
      parentFormId: 'root',
      versions: [version('child', 1, childC)],
      publishedVersionId: 'v_child_1',
    });
    // seed initial snapshot consistent with v1
    child.versions[0].resolvedSnapshot = resolveWithContent(
      [root, child],
      'child',
      childC,
    );

    const before = child.versions[0].resolvedSnapshot!;
    const beforeLabel = before.items.find(
      (i) => i.kind === 'field' && i.field.key === 'a',
    );
    expect(
      beforeLabel && beforeLabel.kind === 'field' && beforeLabel.field.label,
    ).toBe('A1');

    const { updatedForms } = publishFormWithPropagation([root, child], 'root');
    const updatedChild = updatedForms.find((f) => f.id === 'child')!;
    const snap = updatedChild.versions.find(
      (v) => v.id === 'v_child_1',
    )!.resolvedSnapshot!;
    const a = snap.items.find((i) => i.kind === 'field' && i.field.key === 'a');
    expect(a && a.kind === 'field' && a.field.label).toBe('A2');
  });

  it("a conflict merge keeps the child's label as an override and removes the child's own copy", () => {
    const rootV1 = content([ownField('a', { insertAfter: '__start__' })]);
    const root = form({
      id: 'root',
      name: 'Root',
      slug: 'root',
      versions: [version('root', 1, rootV1)],
      publishedVersionId: 'v_root_1',
      draft: content([
        ownField('a', { insertAfter: '__start__' }),
        ownField('github_url', { insertAfter: 'a', label: 'GitHub URL' }),
      ]),
    });
    const child = form({
      id: 'child',
      name: 'Child',
      slug: 'child',
      parentFormId: 'root',
      versions: [
        version('child', 1, content([ownField('c', { insertAfter: 'a' })])),
      ],
      publishedVersionId: 'v_child_1',
      draft: content([
        ownField('c', { insertAfter: 'a' }),
        ownField('github_url', { insertAfter: 'c', label: 'GitHub Profile' }),
      ]),
    });
    const conflicts = findPublishKeyConflicts(
      [root, child],
      'root',
      root.draft!,
    );
    expect(conflicts).toEqual([
      expect.objectContaining({ key: 'github_url', descendantId: 'child' }),
    ]);

    const merged = applyConflictMerges([root, child], root.draft!, conflicts);
    const mergedChild = merged.find((f) => f.id === 'child')!;
    expect(
      mergedChild.draft!.ownFields.find((f) => f.key === 'github_url'),
    ).toBeUndefined();
    expect(mergedChild.draft!.overrides?.github_url?.label).toBe(
      'GitHub Profile',
    );
  });

  it('publishing a leaf form changes no other form', () => {
    const rootC = content([ownField('a', { insertAfter: '__start__' })]);
    const root = form({
      id: 'root',
      name: 'Root',
      slug: 'root',
      versions: [version('root', 1, rootC)],
      publishedVersionId: 'v_root_1',
    });
    const child = form({
      id: 'child',
      name: 'Child',
      slug: 'child',
      parentFormId: 'root',
      versions: [
        version('child', 1, content([ownField('c', { insertAfter: 'a' })])),
      ],
      publishedVersionId: 'v_child_1',
      draft: content([
        ownField('c', { insertAfter: 'a' }),
        ownField('d', { insertAfter: 'c' }),
      ]),
    });
    const rootBefore = JSON.stringify(root);
    const { updatedForms } = publishFormWithPropagation([root, child], 'child');
    const updatedRoot = updatedForms.find((f) => f.id === 'root')!;
    const updatedChild = updatedForms.find((f) => f.id === 'child')!;
    expect(JSON.stringify(updatedRoot)).toBe(rootBefore);
    expect(updatedChild.publishedVersionId).toBe('ver_child_2');
  });

  it('publishing twice with no changes is rejected clearly', () => {
    const root = form({
      id: 'root',
      name: 'Root',
      slug: 'root',
      versions: [
        version(
          'root',
          1,
          content([ownField('a', { insertAfter: '__start__' })]),
        ),
      ],
      publishedVersionId: 'v_root_1',
      draft: null,
    });
    expect(() => publishFormWithPropagation([root], 'root')).toThrow(
      /no unpublished changes/i,
    );
  });

  it('locked fields stay locked after a merge', () => {
    const rootV1 = content([ownField('a', { insertAfter: '__start__' })]);
    const root = form({
      id: 'root',
      name: 'Root',
      slug: 'root',
      versions: [version('root', 1, rootV1)],
      publishedVersionId: 'v_root_1',
      draft: content([
        ownField('a', { insertAfter: '__start__' }),
        ownField('x', { insertAfter: 'a', label: 'X' }),
      ]),
    });
    const childDraft = content(
      [ownField('x', { insertAfter: 'a', label: 'Child X' })],
      { locks: ['other_lock'] },
    );
    const child = form({
      id: 'child',
      name: 'Child',
      slug: 'child',
      parentFormId: 'root',
      versions: [version('child', 1, content([]))],
      publishedVersionId: 'v_child_1',
      draft: childDraft,
    });
    const conflicts = findPublishKeyConflicts(
      [root, child],
      'root',
      root.draft!,
    );
    const merged = applyConflictMerges([root, child], root.draft!, conflicts);
    const mergedChild = merged.find((f) => f.id === 'child')!;
    expect(mergedChild.draft!.locks).toContain('other_lock');
    expect(mergedChild.draft!.overrides?.x?.label).toBe('Child X');

    // and a parent-locked inherited field remains locked in resolved output after publish
    const rootLocked = form({
      id: 'r2',
      name: 'R2',
      slug: 'r2',
      versions: [
        version(
          'r2',
          1,
          content([ownField('a', { insertAfter: '__start__' })]),
        ),
      ],
      publishedVersionId: 'v_r2_1',
      draft: content(
        [
          ownField('a', { insertAfter: '__start__' }),
          ownField('y', { insertAfter: 'a', label: 'Y' }),
        ],
        { locks: ['y'] },
      ),
    });
    const child2 = form({
      id: 'c2',
      name: 'C2',
      slug: 'c2',
      parentFormId: 'r2',
      versions: [version('c2', 1, content([]))],
      publishedVersionId: 'v_c2_1',
      draft: content([]),
    });
    const { updatedForms } = publishFormWithPropagation(
      [rootLocked, child2],
      'r2',
    );
    const c2 = updatedForms.find((f) => f.id === 'c2')!;
    const snap = c2.versions.find((v) => v.id === 'v_c2_1')!.resolvedSnapshot!;
    const y = snap.items.find((i) => i.kind === 'field' && i.field.key === 'y');
    expect(y && y.kind === 'field' && y.field.locked).toBe(true);
  });
});
