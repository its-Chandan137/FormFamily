import type {
  Form,
  FormContent,
  FormRecord,
  FormVersion,
  ResolvedForm,
} from '@/types';
import { resolveForm } from './resolve';
import { getAncestors, getDescendants } from './family-tree';
import { getPublishedContent } from './chain';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function getChainForContent(
  forms: FormRecord[],
  formId: string,
  selfContent: FormContent,
  options?: { allowAncestorDraftFallback?: boolean },
): { chain: FormContent[]; ids: string[] } | null {
  const leaf = forms.find((x) => x.id === formId);
  const ancestorIds = getAncestors(forms as unknown as Form[], formId)
    .slice()
    .reverse(); // root->parent
  const chain: FormContent[] = [];
  const ids: string[] = [];
  for (const id of ancestorIds) {
    const f = forms.find((x) => x.id === id);
    if (!f) return null;
    const pinnedVersionId = leaf?.ancestorVersionPins?.[id];
    const pinned = pinnedVersionId
      ? (f.versions.find((v) => v.id === pinnedVersionId)?.content ?? null)
      : null;
    const published = getPublishedContent(f);
    const c =
      pinned ??
      published ??
      (options?.allowAncestorDraftFallback ? (f.draft ?? null) : null);
    if (!c) return null;
    chain.push(c);
    ids.push(id);
  }
  chain.push(selfContent);
  ids.push(formId);
  return { chain, ids };
}

export function resolveWithContent(
  forms: FormRecord[],
  formId: string,
  content: FormContent,
): ResolvedForm | null {
  const info = getChainForContent(forms, formId, content, {
    allowAncestorDraftFallback: true,
  });
  if (!info) return null;
  return resolveForm(info.chain, info.ids);
}

export interface KeyConflict {
  key: string;
  descendantId: string;
  descendantName: string;
}

export function findPublishKeyConflicts(
  forms: FormRecord[],
  formId: string,
  newContent: FormContent,
): KeyConflict[] {
  const form = forms.find((f) => f.id === formId);
  if (!form) return [];
  const oldPublished = getPublishedContent(form);
  const oldKeys = new Set((oldPublished?.ownFields ?? []).map((f) => f.key));
  const newOwnKeys = (newContent.ownFields ?? []).map((f) => f.key);
  const addedKeys = newOwnKeys.filter((k) => !oldKeys.has(k));
  if (addedKeys.length === 0) return [];

  const descendants = getDescendants(forms as unknown as Form[], formId);
  const conflicts: KeyConflict[] = [];
  for (const dId of descendants) {
    const d = forms.find((f) => f.id === dId);
    if (!d) continue;
    const dContent = d.draft ?? getPublishedContent(d);
    if (!dContent) continue;
    const dOwnKeys = new Set((dContent.ownFields ?? []).map((f) => f.key));
    for (const key of addedKeys) {
      if (dOwnKeys.has(key)) {
        conflicts.push({ key, descendantId: dId, descendantName: d.name });
      }
    }
  }
  return conflicts;
}

export function applyConflictMerges(
  forms: FormRecord[],
  parentNewContent: FormContent,
  conflicts: KeyConflict[],
): FormRecord[] {
  const byId = new Map(forms.map((f) => [f.id, clone(f) as FormRecord]));
  const parentFieldByKey = new Map(
    (parentNewContent.ownFields ?? []).map((f) => [f.key, f]),
  );

  // group by descendant
  const byDesc = new Map<string, string[]>();
  for (const c of conflicts) {
    const arr = byDesc.get(c.descendantId) ?? [];
    arr.push(c.key);
    byDesc.set(c.descendantId, arr);
  }

  for (const [descId, keys] of byDesc.entries()) {
    const desc = byId.get(descId);
    if (!desc) continue;
    const content = clone(desc.draft ?? getPublishedContent(desc));
    if (!content) continue;
    for (const key of keys) {
      const childOwnIdx = (content.ownFields ?? []).findIndex(
        (f) => f.key === key,
      );
      if (childOwnIdx === -1) continue;
      const childOwn = content.ownFields[childOwnIdx];
      const parentOwn = parentFieldByKey.get(key);
      // remove child's own copy
      content.ownFields.splice(childOwnIdx, 1);
      // keep child's custom label as override if different
      if (parentOwn && childOwn.label && childOwn.label !== parentOwn.label) {
        content.overrides = {
          ...(content.overrides ?? {}),
          [key]: { ...(content.overrides?.[key] ?? {}), label: childOwn.label },
        };
      }
      // remove from locks? unlikely
    }
    // update draft if existed else create draft with merged content
    desc.draft = content;
    desc.updatedAt = new Date().toISOString();
    byId.set(descId, desc);
  }
  return Array.from(byId.values());
}

export function publishFormWithPropagation(
  forms: FormRecord[],
  formId: string,
): { updatedForms: FormRecord[]; publishedVersion: FormVersion } {
  const byId = new Map(forms.map((f) => [f.id, clone(f) as FormRecord]));
  const form = byId.get(formId);
  if (!form) throw new Error('Form not found');
  const content = form.draft;
  if (!content) throw new Error('No unpublished changes to publish');

  // publish this form
  const versionNumber = (form.versions.at(-1)?.versionNumber ?? 0) + 1;
  const chainInfo = getChainForContent(
    Array.from(byId.values()),
    formId,
    content,
  );
  if (!chainInfo) throw new Error('Cannot resolve form chain');
  const resolvedSnapshot = resolveForm(chainInfo.chain, chainInfo.ids);
  const version: FormVersion = {
    id: `ver_${formId}_${versionNumber}`,
    formId,
    versionNumber,
    status: 'published',
    content: clone(content),
    resolvedSnapshot: clone(resolvedSnapshot),
    publishedAt: new Date().toISOString(),
  };
  form.versions = [...form.versions, version];
  form.publishedVersionId = version.id;
  form.draft = null;
  form.updatedAt = new Date().toISOString();
  byId.set(formId, form);

  // recompute snapshots for all descendants (based on published versions chain)
  const descendants = getDescendants(
    Array.from(byId.values()) as unknown as Form[],
    formId,
  );
  for (const dId of descendants) {
    const d = byId.get(dId);
    if (!d) continue;
    if (!d.publishedVersionId) continue; // no published version to update snapshot for? skip
    const pub = d.versions.find((v) => v.id === d.publishedVersionId);
    if (!pub) continue;
    const dChain = getChainForContent(
      Array.from(byId.values()),
      dId,
      pub.content,
    );
    if (!dChain) continue;
    const dResolved = resolveForm(dChain.chain, dChain.ids);
    pub.resolvedSnapshot = clone(dResolved);
  }

  return { updatedForms: Array.from(byId.values()), publishedVersion: version };
}
