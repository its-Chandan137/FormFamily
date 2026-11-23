import type { Form, FormContent, FormRecord } from '@/types';
import { getAncestors } from './family-tree';

export function getPublishedContent(form: FormRecord): FormContent | null {
  if (!form.publishedVersionId) return null;
  const v = form.versions.find((ver) => ver.id === form.publishedVersionId);
  return v?.content ?? null;
}

export function getAncestorChain(
  forms: FormRecord[],
  formId: string,
  options?: { allowAncestorDraftFallback?: boolean },
): { chain: FormContent[]; ids: string[] } | null {
  const form = forms.find((f) => f.id === formId);
  if (!form) return null;
  const ancestorIds = getAncestors(forms as unknown as Form[], formId); // parent -> root
  const rootToParent = [...ancestorIds].reverse();
  const chain: FormContent[] = [];
  const ids: string[] = [];
  for (const id of rootToParent) {
    const ancestor = forms.find((x) => x.id === id);
    if (!ancestor) return null;
    const published = getPublishedContent(ancestor);
    const content =
      published ??
      (options?.allowAncestorDraftFallback ? (ancestor.draft ?? null) : null);
    if (!content) return null;
    chain.push(content);
    ids.push(id);
  }
  return { chain, ids };
}

export function getPublishedResolutionChain(
  forms: FormRecord[],
  formId: string,
): { chain: FormContent[]; ids: string[] } | null {
  const form = forms.find((f) => f.id === formId);
  if (!form) return null;
  const ancestors = getAncestorChain(forms, formId);
  const self = getPublishedContent(form);
  if (!self) return null;
  if (!ancestors) {
    // root
    return { chain: [self], ids: [formId] };
  }
  return { chain: [...ancestors.chain, self], ids: [...ancestors.ids, formId] };
}

export function getDraftResolutionChain(
  forms: FormRecord[],
  formId: string,
  options?: { allowAncestorDraftFallback?: boolean },
): { chain: FormContent[]; ids: string[] } | null {
  const form = forms.find((f) => f.id === formId);
  if (!form) return null;
  const draft = form.draft ?? getPublishedContent(form);
  if (!draft) return null;
  const ancestors = getAncestorChain(forms, formId, options);
  if (!ancestors) {
    return { chain: [draft], ids: [formId] };
  }
  return {
    chain: [...ancestors.chain, draft],
    ids: [...ancestors.ids, formId],
  };
}
